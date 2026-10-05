import express from 'express';
import OrderModel from '../models/order';
import ProductModel from '../models/product';
import CartModel from '../models/cart';
import UserModel from '../models/user';
import {generateInvoicePdf} from '../services/invoice.service';

export class OrderController {
    public getActiveOrders = async(req: express.Request, res: express.Response) => {
        try {
            const userId = req.params.userId;

            const orders = await OrderModel.find({
                userId: userId,
                status: {$in: ['ordered', 'paid', 'printing', 'delivered']}
            })
            .populate('printerId', 'username institution')
            .sort({createdAt: -1});

            return res.status(200).json(orders);
        } catch(error) {
            console.log('GET ACTIVE ORDERS ERROR:', error);
            return res.status(500).json([]);
        }
    };

    public getOtherOrders = async(req: express.Request, res: express.Response) => {
        try {
            const userId = req.params.userId;

            const orders = await OrderModel.find({
                userId: userId,
                status: {$in: ['received', 'cancelled']}
            })
            .populate('printerId', 'username institution')
            .sort({createdAt: -1});

            return res.status(200).json(orders);
        } catch(error) {
            console.log('GET OTHER ORDERS ERROR:', error);
            return res.status(500).json([]);
        }
    };

    public getPrinterOrders = async(req: express.Request, res: express.Response) => {
        try {
            const printerId = req.params.printerId;

            if(!printerId) {
                return res.status(400).json({
                    message: 'Nedostaje ID štamparije.'
                });
            }

            const orders = await OrderModel.find({
                printerId: printerId,
                status: {$in: ['paid', 'printing']}
            })
            .populate('printerId', 'username institution')
            .sort({createdAt: -1});

            return res.status(200).json(orders);
        } catch(error) {
            console.log('GET PRINTER ORDERS ERROR:', error);
            return res.status(500).json({
                message: 'Greška pri učitavanju narudžbina štamparije.'
            });
        }
    };

