import express from 'express';
import path from 'path';
import ProductModel from '../models/product';
import CategoryModel from '../models/category';
import mongoose from 'mongoose';
import OrderModel from '../models/order';
import { ArchiveProduct } from '../models/archiveProduct';
import UserModel from '../models/user';
import ProductCommentModel from '../models/productComment';

export class ProductController {
    public getAllProducts = async(req: express.Request, res: express.Response) => {
        try {
            const products = await ProductModel
                .find()
                .select("-mainImage.data -additionalImages.data");

            const result = products.map(product => ({
                ...product.toObject(),
                likeCount: product.likedBy.length,
                dislikeCount: product.dislikedBy.length,
                additionalImageCount: product.additionalImages.length
            }));

            return res.json(result);
        } catch(error) {
        console.log("Get all products error:", error);
        return res.status(500).json([]);
        }
    }

    public getTop5Products = async(req: express.Request, res: express.Response) => {
        try {
            const products = await ProductModel.aggregate([
                {
                    $match: {
                        active: true,
                        quantity: { $gt: 0 }
                    }
                },
                {
                    $addFields: {
                        likeCount: {
                            $size: { $ifNull: ["$likedBy", []] }
                        },
                        dislikeCount: {
                            $size: { $ifNull: ["$dislikedBy", []] }
                        },
                        additionalImageCount: {
                            $size: { $ifNull: ["$additionalImages", []] }
                        }
                    }
                },
                {
                    $sort: {
                        likeCount: -1
                    }
                },
                {
                    $limit: 5
                },
                {
                    $project: {
                        "mainImage.data": 0,
                        "additionalImages.data": 0
                    }
                }
            ]);

            return res.json(products);
        } catch(error) {
            console.log("Get top 5 products error:", error);
            return res.status(500).json([]);
        }
    }

    public getAvailableCategories = async(req: express.Request, res: express.Response) => {
        try {
            const categoryIds = await ProductModel.distinct(
                "categoryId",
                {
                active: true,
                quantity: { $gt: 0 }
                }
            );

            const categories = await CategoryModel.find({
                _id: {
                $in: categoryIds
                }
            });

            return res.json(categories);
        } catch(error) {
        console.log("Get categories error:", error);
        return res.status(500).json([]);
        }
    }

    public searchProducts = async(req: express.Request, res: express.Response) => {
        try {
        const name = req.query.name as string;
        const categoryId = req.query.categoryId as string;

        const filter: any = {
            active: true,
            quantity: { $gt: 0 }
        };

        if(name && name.trim() !== "") {
            filter.name = {
            $regex: name.trim(),
            $options: "i"
            };
        }

        if(categoryId && categoryId !== "") {
            filter.categoryId = categoryId;
        }

        const products = await ProductModel
            .find(filter)
            .select("-mainImage.data -additionalImages.data");

        const result = products.map(product => ({
            ...product.toObject(),
            likeCount: product.likedBy.length,
            dislikeCount: product.dislikedBy.length,
            additionalImageCount: product.additionalImages.length
        }));

        return res.json(result);
        } catch(error) {
        console.log("Search products error:", error);
        return res.status(500).json([]);
        }
    }

    public getProduct = async(req: express.Request, res: express.Response) => {
        try {
            const productId = req.params.productId;

            const product = await ProductModel
            .findById(productId)
            .select("-mainImage.data -additionalImages.data")
            .populate("printerId", "username institution");

            if(!product) {
            return res.status(404).json(null);
            }

            const result = {
            ...product.toObject(),
            likeCount: product.likedBy.length,
            dislikeCount: product.dislikedBy.length,
            additionalImageCount: product.additionalImages.length,
            hasMainImage: product.mainImage != null
            };

            return res.json(result);
        } catch(error) {
            console.log("Get product error:", error);
            return res.status(500).json(null);
        }
    }

    public getMainImage = async(req: express.Request, res: express.Response) => {
        try {
        const product = await ProductModel
            .findById(req.params.productId)
            .select("mainImage");

        if(!product) {
            return res.status(404).send();
        }

        if(!product.mainImage || !product.mainImage.data) {
            const defaultImage = path.resolve(
            process.cwd(),
            "assets",
            "default_product_image.jpg"
            );

            return res.sendFile(defaultImage);
        }

        res.setHeader(
            "Content-Type",
            product.mainImage.contentType
        );

        return res.send(product.mainImage.data);
        } catch(error) {
        console.log("Get main image error:", error);
        return res.status(500).send();
        }
    }

