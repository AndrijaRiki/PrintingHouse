import { Component, inject } from '@angular/core';
import { UserService } from '../services/user-service';
import { User } from '../models/user';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../header-component/header-component';
import { Order } from '../models/order';
import { DatePipe } from '@angular/common';
import { OrderService } from '../services/order-service';
import { FooterComponent } from '../footer-component/footer-component';

@Component({
    selector: 'app-user-profile-component',
    imports: [FormsModule, HeaderComponent, DatePipe, FooterComponent],
    templateUrl: './user-profile-component.html',
    styleUrl: './user-profile-component.css'
})
export class UserProfileComponent {
    private userService = inject(UserService);
    private orderService = inject(OrderService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    user: User | null = null;
    editedUser: User | null = null;
    selectedImage: File | null = null;
    message = '';
    profileImageUrl = '';

    activeOrders: Order[] = [];
    previousOrders: Order[] = [];
    allOrders: Order[] = [];
    printerOrders: Order[] = [];

    sortDirection: 'asc' | 'desc' = 'desc';
    sortColumn = 'createdAt';

    ngOnInit() {
        const username = this.route.snapshot.paramMap.get('username') ?? '';
        this.loadUser(username);
    }

    loadUser(username: string) {
        this.userService.getUserById(username).subscribe({
            next: data => {
                if(!data) {
                    this.user = null;
                    this.editedUser = null;
                    return;
                }

                this.user = data;
                this.editedUser = {...data};
                this.profileImageUrl = `http://localhost:4000/users/profileImage/${data.username}`;

                if(this.user.role === 'printer') {
                    this.getPrinterOrders();
                } else {
                    this.getActiveOrders();
                    this.getPreviousOrders();
                }
            },
            error: error => {
                console.log('LOAD USER ERROR:', error);
            }
        });
    }

    updateProfile() {
        if(!this.user || !this.editedUser) return;

        const formData = new FormData();

        if(this.editedUser.firstname !== this.user.firstname) {
            formData.append('firstname', this.editedUser.firstname);
        }

        if(this.editedUser.lastname !== this.user.lastname) {
            formData.append('lastname', this.editedUser.lastname);
        }

        if(this.editedUser.email !== this.user.email) {
            formData.append('email', this.editedUser.email);
        }

        if(this.editedUser.phone !== this.user.phone) {
            formData.append('phone', this.editedUser.phone);
        }

        if(this.selectedImage) {
            formData.append('profileImage', this.selectedImage);
        }

        this.userService.updateProfile(this.user.username, formData).subscribe({
            next: data => {
                this.message = data.message;
                this.user = data.user;
                this.editedUser = {...data.user};

                if(this.selectedImage) {
                    this.profileImageUrl = `http://localhost:4000/users/profileImage/${this.user!.username}?t=${Date.now()}`;
                }

                this.selectedImage = null;
            },
            error: error => {
                this.message = error.error?.message ?? 'Greška pri ažuriranju.';
            }
        });
    }

    onImageSelected(event: Event) {
        const input = event.target as HTMLInputElement;

        if(input.files && input.files.length > 0) {
            this.selectedImage = input.files[0];
        }
    }

    getActiveOrders() {
        if(!this.user?._id) return;

        this.orderService.getActiveOrders(this.user._id).subscribe({
            next: data => {
                this.activeOrders = data;
                this.mergeOrders();
            },
            error: error => {
                console.log('ACTIVE ORDERS ERROR:', error);
            }
        });
    }

    getPreviousOrders() {
        if(!this.user?._id) return;

        this.orderService.getOtherOrders(this.user._id).subscribe({
            next: data => {
                this.previousOrders = data;
                this.mergeOrders();
            },
            error: error => {
                console.log('OTHER ORDERS ERROR:', error);
            }
        });
    }

    getPrinterOrders() {
        if(!this.user?._id) return;

        this.orderService.getPrinterOrders(this.user._id).subscribe({
            next: data => {
                this.printerOrders = data;
            },
            error: error => {
                console.log('PRINTER ORDERS ERROR:', error);
                this.message = error.error?.message ?? 'Greška pri učitavanju narudžbina.';
            }
        });
    }

    mergeOrders() {
        this.allOrders = [...this.activeOrders, ...this.previousOrders];
        this.sortOrdersCurrentDirection();
    }

    payOrder(orderId: string) {
        this.router.navigate(['/payment', orderId]);
    }

    cancelOrder(orderId: string) {
        this.orderService.cancelOrder(orderId).subscribe({
            next: data => {
                this.message = data.message;
                this.activeOrders = this.activeOrders.filter(order => order._id !== orderId);
                this.getPreviousOrders();
            },
            error: error => {
                this.message = error.error?.message ?? 'Greška pri otkazivanju narudžbine.';
            }
        });
    }

    startPrinting(orderId: string) {
        this.orderService.startPrinting(orderId).subscribe({
            next: res => {
                const order = this.printerOrders.find(o => o._id === orderId);

                if(order) {
                    order.status = 'printing';
                }

                this.message = res.message;
            },
            error: error => {
                this.message = error.error?.message ?? 'Greška pri pokretanju štampe.';
            }
        });
    }

    markAsDelivered(orderId: string) {
        this.orderService.markAsDelivered(orderId).subscribe({
            next: res => {
                this.printerOrders = this.printerOrders.filter(order => order._id !== orderId);
                this.message = res.message;
            },
            error: error => {
                this.message = error.error?.message ?? 'Greška pri isporuci porudžbine.';
            }
        });
    }

    markAsReceived(orderId: string) {
        this.orderService.markAsReceived(orderId).subscribe({
            next: res => {
                this.message = res.message;

                const order = this.activeOrders.find(o => o._id === orderId);

                if(order) {
                    this.activeOrders = this.activeOrders.filter(o => o._id !== orderId);
                    order.status = 'received';
                    this.previousOrders.unshift(order);
                    this.mergeOrders();
                }
            },
            error: error => {
                this.message = error.error?.message ?? 'Greška pri potvrdi prijema.';
            }
        });
    }

    downloadInvoice(orderId: string, invoiceNumber: string) {
        this.orderService.downloadInvoice(orderId).subscribe({
            next: pdf => {
                const url = window.URL.createObjectURL(pdf);
                const link = document.createElement('a');

                link.href = url;
                link.download = `${invoiceNumber}.pdf`;
                link.click();

                window.URL.revokeObjectURL(url);
            },
            error: error => {
                console.log('INVOICE ERROR:', error);
                this.message = 'Greška pri preuzimanju fakture.';
            }
        });
    }

    getStatusName(status: string) {
        switch(status) {
            case 'ordered': return 'Naručeno';
            case 'paid': return 'Plaćeno';
            case 'printing': return 'U štampi';
            case 'delivered': return 'Isporučeno';
            case 'received': return 'Primljeno';
            case 'cancelled': return 'Otkazano';
            default: return status;
        }
    }

    canCancel(order: Order) {
        return order.status === 'ordered';
    }

    sortOrders(column: string) {
        if(this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.sortOrdersCurrentDirection();
    }

    private sortOrdersCurrentDirection() {
        this.allOrders.sort((a: any, b: any) => {
            let valueA = a[this.sortColumn];
            let valueB = b[this.sortColumn];

            if(this.sortColumn === 'createdAt') {
                valueA = new Date(valueA).getTime();
                valueB = new Date(valueB).getTime();
            }

            if(typeof valueA === 'string' && typeof valueB === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            if(valueA < valueB) {
                return this.sortDirection === 'asc' ? -1 : 1;
            }

            if(valueA > valueB) {
                return this.sortDirection === 'asc' ? 1 : -1;
            }

            return 0;
        });
    }
}