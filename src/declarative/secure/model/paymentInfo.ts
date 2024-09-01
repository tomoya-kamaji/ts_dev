export interface PaymentInfoRepository {
  get(userID: string): Promise<PaymentInfo>;
}

// 決済情報の型
export type PaymentInfo = {
  method: string;
  transactionId: string;
};
