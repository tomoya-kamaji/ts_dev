// main.ts

import { UnverifiedOrder } from "./domain";
import {
  calculateOrderResult,
  sendOrderToCustomer,
  verifyOrderResult,
} from "./orderLogic";

/**
 * 呼び出しのサンプル
 */
const main = (): void => {
  // (1) 未検証状態の注文を用意
  const unverifiedOrder: UnverifiedOrder = {
    kind: "Unverified",
    id: "order-123",
    shippingAddress: "Shibuya, Tokyo",
    orderLines: [
      { id: "line-1", price: 100 },
      { id: "line-2", price: 200 },
    ],
  };

  // (2) 検証
  const verifiedResult = verifyOrderResult(unverifiedOrder, (addr) => !!addr);
  if (!verifiedResult.ok) {
    // エラー時の対処
    console.error("検証失敗:", verifiedResult.error.message);
    return;
  }
  const verifiedOrder = verifiedResult.value;

  // (3) 金額計算
  const calcResult = calculateOrderResult(verifiedOrder);
  if (!calcResult.ok) {
    // エラー時の対処
    console.error("計算失敗:", calcResult.error.message);
    return;
  }
  const calculatedOrder = calcResult.value;

  // (4) 顧客通知 (Calculated のみ渡せる)
  sendOrderToCustomer(calculatedOrder);

  console.log("処理完了");
};

// サンプル実行
main();
