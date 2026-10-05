import express from 'express';
import mongoose from 'mongoose';
import UserModel from '../models/user';
import CategoryModel from '../models/category';
import ProductModel from '../models/product';
import OrderModel from '../models/order';

export class AdminController{
    private checkAdmin=async(adminId:string)=>{
        if(!mongoose.Types.ObjectId.isValid(adminId)){
            return null;
        }

        return UserModel.findOne({
            _id:adminId,
            role:"admin",
            status:"active"
        });
    };

    private escapeRegex(value:string){
        return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    }

    public getAllUsers=async(req:express.Request,res:express.Response)=>{
        try{
            const adminId=String(req.query.adminId??"");

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            const users=await UserModel
                .find({
                    status:{$ne:"deleted"}
                })
                .select("-password -profileImage.data")
                .sort({
                    lastname:1,
                    firstname:1
                });

            return res.status(200).json(users);
        }catch(error){
            console.log("GET ALL USERS ERROR:",error);

            return res.status(500).json({
                message:"Greška pri učitavanju korisnika."
            });
        }
    };

    public getPendingUsers=async(req:express.Request,res:express.Response)=>{
        try{
            const adminId=String(req.query.adminId??"");

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            const users=await UserModel
                .find({
                    status:"pending",
                    role:{$in:["client","printer"]}
                })
                .select("-password -profileImage.data")
                .sort({
                    lastname:1,
                    firstname:1
                });

            return res.status(200).json(users);
        }catch(error){
            console.log("GET PENDING USERS ERROR:",error);

            return res.status(500).json({
                message:"Greška pri učitavanju zahteva."
            });
        }
    };

    public approveUser=async(req:express.Request,res:express.Response)=>{
        try{
            const productUserId=Array.isArray(req.params.userId)
                ?req.params.userId[0]
                :req.params.userId;

            const {adminId}=req.body;

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            if(!mongoose.Types.ObjectId.isValid(productUserId)){
                return res.status(400).json({
                    message:"Neispravan ID korisnika."
                });
            }

            const user=await UserModel.findOneAndUpdate(
                {
                    _id:productUserId,
                    status:"pending",
                    role:{$in:["client","printer"]}
                },
                {
                    $set:{
                        status:"active"
                    }
                },
                {
                    new:true
                }
            ).select("-password -profileImage.data");

            if(!user){
                return res.status(404).json({
                    message:"Zahtev za registraciju nije pronađen."
                });
            }

            return res.status(200).json({
                message:"Registracija je uspešno odobrena.",
                user
            });
        }catch(error){
            console.log("APPROVE USER ERROR:",error);

            return res.status(500).json({
                message:"Greška pri odobravanju korisnika."
            });
        }
    };

    public rejectUser=async(req:express.Request,res:express.Response)=>{
        try{
            const userId=Array.isArray(req.params.userId)
                ?req.params.userId[0]
                :req.params.userId;

            const {adminId}=req.body;

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            if(!mongoose.Types.ObjectId.isValid(userId)){
                return res.status(400).json({
                    message:"Neispravan ID korisnika."
                });
            }

            const user=await UserModel.findOneAndUpdate(
                {
                    _id:userId,
                    status:"pending",
                    role:{$in:["client","printer"]}
                },
                {
                    $set:{
                        status:"rejected"
                    }
                },
                {
                    new:true
                }
            );

            if(!user){
                return res.status(404).json({
                    message:"Zahtev za registraciju nije pronađen."
                });
            }

            return res.status(200).json({
                message:"Zahtev za registraciju je odbijen."
            });
        }catch(error){
            console.log("REJECT USER ERROR:",error);

            return res.status(500).json({
                message:"Greška pri odbijanju registracije."
            });
        }
    };

