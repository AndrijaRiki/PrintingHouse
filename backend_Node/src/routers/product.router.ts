import express from 'express';
import multer from 'multer';
import { ProductController } from '../controllers/product.controller';

const productRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

productRouter.get('/getAllProducts', (req, res) => {
    new ProductController().getAllProducts(req, res);
});

productRouter.get('/top5', (req, res) => {
    new ProductController().getTop5Products(req, res);
});

productRouter.get('/availableCategories', (req, res) => {
    new ProductController().getAvailableCategories(req, res);
});

productRouter.get('/lastComments/:productId', (req, res) => {
    new ProductController().getLastComments(req, res);
})

productRouter.get('/allCategories', (req, res) => {
    new ProductController().getAllCategories(req, res);
});

productRouter.get('/printerProducts/:printerId', (req, res) => {
    new ProductController().getPrinterProducts(req, res);
});

productRouter.post(
    '/create',
    upload.single('mainImage'),
    (req, res) => {
        new ProductController().createProduct(req, res);
    }
);

productRouter.get('/search', (req, res) => {
    new ProductController().searchProducts(req, res);
});

productRouter.get('/getProduct/:productId', (req, res) => {
    new ProductController().getProduct(req, res);
});

productRouter.get('/:productId/mainImage', (req, res) => {
    new ProductController().getMainImage(req, res);
});

productRouter.get('/:productId/image/:index', (req, res) => {
    new ProductController().getAdditionalImage(req, res);
});

productRouter.patch('/like/:productId',(req,res)=>{
    new ProductController().likeProduct(req,res);
});

productRouter.patch('/dislike/:productId',(req,res)=>{
    new ProductController().dislikeProduct(req,res);
});

productRouter.get('/getProductDetails/:productId',(req,res)=>{
    new ProductController().getProductDetails(req,res);
});

productRouter.get('/archive/:userId',(req,res)=>{
    new ProductController().getArchivedProducts(req,res);
});

productRouter.post('/confirmReceipt',(req,res)=>{
    new ProductController().confirmReceipt(req,res);
});

productRouter.post('/:productId/comment',(req,res)=>{
    new ProductController().addComment(req,res);
});

productRouter.get('/printer/:printerId',(req,res)=>{
    new ProductController().getProductsByPrinter(req,res);
});

export default productRouter;