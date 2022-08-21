import {ShoppingCartEvent} from "../events";
import {StreamAggregator} from "./aggregate";

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
    NOT_ENOUGH_PRODUCT_ITEM_IN_CART,
    SHOPPING_CART_IS_CLOSED
};

const addProductItem = (
    productItems: ProductItem[],
    newProductItem: ProductItem
): ProductItem[] => {
    const { productId, quantity } = newProductItem;

    const currentProductItem = findProductItem(productItems, productId);

    if (!currentProductItem) return [...productItems, newProductItem];

    const newQuantity = currentProductItem.quantity + quantity;
    const mergedProductItem = { productId, quantity: newQuantity };

    return productItems.map((pi) => {
        return pi.productId === productId ? mergedProductItem : pi
    });
};

const removeProductItem = (
    productItems: ProductItem[],
    productItem: ProductItem
): ProductItem[] => {
    const { productId, quantity } = productItem;
    const currentProductItem = findProductItem(productItems, productId);

    if (!currentProductItem) throw ShoppingCartErrors.PRODUCT_ITEM_NOT_IN_CART;

    const newQuantity = currentProductItem.quantity - quantity;
    if (newQuantity < 0) throw ShoppingCartErrors.NOT_ENOUGH_PRODUCT_ITEM_IN_CART;

    if (newQuantity === 0)
        return productItems.filter((pi) => pi.productId !== productId);

    const mergedProductItem = { productId, quantity: newQuantity };

    return productItems.map((pi) => {
        return pi.productId === productId ? mergedProductItem : pi
    });
};

const findProductItem = (
    productItems: ProductItem[],
    id: string
): ProductItem | undefined => {
    return productItems.find((pi) => pi.productId === id);
};

export const replayHistory = StreamAggregator<ShoppingCart, ShoppingCartEvent>(
    (currentState, event) => {
        if (event.type == 'shopping-cart-opened') {
            if (currentState != null) {
                throw ShoppingCartErrors.OPENED_EXISTING_CART;
            }

            return {
                id: event.data.shoppingCartId,
                clientId: event.data.clientId,
                status: ShoppingCartStatus.Opened,
                productItems: [],
                openedAt: new Date(event.data.openedAt),
            };
        }

        if (currentState == null) {
            throw ShoppingCartErrors.CART_NOT_FOUND;
        }

        switch (event.type) {
            case 'product-item-added-to-shopping-cart':
                return {
                    ...currentState,
                    productItems: addProductItem(
                        currentState.productItems,
                        event.data.productItem
                    )
                };

            case 'product-item-removed-from-shopping-cart':
                return {
                    ...currentState,
                    productItems: removeProductItem(
                        currentState.productItems,
                        event.data.productItem
                    )
                };

            case 'shopping-cart-confirmed':
                return {
                    ...currentState,
                    status: ShoppingCartStatus.Confirmed,
                    confirmedAt: new Date(event.data.confirmedAt)
                };

            default:
                throw ShoppingCartErrors.UNKNOWN_EVENT_TYPE;
        }
    }
);
