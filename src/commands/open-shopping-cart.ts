import {ShoppingCartOpened} from "../events";

type OpenShoppingCart = {
    shoppingCartId: string;
    clientId: string;
};

export const openShoppingCart = ({
    shoppingCartId,
    clientId
}: OpenShoppingCart): ShoppingCartOpened => {
    return {
        type: 'shopping-cart-opened',
        data: {
            shoppingCartId,
            clientId,
            openedAt: new Date().toJSON(),
        }
    };
};
