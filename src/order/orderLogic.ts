import { err, ok, Result, ResultAsync } from "neverthrow";
import { CalculatedOrder, UnverifiedOrder, VerifiedOrder } from "./domain";
import { OrderError, OrderErrorType } from "./result";

/**
 * (例) 非同期の住所チェックを行う想定:
 *   isAddressExist: (addr: string) => Promise<boolean>
 *
 * UnverifiedOrder → VerifiedOrder
 */
export const verifyOrderResult = (
  order: UnverifiedOrder,
  isAddressExist: (addr: string) => Promise<boolean>
): ResultAsync<VerifiedOrder, OrderError> => {
  return ResultAsync.fromPromise(
    isAddressExist(order.shippingAddress),
    (e): OrderError => ({
      type: OrderErrorType.ADDRESS_NOT_EXIST,
      message: `住所存在チェックで例外が発生: ${String(e)}`,
    })
  ).andThen((exists) => {
    if (!exists) {
      return err<VerifiedOrder, OrderError>({
        type: OrderErrorType.ADDRESS_NOT_EXIST,
        message: "配送先住所が存在しません",
      });
    }
    return ok<VerifiedOrder, OrderError>({
      ...order,
      kind: "Verified",
    });
  });
};

/**
 * VerifiedOrder → CalculatedOrder
 * 今回は同期的なロジックだが、あえて ResultAsync.fromSafePromise を使ってみる例
 */
export const calculateOrderResult = (
  order: VerifiedOrder
): Result<CalculatedOrder, OrderError> => {
  if (order.orderLines.length === 0) {
    return err<CalculatedOrder, OrderError>({
      type: OrderErrorType.NO_ORDER_LINES,
      message: "注文明細がありません",
    });
  }
  const totalPrice = order.orderLines.reduce(
    (sum, line) => sum + line.price,
    0
  );
  return ok<CalculatedOrder, OrderError>({
    ...order,
    kind: "Calculated",
    totalPrice,
  });
};

/**
 * CalculatedOrder → 顧客通知
 * ここでも非同期を想定して ResultAsync を返す例
 */
export const sendOrderToCustomer = (
  order: CalculatedOrder
): ResultAsync<CalculatedOrder, OrderError> => {
  const promise = (async () => {
    // 非同期の顧客通知処理があると仮定 (ここでは代わりに console.log)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(
      `Send order#${order.id} to ${order.shippingAddress} ` +
        `with totalPrice=${order.totalPrice}`
    );
    return order;
  })();

  return ResultAsync.fromSafePromise(promise);
};

export const saveOrder = (
  order: CalculatedOrder,
  saveOrder: (order: CalculatedOrder) => Promise<CalculatedOrder>
): ResultAsync<CalculatedOrder, OrderError> => {
  return ResultAsync.fromPromise(
    saveOrder(order),
    (e): OrderError => ({
      type: OrderErrorType.SAVE_ORDER_FAILED,
      message: `注文保存で例外が発生: ${String(e)}`,
    })
  );
};
