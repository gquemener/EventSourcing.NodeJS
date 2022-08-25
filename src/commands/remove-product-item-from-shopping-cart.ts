import {ResolvedEvent, StreamingRead} from "@eventstore/db-client";
import {ProductItem, replayHistory, ShoppingCart, ShoppingCartErrors, ShoppingCartStatus} from "../entity/shopping-cart";
import {ProductItemRemovedFromShoppingCart, ShoppingCartEvent} from "../events";

type RemoveProductItemFromShoppingCart = {
    shoppingCartId: string;
    productItem: ProductItem;
};

const assertShoppingCartIsNotClosed = (shoppingCart: ShoppingCart): void => {
    if (shoppingCart.status !== ShoppingCartStatus.Opened)
        throw ShoppingCartErrors.SHOPPING_CART_IS_CLOSED;
};

export const removeProductItemFromShoppingCart = async (
    events: StreamingRead<ResolvedEvent<ShoppingCartEvent>>,
    { shoppingCartId, productItem }: RemoveProductItemFromShoppingCart
): Promise<ProductItemRemovedFromShoppingCart> => {
    const shoppingCart = await replayHistory(events);

    assertShoppingCartIsNotClosed(shoppingCart);

    return {
        type: 'product-item-removed-from-shopping-cart',
        data: {
            shoppingCartId,
            productItem
        }
    }
};
