import express, {NextFunction, Request, Response} from "express";
import {v4 as uuid} from "uuid";
import {create, getEventStore, toShoppingCartStreamName, update} from "./eventstore";
import Clock from "./commands/clock";
import {openShoppingCart} from "./commands/open-shopping-cart";
import {assertNotEmptyString, assertPositiveNumber} from "./core/validation";
import {getExpectedRevisionFromETag, sendCreated, toWeakETag} from "./core/http";
import {addProductItemToShoppingCart} from "./commands/add-product-item-to-shopping-cart";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());
const port = 3000;
const eventstoreDns = 'esdb://eventstore:2113?tls=false';

app.post(
    '/clients/:clientId/shopping-carts',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
        const shoppingCartId = uuid();
        const streamName = toShoppingCartStreamName(shoppingCartId);

        const clock: Clock = {
            now: (): string => new Date().toJSON()
        }
        const result = await create(
            getEventStore(eventstoreDns),
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
        sendCreated(response, shoppingCartId);
        } catch (error) {
            next(error);
        }
    }
);

app.post(
    '/clients/:clientId/shopping-carts/:shoppingCartId/product-items',
    async (request: Request, response: Response, next: NextFunction) => {
        try {
            const shoppingCartId = assertNotEmptyString(
                request.params.shoppingCartId
            );
            const streamName = toShoppingCartStreamName(shoppingCartId);
            const expectedRevision = getExpectedRevisionFromETag(request);

            const result = await update(
                getEventStore(eventstoreDns),
                addProductItemToShoppingCart
            )
            (
                streamName,
                {
                    shoppingCartId,
                    productItem: {
                        productId: assertNotEmptyString(request.body.productId),
                        quantity: assertPositiveNumber(request.body.quantity)
                    }
                },
                expectedRevision
            );

            response.set('ETag', toWeakETag(result.nextExpectedRevision));
            response.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`EventSourcing app listening on port ${port}`);
});

const shutdown = () => {
    console.log('Good bye...')
    server.close();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
