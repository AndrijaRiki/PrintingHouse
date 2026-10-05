import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private loggedUserSubject =
        new BehaviorSubject<User | null>(
            this.getStoredUser()
        );

    loggedUser$ =
        this.loggedUserSubject.asObservable();

    private getStoredUser(): User | null {
        const data =
            localStorage.getItem("loggedUser");

        return data
            ? JSON.parse(data) as User
            : null;
    }

    login(user: User) {
        localStorage.setItem(
            "loggedUser",
            JSON.stringify(user)
        );

        this.loggedUserSubject.next(user);
    }

    logout() {
        localStorage.removeItem("loggedUser");
        this.loggedUserSubject.next(null);
    }
}