import { Cart, Product } from "../model/state";
import { addToCart } from "../service/addCard";
import { purchase } from "../service/purchase";

// 初期カート
let cart: Cart = { items: [], total: 0 };

// 商品を追加
// 商品の配列を作成
const products: Product[] = [
  { id: "1", name: "商品A", price: 1000 },
  { id: "2", name: "商品B", price: 1500 },
  { id: "3", name: "商品C", price: 2000 },
  { id: "4", name: "商品D", price: 2500 },
  { id: "5", name: "商品E", price: 3000 },
];

// 商品をカートに追加
const addProductsToCart = async () => {
  for (const product of products) {
    const result = await addToCart(cart, product);

    result
      .map((updatedCart) => {
        cart = updatedCart;
      })
      .mapErr((err) => {
        console.error("エラー:", err);
      });
  }

  // 購入処理
  purchase(cart, "user123")
    .map((purchaseDetails) => {
      console.log("購入完了:", purchaseDetails);
    })
    .mapErr((err) => {
      console.error("エラー:", err);
    });
};

addProductsToCart();
