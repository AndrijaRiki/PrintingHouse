import PublicProcurementModel from '../models/publicProcurement';
import ProcurementBidModel from '../models/procurementBids';
import ProductModel from '../models/product';
import UserModel from '../models/user';
import OrderModel from '../models/order';

export async function finalizeExpiredProcurements() {
    try {
        const expired = await PublicProcurementModel.find({
            status: 'open',
            expiresAt: { $lte: new Date() }
        }).select('_id');

        for(const procurement of expired) {
            await finalizeProcurement(procurement._id.toString());
        }
    } catch(error) {
        console.log("FINALIZE PROCUREMENTS ERROR:", error);
    }
}

export async function finalizeProcurement(procurementId: string) {
    const procurement = await PublicProcurementModel.findOneAndUpdate(
        {
            _id: procurementId,
            status: 'open',
            expiresAt: { $lte: new Date() }
        },
        {
            $set: { status: 'processing' }
        },
        {
            new: true
        }
    );

    if(!procurement) return;

    try {
        const bids = await ProcurementBidModel.find({
            procurementId
        }).sort({ totalAmount: 1 });

        if(bids.length === 0) {
            procurement.status = 'no_offers';
            await procurement.save();
            return;
        }

        for(const bid of bids) {
            const printer = await UserModel.findById(bid.printerId);

            if(!printer || printer.role !== 'printer' || !printer.institution) {
                continue;
            }

            const orderItems: any[] = [];
            const stockNeeded = new Map<string, number>();
            let valid = true;
            let calculatedTotal = 0;

            for(const requestedItem of procurement.items) {
                const bidItem = bid.items.find((item: { requestedItemId: unknown }) =>
                    String(item.requestedItemId) === String(requestedItem._id)
                );

                if(!bidItem) {
                    valid = false;
                    break;
                }

                const product = await ProductModel.findById(bidItem.productId);

                if(!product || !product.active) {
                    valid = false;
                    break;
                }

                if(String(product.printerId) !== String(bid.printerId)) {
                    valid = false;
                    break;
                }

                if(String(product.categoryId) !== String(requestedItem.categoryId) ||
                    String(product.subcategoryId) !== String(requestedItem.subcategoryId)) {
                    valid = false;
                    break;
                }

                if(requestedItem.printService) {
                    const supportsService = product.printServices.some(
                        service => service.type === requestedItem.printService
                    );

                    if(!supportsService) {
                        valid = false;
                        break;
                    }
                }

                const key = product._id.toString();
                stockNeeded.set(key, (stockNeeded.get(key) ?? 0) + requestedItem.quantity);

                const selectedPrintService = requestedItem.printService
                    ? product.printServices.find(service => service.type === requestedItem.printService)
                    : null;

                const totalPrice = bidItem.unitPrice * requestedItem.quantity;
                calculatedTotal += totalPrice;

                orderItems.push({
                    productId: product._id,
                    productName: product.name,
                    quantity: requestedItem.quantity,
                    unitPrice: bidItem.unitPrice,
                    color: requestedItem.color,
                    selectedPrintService: selectedPrintService ? {
                        type: selectedPrintService.type,
                        additionalPrice: selectedPrintService.additionalPrice,
                        maxWidthMm: selectedPrintService.maxWidthMm,
                        maxHeightMm: selectedPrintService.maxHeightMm
                    } : null,
                    customization: requestedItem.customization ?? null,
                    totalPrice
                });
            }

            if(!valid) continue;

            for(const [productId, quantity] of stockNeeded) {
                const product = await ProductModel.findById(productId);

                if(!product || product.quantity < quantity) {
                    valid = false;
                    break;
                }
            }

            if(!valid) continue;

            const customer = await UserModel.findById(procurement.userId);

            if(!customer) {
                procurement.status = 'no_offers';
                await procurement.save();
                return;
            }

            const decrementedProducts: { productId: string, quantity: number }[] = [];

            for(const [productId, quantity] of stockNeeded) {
                const updated = await ProductModel.findOneAndUpdate(
                    {
                        _id: productId,
                        quantity: { $gte: quantity }
                    },
                    {
                        $inc: { quantity: -quantity }
                    },
                    {
                        new: true
                    }
                );

                if(!updated) {
                    valid = false;
                    break;
                }

                decrementedProducts.push({ productId, quantity });
            }

            if(!valid) {
                for(const item of decrementedProducts) {
                    await ProductModel.findByIdAndUpdate(item.productId, {
                        $inc: { quantity: item.quantity }
                    });
                }

                continue;
            }

            try {
                const invoiceNumber = `JN-${Date.now()}-${procurement._id.toString().slice(-6)}`;

                const order = new OrderModel({
                    userId: procurement.userId,
                    printerId: bid.printerId,
                    invoiceNumber,
                    issuedAt: new Date(),

                    customerSnapshot: {
                        firstname: customer.firstname,
                        lastname: customer.lastname,
                        email: customer.email,
                        clientType: customer.clientType,
                        institution: {
                            name: customer.institution?.name ?? null,
                            address: customer.institution?.address ?? null,
                            city: customer.institution?.city ?? null,
                            registrationNumber: customer.institution?.registrationNumber ?? null,
                            taxId: customer.institution?.taxId ?? null
                        }
                    },

                    printerSnapshot: {
                        name: printer.institution.name,
                        address: printer.institution.address,
                        city: printer.institution.city,
                        registrationNumber: printer.institution.registrationNumber ?? null,
                        taxId: printer.institution.taxId ?? null
                    },

                    items: orderItems,
                    totalAmount: calculatedTotal,
                    currency: 'RSD',
                    status: 'printing'
                });

                await order.save();

                procurement.status = 'awarded';
                procurement.winnerPrinterId = bid.printerId;
                procurement.winningBidId = bid._id;
                procurement.orderId = order._id;

                await procurement.save();

                console.log(
                    "PROCUREMENT AWARDED:",
                    procurement._id,
                    "PRINTER:",
                    printer.username,
                    "TOTAL:",
                    calculatedTotal
                );

                // OVDE POZIVAŠ ISTU LOGIKU ZA PDF FAKTURU KOJU VEĆ KORISTIŠ U createOrder().
                // Primer:
                // await generateAndSendInvoice(order);

                return;
            } catch(error) {
                for(const item of decrementedProducts) {
                    await ProductModel.findByIdAndUpdate(item.productId, {
                        $inc: { quantity: item.quantity }
                    });
                }

                throw error;
            }
        }

        procurement.status = 'no_offers';
        await procurement.save();
    } catch(error) {
        console.log("FINALIZE PROCUREMENT ERROR:", procurementId, error);

        await PublicProcurementModel.findByIdAndUpdate(procurementId, {
            status: 'open'
        });
    }
}

let finalizerStarted = false;

export function startProcurementFinalizer() {
    if(finalizerStarted) return;

    finalizerStarted = true;

    finalizeExpiredProcurements();

    setInterval(() => {
        finalizeExpiredProcurements();
    }, 5000);

    console.log("Procurement finalizer started.");
}