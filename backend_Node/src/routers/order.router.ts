import express from 'express';
import {OrderController} from '../controllers/order.controller';

const orderRouter = express.Router();

orderRouter.get('/activeOrders/:userId', (req, res) => {
    new OrderController().getActiveOrders(req, res);
});

orderRouter.get('/otherOrders/:userId', (req, res) => {
    new OrderController().getOtherOrders(req, res);
});

orderRouter.get('/printerOrders/:printerId', (req, res) => {
    new OrderController().getPrinterOrders(req, res);
});

orderRouter.post('/create', (req, res) => {
    new OrderController().createOrder(req, res);
});

orderRouter.patch('/cancelOrder/:orderId', (req, res) => {
    new OrderController().cancelOrder(req, res);
});

orderRouter.patch('/startPrinting', (req, res) => {
    new OrderController().startPrinting(req, res);
});

orderRouter.patch('/markAsDelivered', (req, res) => {
    new OrderController().markAsDelivered(req, res);
});

orderRouter.patch('/markAsReceived', (req, res) => {
    new OrderController().markAsReceived(req, res);
});

orderRouter.get('/invoice/:orderId', (req, res) => {
    new OrderController().downloadInvoice(req, res);
});

export default orderRouter;