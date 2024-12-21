// main.ts

import { CalculatedOrder, UnverifiedOrder } from "./domain";
import {
  calculateOrderResult,
  sendOrderToCustomer,
  verifyOrderResult,
} from "./orderLogic";

/**
 * サンプル実行
 */
export const execute = async (
  order: UnverifiedOrder
): Promise<CalculatedOrder> => {
  // (2) ロジックを合成 (verify → calculate → send)
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
