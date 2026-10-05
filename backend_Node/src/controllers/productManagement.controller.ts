import express from 'express';
import mongoose from 'mongoose';
import ProductModel from '../models/product';
import CategoryModel from '../models/category';
import UserModel from '../models/user';

export class ProductManagementController {
    private escapeRegex(value:string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    }

    private async checkPrinter(printerId:string) {
        if(!mongoose.Types.ObjectId.isValid(printerId))return null;

        const printer=await UserModel.findById(printerId);

        if(!printer || printer.role!=='printer')return null;

        return printer;
    }

    public getAllCategories=async(req:express.Request,res:express.Response)=>{
        try{
            const categories=await CategoryModel.find({}).sort({name:1});
            return res.status(200).json(categories);
        }catch(error){
            console.log('GET ALL CATEGORIES ERROR:',error);
            return res.status(500).json({
                message:'Greška pri učitavanju kategorija.'
            });
        }
    };

    public createCategory=async(req:express.Request,res:express.Response)=>{
        try{
            const {name,printerId}=req.body;

            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({
                    message:'Samo štampar može dodavati kategorije.'
                });
            }

            if(!name || !name.trim()){
                return res.status(400).json({
                    message:'Unesite naziv kategorije.'
                });
            }

            const categoryName=name.trim();

            const existing=await CategoryModel.findOne({
                name:{
                    $regex:`^${this.escapeRegex(categoryName)}$`,
                    $options:'i'
                }
            });

            if(existing){
                return res.status(400).json({
                    message:'Kategorija sa ovim nazivom već postoji.'
                });
            }

            const category=new CategoryModel({
                name:categoryName,
                subcategories:[]
            });

            await category.save();

            return res.status(201).json({
                message:'Kategorija je uspešno dodata.',
                category
            });
        }catch(error){
            console.log('CREATE CATEGORY ERROR:',error);
            return res.status(500).json({
                message:'Greška pri dodavanju kategorije.'
            });
        }
    };

    public createSubcategory=async(req:express.Request,res:express.Response)=>{
        try{
            const {categoryId,name,printerId}=req.body;

            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({
                    message:'Samo štampar može dodavati potkategorije.'
                });
            }

            if(!mongoose.Types.ObjectId.isValid(categoryId)){
                return res.status(400).json({
                    message:'Neispravna kategorija.'
                });
            }

            if(!name || !name.trim()){
                return res.status(400).json({
                    message:'Unesite naziv potkategorije.'
                });
            }

            const category=await CategoryModel.findById(categoryId);

            if(!category){
                return res.status(404).json({
                    message:'Kategorija nije pronađena.'
                });
            }

            const subcategoryName=name.trim();

            const exists=category.subcategories.some(
                (subcategory:any)=>
                    subcategory.name.toLowerCase()===
                    subcategoryName.toLowerCase()
            );

            if(exists){
                return res.status(400).json({
                    message:'Ova potkategorija već postoji u izabranoj kategoriji.'
                });
            }

            category.subcategories.push({
                name:subcategoryName
            } as any);

            await category.save();

            return res.status(201).json({
                message:'Potkategorija je uspešno dodata.',
                category
            });
        }catch(error){
            console.log('CREATE SUBCATEGORY ERROR:',error);
            return res.status(500).json({
                message:'Greška pri dodavanju potkategorije.'
            });
        }
    };

    public getPrinterProducts=async(req:express.Request,res:express.Response)=>{
        try{
            const printerIdParam=req.params.printerId;

            if(Array.isArray(printerIdParam)){
                return res.status(400).json({
                    message:'Neispravan ID štamparije.'
                });
            }

            const printerId=printerIdParam;

            if(!mongoose.Types.ObjectId.isValid(printerId)){
                return res.status(400).json({
                    message:'Neispravan ID štamparije.'
                });
            }

            const products=await ProductModel.find({
                printerId
            })
            .select('-mainImage.data -additionalImages.data')
            .sort({name:1});

            const result=products.map(product=>({
                ...product.toObject(),
                likeCount:product.likedBy?.length??0,
                dislikeCount:product.dislikedBy?.length??0,
                additionalImageCount:product.additionalImages?.length??0,
                hasMainImage:!!product.mainImage?.data
            }));

            return res.status(200).json(result);
        }catch(error){
            console.log('GET PRINTER PRODUCTS ERROR:',error);
            return res.status(500).json({
                message:'Greška pri učitavanju proizvoda.'
            });
        }
    };

    public createProduct=async(req:express.Request,res:express.Response)=>{
        try{

            console.log("BODY: ", req.body);
            console.log("FILES: ", req.files);

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

            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({
                    message:'Samo štampar može dodavati proizvode.'
                });
            }

            if(!code?.trim() || !name?.trim() ||!categoryId || !subcategoryId){
                return res.status(400).json({
                    message:'Popunite sva obavezna polja.'
                });
            }

            if(!mongoose.Types.ObjectId.isValid(categoryId) || !mongoose.Types.ObjectId.isValid(subcategoryId)){
                return res.status(400).json({
                    message:'Kategorija ili potkategorija nije ispravna.'
                });
            }

            const price=Number(unitPrice);
            const productQuantity=Number(quantity);

            if(!Number.isFinite(price) || price<=0){
                return res.status(400).json({
                    message:'Cena proizvoda mora biti veća od nule.'
                });
            }

            if(!Number.isInteger(productQuantity) || productQuantity<0){
                return res.status(400).json({
                    message:'Količina mora biti nenegativan ceo broj.'
                });
            }

            const category=await CategoryModel.findById(categoryId);

            if(!category){
                return res.status(404).json({
                    message:'Kategorija nije pronađena.'
                });
            }

            const subcategoryExists=category.subcategories.some(
                (subcategory:any)=>
                    subcategory._id.toString()===subcategoryId
            );

            if(!subcategoryExists){
                return res.status(400).json({
                    message:'Potkategorija ne pripada izabranoj kategoriji.'
                });
            }

            const existingCode=await ProductModel.findOne({
                code:{
                    $regex:`^${this.escapeRegex(code.trim())}$`,
                    $options:'i'
                }
            });

            if(existingCode){
                return res.status(400).json({
                    message:'Proizvod sa ovom šifrom već postoji.'
                });
            }

            let parsedColors:string[]=[];
            let parsedServices:any[]=[];

            try{
                parsedColors=colors?JSON.parse(colors):[];
                parsedServices=printServices?JSON.parse(printServices):[];
            }catch(error){
                return res.status(400).json({
                    message:'Neispravni podaci o bojama ili uslugama.'
                });
            }

            if(!Array.isArray(parsedColors) || !Array.isArray(parsedServices)){
                return res.status(400).json({
                    message:'Neispravni podaci proizvoda.'
                });
            }

            parsedColors=parsedColors.map(color=>String(color).trim())
                .filter(color=>color.length>0);

            for(const service of parsedServices){
                if(!service.type?.trim() || Number(service.additionalPrice)<0 ||
                    Number(service.maxWidthMm)<=0 || Number(service.maxHeightMm)<=0){
                    return res.status(400).json({
                        message:'Podaci o dodatnim uslugama nisu ispravni.'
                    });
                }
            }

            const files = req.files as {
                [fieldname: string]: Express.Multer.File[]
            } | undefined;

            let mainImage=null;
            let additionalImages: any[] = [];

            const mainImageFile = files?.['mainImage']?.[0];

            if(mainImageFile) {
                if(!mainImageFile.mimetype.startsWith('image/')) {
                    return res.status(400).json({
                        message: "Glavni fajl mora biti slika"
                    });
                }

                mainImage = {
                    data: mainImageFile.buffer,
                    contentType: mainImageFile.mimetype
                };
            }

            const additionalImageFiles = files?.['additionalImages']??[];

            for(const image of additionalImageFiles) {
                if(!image.mimetype.startsWith('image/')) {
                    return res.status(400).json({
                        message: "Svi dodatni fajlovi moraju biti slike"
                    });
                }

                additionalImages.push({
                    data: image.buffer,
                    contentType: image.mimetype
                });
            }

            const product=new ProductModel({
                code:code.trim(),
                name:name.trim(),
                description:description?.trim()??'',
                printerId,
                categoryId,
                subcategoryId,
                unitPrice:price,
                quantity:productQuantity,
                colors:parsedColors,
                active:true,
                mainImage,
                additionalImages,
                printServices:parsedServices,
                likedBy:[],
                dislikedBy:[]
            });

            await product.save();

            return res.status(201).json({
                message:'Proizvod je uspešno dodat.',
                product
            });
        }catch(error){
            console.log('CREATE PRODUCT ERROR:',error);
            return res.status(500).json({
                message:'Greška pri dodavanju proizvoda.'
            });
        }
    };

    public addProductQuantity=async(req:express.Request,res:express.Response)=>{
        try{
            const productId=Array.isArray(req.params.productId)
                ? req.params.productId[0]
                : req.params.productId;
            const {printerId,amount}=req.body;

            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({
                    message:'Samo štampar može menjati količinu proizvoda.'
                });
            }

            if(typeof productId !== 'string' || !mongoose.Types.ObjectId.isValid(productId)){
                return res.status(400).json({
                    message:'Neispravan ID proizvoda.'
                });
            }

            const quantityToAdd=Number(amount);

            if(!Number.isInteger(quantityToAdd) || quantityToAdd<=0){
                return res.status(400).json({
                    message:'Količina mora biti pozitivan ceo broj.'
                });
            }

            const product=await ProductModel.findOneAndUpdate(
                {
                    _id:productId,
                    printerId
                },
                {
                    $inc:{
                        quantity:quantityToAdd
                    }
                },
                {
                    new:true
                }
            );

            if(!product){
                return res.status(404).json({
                    message:'Proizvod nije pronađen ili ne pripada ovoj štampariji.'
                });
            }

            return res.status(200).json({
                message:'Količina je uspešno ažurirana.',
                quantity:product.quantity
            });
        }catch(error){
            console.log('ADD PRODUCT QUANTITY ERROR:',error);

            return res.status(500).json({
                message:'Greška pri ažuriranju količine.'
            });
        }
    };

    public importProductsFromJson=async(req:express.Request, res:express.Response)=>{
        try{
            const {printerId}=req.body;

            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({
                    message:'Samo štampar može uvoziti proizvode.'
                });
            }

            if(!req.file){
                return res.status(400).json({
                    message:'JSON fajl nije izabran.'
                });
            }

            let jsonData:any;

            try{
                const jsonText=req.file.buffer.toString('utf8').replace(/^\uFEFF/,'');

                jsonData=JSON.parse(jsonText);
            }catch(error){
                return res.status(400).json({
                    message:'Fajl nije validan JSON.'
                });
            }

            if(!jsonData.proizvodi || !Array.isArray(jsonData.proizvodi)){
                return res.status(400).json({
                    message:'JSON mora sadržati niz proizvodi.'
                });
            }

            const importedProducts:any[]=[];
            const errors:any[]=[];

            for(const importedProduct of jsonData.proizvodi){
                try{
                    const {
                        sifra,
                        naziv,
                        opis,
                        kategorija,
                        potkategorija,
                        jedinicnaCena,
                        kolicinaNaLageru,
                        dostupneBoje,
                        uslugeStampe
                    }=importedProduct;

                    if(!sifra?.trim() || !naziv?.trim() || !kategorija?.trim() || !potkategorija?.trim()){
                        throw new Error('Nedostaju obavezni podaci proizvoda.');
                    }

                    const category=await CategoryModel.findOne({
                        name:{
                            $regex: `^${this.escapeRegex(kategorija.trim())}$`,
                            $options:'i'
                        }
                    });

                    if(!category){
                        throw new Error(`Kategorija "${kategorija}" ne postoji.`);
                    }

                    const subcategory = category.subcategories.find(
                            (subcategory:any)=>
                                subcategory.name.toLowerCase()=== potkategorija.trim().toLowerCase()
                        );

                    if(!subcategory){
                        throw new Error(`Potkategorija "${potkategorija}" ne postoji u kategoriji "${kategorija}".`);
                    }

                    const price=Number(jedinicnaCena);
                    const quantity=Number(kolicinaNaLageru);

                    if(!Number.isFinite(price) || price<=0){
                        throw new Error('Jedinična cena nije ispravna.');
                    }

                    if(!Number.isInteger(quantity) || quantity<0){
                        throw new Error('Količina nije ispravna.');
                    }

                    const colors = Array.isArray(dostupneBoje) ? dostupneBoje
                        .map((color:any)=>
                            String(color).trim()
                        ).filter((color:string)=>
                            color.length>0
                        ): [];

                    const printServices = Array.isArray(uslugeStampe) ? uslugeStampe.map(
                        (service:any)=>({
                            type: service.tipStampe,
                            additionalPrice: Number(service.dodatnaCenaPoKomadu),
                            maxWidthMm: Number(service.maxSirinaMm),
                            maxHeightMm: Number(service.maxVisinaMm)
                        }))
                    : [];

                    for(const service of printServices){
                        if(!service.type?.trim() || service.additionalPrice<0 || service.maxWidthMm<=0 || service.maxHeightMm<=0){
                            throw new Error('Podaci o uslugama štampe nisu ispravni.');
                        }
                    }

                    let product=await ProductModel.findOne({
                        printerId,
                        code:sifra.trim()
                    });

                    if(product){
                        product.name=naziv.trim();
                        product.description=opis?.trim()??'';
                        product.categoryId=category._id;
                        product.subcategoryId=subcategory._id;
                        product.unitPrice=price;
                        product.quantity=quantity;
                        product.colors=colors;
                        product.set('printServices',printServices);
                        product.active=true;

                        await product.save();
                    }else{
                        product=new ProductModel({
                            code:sifra.trim(),
                            name:naziv.trim(),
                            description:opis?.trim()??'',
                            printerId,
                            categoryId:category._id,
                            subcategoryId:subcategory._id,
                            unitPrice:price,
                            quantity,
                            colors,
                            active:true,
                            mainImage:null,
                            additionalImages:[],
                            printServices,
                            likedBy:[],
                            dislikedBy:[]
                        });

                        await product.save();
                    }

                    importedProducts.push({
                        _id:product._id,
                        code:product.code,
                        name:product.name
                    });
                }catch(error){
                    errors.push({
                        code: importedProduct.sifra??'Nepoznata',
                        message: error instanceof Error
                            ? error.message
                            : 'Greška pri uvozu proizvoda.'
                    });
                }
            }

            return res.status(200).json({
                message: `Uspešno uvezeno ${importedProducts.length} proizvoda.`,
                products:importedProducts,
                errors
            });
        }catch(error){
            console.log('IMPORT PRODUCTS ERROR:', error);

            return res.status(500).json({
                message:'Greška pri uvozu proizvoda.'
            });
        }
    };

    public uploadProductImages=async(req:express.Request, res:express.Response) =>{
        try{
            const productIdParam=req.params.productId;
            const productId = Array.isArray(productIdParam) ? productIdParam[0] : productIdParam;
            const {printerId}=req.body;

            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({
                    message:'Samo štampar može dodavati slike proizvoda.'
                });
            }

            if(!productId || !mongoose.Types.ObjectId.isValid(productId)){
                return res.status(400).json({
                    message:'Neispravan ID proizvoda.'
                });
            }

            const product=
                await ProductModel.findOne({
                    _id:productId,
                    printerId
                });

            if(!product){
                return res.status(404).json({
                    message: 'Proizvod nije pronađen ili ne pripada ovoj štampariji.'
                });
            }

            const files=req.files as {
                [fieldname:string]: Express.Multer.File[];
            } | undefined;

            const mainImageFile = files?.['mainImage']?.[0];

            const additionalImageFiles = files?.['additionalImages']??[];

            if(!mainImageFile && additionalImageFiles.length===0){
                return res.status(400).json({
                    message:'Nije poslata nijedna slika.'
                });
            }

            if(additionalImageFiles.length>3){
                return res.status(400).json({
                    message: 'Proizvod može imati najviše 3 dodatne slike.'
                });
            }

            if(mainImageFile){
                if(!mainImageFile.mimetype .startsWith('image/')){
                    return res.status(400).json({
                        message: 'Glavni fajl mora biti slika.'
                    });
                }

                product.mainImage={
                    data: mainImageFile.buffer,
                    contentType: mainImageFile.mimetype
                };
            }

            const additionalImages=[];

            for(const image of additionalImageFiles){
                if(!image.mimetype.startsWith('image/')){
                    return res.status(400).json({
                        message: 'Svi dodatni fajlovi moraju biti slike.'
                    });
                }

                additionalImages.push({
                    data:image.buffer,
                    contentType:image.mimetype
                });
            }

            /*
            * Ako su poslate dodatne slike,
            * postavljamo ih kao galeriju proizvoda.
            */
            if(additionalImageFiles.length>0){
                product.set('additionalImages', additionalImages);
            }

            await product.save();

            return res.status(200).json({
                message: 'Slike proizvoda su uspešno sačuvane.',
                hasMainImage: !!product.mainImage?.data,
                additionalImageCount: product.additionalImages.length
            });

        }catch(error){
            console.log('UPLOAD PRODUCT IMAGES ERROR:', error);

            return res.status(500).json({
                message: 'Greška pri čuvanju slika proizvoda.'
            });
        }
    };

    public deactivateProduct=async(req:express.Request,res:express.Response)=>{
        try{
            const productId=Array.isArray(req.params.productId)?req.params.productId[0]:req.params.productId;
            const {printerId}=req.body;
            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({message:'Samo štampar može deaktivirati proizvode.'});
            }
            if(!mongoose.Types.ObjectId.isValid(productId)){
                return res.status(400).json({message:'Neispravan ID proizvoda.'});
            }
            const product=await ProductModel.findOneAndUpdate(
                {_id:productId,printerId},
                {$set:{active:false}},
                {new:true}
            );
            if(!product){
                return res.status(404).json({message:'Proizvod nije pronađen ili ne pripada ovoj štampariji.'});
            }
            return res.status(200).json({
                message:'Proizvod je uspešno deaktiviran.',
                active:product.active
            });
        }catch(error){
            console.log('DEACTIVATE PRODUCT ERROR:',error);
            return res.status(500).json({message:'Greška pri deaktiviranju proizvoda.'});
        }
    };

    public activateProduct=async(req:express.Request,res:express.Response)=>{
        try{
            const productId=Array.isArray(req.params.productId)?req.params.productId[0]:req.params.productId;
            const {printerId}=req.body;
            if(!printerId || !await this.checkPrinter(printerId)){
                return res.status(403).json({message:'Samo štampar može aktivirati proizvode.'});
            }
            if(!mongoose.Types.ObjectId.isValid(productId)){
                return res.status(400).json({message:'Neispravan ID proizvoda.'});
            }
            const product=await ProductModel.findOneAndUpdate(
                {_id:productId,printerId},
                {$set:{active:true}},
                {new:true}
            );
            if(!product){
                return res.status(404).json({message:'Proizvod nije pronađen ili ne pripada ovoj štampariji.'});
            }
            return res.status(200).json({
                message:'Proizvod je uspešno aktiviran.',
                active:product.active
            });
        }catch(error){
            console.log('ACTIVATE PRODUCT ERROR:',error);
            return res.status(500).json({message:'Greška pri aktiviranju proizvoda.'});
        }
    };
}