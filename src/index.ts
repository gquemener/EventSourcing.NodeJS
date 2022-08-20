import {ProductItemAddedToShoppingCart, ProductItemRemovedFromShoppingCart, ShoppingCartConfirmed, ShoppingCartEvent, ShoppingCartOpened} from "./events";
import {appendShoppingCartEvents, getShoppingCart} from "./repository";
import {v4 as uuid} from 'uuid';
import {EventStoreDBClient} from "@eventstore/db-client";
import {addProductItemToShoppingCart, openShoppingCart} from "./commands";

const enum ProductIds {
    T_SHIRT = 't-shirt-123',
    SHOES = 'shoes-87',
};

(async () => {
    const clientId = 'client-54987';
    //const shoppingCartId = `cart-${uuid()}`;
    const shoppingCartId = 'cart-b1554cf7-1335-4cc3-92ac-d292a3ee77ec';

    const history: ShoppingCartEvent[] = [];
    //history.push(openShoppingCart({ shoppingCartId, clientId }));
    history.push(addProductItemToShoppingCart({ shoppingCartId, productItem: {
        productId: ProductIds.T_SHIRT,
        quantity: 1
    }}));

    const eventStore = EventStoreDBClient.connectionString(
        'esdb://eventstore:2113?tls=false'
    );

    //await appendShoppingCartEvents(eventStore)(shoppingCartId, history);

    const cart = await getShoppingCart(eventStore)(shoppingCartId);

    console.log(cart);
})();
