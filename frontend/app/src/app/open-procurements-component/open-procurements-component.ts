import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HeaderComponent } from '../header-component/header-component';
import { PublicProcurementService } from '../services/public-procurement-service';
import { ProductService } from '../services/product-service';
import { ProcurementBidItem, PublicProcurement, PublicProcurementItem } from '../models/publicProcurement';
import { User } from '../models/user';

@Component({
    selector: 'app-open-procurements-component',
    imports: [HeaderComponent, FormsModule, DatePipe],
    templateUrl: './open-procurements-component.html',
    styleUrl: './open-procurements-component.css'
})
export class OpenProcurementsComponent implements OnInit, OnDestroy {
    private procurementService = inject(PublicProcurementService);
    private productService = inject(ProductService);

    user: User | null = null;
    procurements: PublicProcurement[] = [];
    printerProducts: any[] = [];

    selectedProducts: { [itemId: string]: string } = {};
    prices: { [itemId: string]: number | null } = {};

    messages: { [procurementId: string]: string } = {};
    messageColors: { [procurementId: string]: string } = {};

    now = Date.now();
    private timer: any;
    private reloadCounter = 0;

    ngOnInit() {
        const loggedUser = localStorage.getItem("loggedUser");
        this.user = loggedUser ? JSON.parse(loggedUser) as User : null;
        console.log(this.user)
        if(!this.user?._id || this.user.role !== 'printer') return;

        this.loadPrinterProducts();
        this.loadOpenProcurements();

        this.timer = setInterval(() => {
            this.now = Date.now();
            this.reloadCounter++;

            if(this.reloadCounter >= 5) {
                this.reloadCounter = 0;
                this.loadOpenProcurements();
            }
        }, 1000);
    }

    ngOnDestroy() {
        if(this.timer) clearInterval(this.timer);
    }

    loadOpenProcurements() {
        this.procurementService.getOpenProcurements().subscribe({
            next: data => {
                console.log("PROCUREMENTS:", data);
                this.procurements = data;

                for(const procurement of data) {
                    this.loadExistingBid(procurement);
                }
            },
            error: error => {
                console.log("OPEN PROCUREMENTS ERROR:", error);
            }
        });
    }

    loadPrinterProducts() {
        if(!this.user?._id) return;

        console.log("PRINTER USER:", this.user);
        console.log("PRINTER ID:", this.user._id);

        this.productService.getProductsByPrinter(this.user._id).subscribe({
            next: (data: any) => {
                console.log("PRINTER PRODUCTS FROM BACKEND:", data);
                this.printerProducts = data;
            },
            error: (error: any) => {
                console.log("PRINTER PRODUCTS ERROR:", error);
            }
        });
    }

    loadExistingBid(procurement: PublicProcurement) {
        if(!this.user?._id) return;

        this.procurementService.getPrinterBid(procurement._id, this.user._id).subscribe({
            next: bid => {
                if(!bid) return;

                for(const item of bid.items) {
                    this.selectedProducts[item.requestedItemId] = item.productId;
                    this.prices[item.requestedItemId] = item.unitPrice;
                }
            },
            error: error => {
                console.log("LOAD BID ERROR:", error);
            }
        });
    }

    getProductsForItem(item: PublicProcurementItem) {
        console.log("TRAZIM ZA:", item.productName);
        console.log("CATEGORY:", item.categoryId);
        console.log("SUBCATEGORY:", item.subcategoryId);
        console.log("SVI PROIZVODI STAMPARIJE:", this.printerProducts);

        const products = this.printerProducts.filter(product =>
            String(product.categoryId) === String(item.categoryId) &&
            String(product.subcategoryId) === String(item.subcategoryId)
        );

        console.log("ODGOVARAJUCI:", products);

        return products;
    }

    getRemainingTime(expiresAt: Date | string) {
        const difference = new Date(expiresAt).getTime() - this.now;

        if(difference <= 0) return "Završeno";

        const minutes = Math.floor(difference / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getBidTotal(procurement: PublicProcurement) {
        let total = 0;

        for(const item of procurement.items) {
            const price = this.prices[item._id];

            if(price !== null && price !== undefined && price > 0) {
                total += price * item.quantity;
            }
        }

        return total;
    }

    submitBid(procurement: PublicProcurement) {
        if(!this.user?._id) return;

        if(new Date(procurement.expiresAt).getTime() <= Date.now()) {
            this.messages[procurement._id] = "Licitacija je završena.";
            this.messageColors[procurement._id] = "red";
            return;
        }

        const bidItems: ProcurementBidItem[] = [];

        for(const item of procurement.items) {
            const productId = this.selectedProducts[item._id];
            const unitPrice = this.prices[item._id];

            if(!productId || unitPrice === null || unitPrice === undefined || unitPrice <= 0) {
                this.messages[procurement._id] = "Izaberite proizvod i unesite cenu za svaku stavku.";
                this.messageColors[procurement._id] = "red";
                return;
            }

            bidItems.push({
                requestedItemId: item._id,
                productId,
                unitPrice
            });
        }

        this.procurementService.placeBid(procurement._id, this.user._id, bidItems).subscribe({
            next: res => {
                this.messages[procurement._id] = res.message;
                this.messageColors[procurement._id] = "green";
            },
            error: error => {
                console.log("PLACE BID ERROR:", error);
                this.messages[procurement._id] = error.error?.message ?? "Greška pri slanju ponude.";
                this.messageColors[procurement._id] = "red";
            }
        });
    }
}