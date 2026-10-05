import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product-service';
import { PrintService, ProductDetails } from '../models/product';
import { HeaderComponent } from '../header-component/header-component';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { User } from '../models/user';
import { ProductComment } from '../models/productComment';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-product-component',
    imports: [HeaderComponent, FormsModule, DatePipe],
    templateUrl: './product-component.html',
    styleUrl: './product-component.css'
})
export class ProductComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private productService = inject(ProductService);
    private sanitizer = inject(DomSanitizer);

    product: ProductDetails | null = null;
    productId = "";

    imageUrls: string[] = [];
    mainImageUrl = "";
    selectedImageIndex = 0;

    user: User | null = null;
    loggedIn = false;

    userId: string = ""

    selectedColor = "";
    selectedPrintServiceType = "";

    liked = false
    disliked = false

    mapUrl: SafeResourceUrl | null = null;

    comments: ProductComment[] = [];

    ngOnInit() {
        this.loadLoggedUser();

        const productId = this.route.snapshot.paramMap.get('productId');
        if(!productId) {
            return;
        }

        this.productId = productId;
        this.loadProduct();

        this.loadComments();
    }

    loadLoggedUser() {
        const loggedUser = localStorage.getItem("loggedUser");

        if(loggedUser) {
            this.user = JSON.parse(loggedUser);
            this.loggedIn = true;
            this.user = JSON.parse(loggedUser) as User;
            this.userId = this.user._id;
        } else {
            this.user = null;
            this.loggedIn = false;
        }
    }

    loadProduct() {
        this.productService
        .getProduct(this.productId)
        .subscribe({
            next: data => {
                this.product = data;
                
                console.log("CEO PRODUCT:", data);
                console.log("PRINTER:", data.printerId);
                console.log("INSTITUTION:", data.printerId?.institution);
                console.log("ADDRESS:", data.printerId?.institution?.address);
            
                this.createGallery();
                this.prepareColor();
                this.prepareMap();

                this.setLikeDislike();
            },

            error: error => {
                console.log(error);
            }
        });
    }

    createGallery() {
        if(!this.product) {
            return;
        }

        this.imageUrls = [];

        if(this.product.hasMainImage) {
            this.imageUrls.push(
                `http://localhost:4000/products/${this.productId}/mainImage`
            );
        }

        for(let i = 0; i < this.product.additionalImageCount;i++) {
            this.imageUrls.push(
                `http://localhost:4000/products/${this.productId}/image/${i}`
            );
        }

        if(this.imageUrls.length === 0) {
            this.mainImageUrl = this.imageUrls[1]

            return;
        }

        const savedIndex =
            this.getSavedImageIndex();

        if(
            savedIndex >= 0 &&
            savedIndex < this.imageUrls.length
        ) {
            this.selectedImageIndex =
                savedIndex;
        } else {
            this.selectedImageIndex = 0;
        }

        this.mainImageUrl =
            this.imageUrls[
                this.selectedImageIndex
            ];
    }

    selectImage(index: number) {
        this.selectedImageIndex = index;

        this.mainImageUrl = this.imageUrls[index];

        this.saveImageIndex(index);
    }

    saveImageIndex(index: number) {
        document.cookie =
            `productImage_${this.productId}=${index}; path=/; max-age=2592000; SameSite=Lax`;
    }

    getSavedImageIndex(): number {
        const cookieName =
            `productImage_${this.productId}=`;

        const cookies =
            document.cookie.split(';');

        for(let cookie of cookies) {
            cookie = cookie.trim();

            if(cookie.startsWith(cookieName)) {
                const value =
                    cookie.substring(
                        cookieName.length
                    );

                const index =
                    Number(value);

                if(!isNaN(index)) {
                    return index;
                }
            }
        }

        return 0;
    }

    prepareColor() {
        if(!this.product) {
            return;
        }

        if(
            this.product.colors &&
            this.product.colors.length > 0
        ) {
            this.selectedColor =
                this.product.colors[0];
        } else {
            this.selectedColor = "Bela";
        }
    }

    getSelectedPrintService(): PrintService | null {
        if( !this.product || !this.selectedPrintServiceType) {
            return null;
        }

        return this.product.printServices.find(service =>
            service.type === this.selectedPrintServiceType
        ) ?? null;
    }

    prepareMap() {
        const institution = this.product?.printerId?.institution;

        if(!institution) {
            this.mapUrl = null;
            return;
        }

        const location = `${institution.address}, ${institution.city}`;
        const url = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
        this.mapUrl = this.sanitizer .bypassSecurityTrustResourceUrl(url);
    }

    next() {
        if(!this.product) {
            return;
        }

        this.router.navigate(
            ['/prepareProduct', this.product._id],
            {
                queryParams: {
                    color: this.selectedColor,
                    printService: this.selectedPrintServiceType,
                    imageIndex: this.selectedImageIndex
                }
            }
        );
    }

    setLikeDislike() {
        if(!this.product || !this.user) {
            this.liked = false;
            this.disliked = false;
            return;
        }

        const userId = this.user._id;

        this.liked = this.product.likedBy?.some(id => String(id) === userId) ?? false;

        this.disliked = this.product.dislikedBy?.some(id => String(id) === userId) ?? false;

        console.log("Liked:", this.liked);
        console.log("Disliked:", this.disliked);
    }

    likeProduct() {
        console.log("Like pressed");
        const userId = this.user?._id;
        
        if(!userId || !this.product) {
            return;
        }

        this.productService.likeProduct(this.productId, userId).subscribe({
            next: res => {
                this.product!.likeCount = res.likeCount;
                this.product!.dislikeCount = res.dislikeCount;
                
                this.liked = res.liked;
                this.disliked = res.disliked;
            },
            error: error => {
                console.log(error);
            }
        })
    }

    dislikeProduct() {
        console.log("Dislike pressed");
        const userId = this.user?._id;
        if(!userId || !this.product) {
            return;
        }

        this.productService.dislikeProduct(this.productId, userId).subscribe({
            next: res => {
                this.product!.likeCount = res.likeCount;
                this.product!.dislikeCount = res.dislikeCount;
                
                this.liked = res.liked;
                this.disliked = res.disliked;
            },
            error: error => {
                console.log(error);
            }
        })
    }

    loadComments() {
        this.productService.getLastComment(this.productId).subscribe({
            next: data => {
                this.comments = data.map(comment => ({
                    ...comment,
                    createdAt: new Date(comment.createdAt)
                }));
            },
            error: error => {
                console.log("COMMENTS ERROR: " + error);
                this.comments = [];
            }
        })
    }
}