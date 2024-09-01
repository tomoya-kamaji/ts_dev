import { ResultAsync, okAsync } from "neverthrow";
import { Cart, Product } from "../model/state";

/**
 * カートを追加
 */
export const addToCart = (
  cart: Cart,
  product: Product
): ResultAsync<Cart, Error> => {
  const updatedCart = {
    items: [...cart.items, product],
  };
  return okAsync(updatedCart);
};
