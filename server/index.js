require('dotenv').config()

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const router = require('./router/index')

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use('/api', router);

const start = async () => {
    try {
        app.listen(PORT, () => console.log(`Server succefully started on port: ${PORT}`))
    } catch (e) {
        console.log(e)
    }

    process.on('SIGINT', async () => {
        await prisma.$disconnect();
        process.exit(0);
    });

    process.on('exit', async () => {
        await prisma.$disconnect();
    });

}

start();