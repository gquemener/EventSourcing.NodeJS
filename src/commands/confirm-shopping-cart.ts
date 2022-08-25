import {ResolvedEvent, StreamingRead} from "@eventstore/db-client";
import {replayHistory, ShoppingCart, ShoppingCartErrors, ShoppingCartStatus} from "../entity/shopping-cart";
import {ShoppingCartConfirmed, ShoppingCartEvent} from "../events";
import Clock from "./clock";

type ConfirmShoppingCart = {
    shoppingCartId: string;
};

const assertShoppingCartIsNotClosed = (shoppingCart: ShoppingCart): void => {
    if (shoppingCart.status !== ShoppingCartStatus.Opened)
        throw ShoppingCartErrors.SHOPPING_CART_IS_CLOSED;
};

export const confirmShoppingCart = (clock: Clock) =>
    async (
        events: StreamingRead<ResolvedEvent<ShoppingCartEvent>>,
        { shoppingCartId }: ConfirmShoppingCart
    ): Promise<ShoppingCartConfirmed> => {
        const shoppingCart = await replayHistory(events);

        assertShoppingCartIsNotClosed(shoppingCart);

        return {
            type: 'shopping-cart-confirmed',
            data: {
                shoppingCartId,
                confirmedAt: clock.now(),
            }
        }
    };
