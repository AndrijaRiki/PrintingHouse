import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import User from './models/user.js';
import userRouter from './routers/user.router.js';

import Product from './models/product.js';
import productRouter from './routers/product.router.js'

import orderRouter from './routers/order.router.js';
import cartRouter from './routers/cart.router.js';
import { startProcurementFinalizer } from './services/procurementFinalizer.service';
import publicProcurementRouter from './routers/procurementRouter';
import paymentRouter from './routers/payment.router';
import productManagementRouter from './routers/productManagement.router';
import adminRouter from './routers/admin.router';

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/PrintingHouse')
    .then(() => {
        console.log('Connected with database');
        startProcurementFinalizer();
    })
    .catch((error) => {
        console.log('Database connection error:', error);
    });

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.post('/users', async (req, res) => {
    try {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            phone: req.body.phone,
            role: req.body.role,
            clientType: req.body.clientType,
            profileImage: req.body.profileImage,
            status: req.body.status,
            institution: req.body.institution
        });

        await user.save();

        res.status(201).json({
            message: 'User added successfully',
            user: user
        });
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error
                ? error.message
                : 'Unknown error'
        });
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({
            message: error instanceof Error
                ? error.message
                : 'Unknown error'
        });
    }
});

console.log("EMAIL_USER FROM ENV:", process.env.EMAIL_USER);

console.log("EMAIL_PASSWORD EXISTS:", !!process.env.EMAIL_PASSWORD);

app.use('/users', userRouter);
app.use('/products', productRouter);
app.use('/orders', orderRouter);
app.use('/carts', cartRouter);
app.use('/publicProcurements', publicProcurementRouter);
app.use('/payments', paymentRouter);
app.use('/productManagement', productManagementRouter);
app.use('/admin', adminRouter);

app.listen(4000, () => {
    console.log('Express running on port 4000!');
});