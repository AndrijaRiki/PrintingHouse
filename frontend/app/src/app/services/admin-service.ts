import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Category} from '../models/category';

export interface AdminUser{
    _id:string;
    username:string;
    firstname:string;
    lastname:string;
    email:string;
    phone:string;
    role:'admin'|'client'|'printer';
    clientType:'individual'|'company'|null;
    status:'pending'|'active'|'rejected';
    institution:{
        name:string;
        address:string;
        city:string;
        registrationNumber:string;
        taxId:string;
    }|null;
}

export interface PrinterRevenue{
    _id:string;
    printerName:string;
    revenue:number;
}

export interface OrderedProductStatistic{
    productId:string;
    productName:string;
    quantity:number;
    percentage:number;
}

export interface RatingPoint{
    date:string;
    likeCount:number;
    dislikeCount:number;
    score:number;
}

export interface ProductRatingHistory{
    productId:string;
    productName:string;
    currentLikeCount:number;
    currentDislikeCount:number;
    currentScore:number;
    points:RatingPoint[];
}

@Injectable({
    providedIn:'root'
})
export class AdminService{
    private http=inject(HttpClient);
    private url='http://localhost:4000/admin';

    getAllUsers(adminId:string){
        return this.http.get<AdminUser[]>(
            `${this.url}/users`,
            {
                params:{adminId}
            }
        );
    }

    getPendingUsers(adminId:string){
        return this.http.get<AdminUser[]>(
            `${this.url}/pendingUsers`,
            {
                params:{adminId}
            }
        );
    }

    approveUser(userId:string,adminId:string){
        return this.http.patch<any>(
            `${this.url}/users/${userId}/approve`,
            {adminId}
        );
    }

    rejectUser(userId:string,adminId:string){
        return this.http.patch<any>(
            `${this.url}/users/${userId}/reject`,
            {adminId}
        );
    }

    updateUser(
        userId:string,
        adminId:string,
        data:{
            firstname:string;
            lastname:string;
            email:string;
            phone:string;
            status:string;
        }
    ){
        return this.http.patch<any>(
            `${this.url}/users/${userId}`,
            {
                adminId,
                ...data
            }
        );
    }

    deleteUser(userId:string,adminId:string){
        return this.http.patch<any>(
            `${this.url}/users/${userId}/delete`,
            {adminId}
        );
    }

    getCategories(adminId:string){
        return this.http.get<Category[]>(
            `${this.url}/categories`,
            {
                params:{adminId}
            }
        );
    }

    createCategory(adminId:string,name:string){
        return this.http.post<any>(
            `${this.url}/categories`,
            {
                adminId,
                name
            }
        );
    }

    createSubcategory(
        adminId:string,
        categoryId:string,
        name:string
    ){
        return this.http.post<any>(
            `${this.url}/subcategories`,
            {
                adminId,
                categoryId,
                name
            }
        );
    }

    getPrinterRevenue(adminId:string){
        return this.http.get<PrinterRevenue[]>(
            `${this.url}/statistics/printers`,
            {
                params:{adminId}
            }
        );
    }

    getMostOrderedProducts(adminId:string){
        return this.http.get<OrderedProductStatistic[]>(
            `${this.url}/statistics/products`,
            {
                params:{adminId}
            }
        );
    }

    getProductRatingHistory(adminId:string){
        return this.http.get<ProductRatingHistory[]>(
            `${this.url}/statistics/ratings`,
            {
                params:{adminId}
            }
        );
    }
}