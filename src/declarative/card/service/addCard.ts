import { ResultAsync, okAsync } from "neverthrow";
import { Cart, Product } from "../model/state";

// カートに商品を追加する関数
export const addToCart = (
  cart: Cart,
  product: Product
): ResultAsync<Cart, Error> => {
  const updatedCart = {
    items: [...cart.items, product],
    total: cart.total + product.price,
  };
  return okAsync(updatedCart);
};
