export interface PrinterInfo {
    username: string;
    institution: {
        name: string;
        city: string;
    };
}

export interface ProductDetails {
    _id: string;
    name: string;
    description: string;
    printerId: PrinterInfo;
    unitPrice: number;
    quantity: number;
    likeCount: number;
    dislikeCount: number;
    additionalImageCount: number;
}