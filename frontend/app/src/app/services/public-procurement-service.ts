import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ProcurementBid, ProcurementBidItem, PublicProcurement } from '../models/publicProcurement';

@Injectable({
    providedIn: 'root'
})
export class PublicProcurementService {
    private http = inject(HttpClient);
    private url = "http://localhost:4000/publicProcurements";

    createPublicProcurement(userId: string) {
        return this.http.post<{ message: string, procurement: PublicProcurement }>(
            `${this.url}/create`,
            { userId }
        );
    }

    getUserProcurements(userId: string) {
        return this.http.get<PublicProcurement[]>(`${this.url}/user/${userId}`);
    }

    getOpenProcurements() {
        return this.http.get<PublicProcurement[]>(`${this.url}/open`);
    }

    getPrinterBid(procurementId: string, printerId: string) {
        return this.http.get<ProcurementBid | null>(
            `${this.url}/${procurementId}/bid/${printerId}`
        );
    }

    placeBid(procurementId: string, printerId: string, items: ProcurementBidItem[]) {
        return this.http.post<{ message: string, bid: ProcurementBid }>(
            `${this.url}/${procurementId}/bid`,
            { printerId, items }
        );
    }
}