    public getAdditionalImage = async(req: express.Request, res: express.Response) => {
        try {
        const product = await ProductModel
            .findById(req.params.productId)
            .select("additionalImages");

        if(!product) {
            return res.status(404).send();
        }

        const index = Number(req.params.index);

        if(
            isNaN(index) ||
            index < 0 ||
            index >= product.additionalImages.length
        ) {
            return res.status(404).send();
        }

        const image = product.additionalImages[index];

        res.setHeader(
            "Content-Type",
            image.contentType
        );

        return res.send(image.data);
        } catch(error) {
        console.log("Get additional image error:", error);
        return res.status(500).send();
        }
    }

    public getProductDetails = async (req: express.Request, res: express.Response) => {
        try {
            const productId = req.params.productId;

            const product = await ProductModel
                .findById(productId)
                .select("-mainImage.data -additionalImages.data")
                .populate("printerId", "username institution");

            if(!product) {
                return res.status(404).json({
                    message: "Proizvod nije pronađen."
                });
            }

            return res.status(200).json(product);

        } catch(error) {
            console.log("Error: " + error);

            return res.status(500).json({
                message: "Greška sa učitavanjem detalja proizvoda."
            });
        }
    }

    public likeProduct=async(req:express.Request,res:express.Response)=>{
        try{
            const productId=Array.isArray(req.params.productId)
                ?req.params.productId[0]
                :req.params.productId;
            const {userId}=req.body;

            if(!userId){
                return res.status(400).json({
                    message:"Nedostaje korisnik."
                });
            }

            if(
                typeof productId!=="string" ||
                !mongoose.Types.ObjectId.isValid(productId) ||
                !mongoose.Types.ObjectId.isValid(userId)
            ){
                return res.status(400).json({
                    message:"Neispravni podaci."
                });
            }

            const receivedOrder=await OrderModel.findOne({
                userId,
                status:"received",
                "items.productId":productId
            });

            if(!receivedOrder){
                return res.status(403).json({
                    message:"Možete oceniti samo proizvod koji ste primili."
                });
            }

            const product=await ProductModel.findById(productId);

            if(!product){
                return res.status(404).json({
                    message:"Proizvod nije pronađen."
                });
            }

            const alreadyLiked=product.likedBy.some(
                id=>id.toString()===userId
            );

            if(alreadyLiked){
                product.likedBy=product.likedBy.filter(
                    id=>id.toString()!==userId
                );
            }else{
                product.likedBy.push(
                    new mongoose.Types.ObjectId(userId)
                );

                product.dislikedBy=product.dislikedBy.filter(
                    id=>id.toString()!==userId
                );
            }

            product.reactionHistory.push({
                date:new Date(),
                likeCount:product.likedBy.length,
                dislikeCount:product.dislikedBy.length,
                score:product.likedBy.length-product.dislikedBy.length
            });

            await product.save();

            return res.status(200).json({
                message:alreadyLiked
                    ?"Lajk je uklonjen."
                    :"Proizvod je lajkovan.",
                liked:!alreadyLiked,
                disliked:false,
                likeCount:product.likedBy.length,
                dislikeCount:product.dislikedBy.length
            });
        }catch(error){
            console.log("LIKE PRODUCT ERROR:",error);

            return res.status(500).json({
                message:"Greška pri ocenjivanju proizvoda."
            });
        }
    };

    public dislikeProduct=async(req:express.Request,res:express.Response)=>{
        try{
            const productId=Array.isArray(req.params.productId)
                ? req.params.productId[0]
                : req.params.productId;
            const {userId}=req.body;

            if(!userId){
                return res.status(400).json({
                    message:"Nedostaje korisnik."
                });
            }

            if(
                !mongoose.Types.ObjectId.isValid(productId) ||
                !mongoose.Types.ObjectId.isValid(userId)
            ){
                return res.status(400).json({
                    message:"Neispravni podaci."
                });
            }

            const receivedOrder=await OrderModel.findOne({
                userId,
                status:"received",
                "items.productId":productId
            });

            if(!receivedOrder){
                return res.status(403).json({
                    message:"Možete oceniti samo proizvod koji ste primili."
                });
            }

            const product=await ProductModel.findById(productId);

            if(!product){
                return res.status(404).json({
                    message:"Proizvod nije pronađen."
                });
            }

            const alreadyDisliked=product.dislikedBy.some(
                id=>id.toString()===userId
            );

            if(alreadyDisliked){
                product.dislikedBy=product.dislikedBy.filter(
                    id=>id.toString()!==userId
                );
            }else{
                product.dislikedBy.push(
                    new mongoose.Types.ObjectId(userId)
                );

                product.likedBy=product.likedBy.filter(
                    id=>id.toString()!==userId
                );
            }

            product.reactionHistory.push({
                date:new Date(),
                likeCount:product.likedBy.length,
                dislikeCount:product.dislikedBy.length,
                score:product.likedBy.length-product.dislikedBy.length
            });

            await product.save();

            return res.status(200).json({
                message:alreadyDisliked
                    ?"Dislajk je uklonjen."
                    :"Proizvod je dislajkovan.",
                liked:false,
                disliked:!alreadyDisliked,
                likeCount:product.likedBy.length,
                dislikeCount:product.dislikedBy.length
            });
        }catch(error){
            console.log("DISLIKE PRODUCT ERROR:",error);

            return res.status(500).json({
                message:"Greška pri ocenjivanju proizvoda."
            });
        }
    };

