export interface ProductComment {
    _id: string;
    productId: string;
    userId: string;
    username: string;
    text: string;
    createdAt: Date;
}