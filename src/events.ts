import {ProductItem} from "./entity";

export type ShoppingCartOpened = Readonly<{
    type: 'shopping-cart-opened';
    data: {
        shoppingCartId: string;
        clientId: string;
        openedAt: Date;
    };
}>;

export type ProductItemAddedToShoppingCart = Readonly<{
    type: 'product-item-added-to-shopping-cart';
    data: {
        shoppingCartId: string;
        productItem: ProductItem;
    };
}>;

export type ProductItemRemovedFromShoppingCart = Readonly<{
    type: 'product-item-removed-from-shopping-cart';
    data: {
        shoppingCartId: string;
        productItem: ProductItem;
    };
}>;

export type ShoppingCartConfirmed = Readonly<{
    type: 'shopping-cart-confirmed';
    data: {
        shoppingCartId: string;
        confirmedAt: Date;
    };
}>;

export type ShoppingCartEvent =
    | ShoppingCartOpened
    | ProductItemAddedToShoppingCart
    | ProductItemRemovedFromShoppingCart
    | ShoppingCartConfirmed;
