import { ResultAsync, okAsync, errAsync } from 'neverthrow';
import { OrderProcessingState, OrderError, PaymentMethod } from '../model/state';
import { ulid } from 'ulid';

// 決済サービスのインターface
export interface PaymentService {
  processPayment(
    amount: number,
    paymentMethod: PaymentMethod,
    orderId: string
  ): ResultAsync<PaymentResult, PaymentError>;
}

// 注文リポジトリ
export interface OrderRepository {
  create(order: OrderCreateRequest): ResultAsync<string, Error>; // 注文IDを返す
}

// 決済結果
export interface PaymentResult {
  paymentId: string;
  status: 'success' | 'pending' | 'failed';
  transactionId?: string;
}

// 決済エラー
export interface PaymentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 注文作成リクエスト
export interface OrderCreateRequest {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: 'pending_payment' | 'paid' | 'failed';
}

// 決済処理サービス
export const processPayment = (deps: {
  paymentService: PaymentService;
  orderRepo: OrderRepository;
}) => 
  (calculated: Extract<OrderProcessingState, { kind: 'CalculatedShipping' }>): ResultAsync<Extract<OrderProcessingState, { kind: 'ProcessedPayment' }>, OrderError> => {
    
    // 注文IDを生成
    const orderId = ulid();
    
    // 注文をデータベースに作成（決済前の状態で）
    const orderCreateRequest: OrderCreateRequest = {
      id: orderId,
      userId: calculated.userId,
      items: calculated.cartItems,
      shippingAddress: calculated.shippingAddress,
      subtotal: calculated.subtotal,
      shippingCost: calculated.shippingCost,
      totalAmount: calculated.totalAmount,
      paymentMethod: calculated.paymentMethod,
      status: 'pending_payment'
    };

    return deps.orderRepo.create(orderCreateRequest)
      .mapErr((): OrderError => ({ 
        type: 'UnknownError', 
        message: 'Failed to create order record' 
      }))
      .andThen(() => {
        // 決済処理を実行
        return deps.paymentService.processPayment(
          calculated.totalAmount,
          calculated.paymentMethod,
          orderId
        )
        .mapErr((paymentError: PaymentError): OrderError => ({
          type: 'PaymentFailed',
          reason: `Payment failed: ${paymentError.message}`,
          paymentId: undefined
        }))
        .andThen((paymentResult) => {
          // 決済が成功した場合のみ次の状態に遷移
          if (paymentResult.status === 'success') {
            return okAsync({
              kind: 'ProcessedPayment' as const,
              userId: calculated.userId,
              orderId,
              cartItems: calculated.cartItems,
              shippingAddress: calculated.shippingAddress,
              paymentId: paymentResult.paymentId,
              totalAmount: calculated.totalAmount
            });
          } else {
            return errAsync<Extract<OrderProcessingState, { kind: 'ProcessedPayment' }>, OrderError>({
              type: 'PaymentFailed',
              reason: `Payment status: ${paymentResult.status}`,
              paymentId: paymentResult.paymentId
            });
          }
        });
      });
  };