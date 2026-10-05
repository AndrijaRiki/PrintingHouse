import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private url = 'http://localhost:4000/payments';

    createSession(orderId: string, userId: string) {
        return this.http.post<any>(
            `${this.url}/create-session`,
            {orderId, userId}
        );
    }

    confirmPayment(sessionId: string) {
        return this.http.post<any>(
            `${this.url}/confirm`,
            {sessionId}
        );
    }

    getSessionStatus(sessionId: string) {
        return this.http.get<any>(
            `${this.url}/session/${sessionId}`
        );
    }
}