const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./mail-service')

class UserService {
    async register(email, password) {
        const candidate = await prisma.user.findUnique({
            where: { email: email }
        })

        if (candidate) {
            throw new Error('User already exist');
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const activationLink = uuid.v4();

        const user = await prisma.user.create({
            data: {email, password: hashPassword, activationLink }
        });

        await mailService.sendActivationMail(email, activationLink);
    }
}

module.exports = new UserService()