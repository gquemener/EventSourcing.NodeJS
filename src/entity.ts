export enum ShoppingCartStatus {
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




export enum ShoppingCartErrors {
    UNKNOWN_EVENT_TYPE,
    OPENED_EXISTING_CART,
    CART_NOT_FOUND,
    PRODUCT_ITEM_NOT_IN_CART,
    NOT_ENOUGH_PRODUCT_ITEM_IN_CART
};
