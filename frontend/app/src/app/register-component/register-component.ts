import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user-service';
import { Router } from '@angular/router';
import { User } from '../models/user';
import { AuthService } from '../helpServices/auth.service';
import { HeaderComponent } from '../header-component/header-component';
import { form } from '@angular/forms/signals';
import { FooterComponent } from '../footer-component/footer-component';

const MIN_LENGTH_REGEX = /^.{8,}$/;
const MAX_LENGTH_REGEX = /^.{0,12}$/;
const STARTS_WITH_LETTER_REGEX = /^[A-Za-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^06\d{7,8}$/;

@Component({
  selector: 'app-register-component',
  imports: [FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css',
})

export class RegisterComponent {
  private userService = inject(UserService);
  private router = inject(Router);
  private authService = inject(AuthService);

  private allEmails: string[] = [];

  ngOnInit() {
    this.collectAllEmails();
  }

  username = "";
  password = "";
  firstname = "";
  lastname = "";
  email = "";
  phoneNumber = ""
  registrationType = ""
  institutionName = ""
  institutionAddress = ""
  institutionCity = ""
  registrationNumber = ""
  taxId = ""

  selectedImage: File | null = null;

  message = "";
  msgColor = "";

  passwordStatus = false;

  checkPassword(password: string) {
    this.passwordStatus = false;
    if (!MIN_LENGTH_REGEX.test(this.password)) {
      this.message = "Lozinka mora imati najmanje 8 karaktera";
    }
    else if (!MAX_LENGTH_REGEX.test(this.password)) {
      this.message = "Lozinka može imati najviše 12 karaktera";
    }
    else if (!STARTS_WITH_LETTER_REGEX.test(this.password)) {
      this.message = "Lozinka mora počinjati slovom";
    }
    else if (!UPPERCASE_REGEX.test(this.password)) {
      this.message = "Lozinka mora sadržati bar jedno veliko slovo";
    }
    else if (!NUMBER_REGEX.test(this.password)) {
      this.message = "Lozinka mora sadržati bar jedan broj";
    }
    else if (!SPECIAL_CHAR_REGEX.test(this.password)) {
      this.message = "Lozinka mora sadržati bar jedan specijalni karakter";
    }
    else {
      this.message = "Lozinka je validna";
      this.passwordStatus = true;
    }
    this.msgColor = (this.passwordStatus == true) ? "green" : "red";
    return this.passwordStatus;
  }

  isEmailValid(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }

  isEmailUnique(email: string, allEmails: string[]): boolean {
    return !allEmails.includes(email);
  }

  isPhoneValid(phone: string): boolean {
    return PHONE_REGEX.test(phone);
  }

  selectImage(event: Event) {
    const input = event.target as HTMLInputElement;

    if(!input.files || input.files.length == 0)
      return;

    const file = input.files[0];
    const img = new Image();

    img.onload = () => {
      if(img.width < 100 || img.height < 100 || img.width > 250 || img.height > 250) {
        this.message = "Slika mora biti sirine i visine izmedju 100 i 250 piksela";
        this.msgColor = "red";
        this.selectedImage = null;
        return;
      }

      this.selectedImage = file;
      this.message = "Slika je validna";
      this.msgColor = "green";
    };

    img.src = URL.createObjectURL(file);
  }

  uploadImage() {
    if(!this.selectedImage)
      return;

    const formData = new FormData();

    formData.append("profileImage", this.selectedImage);
    
    this.userService.uploadImage(formData).subscribe(res => {
      console.log(res);
    });
  }

  register() {
    if(this.username == "") {
      this.message = "Korisnicko ime je obavezno";
      this.msgColor = "red";
    } else if(this.password == ""){
      this.message = "Lozinka je obavezna";
      this.msgColor = "red"
    } else if(this.firstname == "") {
      this.message = "Ime je obavezno";
      this.msgColor = "red";
    } else if(this.lastname == "") {
      this.message = "Prezime je obavezno";
      this.msgColor = "red";
    } else if(this.email == "") {
      this.message = "Email je obavezan";
      this.msgColor = "red";
    } else if(this.phoneNumber == "") {
      this.message = "Broj telefona je obavezan";
      this.msgColor = "red";
    } else if(this.registrationType == "") {
      this.message = "Obavezan je tip korisnika";
      this.msgColor = "red"
    } else {
      console.log("Username: " + this.username);
      console.log("Password:" + this.password);
      console.log("Firstname:" + this.firstname);
      console.log("Last name: " + this.lastname);
      console.log("Phone number: " + this.phoneNumber);
      console.log("Email: " + this.email);
      console.log("RegistratioType: " + this.registrationType);

      if(!this.checkPassword(this.password)) {
        return;
      }
      if (!this.isEmailValid(this.email)) {
        this.message = "Email adresa nije u odgovarajucem formatu";
        this.msgColor = "red";
        return;
      } else if(!this.isEmailUnique(this.email, this.allEmails)) {
        this.message = "E-mejl adresa je vec u upotrebi, probajte drugu";
        this.msgColor = "red";
        return;
      }

      if (!this.isPhoneValid(this.phoneNumber.toString())) {
        this.message = "Broj telefona nije u odgovarajucem formatu";
        this.msgColor = "red";
        return;
      }

      let role = "";
      let clientType = "";

      if(this.registrationType === "individual") {
          role = "client";
          clientType = "individual";
      } else if(this.registrationType === "company") {
          role = "client";
          clientType = "company";
      } else if(this.registrationType === "printer") {
          role = "printer";
          clientType = "";
      }

      const formData = new FormData();

      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('firstname', this.firstname);
      formData.append('lastname', this.lastname);
      formData.append('email', this.email);
      formData.append('phone', this.phoneNumber);
      formData.append("role", role);
      formData.append("clientType", clientType);

      if(this.registrationType === 'company' || this.registrationType === 'printer') {
        formData.append("institutionName", this.institutionName);
        formData.append("institutionAddress", this.institutionAddress);
        formData.append("institutionCity", this.institutionCity);
        formData.append("registrationNumber", this.registrationNumber);
        formData.append("taxId", this.taxId)
      }

      if(this.selectedImage) {
        formData.append('profileImage', this.selectedImage);
      }

      this.userService.register(formData).subscribe({
        next: (response: any) => {
          this.message = response.message;
          this.msgColor = "green";
          setTimeout(() => {
            //this.authService.login(response.user);
            this.router.navigate(['/']);
          }, 1000)
          /* setTimeout(() => {
            this.userService.login(this.username, this.password).subscribe({
              next: (res: any) => {
                if(!res) {
                  this.message = "Korisnik registrovan, ali prijava nije uspela";
                  this.msgColor = "red";
                  return;
                }
                console.log("Iz registera poruka: " + res.user)
                const user = res.user as User;
                this.authService.login(user);
                this.router.navigate(['/']);
              }
            })
          }, 1000); */
        },
        error: (error) => {
          this.message = error.error?.message ?? "Doslo je do greske";
          this.msgColor = "red";
          return;
        }
      })
    }
  }

  collectAllEmails() {
    this.userService.getAllEmails().subscribe(dataset => {
      if(dataset) {
        //alert("Prikupljeni mejlovi");
        this.allEmails = dataset;
      }
    })
  }
}
