import express from 'express';
import multer from 'multer';
import {ProductManagementController} from '../controllers/productManagement.controller';

const productManagementRouter=express.Router();

const upload=multer({
    storage:multer.memoryStorage(),
    limits:{
        fileSize:5*1024*1024
    }
});

productManagementRouter.get('/categories',(req,res)=>{
    new ProductManagementController().getAllCategories(req,res);
});

productManagementRouter.post('/categories',(req,res)=>{
    new ProductManagementController().createCategory(req,res);
});

productManagementRouter.post('/subcategories',(req,res)=>{
    new ProductManagementController().createSubcategory(req,res);
});

productManagementRouter.get('/printerProducts/:printerId',(req,res)=>{
    new ProductManagementController().getPrinterProducts(req,res);
});

productManagementRouter.post('/products',
    upload.fields([
        {name: 'mainImage', maxCount:1},
        {name: 'additionalImages', maxCount:10}
    ]),
    (req,res)=>{
        new ProductManagementController().createProduct(req,res);
    }
);

productManagementRouter.patch('/products/:productId/quantity', (req,res) => {
    new ProductManagementController().addProductQuantity(req,res);
});

productManagementRouter.post('/importJson', upload.single('jsonFile'), (req, res) => {
    new ProductManagementController().importProductsFromJson(req, res);
})

productManagementRouter.patch('/products/:productId/images', upload.fields([
        {
            name:'mainImage',
            maxCount:1
        },
        {
            name:'additionalImages',
            maxCount:3
        }
    ]), (req,res) => {
        new ProductManagementController().uploadProductImages(req, res);
    }
);

productManagementRouter.patch('/products/:productId/deactivate',(req,res)=>{
    new ProductManagementController().deactivateProduct(req,res);
});

productManagementRouter.patch('/products/:productId/activate',(req,res)=>{
    new ProductManagementController().activateProduct(req,res);
});

export default productManagementRouter;