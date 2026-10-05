import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private http = inject(HttpClient);

  private url = "http://localhost:4000/users";

  login(username: string, password: string) {
    const data = {
        username: username,
        password: password
    };

    return this.http.post<User | null>(`${this.url}/login`,data);
  }

  getUserById(user: string) {
    return this.http.post<User>(`${this.url}/getUserById`, {username: user})
  }

  getUserByEmail(e: string) {
    return this.http.post<User>(`${this.url}/getUserByEmail`, {email: e});
  }

  getAllEmails() {
    return this.http.get<string[]>(`${this.url}/getAllEmails`);
  }

  forgotPassword(email: string) {
    const data = {email: email}

    return this.http.post<any>(`${this.url}/forgotPassword`, data);
  }

  resetPassword(token: string, password: string) {
    const data = {
      token: token,
      password: password
    };

    return this.http.post<any>(`${this.url}/resetPasswordByToken`, data);
  }

  adminLogin(username:string,password:string){
    const data={
      username,
      password
    };

    return this.http.post<User|null>(`${this.url}/adminLogin`, data);
  }

  uploadImage(data: FormData) {
    return this.http.post(`${this.url}/uploadImage`, data);
  }

  register(data: FormData) {
    return this.http.post<any>(`${this.url}/register`, data);
  }

  getAllPrinters() {
    return this.http.get<User[]>(`${this.url}/getAllPrinters`);
  }

  updateProfile(username: string, formData: FormData) {
    return this.http.patch<any>(`${this.url}/updateProfile/${username}`, formData);
  }
}