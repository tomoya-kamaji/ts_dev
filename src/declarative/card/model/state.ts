// 商品情報の型
export type Product = {
  id: string;
  name: string;
  price: number;
};

/**
 * カートの状態
 */
export type Cart = {
  items: Product[];
};

export const total = (cart: Cart): number => {
  return cart.items.reduce((acc, product) => acc + product.price, 0);
};

/**
 * 購入情報
 */
export type Purchase = {
  userId: string;
  cart: Cart;
};
