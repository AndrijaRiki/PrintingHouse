import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { User } from '../models/user';
import { AuthService } from '../helpServices/auth.service';

@Component({
  selector: 'app-header-component',
  imports: [RouterLink],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css',
})
export class HeaderComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  loggedIn = false;
  korisnik: User | null = null;

  ngOnInit() {
      this.authService.loggedUser$.subscribe(user => {
        this.loggedIn = user !== null;
        this.korisnik = user;

        console.log("HEADER USER:", this.korisnik);
        console.log("HEADER USERNAME:",this.korisnik?.username);
      });
  }

  logout() {
      this.authService.logout();
      this.router.navigate(['/']);
  }
}