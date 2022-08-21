import {openShoppingCart} from "../../src/commands/open-shopping-cart";

describe('Open shopping cart should', () => {
    test('provide a ShoppingCartOpened event', () => {
        const now = new Date().toJSON();
        const clock = {
            now: jest.fn(() => now)
        };

        const result = openShoppingCart(clock)({
            shoppingCartId: '1234',
            clientId: '5678'
        });

        expect(result).toEqual({
            type: 'shopping-cart-opened',
            data: {
                shoppingCartId: '1234',
                clientId: '5678',
                openedAt: now,
            }
        })
    });
});
