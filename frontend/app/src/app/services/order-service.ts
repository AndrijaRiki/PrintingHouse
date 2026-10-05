import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Order} from '../models/order';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private url = 'http://localhost:4000/orders';

    getActiveOrders(userId: string) {
        return this.http.get<Order[]>(
            `${this.url}/activeOrders/${userId}`
        );
    }

    getOtherOrders(userId: string) {
        return this.http.get<Order[]>(
            `${this.url}/otherOrders/${userId}`
        );
    }

    getPrinterOrders(printerId: string) {
        return this.http.get<Order[]>(
            `${this.url}/printerOrders/${printerId}`
        );
    }

    createOrder(userId: string) {
        return this.http.post<any>(
            `${this.url}/create`,
            {userId}
        );
    }

    cancelOrder(orderId: string) {
        return this.http.patch<any>(
            `${this.url}/cancelOrder/${orderId}`,
            {}
        );
    }

    startPrinting(orderId: string) {
        return this.http.patch<any>(
            `${this.url}/startPrinting`,
            {orderId}
        );
    }

    markAsDelivered(orderId: string) {
        return this.http.patch<any>(
            `${this.url}/markAsDelivered`,
            {orderId}
        );
    }

    markAsReceived(orderId: string) {
        return this.http.patch<any>(
            `${this.url}/markAsReceived`,
            {orderId}
        );
    }

    downloadInvoice(orderId: string) {
        return this.http.get(
            `${this.url}/invoice/${orderId}`,
            {responseType: 'blob'}
        );
    }
}