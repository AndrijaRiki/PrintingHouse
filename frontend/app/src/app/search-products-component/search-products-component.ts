import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header-component/header-component';
import { ProductService } from '../services/product-service';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FooterComponent } from '../footer-component/footer-component';

@Component({
    selector: 'app-search-products-component',
    imports: [HeaderComponent, FormsModule, FooterComponent],
    templateUrl: './search-products-component.html',
    styleUrl: './search-products-component.css',
})
export class SearchProductsComponent implements OnInit {

    private productService = inject(ProductService);
    private router = inject(Router);

    categories: Category[] = [];
    products: Product[] = [];

    productName = "";
    selectedCategoryId = "";
    searchPerformed = false;
    sortAscending = false;

    ngOnInit() {
        this.getAvailableCategories();
    }

    getAvailableCategories() {
        this.productService.getAvailableCategories().subscribe({
            next: data => {
                this.categories = data;
            },
            error: error => {
                console.log("Greška pri učitavanju kategorija:", error);
            }
        });
    }

    searchProducts() {
        this.productService.searchProducts(
            this.productName,
            this.selectedCategoryId
        ).subscribe({
            next: data => {
                this.products = data;
                this.searchPerformed = true;
            },
            error: error => {
                console.log("Greška pri pretrazi proizvoda:", error);
                this.products = [];
                this.searchPerformed = true;
            }
        });
    }

    sortByName() {
        this.sortAscending = !this.sortAscending;

        this.products.sort((a, b) => {
            const result = a.name.localeCompare(b.name, 'sr');
            return this.sortAscending ? result : -result;
        });
    }

    getCategoryName(categoryId: string) {
        const category = this.categories.find(
            c => c._id === categoryId
        );

        return category ? category.name : "";
    }

    showDetails(productId: string) {
        setTimeout(() => {
            this.router.navigate(['/product', productId]);
        }, 200);
    }
}

