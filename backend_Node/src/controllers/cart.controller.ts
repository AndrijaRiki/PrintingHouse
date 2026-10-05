import express from 'express';
import CartModel from '../models/cart';
import UserModel from '../models/user';
import ProductModel from '../models/product';
import mongoose from 'mongoose';

export class CartController {
    public getCart = async(req: express.Request, res: express.Response) => {
        try {
            const userId = req.params.userId;
            const cart = await CartModel.findOne({userId: userId})
                .populate({
                    path: "items.productId",
                    select: "name unitPrice quantity printerId printServices",
                    populate: {
                        path: "printerId",
                        select: "username institution"
                    }
                });

            if(!cart) {
                return res.status(404).json({
                    message: "Korpa nije pronađena ili ista ne postoji za ovog korisnika"
                });
            }

            return res.status(200).json(cart);
        } catch(error) {
            console.log("GET CART ERROR:",error);

            return res.status(500).json({
                message: "Greška pri učitavanju korpe"
            });
        }
    }

    public addToCart = async (req: express.Request, res: express.Response) => {
        try {
            const {
                userId,
                productId,
                quantity,
                selectedPrintServiceType
            } = req.body;

            if(!userId || !productId || !quantity || quantity < 1) {
                return res.status(400).json({
                    message: "Neispravni podaci."
                });
            }

            const product = await ProductModel.findById(productId);

            if(!product) {
                return res.status(404).json({
                    message: "Proizvod nije pronađen."
                });
            }

            if(!product.active) {
                return res.status(400).json({
                    message: "Proizvod trenutno nije dostupan."
                });
            }

            if(product.quantity < quantity) {
                return res.status(400).json({
                    message: "Nema dovoljno proizvoda na stanju."
                });
            }

            if(selectedPrintServiceType) {
                const serviceExists = product.printServices.some(service =>
                    service.type === selectedPrintServiceType
                );

                if(!serviceExists) {
                    return res.status(400).json({
                        message: "Izabrana usluga štampe nije dostupna."
                    });
                }
            }

            let cart = await CartModel.findOne({
                userId: userId
            });

            if(!cart) {
                cart = new CartModel({
                    userId: userId,
                    items: []
                });
            }

            const existingItem = cart.items.find((item: any) =>
                item.productId.toString() === productId &&
                item.selectedPrintServiceType === (selectedPrintServiceType ?? null)
            );

            if(existingItem) {
                const newQuantity = existingItem.quantity + quantity;

                if(product.quantity < newQuantity) {
                    return res.status(400).json({
                        message: "Nema dovoljno proizvoda na stanju."
                    });
                }
                existingItem.quantity = newQuantity;

            } else {
                cart.items.push({
                    productId: productId,
                    quantity: quantity,
                    selectedPrintServiceType: selectedPrintServiceType ?? null
                });
            }
            await cart.save();
            return res.status(200).json({
                message: "Proizvod je dodat u korpu.",
                cart: cart
            });
        } catch(error) {
            console.log("ADD TO CART ERROR:", error);
            return res.status(500).json({
                message: "Serverska greška."
            });
        }
    }

    public updateCartItem = async (req: express.Request, res: express.Response) => {
        try {
            const {
                userId,
                productId,
                quantity,
                selectedPrintServiceType
            } = req.body;

            if(!userId || !productId || !quantity || quantity < 1) {
                return res.status(400).json({
                    message: "Neispravni podaci."
                });
            }

            const product = await ProductModel.findById(productId);

            if(!product) {
                return res.status(404).json({
                    message: "Proizvod nije pronađen."
                });
            }

            if(product.quantity < quantity) {
                return res.status(400).json({
                    message: "Nema dovoljno proizvoda na stanju."
                });
            }

            const cart = await CartModel.findOne({
                userId: userId
            });

            if(!cart) {
                return res.status(404).json({
                    message: "Korpa nije pronađena."
                });
            }

            const item = cart.items.find((item: any) =>
                item.productId.toString() === productId &&
                item.selectedPrintServiceType === (selectedPrintServiceType ?? null)
            );

            if(!item) {
                return res.status(404).json({
                    message: "Stavka nije pronađena u korpi."
                });
            }

            item.quantity = quantity;

            await cart.save();

            return res.status(200).json({
                message: "Količina je uspešno ažurirana.",
                cart: cart
            });

        } catch(error) {
            console.log("UPDATE CART ITEM ERROR:", error);

            return res.status(500).json({
                message: "Serverska greška."
            });
        }
    }

