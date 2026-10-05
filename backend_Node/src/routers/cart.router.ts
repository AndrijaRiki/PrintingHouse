import express from 'express';
import { CartController } from '../controllers/cart.controller';
import orderRouter from './order.router';
import multer from 'multer';

const cartRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});

cartRouter.get('/getCart/:userId', (req, res) => {
    new CartController().getCart(req, res);
});

cartRouter.post('/addToCart', (req, res)  => {
    new CartController().addToCart(req, res);
});

cartRouter.patch('/updateCartItem', (req, res) => {
    new CartController().updateCartItem(req, res);
});

cartRouter.delete('/removeFromCart', (req, res) => {
    new CartController().removeFromCart(req, res);
});

cartRouter.delete('/clearCart/:userId', (req, res) => {
    new CartController().clearCart(req, res);
});

cartRouter.post("/addCustomizedProduct", upload.fields([
        {
            name: "previewImage",
            maxCount: 1
        },
        {
            name: "printImage",
            maxCount: 1
        }
    ]),
    new CartController().addCustomizedProduct
);

export default cartRouter;