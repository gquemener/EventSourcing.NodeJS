import {getMongoCollection, retryIfNotFound, retryIfNotUpdated, storeCheckpointInCollection, SubscriptionToAllWithMongoCheckpoints, toObjectId} from "../core/mongoDB";
import {SubscriptionResolvedEvent} from "../core/subscriptions";
import {addProductItem, removeProductItem, ShoppingCartErrors} from "../entity/shopping-cart";
import {ShoppingCartEvent, ShoppingCartOpened, ProductItemAddedToShoppingCart, ProductItemRemovedFromShoppingCart, ShoppingCartConfirmed} from "../events";

export type ShoppingCartDetails = Readonly<{
    shoppingCartId: string;
    clientId: string;
    status: string;
    productItems: ProductItem[];
    openedAt: string;
    confirmedAt?: string;
    revision: number;
}>;

type ProductItem = Readonly<{
    productId: string;
    quantity: number;
}>;

export const projectToShoppingCartItem = ({ event }: SubscriptionResolvedEvent): Promise<void> => {
    if (
        event === undefined ||
        !isShoppingCartEvent(event)
    ) {
        return Promise.resolve();
    }

    const streamRevision = Number(event.revision);

    switch(event.type) {
        case 'shopping-cart-opened':
            return projectShoppingCartOpened(event as ShoppingCartOpened, streamRevision);

        case 'product-item-added-to-shopping-cart':
            return projectProductItemAddedToShoppingCart(event as ProductItemAddedToShoppingCart, streamRevision);

        case 'product-item-removed-from-shopping-cart':
            return projectProductItemRemovedFromShoppingCart(event as ProductItemRemovedFromShoppingCart, streamRevision);

        case 'shopping-cart-confirmed':
            return projectShoppingCartConfirmed(event as ShoppingCartConfirmed, streamRevision);

        default:
            throw ShoppingCartErrors.UNKNOWN_EVENT_TYPE;
    }
};

const projectShoppingCartOpened = async (
    event: ShoppingCartOpened,
    streamRevision: number
): Promise<void> => {
    const shoppingCarts = await getShoppingCartsCollection();

    await shoppingCarts.insertOne({
        _id: toObjectId(event.data.shoppingCartId),
        shoppingCartId: event.data.shoppingCartId,
        clientId: event.data.clientId,
        status: 'Opened',
        productItems: [],
        revision: streamRevision,
        openedAt: event.data.openedAt
    });
};

const projectProductItemAddedToShoppingCart = async (
    event: ProductItemAddedToShoppingCart,
    streamRevision: number
): Promise<void> => {
    const shoppingCarts = await getShoppingCartsCollection();
    const lastRevision = streamRevision - 1;
    const { productItems, revision } = await retryIfNotFound(() =>
        shoppingCarts.findOne(
            {
                _id: toObjectId(event.data.shoppingCartId),
                revision: { $gte: lastRevision },
            },
            {
                projection: { productItems: 1, revision: 1 }
            }
        )
    );

    if (revision > lastRevision) {
        return;
    }

    retryIfNotUpdated(() =>
        shoppingCarts.updateOne(
            {
                _id: toObjectId(event.data.shoppingCartId),
                revision: lastRevision
            },
            {
                $set: {
                    productItems: addProductItem(productItems, event.data.productItem),
                    revision: streamRevision
                }
            },
            { upsert: false }
        )
    )
};

const projectProductItemRemovedFromShoppingCart = async (
    event: ProductItemRemovedFromShoppingCart,
    streamRevision: number
): Promise<void> => {
    const shoppingCarts = await getShoppingCartsCollection();
    const lastRevision = streamRevision - 1;
    const { productItems, revision } = await retryIfNotFound(() =>
        shoppingCarts.findOne(
            {
                _id: toObjectId(event.data.shoppingCartId),
                revision: { $gte: lastRevision },
            },
            {
                projection: { productItems: 1, revision: 1 }
            }
        )
    );

    if (revision > lastRevision) {
        return;
    }

    retryIfNotUpdated(() =>
        shoppingCarts.updateOne(
            {
                _id: toObjectId(event.data.shoppingCartId),
                revision: lastRevision
            },
            {
                $set: {
                    productItems: removeProductItem(productItems, event.data.productItem),
                    revision: streamRevision
                }
            },
            { upsert: false }
        )
    )
};

const projectShoppingCartConfirmed = async (
    event: ShoppingCartConfirmed,
    streamRevision: number
): Promise<void> => {
    const shoppingCarts = await getShoppingCartsCollection();
    const lastRevision = streamRevision - 1;
    const { revision } = await retryIfNotFound(() =>
        shoppingCarts.findOne(
            {
                _id: toObjectId(event.data.shoppingCartId),
                revision: { $gte: lastRevision },
            },
            {
                projection: { revision: 1 }
            }
        )
    );

    if (revision > lastRevision) {
        return;
    }

    retryIfNotUpdated(() =>
        shoppingCarts.updateOne(
            {
                _id: toObjectId(event.data.shoppingCartId),
                revision: lastRevision
            },
            {
                $set: {
                    confirmedAt: event.data.confirmedAt,
                    status: 'Confirmed',
                    revision: streamRevision
                }
            },
            { upsert: false }
        )
    )
};

const isShoppingCartEvent = (event: any): event is ShoppingCartEvent => {
    return (
        event !== null &&
        (event.type === 'shopping-cart-opened' ||
         event.type === 'product-item-added-to-shopping-cart' ||
         event.type === 'product-item-removed-from-shopping-cart' ||
         event.type === 'shopping-cart-confirmed')
    );
};

export const getShoppingCartsCollection = () =>
  getMongoCollection<ShoppingCartDetails>('shoppingCartDetails');

export const runProjection = async () => {
    await SubscriptionToAllWithMongoCheckpoints('sub_shopping_carts', [
        storeCheckpointInCollection(projectToShoppingCartItem),
    ])
};
