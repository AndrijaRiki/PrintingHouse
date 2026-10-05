export interface SelectedPrintService {
    type: string;
    additionalPrice: number;
    maxWidthMm: number;
    maxHeightMm: number;
}

export interface Customization {
    text: string | null;
    image?: {
        data: any;
        contentType: string;
    } | null;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    color: string;
    selectedPrintService: SelectedPrintService | null;
    customization: Customization | null;
    totalPrice: number;
}

export interface InstitutionSnapshot {
    name: string;
    address: string;
    city: string;
    registrationNumber: string;
    taxId: string;
}

export interface CustomerSnapshot {
    firstname: string;
    lastname: string;
    email: string;
    clientType: string | null;
    institution: InstitutionSnapshot | null;
}

export interface PrinterSnapshot {
    name: string;
    address: string;
    city: string;
    registrationNumber: string;
    taxId: string;
}

export interface PrinterInfo {
    _id: string;
    username: string;
    institution: {
        name: string;
        address: string;
        city: string;
        registrationNumber: string;
        taxId: string;
    } | null;
}

export interface Order {
    _id: string;
    userId: string;
    printerId: PrinterInfo;
    invoiceNumber: string;
    issuedAt?: string | null;
    customerSnapshot: CustomerSnapshot;
    printerSnapshot: PrinterSnapshot;
    items: OrderItem[];
    totalAmount: number;
    currency: string;
    status:
        | 'ordered'
        | 'paid'
        | 'printing'
        | 'delivered'
        | 'received'
        | 'cancelled';
    stripeSessionId?: string | null;
    paidAt?: string | null;
    createdAt: string;
    updatedAt: string;
}