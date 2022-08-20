import {ProductItem} from "./entity";
import {ProductItemAddedToShoppingCart, ShoppingCartOpened} from "./events";

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

type AddProductItemToShoppingCart = {
    shoppingCartId: string;
    productItem: ProductItem;
};

export const addProductItemToShoppingCart = ({
    shoppingCartId,
    productItem
}: AddProductItemToShoppingCart): ProductItemAddedToShoppingCart => {
    return {
        type: 'product-item-added-to-shopping-cart',
        data: {
            shoppingCartId,
            productItem
        }
    }
};
