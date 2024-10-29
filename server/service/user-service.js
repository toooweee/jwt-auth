const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDto = require('../dto/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
    async register(email, password) {
        const candidate = await prisma.user.findUnique({
            where: { email: email }
        })

        if (candidate) {
            throw ApiError.BadRequest('User already exist');
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const activationLink = uuid.v4();

        const user = await prisma.user.create({
            data: {email, password: hashPassword, activationLink }
        });

        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        }
    }

    async activate(activationLink) {
        const user = await prisma.user.findFirst({
            where: { activationLink }
        })

        if (!user) {
            throw ApiError.BadRequest('User not found');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { isActivated: true}
        })
    }

    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw ApiError.BadRequest('User not found');
        }

        const isPassEquals = await bcrypt.compare(password, user.password);
        if(!isPassEquals) {
            throw ApiError.BadRequest('Wrong Password');
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        }
    }

    async logout (refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if(!refreshToken) {
            throw ApiError.UnauthorizedError();
        }

        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);

        if(!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }

        const user = await prisma.user.findUnique(
            { where: {id: userData.id} }
        )
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto});

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return {
            ...tokens,
            user: userDto
        }
    }

    async getAllUsers() {
        const users = await prisma.user.findMany();
        return users;
    }
}

module.exports = new UserService()