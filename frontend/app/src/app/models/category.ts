export interface Subcategory {
    _id:string;
    name:string;
}

export interface Category {
    _id:string;
    name:string;
    subcategories:Subcategory[];
}