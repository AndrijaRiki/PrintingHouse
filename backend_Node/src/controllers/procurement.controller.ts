import express from 'express';
import ProcurementBidModel from '../models/procurementBids';
import PublicProcurementModel from '../models/publicProcurement';
import { sendProcurementEmails } from '../services/email.service';
import CartModel from '../models/cart';
import UserModel from '../models/user';
import ProductModel from '../models/product';

export class PublicProcurementController {
    public createPublicProcurement = async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.body;

            const user = await UserModel.findById(userId);
            if(!user) {
                return res.status(404).json({ message: "Korisnik nije pronađen." });
            }

            if(user.clientType !== 'company') {
                return res.status(403).json({ message: "Javne nabavke su dostupne samo pravnim licima." });
            }

            const cart = await CartModel.findOne({ userId }).populate('items.productId');

            if(!cart || cart.items.length === 0) {
                return res.status(400).json({ message: "Korpa je prazna." });
            }

            if(cart.items.some((item: any) => !item.productId)) {
                return res.status(400).json({ message: "Neki proizvod iz korpe više nije dostupan." });
            }

            const items = cart.items.map((item: any) => ({
                originalProductId: item.productId._id,
                productName: item.productId.name,
                categoryId: item.productId.categoryId,
                subcategoryId: item.productId.subcategoryId,
                quantity: item.quantity,
                color: item.color,
                printService: item.selectedPrintServiceType ?? null,
                customization: item.customization ?? null
            }));

            const procurement = new PublicProcurementModel({
                userId,
                items,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            });

            await procurement.save();

            cart.items.splice(0, cart.items.length);
            await cart.save();

            try {
                await sendProcurementEmails(procurement);
            } catch(error) {
                console.log("PROCUREMENT EMAIL ERROR:", error);
            }

            return res.status(201).json({
                message: "Javna nabavka je uspešno otvorena.",
                procurement
            });
        } catch(error) {
            console.log("CREATE PROCUREMENT ERROR:", error);
            return res.status(500).json({ message: "Greška pri kreiranju javne nabavke." });
        }
    };

    public getUserProcurements = async (req: express.Request, res: express.Response) => {
        try {
            const userId = req.params.userId;

            const procurements = await PublicProcurementModel.find({ userId })
                .populate('winnerPrinterId', 'username institution')
                .sort({ createdAt: -1 });

            return res.status(200).json(procurements);
        } catch(error) {
            console.log("GET USER PROCUREMENTS ERROR:", error);
            return res.status(500).json({ message: "Greška pri učitavanju javnih nabavki." });
        }
    };

    public getOpenProcurements = async (req: express.Request, res: express.Response) => {
        try {
            const procurements = await PublicProcurementModel.find({
                status: 'open',
                expiresAt: { $gt: new Date() }
            }).sort({ createdAt: -1 });

            return res.status(200).json(procurements);
        } catch(error) {
            console.log("GET OPEN PROCUREMENTS ERROR:", error);
            return res.status(500).json({ message: "Greška pri učitavanju otvorenih javnih nabavki." });
        }
    };

    public placeBid = async (req: express.Request, res: express.Response) => {
        try {
            const procurementId = req.params.procurementId;
            const { printerId, items } = req.body;

            if(!printerId || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: "Nedostaju podaci za ponudu." });
            }

            const procurement = await PublicProcurementModel.findById(procurementId);

            if(!procurement) {
                return res.status(404).json({ message: "Javna nabavka nije pronađena." });
            }

            if(procurement.status !== 'open') {
                return res.status(400).json({ message: "Licitacija više nije otvorena." });
            }

            if(new Date() >= procurement.expiresAt) {
                return res.status(400).json({ message: "Vreme za licitiranje je isteklo." });
            }

            const printer = await UserModel.findById(printerId);

            if(!printer || printer.role !== 'printer') {
                return res.status(403).json({ message: "Ponudu može podneti samo štamparija." });
            }

            if(items.length !== procurement.items.length) {
                return res.status(400).json({ message: "Ponuda mora obuhvatiti sve tražene proizvode." });
            }

            const requestedIds = new Set(items.map((item: any) => String(item.requestedItemId)));

            if(requestedIds.size !== procurement.items.length) {
                return res.status(400).json({ message: "Ponuda sadrži duplirane ili nedostajuće stavke." });
            }

            const bidItems = [];
            let totalAmount = 0;

            for(const requestedItem of procurement.items) {
                const offeredItem = items.find((item: any) =>
                    String(item.requestedItemId) === String(requestedItem._id)
                );

                if(!offeredItem) {
                    return res.status(400).json({ message: `Nedostaje ponuda za proizvod ${requestedItem.productName}.` });
                }

                const product = await ProductModel.findById(offeredItem.productId);

                if(!product || !product.active) {
                    return res.status(404).json({ message: "Ponuđeni proizvod nije dostupan." });
                }

                if(String(product.printerId) !== String(printerId)) {
                    return res.status(403).json({ message: "Ponuđeni proizvod ne pripada ovoj štampariji." });
                }

                if(String(product.categoryId) !== String(requestedItem.categoryId) ||
                    String(product.subcategoryId) !== String(requestedItem.subcategoryId)) {
                    return res.status(400).json({
                        message: `${product.name} ne odgovara traženoj kategoriji proizvoda.`
                    });
                }

                if(product.quantity < requestedItem.quantity) {
                    return res.status(400).json({
                        message: `Nema dovoljno proizvoda ${product.name} na stanju.`
                    });
                }

                if(requestedItem.printService) {
                    const supportsService = product.printServices.some(
                        service => service.type === requestedItem.printService
                    );

                    if(!supportsService) {
                        return res.status(400).json({
                            message: `${product.name} ne podržava traženu uslugu štampe ${requestedItem.printService}.`
                        });
                    }
                }

                const unitPrice = Number(offeredItem.unitPrice);

                if(!Number.isFinite(unitPrice) || unitPrice <= 0) {
                    return res.status(400).json({ message: "Cena mora biti veća od nule." });
                }

                const totalPrice = unitPrice * requestedItem.quantity;
                totalAmount += totalPrice;

                bidItems.push({
                    requestedItemId: requestedItem._id,
                    productId: product._id,
                    unitPrice,
                    quantity: requestedItem.quantity,
                    totalPrice
                });
            }

            const bid = await ProcurementBidModel.findOneAndUpdate(
                { procurementId, printerId },
                {
                    $set: {
                        items: bidItems,
                        totalAmount
                    }
                },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            return res.status(200).json({
                message: "Ponuda je uspešno sačuvana.",
                bid
            });
        } catch(error) {
            console.log("PLACE BID ERROR:", error);
            return res.status(500).json({ message: "Greška pri slanju ponude." });
        }
    };

    public getPrinterBid = async (req: express.Request, res: express.Response) => {
        try {
            const { procurementId, printerId } = req.params;

            const bid = await ProcurementBidModel.findOne({
                procurementId,
                printerId
            });

            return res.status(200).json(bid);
        } catch(error) {
            console.log("GET PRINTER BID ERROR:", error);
            return res.status(500).json({ message: "Greška pri učitavanju ponude." });
        }
    };
}