    public getArchivedProducts = async (req: express.Request, res: express.Response) => {
        try {
            const userId = req.params.userId;

            const orders = await OrderModel.find({
                userId,
                status: { $in: ['delivered', 'received'] }
            }).sort({ issuedAt: -1 });

            const archivedProducts: ArchiveProduct[] = [];

            for(const order of orders) {
                if(!order.printerSnapshot) {
                    console.log("ORDER NEMA PRINTER SNAPSHOT:", order._id, order.invoiceNumber);
                }

                const printer = await UserModel.findById(order.printerId);

                for(const item of order.items) {
                    const product = await ProductModel.findById(item.productId);
                    if(!product) continue;

                    let userReaction: 'like' | 'dislike' | null = null;

                    if(product.likedBy.some(id => id.toString() === userId)) {
                        userReaction = 'like';
                    } else if(product.dislikedBy.some(id => id.toString() === userId)) {
                        userReaction = 'dislike';
                    }

                    archivedProducts.push({
                        archiveId: `${order._id}-${item.productId}`,
                        orderId: order._id.toString(),
                        productId: item.productId.toString(),
                        productName: item.productName,
                        quantity: item.quantity,
                        color: item.color,
                        printService: item.selectedPrintService?.type ?? null,
                        printerId: order.printerId.toString(),
                        printerName: order.printerSnapshot?.name
                            ?? printer?.institution?.name
                            ?? printer?.username
                            ?? "Nepoznata štamparija",
                        printerCity: order.printerSnapshot?.city
                            ?? printer?.institution?.city
                            ?? "",
                        orderDate: order.issuedAt ?? order.createdAt,
                        status: order.status as 'delivered' | 'received',
                        userReaction
                    });
                }
            }

            return res.status(200).json(archivedProducts);
        } catch(error) {
            console.log("GET ARCHIVED PRODUCTS ERROR:", error);
            return res.status(500).json({
                message: "Greška pri učitavanju arhive proizvoda."
            });
        }
    };

    public confirmReceipt = async (req: express.Request, res: express.Response) => {
        try {
            const {orderId, userId} = req.body;

            if(!orderId || !userId) {
                return res.status(400).json({message: "Nedostaju podaci."});
            }

            const order = await OrderModel.findOne({_id: orderId, userId});

            if(!order) {
                return res.status(404).json({message: "Narudzbina nije pronadjena."});
            }

            if(order.status !== 'delivered') {
                return res.status(400).json({message: "Samo isporucena porudzbina moze biti primljena"});
            }

            order.status = 'received';
            await order.save();

            return res.status(200).json({
                message: "Prijem je uspesno potvrdjen",
                status: order.status
            });
        } catch(error) {
            console.log("CONFIRM RECEIPT ERROR: ", error);
            return res.status(500).json({message: "Greska pri potvrdi prijema."});
        }
    }

    public addComment = async (req: express.Request, res: express.Response) => {
        try {
            const productId = req.params.productId;
            const { userId, text } = req.body;

            console.log("ADD COMMENT START");
            console.log("productId:", productId);
            console.log("userId:", userId);
            console.log("text:", text);

            if(!userId || !text?.trim()) {
                return res.status(400).json({ message: "Nedostaju podaci." });
            }

            const user = await UserModel.findById(userId);
            if(!user) {
                return res.status(404).json({ message: "Korisnik nije pronađen." });
            }

            const product = await ProductModel.findById(productId);
            if(!product) {
                return res.status(404).json({ message: "Proizvod nije pronađen." });
            }

            const receivedOrder = await OrderModel.findOne({
                userId,
                status: 'received',
                "items.productId": productId
            });

            if(!receivedOrder) {
                return res.status(403).json({
                    message: "Možete komentarisati samo proizvode koje ste primili."
                });
            }

            const comment = new ProductCommentModel({
                productId,
                userId,
                username: user.username,
                text: text.trim()
            });

            await comment.save();

            console.log("KOMENTAR SACUVAN:", comment._id);
            console.log("SALJEM RESPONSE");

            return res.status(201).json({
                message: "Komentar je uspešno dodat."
            });
        } catch(error) {
            console.log("ADD COMMENT ERROR:", error);

            return res.status(500).json({
                message: "Greška pri dodavanju komentara."
            });
        }
    };

