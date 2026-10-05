export interface ArchiveProduct {
    archiveId: string;
    orderId: string;
    productId: string;

    productName: string;
    quantity: number;

    color: string;
    printService: string | null;

    printerId: string;
    printerName: string;
    printerCity: string;

    orderDate: Date;

    status: 'delivered' | 'received';

    userReaction: 'like' | 'dislike' | null;
}