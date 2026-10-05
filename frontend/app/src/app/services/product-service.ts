import {HttpClient} from '@angular/common/http';
import {inject,Injectable} from '@angular/core';
import {Product,ProductDetails} from '../models/product';
import {Category} from '../models/category';
import {ArchiveProduct} from '../models/archiveProduct';

export interface ProductReactionResponse {
    message:string;
    liked:boolean;
    disliked:boolean;
    likeCount:number;
    dislikeCount:number;
}

export interface ProductComment {
    _id:string;
    productId:string;
    userId:string;
    username:string;
    text:string;
    createdAt:string;
}

@Injectable({
    providedIn:'root'
})
export class ProductService {
    private http=inject(HttpClient);
    private url='http://localhost:4000/products';
    private managementUrl='http://localhost:4000/productManagement';

    getAllProducts(){
        return this.http.get<Product[]>(`${this.url}/getAllProducts`);
    }

    getTop5Products(){
        return this.http.get<Product[]>(`${this.url}/top5`);
    }

    getAvailableCategories(){
        return this.http.get<Category[]>(`${this.url}/availableCategories`);
    }

    searchProducts(name:string,categoryId:string){
        return this.http.get<Product[]>(`${this.url}/search`,{
            params:{name,categoryId}
        });
    }

    getProduct(productId:string){
        return this.http.get<ProductDetails>(`${this.url}/getProduct/${productId}`);
    }

    getProductDetails(productId:string){
        return this.http.get<ProductDetails>(`${this.url}/getProductDetails/${productId}`);
    }

    likeProduct(productId:string,userId:string){
        return this.http.patch<ProductReactionResponse>(`${this.url}/like/${productId}`,{userId});
    }

    dislikeProduct(productId:string,userId:string){
        return this.http.patch<ProductReactionResponse>(`${this.url}/dislike/${productId}`,{userId});
    }

    getLastComment(productId:string){
        return this.http.get<ProductComment[]>(`${this.url}/lastComments/${productId}`);
    }

    getArchivedProducts(userId:string){
        return this.http.get<ArchiveProduct[]>(`${this.url}/archive/${userId}`);
    }

    confirmReceipt(orderId:string,userId:string){
        return this.http.post<{message:string,status:string}>(`${this.url}/confirmReceipt`,{
            orderId,
            userId
        });
    }

    addComment(productId:string,userId:string,text:string){
        return this.http.post<{message:string}>(`${this.url}/${productId}/comment`,{
            userId,
            text
        });
    }

    getProductsByPrinter(printerId:string){
        return this.http.get<Product[]>(`${this.url}/printer/${printerId}`);
    }

    getAllCategories(){
        return this.http.get<Category[]>(`${this.managementUrl}/categories`);
    }

    createCategory(name:string,printerId:string){
        return this.http.post<any>(`${this.managementUrl}/categories`,{
            name,
            printerId
        });
    }

    createSubcategory(categoryId:string,name:string,printerId:string){
        return this.http.post<any>(`${this.managementUrl}/subcategories`,{
            categoryId,
            name,
            printerId
        });
    }

    getPrinterProducts(printerId:string){
        return this.http.get<Product[]>(`${this.managementUrl}/printerProducts/${printerId}`);
    }

    createProduct(formData:FormData){
        return this.http.post<any>(`${this.managementUrl}/products`,formData);
    }
    
    addProductQuantity(productId:string,printerId:string,amount:number){
        return this.http.patch<{message:string,quantity:number}>(`${this.managementUrl}/products/${productId}/quantity`,
            {
                printerId,
                amount
            }
        );
    }

    importProductsFromJson(file: File, printerId: string) {
        const formData = new FormData();

        formData.append('jsonFile', file);
        formData.append('printerId', printerId);

        return this.http.post<{
            message: string, products: {_id: string, code: string, name: string}[],
            errors: {code: string, message: string}[]}>
            (`${this.managementUrl}/importJson`, formData);
    }

    uploadImportedProductImages(productId:string, formData:FormData){
        return this.http.patch<{message:string;}>(`${this.managementUrl}/products/${productId}/images`, formData);
    }

    deactivateProduct(productId:string,printerId:string){
        return this.http.patch<{message:string;active:boolean}>(`${this.managementUrl}/products/${productId}/deactivate`,
            {printerId}
        );
    }

    activateProduct(productId:string,printerId:string){
        return this.http.patch<{message:string;active:boolean}>(`${this.managementUrl}/products/${productId}/activate`,
            {printerId}
        );
    }

}