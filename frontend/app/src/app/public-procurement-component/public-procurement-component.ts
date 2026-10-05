import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HeaderComponent } from '../header-component/header-component';
import { PublicProcurementService } from '../services/public-procurement-service';
import { PublicProcurement } from '../models/publicProcurement';
import { User } from '../models/user';

@Component({
    selector: 'app-public-procurement-component',
    imports: [HeaderComponent, DatePipe],
    templateUrl: './public-procurement-component.html',
    styleUrl: './public-procurement-component.css'
})
export class PublicProcurementComponent implements OnInit, OnDestroy {
    private procurementService = inject(PublicProcurementService);

    user: User | null = null;
    procurements: PublicProcurement[] = [];
    now = Date.now();

    private timer: any;

    ngOnInit() {
        const loggedUser = localStorage.getItem("loggedUser");
        this.user = loggedUser ? JSON.parse(loggedUser) as User : null;

        if(this.user?._id) {
            this.loadProcurements();
        }

        this.timer = setInterval(() => {
            this.now = Date.now();
        }, 1000);
    }

    ngOnDestroy() {
        if(this.timer) clearInterval(this.timer);
    }

    loadProcurements() {
        if(!this.user?._id) return;

        this.procurementService.getUserProcurements(this.user._id).subscribe({
            next: data => {
                this.procurements = data;
            },
            error: error => {
                console.log("PROCUREMENTS ERROR:", error);
            }
        });
    }

    getRemainingTime(expiresAt: Date | string) {
        const difference = new Date(expiresAt).getTime() - this.now;

        if(difference <= 0) return "Završeno";

        const minutes = Math.floor(difference / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    getStatus(status: string) {
        if(status === 'open') return 'Otvorena';
        if(status === 'processing') return 'Obrada rezultata';
        if(status === 'awarded') return 'Završena';
        if(status === 'no_offers') return 'Bez odgovarajućih ponuda';
        if(status === 'cancelled') return 'Otkazana';

        return status;
    }
}