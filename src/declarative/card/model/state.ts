// 商品情報の型
export type Product = {
  id: string;
  name: string;
  price: number;
};

// カートの型
export type Cart = {
  items: Product[];
  total: number;
};

// 購入処理の型
export type Purchase = {
  userId: string;
  cart: Cart;
};
