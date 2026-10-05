import { PrintService } from "./product";

interface CartItem {
    _id: string;
    productId: CartProduct;
    quantity: number;
    color: string;
    selectedPrintServiceType: string | null;
    selectedPrintService?: PrintService | null;
    totalPrice?: number;
}

export interface Cart {
    _id: string,
    userId: string,
    items: CartItem[],
    createdAt: string,
    updatedAt: string
};


export interface CartProduct {
    _id: string;
    name: string;
    unitPrice: number;
    quantity: number;
}

export interface CartItemDetails {
    productId: CartProduct;
    quantity: number;
    selectedPrintServiceType: string | null;
}

export interface CartDetails {
    _id: string;
    userId: string;
    items: CartItemDetails[];
}