    public getLastComments = async (req: express.Request, res: express.Response) => {
        try {
            const productId = req.params.productId;

            const comments = await ProductCommentModel.find({ productId })
                .sort({ createdAt: -1 })
                .limit(5);

            return res.status(200).json(comments);
        } catch(error) {
            console.log("GET COMMENTS ERROR:", error);
            return res.status(500).json({ message: "Greška pri učitavanju komentara." });
        }
    };

    public getProductsByPrinter = async (req: express.Request, res: express.Response) => {
        try {
            const printerId = req.params.printerId;

            console.log("REQ PARAMS:", req.params);
            console.log("PRINTER ID BACKEND:", printerId);

            const products = await ProductModel.find({
                printerId,
                active: true
            }).select('_id name quantity unitPrice categoryId subcategoryId printServices');

            console.log("PRONADJENI PROIZVODI:", products);

            return res.status(200).json(products);
        } catch(error) {
            console.log("GET PRINTER PRODUCTS ERROR:", error);
            return res.status(500).json([]);
        }
    };

    public getAllCategories = async(req: express.Request, res: express.Response) => {
        try {
            const categories = await CategoryModel.find({});
            return res.status(200).json(categories);
        } catch(error) {
            console.log("GET ALL CATEGORIES ERROR:", error);
            return res.status(500).json([]);
        }
    };

    public getPrinterProducts = async(req: express.Request, res: express.Response) => {
        try {
            const printerId = req.params.printerId;

            if(!printerId) {
                return res.status(400).json({
                    message: "Nedostaje ID štamparije."
                });
            }

            const products = await ProductModel.find({
                printerId: printerId
            })
            .select("-mainImage.data -additionalImages.data")
            .sort({name: 1});

            const result = products.map(product => ({
                ...product.toObject(),
                likeCount: product.likedBy.length,
                dislikeCount: product.dislikedBy.length,
                additionalImageCount: product.additionalImages.length,
                hasMainImage: product.mainImage != null
            }));

            return res.status(200).json(result);
        } catch(error) {
            console.log("GET PRINTER PRODUCTS ERROR:", error);
            return res.status(500).json([]);
        }
    };

    public createProduct = async(req: express.Request, res: express.Response) => {
        try {
            const {
                code,
                name,
                description,
                printerId,
                categoryId,
                subcategoryId,
                unitPrice,
                quantity,
                colors,
                printServices
            } = req.body;

            if(!code || !name || !printerId || !categoryId || !subcategoryId) {
                return res.status(400).json({
                    message: "Nisu popunjeni svi obavezni podaci."
                });
            }

            const category = await CategoryModel.findById(categoryId);

            if(!category) {
                return res.status(400).json({
                    message: "Izabrana kategorija ne postoji."
                });
            }

            const subcategoryExists = category.subcategories.some(
                (subcategory: any) =>
                    subcategory._id.toString() === subcategoryId
            );

            if(!subcategoryExists) {
                return res.status(400).json({
                    message: "Izabrana potkategorija ne pripada izabranoj kategoriji."
                });
            }

            const existingCode = await ProductModel.findOne({
                code: code.trim()
            });

            if(existingCode) {
                return res.status(400).json({
                    message: "Proizvod sa ovom šifrom već postoji."
                });
            }

            let parsedColors: string[] = [];
            let parsedServices: any[] = [];

            try {
                parsedColors = colors ? JSON.parse(colors) : [];
                parsedServices = printServices
                    ? JSON.parse(printServices)
                    : [];
            } catch(error) {
                return res.status(400).json({
                    message: "Neispravni podaci o bojama ili uslugama."
                });
            }

            for(const service of parsedServices) {
                if(!service.type ||
                Number(service.additionalPrice) < 0 ||
                Number(service.maxWidthMm) <= 0 ||
                Number(service.maxHeightMm) <= 0) {

                    return res.status(400).json({
                        message: "Podaci o dodatnim uslugama nisu ispravni."
                    });
                }
            }

            let mainImage = null;

            if(req.file) {
                mainImage = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                };
            }

            const product = new ProductModel({
                code: code.trim(),
                name: name.trim(),
                description: description?.trim() ?? "",
                printerId: printerId,
                categoryId: categoryId,
                subcategoryId: subcategoryId,
                unitPrice: Number(unitPrice),
                quantity: Number(quantity),
                colors: parsedColors,
                active: true,
                mainImage: mainImage,
                additionalImages: [],
                printServices: parsedServices,
                likedBy: [],
                dislikedBy: []
            });

            await product.save();

            return res.status(201).json({
                message: "Proizvod je uspešno dodat.",
                product: product
            });
        } catch(error) {
            console.log("CREATE PRODUCT ERROR:", error);

            return res.status(500).json({
                message: "Greška pri dodavanju proizvoda."
            });
        }
    };
}