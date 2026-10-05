export interface PublicProcurementItem {
    _id: string;
    originalProductId: string;
    productName: string;
    categoryId: string;
    subcategoryId: string;
    quantity: number;
    color: string;
    printService: string | null;
}

export interface PublicProcurement {
    _id: string;
    userId: string;
    items: PublicProcurementItem[];
    status: 'open' | 'processing' | 'awarded' | 'no_offers' | 'cancelled';
    expiresAt: Date;
    winnerPrinterId: any | null;
    winningBidId: string | null;
    orderId: string | null;
    createdAt: Date;
}

export interface ProcurementBidItem {
    requestedItemId: string;
    productId: string;
    unitPrice: number;
}

export interface ProcurementBid {
    _id: string;
    procurementId: string;
    printerId: string;
    items: {
        requestedItemId: string;
        productId: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
    }[];
    totalAmount: number;
}