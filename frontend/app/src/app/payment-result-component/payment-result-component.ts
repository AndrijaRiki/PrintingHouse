import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PaymentService} from '../services/payment-service';
import {HeaderComponent} from '../header-component/header-component';
import {FooterComponent} from '../footer-component/footer-component';
import {User} from '../models/user';

@Component({
    selector: 'app-payment-result',
    standalone: true,
    imports: [
        HeaderComponent,
        FooterComponent
    ],
    templateUrl: './payment-result-component.html',
    styleUrl: './payment-result-component.css'
})
export class PaymentResultComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private paymentService =
        inject(PaymentService);

    message = 'Provera plaćanja...';
    success = false;
    finished = false;
    user: User | null = null;

    ngOnInit() {
        const loggedUser =
            localStorage.getItem('loggedUser');

        if(loggedUser) {
            this.user =
                JSON.parse(loggedUser) as User;
        }

        const sessionId =
            this.route.snapshot.queryParamMap
                .get('session_id');

        if(!sessionId) {
            this.message =
                'Nedostaje Stripe session ID.';

            this.finished = true;
            return;
        }

        this.paymentService
            .confirmPayment(sessionId)
            .subscribe({
                next: data => {
                    this.success = true;
                    this.finished = true;
                    this.message =
                        data.message ??
                        'Plaćanje je uspešno izvršeno.';
                },
                error: error => {
                    console.log(
                        'CONFIRM PAYMENT ERROR:',
                        error
                    );

                    this.success = false;
                    this.finished = true;
                    this.message =
                        error.error?.message ??
                        'Plaćanje nije uspešno završeno.';
                }
            });
    }

    backToProfile() {
        if(this.user) {
            this.router.navigate([
                '/profile',
                this.user.username
            ]);
        } else {
            this.router.navigate(['/']);
        }
    }
}