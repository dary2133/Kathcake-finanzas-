export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'cashier' | 'baker' | 'seller';
    phone?: string;
    isActive?: boolean;
    permissions?: any;
}

export interface Product {
    _id: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    category: string;
    images: { url: string }[];
    description?: string;
    minStock?: number;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface SaleItem {
    product: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface Sale {
    _id: string;
    invoiceNumber: string;
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
        taxId?: string;
    };
    items: SaleItem[];
    subtotal: number;
    tax: number;
    discount: number;
    discountType: 'percentage' | 'fixed' | 'none';
    total: number;
    paymentMethod: 'cash' | 'card' | 'transfer' | 'mixed';
    status: 'pending' | 'paid' | 'cancelled' | 'refunded';
    seller: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
}
