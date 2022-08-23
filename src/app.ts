import express, {NextFunction} from "express";
import {v4 as uuid} from "uuid";
import {create, getEventStore, toShoppingCartStreamName} from "./eventstore";
import Clock from "./commands/clock";
import {openShoppingCart} from "./commands/open-shopping-cart";

const app = express();
const port = 3000;

type WeakETag = `W/${string}`;
const toWeakETag = (value: any): WeakETag => {
  return `W/"${value}"`;
};

const assertNotEmptyString = (value: string): string => {
    if(!value)
        throw new Error('String is empty');

    return value;
}

app.post(
    '/clients/:clientId/shopping-carts',
    async (request, response) => {
        const shoppingCartId = uuid();
        const streamName = toShoppingCartStreamName(shoppingCartId);

        const clock: Clock = {
            now: (): string => new Date().toJSON()
        }
        const result = await create(
            getEventStore('esdb://eventstore:2113?tls=false'),
            openShoppingCart(clock)
        )
        (
            streamName,
            {
                shoppingCartId,
                clientId: assertNotEmptyString(request.params.clientId)
            }
        );

        response.set('ETag', toWeakETag(result.nextExpectedRevision));
        response.status(201).send(shoppingCartId);
    }
);

app.listen(port, '0.0.0.0', () => {
    console.log(`EventSourcing app listening on port ${port}`);
});
