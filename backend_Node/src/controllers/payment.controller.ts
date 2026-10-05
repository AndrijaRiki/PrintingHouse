import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import OrderModel from '../models/order';
import { generateInvoicePdf } from '../services/invoice.service';
import { sendInvoicesEmail } from '../services/email.service';
import mongoose from 'mongoose';
import ProductModel from '../models/product';

dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
    quiet: true
});

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY nije definisan u .env fajlu.');
}

const stripe = new Stripe(stripeSecretKey);

export class PaymentController {
    public createSession = async (req: express.Request, res: express.Response) => {
    try {
        const { orderId, userId } = req.body;

        if (!orderId || !userId) {
            return res.status(400).json({
                message: 'Nedostaju podaci za plaćanje.'
            });
        }

        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({message: 'Porudžbina nije pronađena.'});
        }

        if (order.userId.toString() !== userId) {
            return res.status(403).json({
                message: 'Nemate pravo da platite ovu porudžbinu.'
            });
        }

        if (order.status !== 'ordered') {
            return res.status(400).json({
                message: 'Ova porudžbina nije dostupna za plaćanje.'
            });
        }

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'elements',
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'rsd',
                    product_data: {
                        name: `Porudžbina ${order.invoiceNumber}`
                    },
                    unit_amount: Math.round(order.totalAmount * 100)
                },
                quantity: 1
            }],
            customer_email: order.customerSnapshot.email ?? undefined,
            return_url: 'http://localhost:4200/payment-result?session_id={CHECKOUT_SESSION_ID}',
            metadata: {
            orderId: order._id.toString(),
            userId: order.userId.toString()
            }
        });

        order.stripeSessionId = session.id;
        await order.save();

        return res.status(200).json({
            clientSecret: session.client_secret
        });
        } catch (error) {
        console.log('CREATE PAYMENT SESSION ERROR:', error);

        return res.status(500).json({
            message: 'Greška pri kreiranju plaćanja.'
        });
        }
    };

    public confirmPayment = async (req: express.Request, res: express.Response) => {
        try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                message: 'Nedostaje sessionId.'
            });
        }

        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

        if (stripeSession.payment_status !== 'paid') {
            return res.status(400).json({
                message: 'Plaćanje nije uspešno završeno.'
            });
        }

        const orderId = stripeSession.metadata?.orderId;

        if (!orderId) {
            return res.status(400).json({
                message: 'Nedostaje orderId u Stripe sesiji.'
            });
        }

        const order = await OrderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: 'Porudžbina nije pronađena.'
            });
        }

        if (order.status === 'paid' || order.status === 'printing' || order.status === 'delivered' || order.status === 'received') {
            return res.status(200).json({
                message: 'Porudžbina je već plaćena.',
                order
            });
        }

        if (order.status !== 'ordered') {
            return res.status(400).json({
            message: 'Porudžbina nije u statusu ordered.'
            });
        }

        const decreasedItems: {
            productId: any;
            quantity: number;
        }[] = [];

        try {
            for (const item of order.items) {
                const result = await ProductModel.updateOne(
                    {
                        _id: item.productId,
                        quantity: {
                            $gte: item.quantity
                        }
                    },
                    {
                        $inc: {
                            quantity: -item.quantity
                        }
                    }
                );

                if (result.modifiedCount !== 1) {
                    throw new Error(
                    `Nema dovoljno proizvoda ${item.productName} na stanju.`
                    );
                }

                decreasedItems.push({
                    productId: item.productId,
                    quantity: item.quantity
                });
            }

            order.status = 'paid';
            order.paidAt = new Date();
            order.issuedAt = new Date();
            order.stripeSessionId = stripeSession.id;

            await order.save();
        } catch (error) {
            for (const item of decreasedItems) {
                await ProductModel.updateOne({_id: item.productId}, {
                    $inc: { quantity: item.quantity }
                }
            );
        }

        console.log('STOCK / ORDER UPDATE ERROR:', error);

            return res.status(400).json({
            message: error instanceof Error ? error.message : 'Greška pri ažuriranju količine proizvoda.'
            });
        }

        let emailSent = false;

        try {
            const customer = order.customerSnapshot;

            const printer = {
                username: order.printerSnapshot?.name ?? '',
                institution: order.printerSnapshot ?? null
            };

            const pdf = await generateInvoicePdf(order, customer, printer);

            const customerEmail = order.customerSnapshot.email;

            if (!customerEmail) {
                throw new Error('Email kupca nije definisan.');
            }

            await sendInvoicesEmail(customerEmail, [{invoiceNumber: order.invoiceNumber, pdf}]);

            emailSent = true;
        } catch (error) {
            console.log('INVOICE / EMAIL ERROR:', error);
        }

        return res.status(200).json({
            message: emailSent
                ? 'Plaćanje uspešno potvrđeno. Faktura je poslata na email.'
                : 'Plaćanje uspešno potvrđeno, ali faktura nije poslata na email.',
            order,
            emailSent
        });
    } catch (error) {
        console.log('CONFIRM PAYMENT ERROR:', error);

        return res.status(500).json({
            message: 'Greška pri potvrdi plaćanja.'
        });
        }
    };

    public getSessionStatus = async (req: express.Request, res: express.Response) => {
        try {
            const sessionId = typeof req.params.sessionId === 'string'
                ? req.params.sessionId
                : req.params.sessionId[0];

            const session = await stripe.checkout.sessions.retrieve(sessionId);

            return res.status(200).json({
                status: session.status,
                paymentStatus: session.payment_status,
                orderId: session.metadata?.orderId,
                userId: session.metadata?.userId
            });
        } catch (error) {
            console.log('STRIPE STATUS ERROR:', error);

            return res.status(500).json({
                message: 'Greška pri proveri plaćanja.'
            });
        }
    };
}