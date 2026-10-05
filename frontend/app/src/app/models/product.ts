export interface PrintService {
    type: string;
    additionalPrice: number;
    maxWidthMm: number;
    maxHeightMm: number;
}

export interface Product {
    _id: string;
    code: string;
    name: string;
    description: string;
    printerId: string;
    categoryId: string;
    subcategoryId: string;
    unitPrice: number;
    quantity: number;
    colors: string[];
    active: boolean;
    printServices: PrintService[];
    likedBy: string[];
    dislikedBy: string[];
    likeCount: number;
    dislikeCount: number;
    additionalImageCount: number;
    hasMainImage?: boolean;
}

export interface PrinterInfo {
    _id: string;
    username: string;
    institution: {
        name: string;
        address: string;
        city: string;
        registrationNumber?: string;
        taxId?: string;
    } | null;
}

export interface ProductDetails extends Omit<Product, 'printerId'> {
    printerId: PrinterInfo;
    hasMainImage: boolean;
}