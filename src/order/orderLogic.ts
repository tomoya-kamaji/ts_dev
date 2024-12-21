// orderLogic.ts

import { CalculatedOrder, UnverifiedOrder, VerifiedOrder } from "./domain";
import { OrderError, OrderErrorType, Result } from "./result";

/**
 * 検証処理 (Unverified → Verified)
 * 成功: { ok: true, value: VerifiedOrder }
 * 失敗: { ok: false, error: OrderError }
 */
export const verifyOrderResult = (
  order: UnverifiedOrder,
  isAddressExist: (addr: string) => boolean
): Result<VerifiedOrder, OrderError> => {
  if (!isAddressExist(order.shippingAddress)) {
    return {
      ok: false,
      error: {
        type: OrderErrorType.ADDRESS_NOT_EXIST,
        message: "配送先住所が存在しません",
      },
    };
  }
  return {
    ok: true,
    value: {
      ...order,
      kind: "Verified",
    },
  };
};

/**
 * 金額計算処理 (Verified → Calculated)
 * 成功: { ok: true, value: CalculatedOrder }
 * 失敗: { ok: false, error: OrderError }
 */
export const calculateOrderResult = (
  order: VerifiedOrder
): Result<CalculatedOrder, OrderError> => {
  if (order.orderLines.length === 0) {
    return {
      ok: false,
      error: {
        type: OrderErrorType.NO_ORDER_LINES,
        message: "注文明細がありません",
      },
    };
  }
  const totalPrice = order.orderLines.reduce(
    (sum, line) => sum + line.price,
    0
  );

  return {
    ok: true,
    value: {
      ...order,
      kind: "Calculated",
      totalPrice,
    },
  };
};

/**
 * 顧客通知処理 (Calculated のみ受け取る想定)
 * 状態が Calculated であることを型で保証
 */
export const sendOrderToCustomer = (order: CalculatedOrder): void => {
  // 顧客通知の実装は仮
  console.log(`Send order#${order.id} with totalPrice=${order.totalPrice}`);
};
