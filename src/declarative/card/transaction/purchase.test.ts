import { addProductsToCart } from "./purchase";

describe("addProductsToCart", () => {
  it("カートに商品を追加する", async () => {
    const products = [
      { id: "1", name: "商品1", price: 100 },
      { id: "2", name: "商品2", price: 200 },
      { id: "3", name: "商品3", price: 300 },
      { id: "4", name: "商品4", price: 400 },
    ];

    await addProductsToCart(products);
  });
});
