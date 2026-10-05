import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user-service';
import { User } from '../models/user';
import { HeaderComponent } from '../header-component/header-component';
import { FooterComponent } from '../footer-component/footer-component';

@Component({
  selector: 'app-forgot-password-component',
  imports: [FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './forgot-password-component.html',
  styleUrl: './forgot-password-component.css',
})
export class ForgotPasswordComponent {
  private userService = inject(UserService);
  private email = "";
  resetLink = ""

  option = ""
  data = ""

  user = new User();

  message = "";
  msgColor = "";

  sendReset(email: string) {
    if(this.email == "") {
      this.message = "Nevalidan mejl";
      return;
    }

    this.userService.forgotPassword(this.email).subscribe({
      next: (data: any) => {
        this.message = data.message;

        if(data.resetLink) {
          this.resetLink = data.resetLink
        }
        console.log("ResetLink: " + this.resetLink)
      },
      error: () => {
        this.message = "Doslo je do greske."
        this.msgColor = "red";
      }
    });
  }

  requestReset() {
    //console.log(this.option)
    //console.log(this.data)

    if(this.option == "") {
      this.message = "Izaberite opciju za slanje linka za resetovanje lozinke!";
      this.msgColor = "red"
    } else if(this.data == "") {
      this.message = "Unesite podatke za identifikaciju"
      this.msgColor = "red"
    }
    else {
      if(this.option == "username") {
        this.userService.getUserById(this.data).subscribe(res => {
          if(res) {
            //console.log(res);
            this.message = "Pronadjen korisnik, mejl poslat"
            this.msgColor = "green";
            this.email = res.email;
            console.log("email: " + this.email)
            this.sendReset(this.email)
          } else {
            this.message = "Nije pronadjen korisnik sa tim podacima, proverite ponovo"
            this.msgColor = "red"
          }
        })
      } else if(this.option == "email") {
        this.userService.getUserByEmail(this.data).subscribe(res => {
          if(res) {
            //console.log(res);
            this.message = "Pronadjen korisnik, mejl poslat"
            this.msgColor = "green";
            this.email = res.email;
            console.log("email: "+ this.email)
            this.sendReset(this.email)
          } else {
            this.message = "Nije pronadjen korisnik sa tim podacima, proverite ponovo"
            this.msgColor = "red"
          }
        })
      }
    }
  }
}
