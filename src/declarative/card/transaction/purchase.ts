import { Cart, Product, total } from "../model/state";
import { addToCart } from "../service/addCard";
import { purchase } from "../service/purchase";

/**
 * カートに商品を追加して購入する
 */
export const addProductsToCart = async (products: Product[]) => {
  const cart: Cart = { items: [] };

  for (const product of products) {
    addToCart(cart, product).map((updatedCart) => {
      cart.items = updatedCart.items;
    });
  }
  // 購入処理
  purchase(cart, "user123")
    .map((purchaseDetails) => {
      console.log("購入完了:", purchaseDetails);
      console.log("トータル:", total(cart));
    })
    .mapErr((err) => {
      console.error("エラー:", err);
    });
};
