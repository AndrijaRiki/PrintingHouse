import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Cart } from '../models/cart';
import { SelectedPrintService } from '../models/order';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private http = inject(HttpClient);
  private url = "http://localhost:4000/carts";

  getCart(userId: string) {
    return this.http.get<Cart>(`${this.url}/getCart/${userId}`);
  }

  addToCart(userId: string, productId: string, quantity: number, selectedPrintServiceType: string) {
    return this.http.post<any>(`${this.url}/addToCart`, {
      userId, productId, quantity, selectedPrintServiceType
    });
  }

  updateCartItem(userId: string, productId: string, quantity: number, selectedPrintServiceType: string | null) {
    return this.http.patch<any>(`${this.url}/updateCartItem`,
      {
        userId, productId, quantity, selectedPrintServiceType
      }
    );
  }

  removeFromCart(userId: string, productId: string, selectedPrintServiceType: string | null) {
    return this.http.request<any>('delete', `${this.url}/removeFromCart`, {
      body: {
        userId, productId, selectedPrintServiceType
      }
    });
  }

  clearCart(userId: string) {
    return this.http.delete<any>(`${this.url}/clearCart/${userId}`);
  }

  createOrder(userId: string) {
    return this.http.post<any>(`${this.url}/create`, {userId: userId});
  }

  addCustomizedProduct(formData: FormData) {
    return this.http.post<any>(`${this.url}/addCustomizedProduct`, formData);
  }
}
