import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {HeaderComponent} from '../header-component/header-component';
import {FooterComponent} from '../footer-component/footer-component';
import {CartService} from '../services/cart-service';
import {OrderService} from '../services/order-service';
import {PublicProcurementService} from '../services/public-procurement-service';
import {User} from '../models/user';

interface PrintService {
    type: string;
    additionalPrice: number;
    maxWidthMm: number;
    maxHeightMm: number;
}

interface CartProduct {
    _id: string;
    name: string;
    unitPrice: number;
    quantity: number;
    printerId: {
        _id: string;
        username: string;
        institution: {
            name: string;
            city: string;
        } | null;
    };
    printServices: PrintService[];
}

interface CartItem {
    _id: string;
    productId: CartProduct;
    quantity: number;
    color: string;
    selectedPrintServiceType: string | null;
    selectedPrintService?: PrintService | null;
    totalPrice?: number;
}

interface Cart {
    _id: string;
    userId: string;
    items: CartItem[];
}

interface CartGroup {
    printerId: string;
    printerName: string;
    city: string;
    items: CartItem[];
    totalAmount: number;
}

@Component({
    selector: 'app-e-cart',
    standalone: true,
    imports: [
        FormsModule,
        HeaderComponent,
        FooterComponent
    ],
    templateUrl: './ecart-component.html',
    styleUrl: './ecart-component.css'
})
export class ECartComponent implements OnInit {
    private router = inject(Router);
    private cartService = inject(CartService);
    private orderService = inject(OrderService);
    private publicProcurementService =
        inject(PublicProcurementService);

    user: User | null = null;
    cart: Cart | null = null;
    cartGroups: CartGroup[] = [];
    totalAmount = 0;
    message = '';
    creatingOrder = false;

    ngOnInit() {
        this.loadLoggedUser();

        if(this.user?._id) {
            this.loadCart();
        }
    }

    loadLoggedUser() {
        const loggedUser =
            localStorage.getItem('loggedUser');

        if(
            loggedUser &&
            loggedUser !== 'undefined' &&
            loggedUser !== 'null'
        ) {
            try {
                this.user =
                    JSON.parse(loggedUser) as User;
            } catch(error) {
                console.log(
                    'Nevalidan loggedUser:',
                    error
                );

                localStorage.removeItem(
                    'loggedUser'
                );

                this.user = null;
            }
        }
    }

    loadCart() {
        if(!this.user?._id) return;

        this.cartService
            .getCart(this.user._id)
            .subscribe({
                next: data => {
                    this.cart =
                        data as unknown as Cart;

                    this.prepareCart();
                },
                error: error => {
                    console.log(
                        'GET CART ERROR:',
                        error
                    );

                    if(error.status === 404) {
                        this.cart = null;
                        this.cartGroups = [];
                        this.totalAmount = 0;
                    }
                }
            });
    }

    prepareCart() {
        if(!this.cart) return;

        this.cartGroups = [];
        this.totalAmount = 0;

        for(const item of this.cart.items) {
            const product = item.productId;

            if(!product) continue;

            const printServices =
                product.printServices ?? [];

            let service: PrintService | null =
                null;

            if(item.selectedPrintServiceType) {
                service =
                    printServices.find(
                        s =>
                            s.type ===
                            item.selectedPrintServiceType
                    ) ?? null;
            }

            item.selectedPrintService = service;

            const additionalPrice =
                service?.additionalPrice ?? 0;

            item.totalPrice =
                (
                    product.unitPrice +
                    additionalPrice
                ) *
                item.quantity;

            const printer = product.printerId;

            if(!printer) continue;

            let group =
                this.cartGroups.find(
                    g =>
                        g.printerId ===
                        printer._id
                );

            if(!group) {
                group = {
                    printerId:
                        printer._id,
                    printerName:
                        printer.institution?.name ??
                        printer.username,
                    city:
                        printer.institution?.city ??
                        '',
                    items: [],
                    totalAmount: 0
                };

                this.cartGroups.push(group);
            }

            group.items.push(item);
            group.totalAmount +=
                item.totalPrice;

            this.totalAmount +=
                item.totalPrice;
        }
    }

    removeFromCart(item: CartItem) {
        if(!this.user?._id) return;

        this.cartService
            .removeFromCart(
                this.user._id,
                item.productId._id,
                item.selectedPrintServiceType
            )
            .subscribe({
                next: data => {
                    this.message =
                        data.message ??
                        'Proizvod je uklonjen iz korpe.';

                    this.loadCart();
                },
                error: error => {
                    this.message =
                        error.error?.message ??
                        'Greška pri uklanjanju proizvoda.';
                }
            });
    }

    createOrder() {
        if(
            !this.user?._id ||
            this.creatingOrder
        ) {
            return;
        }

        if(this.cartGroups.length === 0) {
            this.message = 'Korpa je prazna.';
            return;
        }

        this.creatingOrder = true;
        this.message = '';

        this.orderService
            .createOrder(this.user._id)
            .subscribe({
                next: data => {
                    this.message =
                        data.message;

                    this.cart = null;
                    this.cartGroups = [];
                    this.totalAmount = 0;
                    this.creatingOrder = false;

                    this.router.navigate([
                        '/profile',
                        this.user!.username
                    ]);
                },
                error: error => {
                    this.message =
                        error.error?.message ??
                        'Greška pri kreiranju porudžbine.';

                    this.creatingOrder = false;
                }
            });
    }

    createPublicProcurement() {
        if(!this.user?._id) return;

        this.publicProcurementService
            .createPublicProcurement(
                this.user._id
            )
            .subscribe({
                next: () => {
                    this.router.navigate([
                        '/publicProcurements'
                    ]);
                },
                error: error => {
                    console.log(
                        'PROCUREMENT ERROR:',
                        error
                    );

                    this.message =
                        error.error?.message ??
                        'Greška pri otvaranju javne nabavke.';
                }
            });
    }

    confirmPurchase() {
        if(!this.user?._id) return;

        if(
            this.user.clientType ===
            'company'
        ) {
            this.createPublicProcurement();
            return;
        }

        this.createOrder();
    }
}