import {JSONEventType} from "@eventstore/db-client";
import {ProductItem} from "./entity";

export type ShoppingCartOpened = JSONEventType<
    'shopping-cart-opened',
    Readonly<{
        shoppingCartId: string;
        clientId: string;
        openedAt: Date;
    }>
>;

export type ProductItemAddedToShoppingCart = JSONEventType<
    'product-item-added-to-shopping-cart',
    Readonly<{
        shoppingCartId: string;
        productItem: ProductItem;
    }>
>;

export type ProductItemRemovedFromShoppingCart = JSONEventType<
    'product-item-removed-from-shopping-cart',
    Readonly<{
        shoppingCartId: string;
        productItem: ProductItem;
    }>
>;

export type ShoppingCartConfirmed = JSONEventType<
    'shopping-cart-confirmed',
    Readonly<{
        shoppingCartId: string;
        confirmedAt: Date;
    }>
>;

export type ShoppingCartEvent =
    | ShoppingCartOpened
    | ProductItemAddedToShoppingCart
    | ProductItemRemovedFromShoppingCart
    | ShoppingCartConfirmed;
