import {EventType, RecordedEvent, ResolvedEvent, StreamingRead, EventStoreDBClient, jsonEvent} from "@eventstore/db-client";
import {ProductItem, ShoppingCart, ShoppingCartErrors, ShoppingCartStatus} from "./entity";
import {ProductItemAddedToShoppingCart, ProductItemRemovedFromShoppingCart, ShoppingCartConfirmed, ShoppingCartEvent, ShoppingCartOpened} from "./events";
import { v4 as uuid } from 'uuid';

type ApplyEvent<Entity, E extends EventType> = (
    currentState: Entity | undefined,
    event: RecordedEvent<E>
) => Entity;

enum StreamAggregatorErrors {
    STREAM_WAS_NOT_FOUND,
};

const StreamAggregator =
    <Entity, E extends EventType>(when: ApplyEvent<Entity, E>) =>
    async (eventStream: StreamingRead<ResolvedEvent<E>>): Promise<Entity> => {
        let currentState: Entity | undefined = undefined;

        for await (const { event } of eventStream) {
            if (!event) continue;
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

const guardCurrentStatusIs = (currentStatus: ShoppingCartStatus, status: ShoppingCartStatus): void => {
    if (currentStatus !== status)
        throw ShoppingCartErrors.INVALID_SHOPPING_CART_STATUS;
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
                openedAt: new Date(event.data.openedAt),
            };
        }

        if (currentState == null) {
            throw ShoppingCartErrors.CART_NOT_FOUND;
        }

        switch (event.type) {
            case 'product-item-added-to-shopping-cart':
                guardCurrentStatusIs(currentState.status, ShoppingCartStatus.Opened);
                return {
                    ...currentState,
                    productItems: addProductItem(
                        currentState.productItems,
                        event.data.productItem
                    )
                };

            case 'product-item-removed-from-shopping-cart':
                guardCurrentStatusIs(currentState.status, ShoppingCartStatus.Opened);
                return {
                    ...currentState,
                    productItems: removeProductItem(
                        currentState.productItems,
                        event.data.productItem
                    )
                };

            case 'shopping-cart-confirmed':
                guardCurrentStatusIs(currentState.status, ShoppingCartStatus.Opened);
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

const toShoppingCartStreamName = (shoppingCartId: string): string =>
    `shopping_cart-${shoppingCartId}`;

// RUN

const enum ProductIds {
    T_SHIRT = 't-shirt-123',
    SHOES = 'shoes-87',
};

(async () => {
    const clientId = 'client-54987';
    const shoppingCartId = `cart-${uuid()}`;

    const history: ShoppingCartEvent[] = [
        <ShoppingCartOpened>{
            type: 'shopping-cart-opened',
            data: {
                shoppingCartId,
                clientId: 'client-456',
                openedAt: new Date().toJSON(),
            }
        },
        <ProductItemAddedToShoppingCart>{
            type: 'product-item-added-to-shopping-cart',
            data: {
                shoppingCartId,
                productItem: {
                    productId: ProductIds.T_SHIRT,
                    quantity: 12
                }
            }
        },
        <ProductItemAddedToShoppingCart>{
            type: 'product-item-added-to-shopping-cart',
            data: {
                shoppingCartId,
                productItem: {
                    productId: ProductIds.T_SHIRT,
                    quantity: 8
                }
            }
        },
        <ProductItemAddedToShoppingCart>{
            type: 'product-item-added-to-shopping-cart',
            data: {
                shoppingCartId,
                productItem: {
                    productId: ProductIds.SHOES,
                    quantity: 1
                }
            }
        },
        <ProductItemRemovedFromShoppingCart>{
            type: 'product-item-removed-from-shopping-cart',
            data: {
                shoppingCartId,
                productItem: {
                    productId: ProductIds.T_SHIRT,
                    quantity: 2
                }
            }
        },
        <ShoppingCartConfirmed>{
            type: 'shopping-cart-confirmed',
            data: {
                shoppingCartId,
                confirmedAt: new Date().toJSON(),
            }
        },
    ];

    const streamName = toShoppingCartStreamName(shoppingCartId);

    const eventStore = EventStoreDBClient.connectionString(
        'esdb://eventstore:2113?tls=false'
    );

    await eventStore.appendToStream(
        streamName,
        history.map((e) => jsonEvent<ShoppingCartEvent>(e))
    );

    const shoppingCartStream =
        eventStore.readStream<ShoppingCartEvent>(streamName);

    const cart = await getShoppingCart(shoppingCartStream);

    console.log(cart);
})();