    public removeFromCart = async (req: express.Request, res: express.Response) => {
        try {
            const {
                userId,
                productId,
                selectedPrintServiceType
            } = req.body;

            const cart = await CartModel.findOne({
                userId: userId
            });

            if(!cart) {
                return res.status(404).json({
                    message: "Korpa nije pronađena."
                });
            }

            for(let i = cart.items.length - 1; i >= 0; i--) {
                const item = cart.items[i];

                if(item.productId.toString() === productId &&
                    item.selectedPrintServiceType === (selectedPrintServiceType ?? null)) {
                    cart.items.splice(i, 1);
                }
            }

            await cart.save();

            return res.status(200).json({
                message: "Proizvod je uklonjen iz korpe.",
                cart: cart
            });

        } catch(error) {
            console.log("REMOVE FROM CART ERROR:", error);

            return res.status(500).json({
                message: "Serverska greška."
            });
        }
    }

    public clearCart = async (req: express.Request, res: express.Response) => {
        try {
            const userId = req.params.userId;

            const cart = await CartModel.findOne({
                userId: userId
            });

            if(!cart) {
                return res.status(404).json({
                    message: "Korpa nije pronađena."
                });
            }
            cart.items.splice(0, cart.items.length);
            await cart.save();
            return res.status(200).json({
                message: "Korpa je uspešno ispražnjena.",
                cart: cart
            });
        } catch(error) {
            console.log("CLEAR CART ERROR:", error);

            return res.status(500).json({
                message: "Serverska greška."
            });
        }
    }

    public addCustomizedProduct = async (req: express.Request,res: express.Response) => {
        try {
            const {
                userId,
                productId,
                quantity,
                color,
                selectedPrintServiceType,
                customText
            } = req.body;

            if(!userId || !productId || !quantity) {
                return res.status(400).json({
                    message: "Nedostaju podaci."
                });
            }

            const numericQuantity = Number(quantity);

            if(!Number.isInteger(numericQuantity) ||numericQuantity < 1) {
                return res.status(400).json({
                    message: "Neispravna količina."
                });
            }

            const user = await UserModel.findById(userId);

            if(!user) {
                return res.status(404).json({
                    message: "Korisnik nije pronađen."
                });
            }

            const product = await ProductModel.findById(productId);

            if(!product) {
                return res.status(404).json({
                    message: "Proizvod nije pronađen."
                });
            }

            if(!product.active) {
                return res.status(400).json({
                    message: "Proizvod nije aktivan."
                });
            }

            if(numericQuantity > product.quantity) {
                return res.status(400).json({
                    message: "Nema dovoljno proizvoda na stanju."
                });
            }

            if(selectedPrintServiceType) {
                const service = product.printServices.find(service =>
                        service.type === selectedPrintServiceType
                    );

                if(!service) {
                    return res.status(400).json({
                        message: "Izabrana vrsta štampe nije dostupna."
                    });
                }
            }

            const files = req.files as {
                [fieldname: string]: Express.Multer.File[];
            };

            const previewFile = files?.["previewImage"]?.[0];
            const printFile = files?.["printImage"]?.[0];

            if(!previewFile ||!printFile) {
                return res.status(400).json({
                    message: "Nedostaju slike pripremljenog proizvoda."
                });
            }

            let cart = await CartModel.findOne({userId});

            if(!cart) {
                cart = new CartModel({userId, items: []});
            }

            cart.items.push({
                productId: new mongoose.Types.ObjectId(productId),
                quantity: numericQuantity,
                color: color || "Bela",
                selectedPrintServiceType: selectedPrintServiceType || null,
                customization: {
                    text: customText || null,
                    previewImage: {
                        data: previewFile.buffer,
                        contentType: previewFile.mimetype
                    },
                    printImage: {
                        data: printFile.buffer,
                        contentType: printFile.mimetype
                    }
                }
            });

            await cart.save();
            return res.status(200).json({
                message: "Proizvod je dodat u korpu."
            });
        } catch(error) {
            console.log("Greška pri dodavanju custom proizvoda: ", error);

            return res.status(500).json({
                message: "Greška pri dodavanju proizvoda u korpu."
            });
        }
    };
}