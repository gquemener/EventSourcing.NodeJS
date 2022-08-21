import {ResolvedEvent, StreamingRead} from "@eventstore/db-client";
import {ProductItem, replayHistory, ShoppingCart, ShoppingCartErrors, ShoppingCartStatus} from "../entity/shopping-cart";
import {ProductItemAddedToShoppingCart, ShoppingCartEvent} from "../events";

type AddProductItemToShoppingCart = {
    shoppingCartId: string;
    productItem: ProductItem;
};

const assertShoppingCartIsNotClosed = (shoppingCart: ShoppingCart): void => {
    if (shoppingCart.status !== ShoppingCartStatus.Opened)
        throw ShoppingCartErrors.SHOPPING_CART_IS_CLOSED;
};

export const addProductItemToShoppingCart = async (
    events: StreamingRead<ResolvedEvent<ShoppingCartEvent>>,
    { shoppingCartId, productItem }: AddProductItemToShoppingCart
): Promise<ProductItemAddedToShoppingCart> => {
    const shoppingCart = await replayHistory(events);

    assertShoppingCartIsNotClosed(shoppingCart);

    return {
        type: 'product-item-added-to-shopping-cart',
        data: {
            shoppingCartId,
            productItem
        }
    }
};
