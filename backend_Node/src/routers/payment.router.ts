import express from 'express';
import {PaymentController} from '../controllers/payment.controller';

const paymentRouter = express.Router();

paymentRouter.post('/create-session', (req, res) => {
    new PaymentController().createSession(req, res);
});

paymentRouter.post('/confirm', (req, res) => {
    new PaymentController().confirmPayment(req, res);
});

paymentRouter.get('/session/:sessionId', (req, res) => {
    new PaymentController().getSessionStatus(req, res);
});

export default paymentRouter;