    public createOrder = async(req: express.Request, res: express.Response) => {
        try {
            const {userId} = req.body;

            if(!userId) {
                return res.status(400).json({
                    message: 'Korisnik nije prosleđen.'
                });
            }

            const user = await UserModel.findById(userId);

            if(!user) {
                return res.status(404).json({
                    message: 'Korisnik nije pronađen.'
                });
            }

            if(user.clientType !== 'individual') {
                return res.status(400).json({
                    message: 'Direktna porudžbina je dostupna samo fizičkim licima.'
                });
            }

            const cart = await CartModel.findOne({userId: userId});

            if(!cart || cart.items.length === 0) {
                return res.status(400).json({
                    message: 'Korpa je prazna.'
                });
            }

            const groups = new Map<string, {
                printerId: any;
                items: any[];
                totalAmount: number;
            }>();

            for(const item of cart.items) {
                const product = await ProductModel.findById(item.productId);

                if(!product) {
                    return res.status(404).json({
                        message: 'Proizvod nije pronađen.'
                    });
                }

                if(!product.active) {
                    return res.status(400).json({
                        message: `Proizvod ${product.name} nije aktivan.`
                    });
                }

                if(product.quantity < item.quantity) {
                    return res.status(400).json({
                        message: `Nema dovoljno proizvoda ${product.name} na stanju.`
                    });
                }

                let selectedPrintService = null;
                let additionalPrice = 0;

                if(item.selectedPrintServiceType) {
                    const service = product.printServices.find(service =>
                        service.type === item.selectedPrintServiceType
                    );

                    if(!service) {
                        return res.status(400).json({
                            message: `Izabrana usluga štampe nije dostupna za ${product.name}.`
                        });
                    }

                    selectedPrintService = {
                        type: service.type,
                        additionalPrice: service.additionalPrice,
                        maxWidthMm: service.maxWidthMm,
                        maxHeightMm: service.maxHeightMm
                    };

                    additionalPrice = service.additionalPrice;
                }

                let customization = null;

                if(item.customization) {
                    let image = null;

                    if(item.customization.printImage) {
                        image = {
                            data: item.customization.printImage.data,
                            contentType: item.customization.printImage.contentType
                        };
                    } else if(item.customization.previewImage) {
                        image = {
                            data: item.customization.previewImage.data,
                            contentType: item.customization.previewImage.contentType
                        };
                    }

                    customization = {
                        text: item.customization.text ?? null,
                        image: image
                    };
                }

                const totalPrice =
                    (product.unitPrice + additionalPrice) *
                    item.quantity;

                const orderItem = {
                    productId: product._id,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: product.unitPrice,
                    color: item.color || 'Bela',
                    selectedPrintService: selectedPrintService,
                    customization: customization,
                    totalPrice: totalPrice
                };

                const printerId = product.printerId.toString();

                let group = groups.get(printerId);

                if(!group) {
                    group = {
                        printerId: product.printerId,
                        items: [],
                        totalAmount: 0
                    };

                    groups.set(printerId, group);
                }

                group.items.push(orderItem);
                group.totalAmount += totalPrice;
            }

            const createdOrders: any[] = [];

            for(const group of groups.values()) {
                const printer = await UserModel.findById(group.printerId);

                if(!printer) {
                    return res.status(404).json({
                        message: 'Štamparija nije pronađena.'
                    });
                }

                if(!printer.institution) {
                    return res.status(400).json({
                        message: `Štamparija ${printer.username} nema podatke o instituciji.`
                    });
                }

                const randomPart =
                    Math.floor(100000 + Math.random() * 900000);

                const invoiceNumber =
                    `FAK-${new Date().getFullYear()}-${Date.now()}-${randomPart}`;

                const customerSnapshot = {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    clientType: user.clientType,
                    institution: user.institution ? {
                        name: user.institution.name,
                        address: user.institution.address,
                        city: user.institution.city,
                        registrationNumber: user.institution.registrationNumber,
                        taxId: user.institution.taxId
                    } : null
                };

                const printerSnapshot = {
                    name: printer.institution.name,
                    address: printer.institution.address,
                    city: printer.institution.city,
                    registrationNumber: printer.institution.registrationNumber,
                    taxId: printer.institution.taxId
                };

                const order = new OrderModel({
                    userId: userId,
                    printerId: group.printerId,
                    invoiceNumber: invoiceNumber,
                    customerSnapshot: customerSnapshot,
                    printerSnapshot: printerSnapshot,
                    items: group.items,
                    totalAmount: group.totalAmount,
                    currency: 'RSD',
                    status: 'ordered'
                });

                await order.save();
                createdOrders.push(order);
            }

            for(const item of cart.items) {
                await ProductModel.findByIdAndUpdate(
                    item.productId,
                    {$inc: {quantity: -item.quantity}}
                );
            }

            cart.items.splice(0, cart.items.length);
            await cart.save();

            return res.status(201).json({
                message: createdOrders.length === 1
                    ? 'Porudžbina je kreirana. Plaćanje možete izvršiti sa svog profila.'
                    : `${createdOrders.length} porudžbine su kreirane. Plaćanje možete izvršiti sa svog profila.`,
                orders: createdOrders
            });
        } catch(error) {
            console.log('CREATE ORDER ERROR:', error);

            return res.status(500).json({
                message: 'Serverska greška.'
            });
        }
    };

    public cancelOrder = async(req: express.Request, res: express.Response) => {
        try {
            const orderId = req.params.orderId;

            const order = await OrderModel.findById(orderId);

            if(!order) {
                return res.status(404).json({
                    message: 'Porudžbina nije pronađena.'
                });
            }

            if(order.status !== 'ordered') {
                return res.status(400).json({
                    message: 'Moguće je otkazati samo neplaćenu porudžbinu.'
                });
            }

            for(const item of order.items) {
                await ProductModel.findByIdAndUpdate(
                    item.productId,
                    {$inc: {quantity: item.quantity}}
                );
            }

            order.status = 'cancelled';
            order.stripeSessionId = null;
            await order.save();

            return res.status(200).json({
                message: 'Porudžbina je uspešno otkazana.',
                order: order
            });
        } catch(error) {
            console.log('CANCEL ORDER ERROR:', error);

            return res.status(500).json({
                message: 'Greška pri otkazivanju porudžbine.'
            });
        }
    };

