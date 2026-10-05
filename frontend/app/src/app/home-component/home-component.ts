import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user-service';
import { ProductService } from '../services/product-service';
import { User } from '../models/user';
import { Product } from '../models/product';
import { Category } from '../models/category';
import { HeaderComponent } from '../header-component/header-component';
import { AuthService } from '../helpServices/auth.service';
import { FooterComponent } from '../footer-component/footer-component';

@Component({
  selector: 'app-home-component',
  imports: [FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css'
})
export class HomeComponent {
  private router = inject(Router);
  private userService = inject(UserService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  printers: User[] = [];
  topProducts: Product[] = [];
  categories: Category[] = [];
  products: Product[] = [];

  productName = "";
  selectedCategoryId = "";
  searchPerformed = false;
  sortAscending = false;
  message = "";

  loggedUser: boolean = false;

  ngOnInit() {
    //this.checkLoggedUser();
    this.authService.loggedUser$.subscribe(user => {
      this.loggedUser = (user != null)
    })
    this.message = (this.loggedUser) ? "ulogovan korisnik" : "nije ulogovan korisnik";
    this.getPrintersData();
    this.getTop5Products();
    this.getAvailableCategories();
  }

  getPrintersData() {
    this.userService.getAllPrinters().subscribe(data => {
      if(data) {
        this.printers = data;
      }
    });
  }

  getTop5Products() {
    this.productService.getTop5Products().subscribe(data => {
      if(data) {
        this.topProducts = data;
      }
    });
  }

  getAvailableCategories() {
    this.productService.getAvailableCategories().subscribe(data => {
      if(data) {
        this.categories = data;
      }
    });
  }

  searchProducts() {
    this.productService.searchProducts(
      this.productName,
      this.selectedCategoryId
    ).subscribe(data => {
      this.products = data;
      this.searchPerformed = true;
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
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : "";
  }

  showDetails(productId: string) {
    this.router.navigate(['/product', productId]);
  }

  checkLoggedUser() {
    if(localStorage.getItem("loggedUser"))
      this.loggedUser = true;
    else
      this.loggedUser = false;
  }

  logout() {
    localStorage.removeItem("loggedUser");
    this.loggedUser = false;
  }
}