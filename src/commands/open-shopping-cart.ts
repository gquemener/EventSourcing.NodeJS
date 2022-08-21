import {ShoppingCartOpened} from "../events";
import Clock from "./clock";

type OpenShoppingCart = {
    shoppingCartId: string;
    clientId: string;
};

export const openShoppingCart = (clock: Clock) =>
    ({
        shoppingCartId,
        clientId
    }: OpenShoppingCart): ShoppingCartOpened => {
        return {
            type: 'shopping-cart-opened',
            data: {
                shoppingCartId,
                clientId,
                openedAt: clock.now(),
            }
        };
    };
