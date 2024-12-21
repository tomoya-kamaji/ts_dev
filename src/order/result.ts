// result.ts
/** エラーの種類 */
export enum OrderErrorType {
  ADDRESS_NOT_EXIST = "ADDRESS_NOT_EXIST",
  NO_ORDER_LINES = "NO_ORDER_LINES",
  // 必要に応じて追加
}

/** エラーの詳細情報 */
export interface OrderError {
  type: OrderErrorType;
  message: string;
}
