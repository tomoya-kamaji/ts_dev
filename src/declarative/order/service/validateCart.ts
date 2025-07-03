import { ResultAsync, errAsync, okAsync } from 'neverthrow';
import { OrderProcessingState, OrderError, CartItem, Address } from '../model/state';

// カート情報を取得するためのリポジトリインターface
export interface CartRepository {
  findById(cartId: string): ResultAsync<Cart | null, Error>;
  getUserShippingAddress(userId: string): ResultAsync<Address | null, Error>;
}

// カート情報の型定義
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// カート検証サービス
export const validateCart = (deps: { cartRepo: CartRepository }) => 
  (input: Extract<OrderProcessingState, { kind: 'Input' }>): ResultAsync<Extract<OrderProcessingState, { kind: 'ValidatedCart' }>, OrderError> => {
    
    return deps.cartRepo.findById(input.cartId)
      .mapErr((): OrderError => ({ type: 'UnknownError', message: 'Failed to fetch cart' }))
      .andThen((cart) => {
        if (!cart) {
          return errAsync<Cart, OrderError>({ type: 'CartNotFound', cartId: input.cartId });
        }
        return okAsync(cart);
      })
      .andThen((cart) => {
        // カートの所有者確認
        if (cart.userId !== input.userId) {
          return errAsync<Cart, OrderError>({ type: 'InvalidCart', reason: 'Cart does not belong to user' });
        }
        
        // カートが空でないことを確認
        if (cart.items.length === 0) {
          return errAsync<Cart, OrderError>({ type: 'InvalidCart', reason: 'Cart is empty' });
        }
        
        return okAsync(cart);
      })
      .andThen((cart) => {
        // 配送先住所を取得
        return deps.cartRepo.getUserShippingAddress(input.userId)
          .mapErr((): OrderError => ({ type: 'UnknownError', message: 'Failed to fetch shipping address' }))
          .andThen((address) => {
            if (!address) {
              return errAsync<Address, OrderError>({ type: 'InvalidCart', reason: 'No shipping address found' });
            }
            return okAsync(address);
          })
          .map((address) => ({ cart, address }));
      })
      .map(({ cart, address }) => {
        // 小計を計算
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
          kind: 'ValidatedCart' as const,
          userId: input.userId,
          cartItems: cart.items,
          shippingAddress: address,
          paymentMethod: input.paymentMethod,
          subtotal
        };
      });
  };