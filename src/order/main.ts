// main.ts

import { CalculatedOrder, UnverifiedOrder } from "./domain";
import {
  calculateOrderResult,
  sendOrderToCustomer,
  verifyOrderResult,
} from "./orderLogic";

/**
 * 以下の記事を参考
 * TypeScriptで書いてみた
 * Kotlinによる関数型アプローチを活用した型安全な注文確認フロー
 * https://zenn.dev/loglass/articles/5e08a7784981cc
 */
export const execute = async (
  order: UnverifiedOrder
): Promise<CalculatedOrder> => {
  // (2) ロジックを合成 (verify → calculate → send)
  //　注文情報を検証して、注文情報を計算して、顧客に通知する
  const finalResult = await verifyOrderResult(order, isAddressExist)
    .andThen((verifiedOrder) => calculateOrderResult(verifiedOrder))
    .andThen((calculatedOrder) => sendOrderToCustomer(calculatedOrder));

  // (3) 結果判定
  if (finalResult.isOk()) {
    console.log("処理完了:", finalResult.value);
    return finalResult.value;
  } else {
    console.error("処理失敗:", finalResult.error.message);
    throw new Error(finalResult.error.message);
  }
};

const isAddressExist = async (addr: string): Promise<boolean> => {
  console.log("住所存在チェック:", addr);
  return true;
};
