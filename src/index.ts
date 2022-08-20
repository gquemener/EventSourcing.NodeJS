import {ProductItemAddedToShoppingCart, ProductItemRemovedFromShoppingCart, ShoppingCartConfirmed, ShoppingCartEvent, ShoppingCartOpened} from "./events";
import {appendShoppingCartEvents, getShoppingCart} from "./repository";
import {v4 as uuid} from 'uuid';
import {EventStoreDBClient} from "@eventstore/db-client";

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
                clientId,
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

    const eventStore = EventStoreDBClient.connectionString(
        'esdb://eventstore:2113?tls=false'
    );

    await appendShoppingCartEvents(eventStore)(shoppingCartId, history);

    const cart = await getShoppingCart(eventStore)(shoppingCartId);

    console.log(cart);
})();