    public updateUser=async(req:express.Request,res:express.Response)=>{
        try{
            const userId=Array.isArray(req.params.userId)
                ?req.params.userId[0]
                :req.params.userId;

            const {
                adminId,
                firstname,
                lastname,
                email,
                phone,
                status
            }=req.body;

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            if(!mongoose.Types.ObjectId.isValid(userId)){
                return res.status(400).json({
                    message:"Neispravan ID korisnika."
                });
            }

            const user=await UserModel.findById(userId);

            if(!user || user.status==="deleted"){
                return res.status(404).json({
                    message:"Korisnik nije pronađen."
                });
            }

            if(!firstname?.trim() || !lastname?.trim()){
                return res.status(400).json({
                    message:"Ime i prezime su obavezni."
                });
            }

            const EMAIL_REGEX=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const PHONE_REGEX=/^06\d{1}[0-9]{6,7}$/;

            if(!EMAIL_REGEX.test(email)){
                return res.status(400).json({
                    message:"Email adresa nije validna."
                });
            }

            if(!PHONE_REGEX.test(phone)){
                return res.status(400).json({
                    message:"Broj telefona nije validan."
                });
            }

            if(!["pending","active","rejected"].includes(status)){
                return res.status(400).json({
                    message:"Neispravan status korisnika."
                });
            }

            const existingEmail=await UserModel.findOne({
                email,
                _id:{$ne:userId},
                status:{$ne:"deleted"}
            });

            if(existingEmail){
                return res.status(400).json({
                    message:"Email adresa je već u upotrebi."
                });
            }

            user.firstname=firstname.trim();
            user.lastname=lastname.trim();
            user.email=email.trim();
            user.phone=phone.trim();
            user.status=status;

            await user.save();

            return res.status(200).json({
                message:"Korisnik je uspešno ažuriran.",
                user:{
                    _id:user._id,
                    username:user.username,
                    firstname:user.firstname,
                    lastname:user.lastname,
                    email:user.email,
                    phone:user.phone,
                    role:user.role,
                    clientType:user.clientType,
                    status:user.status,
                    institution:user.institution
                }
            });
        }catch(error){
            console.log("UPDATE USER ERROR:",error);

            return res.status(500).json({
                message:"Greška pri ažuriranju korisnika."
            });
        }
    };

    public deleteUser=async(req:express.Request,res:express.Response)=>{
        try{
            const userId=Array.isArray(req.params.userId)
                ?req.params.userId[0]
                :req.params.userId;

            const {adminId}=req.body;

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            if(!mongoose.Types.ObjectId.isValid(userId)){
                return res.status(400).json({
                    message:"Neispravan ID korisnika."
                });
            }

            if(userId===adminId){
                return res.status(400).json({
                    message:"Administrator ne može obrisati sopstveni nalog."
                });
            }

            const user=await UserModel.findOneAndUpdate(
                {
                    _id:userId,
                    status:{$ne:"deleted"}
                },
                {
                    $set:{
                        status:"deleted"
                    }
                },
                {
                    new:true
                }
            );

            if(!user){
                return res.status(404).json({
                    message:"Korisnik nije pronađen."
                });
            }

            return res.status(200).json({
                message:"Korisnički nalog je uspešno obrisan."
            });
        }catch(error){
            console.log("DELETE USER ERROR:",error);

            return res.status(500).json({
                message:"Greška pri brisanju korisnika."
            });
        }
    };

    public getCategories=async(req:express.Request,res:express.Response)=>{
        try{
            const adminId=String(req.query.adminId??"");

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            const categories=await CategoryModel
                .find({})
                .sort({name:1});

            return res.status(200).json(categories);
        }catch(error){
            console.log("GET CATEGORIES ERROR:",error);

            return res.status(500).json({
                message:"Greška pri učitavanju kategorija."
            });
        }
    };

    public createCategory=async(req:express.Request,res:express.Response)=>{
        try{
            const {adminId,name}=req.body;

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            const categoryName=String(name??"").trim();

            if(!categoryName){
                return res.status(400).json({
                    message:"Unesite naziv kategorije."
                });
            }

            const existing=await CategoryModel.findOne({
                name:{
                    $regex:`^${this.escapeRegex(categoryName)}$`,
                    $options:"i"
                }
            });

            if(existing){
                return res.status(400).json({
                    message:"Kategorija već postoji."
                });
            }

            const category=await CategoryModel.create({
                name:categoryName,
                subcategories:[]
            });

            return res.status(201).json({
                message:"Kategorija je uspešno dodata.",
                category
            });
        }catch(error){
            console.log("CREATE CATEGORY ERROR:",error);

            return res.status(500).json({
                message:"Greška pri dodavanju kategorije."
            });
        }
    };

    public createSubcategory=async(req:express.Request,res:express.Response)=>{
        try{
            const {
                adminId,
                categoryId,
                name
            }=req.body;

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            if(!mongoose.Types.ObjectId.isValid(categoryId)){
                return res.status(400).json({
                    message:"Neispravna kategorija."
                });
            }

            const subcategoryName=String(name??"").trim();

            if(!subcategoryName){
                return res.status(400).json({
                    message:"Unesite naziv potkategorije."
                });
            }

            const category=await CategoryModel.findById(categoryId);

            if(!category){
                return res.status(404).json({
                    message:"Kategorija nije pronađena."
                });
            }

            const existing=category.subcategories.some(
                (subcategory:any)=>
                    subcategory.name.toLowerCase()===
                    subcategoryName.toLowerCase()
            );

            if(existing){
                return res.status(400).json({
                    message:"Potkategorija već postoji."
                });
            }

            category.subcategories.push({
                name:subcategoryName
            } as any);

            await category.save();

            return res.status(201).json({
                message:"Potkategorija je uspešno dodata.",
                category
            });
        }catch(error){
            console.log("CREATE SUBCATEGORY ERROR:",error);

            return res.status(500).json({
                message:"Greška pri dodavanju potkategorije."
            });
        }
    };

