enum ShoppingCartStatus {
    Opened = 1,
    Confirmed = 2,
    Cancelled = 3,
    Closed = Confirmed | Cancelled,
};

export type ProductItem = Readonly<{
    productId: string;
    quantity: number;
}>;

export type ShoppingCart = Readonly<{
    id: string;
    clientId: string;
    status: ShoppingCartStatus;
    productItems: ProductItem[];
    openedAt: Date;
    confirmedAt?: Date;
}>;
