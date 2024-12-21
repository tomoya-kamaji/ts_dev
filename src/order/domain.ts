// domain.ts

/** 注文明細行 */
export interface OrderLine {
  id: string;
  price: number;
}

/** 共通部分 (ベース) */
interface BaseOrder {
  id: string;
  shippingAddress: string;
  orderLines: OrderLine[];
}

/** 未検証 (Unverified) */
export interface UnverifiedOrder extends BaseOrder {
  kind: "Unverified";
}

/** 検証済み (Verified) */
export interface VerifiedOrder extends BaseOrder {
  kind: "Verified";
}

/** 計算済み (Calculated) */
export interface CalculatedOrder extends BaseOrder {
  kind: "Calculated";
  totalPrice: number;
}

/** 判別用ユニオン型 */
export type Order = UnverifiedOrder | VerifiedOrder | CalculatedOrder;
