import {replayHistory, ShoppingCart} from "./entity/shopping-cart";
import {getEventStore} from "./eventstore";

const enum ProductIds {
    T_SHIRT = 't-shirt-123',
    SHOES = 'shoes-87',
};

const toShoppingCartStreamName = (shoppingCartId: string) => `shopping_cart-${shoppingCartId}`;

(async () => {
    const shoppingCartId = 'cart-b1554cf7-1335-4cc3-92ac-d292a3ee77ec';
    const eventStore = getEventStore('esdb://eventstore:2113?tls=false');

    const history = eventStore.readStream('shopping_cart', shoppingCartId);
    const cart: ShoppingCart = await replayHistory(history);

    //const event: ShoppingCartEvent = addProductItemToShoppingCart(
    //    eventStore.readStream<ShoppingCartEvent>(streamName),
    //    {
    //        shoppingCartId,
    //        productItem: {
    //            productId: ProductIds.T_SHIRT,
    //            quantity: 1
    //        }
    //    });

    //const cart = await getShoppingCart(shoppingCartId);

    console.log(cart);
})();
