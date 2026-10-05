import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header-component/header-component';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user';
import { ArchiveProduct } from '../models/archiveProduct';
import { ProductService } from '../services/product-service';

@Component({
  selector: 'app-archive-component',
  imports: [HeaderComponent, DatePipe, FormsModule],
  templateUrl: './archive-component.html',
  styleUrl: './archive-component.css',
})
export class ArchiveComponent implements OnInit {
  private productService = inject(ProductService);
  
  user: User | null = null;
  archivedProducts: ArchiveProduct[] = [];

  sortField = 'date';
  sortAscending = false;
  message = "";
  msgColor = "red";

  comments: {[archiveId: string]: string} = {};

  ngOnInit() {
    this.loadLoggedUser();

    if(this.user?._id) {
      this.loadArchive();
    }
  }

  loadLoggedUser() {
    const loggedUser = localStorage.getItem("loggedUser");
    this.user = loggedUser ? JSON.parse(loggedUser) as User : null;
  }

  loadArchive() {
    if(!this.user?._id) return;

    this.productService.getArchivedProducts(this.user?._id).subscribe({
      next: data => {
        this.archivedProducts = data;
        this.sortProducts('date', false);
        console.log("ARCHIVE: ", data);
      },
      error: (error) => {
        console.log("ARCHIVE ERROR: ", error);
        this.archivedProducts = [];
        this.message = "Greska pri ucitavanju arhive";
        this.msgColor = "red";
      }
    })
  }

  getDeliveredCount() {
    return this.archivedProducts.filter(p => p.status === 'delivered').length;
  }
  getReceivedCount() {
    return this.archivedProducts.filter(p => p.status === "received").length;
  }

  sortProducts(field: string, toggle = true) {
    if(toggle) {
      if(this.sortField === field) {
        this.sortAscending = !this.sortAscending;
      } else {
        this.sortField = field;
        this.sortAscending = true;
      }
    } else {
      this.sortField = field;
      this.sortAscending = false;
    }

    this.archivedProducts.sort((a, b) => {
      let result = 0;

      if(field === 'date') {
        result = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(); 
      } else if(field === "name") {
        result = a.productName.localeCompare(b.productName, 'sr');
      } else if(field === 'quantity') {
        result = a.quantity - b.quantity;
      } else if(field === 'printer') {
        result = a.printerName.localeCompare(b.printerName, 'sr');
      }

      return this.sortAscending ? result : -result;
    });
  }

  markAsReceived(item: ArchiveProduct) {
    if(!this.user?._id) return;

    this.productService.confirmReceipt(item.orderId, this.user?._id).subscribe({
      next: res => {
        if(res.status === 'received') {
          this.archivedProducts.filter(product => product.orderId === item.orderId)
            .forEach(product => product.status = 'received');

          this.message = "Prijem proizvoda uspesno potvrdjen";
          this.msgColor = "green";
          console.log("Potvrda prijema uspela; " + item.orderId);
        }
      },
      error: error => {
        console.log("CONFIRM RECEIPT ERROR: ", error);
        this.message = error.error?.message ?? "Greska pri potvrdi prijema";
        this.msgColor = "red";
        console.log("Potvrda prijema neuspela; " + item.orderId);
      }
    });
  }

  rateProduct(item: ArchiveProduct, reaction: 'like' | 'dislike') {
      if(!this.user?._id) return;

      if(reaction === 'like') {
          this.productService.likeProduct(item.productId, this.user._id).subscribe({
              next: res => {
                  if(res.liked) {
                      item.userReaction = 'like';
                  } else if(res.disliked) {
                      item.userReaction = 'dislike';
                  } else {
                      item.userReaction = null;
                  }
              },
              error: error => {
                  console.log("LIKE ERROR:", error);
              }
          });
      } else {
          this.productService.dislikeProduct(item.productId, this.user._id).subscribe({
              next: res => {
                  if(res.disliked) {
                      item.userReaction = 'dislike';
                  } else if(res.liked) {
                      item.userReaction = 'like';
                  } else {
                      item.userReaction = null;
                  }
              },
              error: error => {
                  console.log("DISLIKE ERROR:", error);
              }
          });
      }
  }

  addComment(item: ArchiveProduct) {
      if(!this.user?._id) return;

      const text = this.comments[item.archiveId];

      if(!text?.trim()) {
          this.message = "Unesite komentar.";
          this.msgColor = "red";
          return;
      }

      this.productService.addComment(item.productId, this.user._id, text).subscribe({
          next: res => {
              console.log("ADD COMMENT SUCCESS:", res);

              this.comments[item.archiveId] = "";
              this.message = "Komentar je uspešno dodat.";
              this.msgColor = "green";
          },
          error: error => {
              console.log("ADD COMMENT ERROR:", error);
              console.log("STATUS:", error.status);
              console.log("BODY:", error.error);

              this.message = error.error?.message ?? "Greška pri dodavanju komentara.";
              this.msgColor = "red";
          }
      });
  }
}