    public startPrinting = async(req: express.Request, res: express.Response) => {
        try {
            const orderId = req.body.orderId;

            const order = await OrderModel.findById(orderId);

            if(!order) {
                return res.status(404).json({
                    message: 'Porudžbina nije pronađena.'
                });
            }

            if(order.status !== 'paid') {
                return res.status(400).json({
                    message: 'Samo plaćena porudžbina može biti poslata u štampu.'
                });
            }

            order.status = 'printing';
            await order.save();

            return res.status(200).json({
                message: 'Porudžbina je poslata u štampu.',
                order: order
            });
        } catch(error) {
            console.log('START PRINTING ERROR:', error);

            return res.status(500).json({
                message: 'Greška pri pokretanju štampe.'
            });
        }
    };

    public markAsDelivered = async(req: express.Request, res: express.Response) => {
        try {
            const orderId = req.body.orderId;

            const order = await OrderModel.findById(orderId);

            if(!order) {
                return res.status(404).json({
                    message: 'Porudžbina nije pronađena.'
                });
            }

            if(order.status !== 'printing') {
                return res.status(400).json({
                    message: 'Samo porudžbina koja je u štampi može biti isporučena.'
                });
            }

            order.status = 'delivered';
            await order.save();

            return res.status(200).json({
                message: 'Porudžbina je označena kao isporučena.',
                order: order
            });
        } catch(error) {
            console.log('MARK DELIVERED ERROR:', error);

            return res.status(500).json({
                message: 'Greška pri isporuci porudžbine.'
            });
        }
    };

    public markAsReceived = async(req: express.Request, res: express.Response) => {
        try {
            const orderId = req.body.orderId;

            const order = await OrderModel.findById(orderId);

            if(!order) {
                return res.status(404).json({
                    message: 'Porudžbina nije pronađena.'
                });
            }

            if(order.status !== 'delivered') {
                return res.status(400).json({
                    message: 'Samo isporučena porudžbina može biti označena kao primljena.'
                });
            }

            order.status = 'received';
            await order.save();

            return res.status(200).json({
                message: 'Potvrdili ste prijem porudžbine.',
                order: order
            });
        } catch(error) {
            console.log('MARK RECEIVED ERROR:', error);

            return res.status(500).json({
                message: 'Greška pri potvrdi prijema.'
            });
        }
    };

    public downloadInvoice = async(req: express.Request, res: express.Response) => {
        try {
            const orderId = req.params.orderId;

            const order = await OrderModel.findById(orderId);

            if(!order) {
                return res.status(404).json({
                    message: 'Porudžbina nije pronađena.'
                });
            }

            if(order.status === 'ordered' || order.status === 'cancelled') {
                return res.status(400).json({
                    message: 'Faktura je dostupna tek nakon plaćanja.'
                });
            }

            const customer = {
                firstname: order.customerSnapshot.firstname,
                lastname: order.customerSnapshot.lastname,
                email: order.customerSnapshot.email,
                clientType: order.customerSnapshot.clientType,
                institution: order.customerSnapshot.institution
            };

            const printer = {
                username: order.printerSnapshot.name,
                institution: order.printerSnapshot
            };

            const pdf = await generateInvoicePdf(
                order,
                customer,
                printer
            );

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${order.invoiceNumber}.pdf"`
            );

            return res.send(pdf);
        } catch(error) {
            console.log('DOWNLOAD INVOICE ERROR:', error);

            return res.status(500).json({
                message: 'Greška pri generisanju fakture.'
            });
        }
    };
}