    public getPrinterRevenue=async(req:express.Request,res:express.Response)=>{
        try{
            const adminId=String(req.query.adminId??"");

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            const from=new Date();
            from.setMonth(from.getMonth()-3);

            const result=await OrderModel.aggregate([
                {
                    $addFields:{
                        statisticsDate:{
                            $ifNull:[
                                "$paidAt",
                                "$createdAt"
                            ]
                        }
                    }
                },
                {
                    $match:{
                        statisticsDate:{
                            $gte:from
                        },
                        status:{
                            $in:[
                                "paid",
                                "printing",
                                "delivered",
                                "received"
                            ]
                        }
                    }
                },
                {
                    $group:{
                        _id:"$printerId",
                        printerName:{
                            $first:"$printerSnapshot.name"
                        },
                        revenue:{
                            $sum:"$totalAmount"
                        }
                    }
                },
                {
                    $sort:{
                        revenue:-1
                    }
                }
            ]);

            return res.status(200).json(result);
        }catch(error){
            console.log("PRINTER REVENUE ERROR:",error);

            return res.status(500).json({
                message:"Greška pri učitavanju statistike prometa."
            });
        }
    };

    public getMostOrderedProducts=async(req:express.Request,res:express.Response)=>{
        try{
            const adminId=String(req.query.adminId??"");

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            const from=new Date();
            from.setMonth(from.getMonth()-1);

            const products=await OrderModel.aggregate([
                {
                    $addFields:{
                        statisticsDate:{
                            $ifNull:[
                                "$paidAt",
                                "$createdAt"
                            ]
                        }
                    }
                },
                {
                    $match:{
                        statisticsDate:{
                            $gte:from
                        },
                        status:{
                            $in:[
                                "paid",
                                "printing",
                                "delivered",
                                "received"
                            ]
                        }
                    }
                },
                {
                    $unwind:"$items"
                },
                {
                    $group:{
                        _id:"$items.productId",
                        productName:{
                            $first:"$items.productName"
                        },
                        quantity:{
                            $sum:"$items.quantity"
                        }
                    }
                },
                {
                    $sort:{
                        quantity:-1
                    }
                }
            ]);

            const totalQuantity=products.reduce(
                (sum,product)=>sum+product.quantity,
                0
            );

            const result=products.map(product=>({
                productId:product._id,
                productName:product.productName,
                quantity:product.quantity,
                percentage:totalQuantity===0
                    ?0
                    :Number(
                        (
                            product.quantity*100/totalQuantity
                        ).toFixed(2)
                    )
            }));

            return res.status(200).json(result);
        }catch(error){
            console.log("MOST ORDERED PRODUCTS ERROR:",error);

            return res.status(500).json({
                message:"Greška pri učitavanju statistike proizvoda."
            });
        }
    };

    public getProductRatingHistory=async(req:express.Request,res:express.Response)=>{
        try{
            const adminId=String(req.query.adminId??"");

            if(!await this.checkAdmin(adminId)){
                return res.status(403).json({
                    message:"Nedozvoljen pristup."
                });
            }

            const products=await ProductModel
                .find({})
                .select(
                    "_id code name reactionHistory likedBy dislikedBy"
                )
                .sort({name:1});

            const result=products.map(product=>({
                productId:product._id,
                productName:product.name,
                currentLikeCount:product.likedBy.length,
                currentDislikeCount:product.dislikedBy.length,
                currentScore:
                    product.likedBy.length-
                    product.dislikedBy.length,
                points:product.reactionHistory.map(
                    point=>({
                        date:point.date,
                        likeCount:point.likeCount,
                        dislikeCount:point.dislikeCount,
                        score:point.score
                    })
                )
            }));

            return res.status(200).json(result);
        }catch(error){
            console.log("PRODUCT RATING HISTORY ERROR:",error);

            return res.status(500).json({
                message:"Greška pri učitavanju statistike ocena."
            });
        }
    };
}