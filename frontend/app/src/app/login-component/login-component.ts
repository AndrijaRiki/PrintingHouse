import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user-service';
import { User } from '../models/user';
import { AuthService } from '../helpServices/auth.service';
import { HeaderComponent } from '../header-component/header-component';
import { FooterComponent } from '../footer-component/footer-component';

@Component({
  selector: 'app-login-component',
  imports: [FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {

  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  username = ""
  password = ""
  message = ""
  msgColor = ""

  korisnik = new User();

  login() {
    console.log(this.username)
    console.log(this.password)
    
    if(this.username == "") {
      this.message = "Obavezno korisnicko ime";
      this.msgColor = "red";
    } else if(this.password == "") {
      this.message = "Obavezna je lozinka";
      this.msgColor = "red"
    } else {
      this.userService.login(this.username, this.password).subscribe({
        next: (user: User | null) => {
          console.log("LOGIN RESPONSE: ", user);

          if(!user) {
            this.message = "Pogrešno korisničko ime ili lozinka";
            this.msgColor = "red";
            return;
          }
          this.authService.login(user);
          this.router.navigate(['/'])
        },
        error: (error) => {
          console.log("AUTO LOGIN ERROR: ", error);
        }
      })
    }
    //console.log("Login pressed")
  }
}
