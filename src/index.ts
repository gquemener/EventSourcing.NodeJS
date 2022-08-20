import {ProductItem, ShoppingCart, ShoppingCartErrors, ShoppingCartStatus} from "./entity";
import {ProductItemAddedToShoppingCart, ProductItemRemovedFromShoppingCart, ShoppingCartEvent, ShoppingCartOpened} from "./events";

type ApplyEvent<Entity, Event> = (
    currentState: Entity | undefined,
    event: Event
) => Entity;

enum StreamAggregatorErrors {
    STREAM_WAS_NOT_FOUND,
};

const StreamAggregator =
    <Entity, Event>(when: ApplyEvent<Entity, Event>) =>
    (events: Event[]): Entity => {
        let currentState: Entity | undefined = undefined;
        for(const event of events) {
            currentState = when(currentState, event);
        }

        if (currentState == null) {
            throw StreamAggregatorErrors.STREAM_WAS_NOT_FOUND;
        }

        return currentState;
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
}

const findProductItem = (
    productItems: ProductItem[],
    id: string
): ProductItem | undefined => {
    return productItems.find((pi) => pi.productId === id);
}

const getShoppingCart = StreamAggregator<ShoppingCart, ShoppingCartEvent>(
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
                openedAt: event.data.openedAt,
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
            default:
                throw ShoppingCartErrors.UNKNOWN_EVENT_TYPE;
        }
    }
);

const history: ShoppingCartEvent[] = [
    <ShoppingCartOpened>{
        type: 'shopping-cart-opened',
        data: {
            shoppingCartId: 'cart-123',
            clientId: 'client-456',
            openedAt: new Date(),
        }
    },
    <ProductItemAddedToShoppingCart>{
        type: 'product-item-added-to-shopping-cart',
        data: {
            productItem: {
                productId: 'product-234',
                quantity: 12
            }
        }
    },
    <ProductItemAddedToShoppingCart>{
        type: 'product-item-added-to-shopping-cart',
        data: {
            productItem: {
                productId: 'product-234',
                quantity: 8
            }
        }
    },
    <ProductItemRemovedFromShoppingCart>{
        type: 'product-item-removed-from-shopping-cart',
        data: {
            productItem: {
                productId: 'product-234',
                quantity: 2
            }
        }
    }
];
const cart = getShoppingCart(history);
console.log(cart);
