import express from 'express';
import {AdminController} from '../controllers/admin.controller';

const adminRouter=express.Router();

adminRouter.get('/users',(req,res)=>{
    new AdminController().getAllUsers(req,res);
});

adminRouter.get('/pendingUsers',(req,res)=>{
    new AdminController().getPendingUsers(req,res);
});

adminRouter.patch('/users/:userId/approve',(req,res)=>{
    new AdminController().approveUser(req,res);
});

adminRouter.patch('/users/:userId/reject',(req,res)=>{
    new AdminController().rejectUser(req,res);
});

adminRouter.patch('/users/:userId',(req,res)=>{
    new AdminController().updateUser(req,res);
});

adminRouter.patch('/users/:userId/delete',(req,res)=>{
    new AdminController().deleteUser(req,res);
});

adminRouter.get('/categories',(req,res)=>{
    new AdminController().getCategories(req,res);
});

adminRouter.post('/categories',(req,res)=>{
    new AdminController().createCategory(req,res);
});

adminRouter.post('/subcategories',(req,res)=>{
    new AdminController().createSubcategory(req,res);
});

adminRouter.get('/statistics/printers',(req,res)=>{
    new AdminController().getPrinterRevenue(req,res);
});

adminRouter.get('/statistics/products',(req,res)=>{
    new AdminController().getMostOrderedProducts(req,res);
});

adminRouter.get('/statistics/ratings',(req,res)=>{
    new AdminController().getProductRatingHistory(req,res);
});

export default adminRouter;