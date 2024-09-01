import { PaymentInfo } from "./paymentInfo";

// タスク実行のInput
export type Input = {
  kind: "Input";
  userID: string;
  price: Price;
};

// DBから必要情報を取得した状態
export type InputCommand = {
  kind: "InputCommand";
  price: Price;
  paymentInfo: PaymentInfo;
};

// 決済情報
type Charge =
  | ThreeDSecureChallengedCharge // 3Dセキュア検証前
  | ThreeDSecureCheckedValidCharge // 検証した結果、有効だった決済情報
  | ThreeDSecureCheckedInvalidCharge // 検証した結果、無効だった決済情報
  | CapturedCharge // キャプチャ済みの決済情報
  | RefundedCharge; // 返金済みの決済情報

// 3Dセキュアで検証するChargeを作成した状態
export type ChallengedThreeDSecure = {
  kind: "ChallengedThreeDSecure";
  charge: ThreeDSecureChallengedCharge;
};

// 3Dセキュアで検証した結果、有効な決済だと判断された状態
export type CheckedThreeDSecureValid = {
  kind: "CheckedThreeDSecureValid";
  charge: ThreeDSecureCheckedValidCharge;
};

// 3Dセキュアで検証した結果、無効な決済だと判断された状態
export type CheckedThreeDSecureInvalid = {
  kind: "CheckedThreeDSecureInvalid";
  charge: ThreeDSecureCheckedInvalidCharge;
};

// 3Dセキュアで検証した決済をキャプチャした状態
export type Captured = {
  kind: "Captured";
  charge: CapturedCharge;
};

// 返金済みの状態
export type Refunded = {
  kind: "Refunded";
  charge: RefundedCharge;
};

// 価格情報の型
export type Price = {
  amount: number;
  currency: string;
};

// 3Dセキュア検証前の決済情報
export type ThreeDSecureChallengedCharge = {
  // ... 具体的なプロパティを定義 ...
};

// 検証した結果、有効だった決済情報
export type ThreeDSecureCheckedValidCharge = {
  // ... 具体的なプロパティを定義 ...
};

// 検証した結果、無効だった決済情報
export type ThreeDSecureCheckedInvalidCharge = {
  // ... 具体的なプロパティを定義 ...
};

// キャプチャ済みの決済情報
export type CapturedCharge = {
  // ... 具体的なプロパティを定義 ...
};

// 返金済みの決済情報
export type RefundedCharge = {
  // ... 具体的なプロパティを定義 ...
};
