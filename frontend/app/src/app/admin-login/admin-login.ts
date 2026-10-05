import {Component,inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {UserService} from '../services/user-service';

@Component({
    selector:'app-admin-login',
    imports:[FormsModule],
    templateUrl:'./admin-login.html',
    styleUrl:'./admin-login.css'
})
export class AdminLogin{
    private userService=inject(UserService);
    private router=inject(Router);

    username='';
    password='';
    message='';
    msgColor='red';
    loading=false;

    adminLogin(){
        this.message='';

        const username=this.username.trim();

        if(!username){
            this.message='Unesite korisničko ime administratora.';
            this.msgColor='red';
            return;
        }

        if(!this.password){
            this.message='Unesite lozinku administratora.';
            this.msgColor='red';
            return;
        }

        this.loading=true;

        this.userService.adminLogin(
            username,
            this.password
        ).subscribe({
            next:data=>{
                this.loading=false;

                if(!data){
                    this.message='Pogrešno korisničko ime ili lozinka.';
                    this.msgColor='red';
                    return;
                }

                if(data.role!=='admin'){
                    this.message='Korisnik nije administrator.';
                    this.msgColor='red';
                    return;
                }

                localStorage.setItem(
                    'loggedUser',
                    JSON.stringify(data)
                );

                this.message='Administrator je uspešno prijavljen.';
                this.msgColor='green';

                this.router.navigate([
                    '/adminPanel'
                ]);
            },
            error:error=>{
                this.loading=false;

                console.log(
                    'ADMIN LOGIN ERROR:',
                    error
                );

                this.message=
                    error.error?.message??
                    'Greška pri prijavljivanju administratora.';

                this.msgColor='red';
            }
        });
    }
}