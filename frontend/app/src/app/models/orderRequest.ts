export interface CreateOrderItem {
    productId: string;
    quantity: number;
    selectedPrintServiceType: string | null;
}

export interface CreateOrderRequest {
    userId: string;
    items: CreateOrderItem[];
}