import {ShoppingCart} from "./entity";
import {ShoppingCartEvent, ShoppingCartOpened} from "./events";

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

const getShoppingCart = StreamAggregator<ShoppingCart, ShoppingCartEvent>(
    (currentState, event) => {
        switch(event.type) {
            case 'shopping-cart-opened':
                return <ShoppingCart>{
                    id: event.data.shoppingCartId,
                    clientId: event.data.clientId,
                    openedAt: event.data.openedAt,
                };

            default:
                return <ShoppingCart>{};
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
    }
];
const cart = getShoppingCart(history);
console.log(cart);
