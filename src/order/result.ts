// result.ts

/** 成功/失敗を表す共通型 (Either型に近い構造) */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** エラーの種類 */
export enum OrderErrorType {
  ADDRESS_NOT_EXIST = 'ADDRESS_NOT_EXIST',
  NO_ORDER_LINES = 'NO_ORDER_LINES',
  // 必要に応じて追加
}

/** エラーの詳細情報 */
export interface OrderError {
  type: OrderErrorType;
  message: string;
}
