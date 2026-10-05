import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../services/user-service';

@Component({
  selector: 'app-reset-password-component',
  imports: [FormsModule],
  templateUrl: './reset-password-component.html',
  styleUrl: './reset-password-component.css',
})
export class ResetPasswordComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  token = "";

  password = "";
  repeatPassword = "";
  message = "";
  msgColor = "";
  
  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    console.log('Token iz URL-a: ' + this.token);
  }

  resetPassword() {
    if(this.password == "") {
      this.message = "Unesite lozinku!";
      this.msgColor = "red";
      return;
    }
    if(this.repeatPassword != this.password) {
      this.message = "Lozinke se ne poklapaju";
      this.msgColor = "red";
      return;
    }

    this.userService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.message = "Lozinka je uspesno promenjena."

        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.message = error.error?.message ?? "Link je nevalidan ili je istekao";
      }
    })
  }
}
