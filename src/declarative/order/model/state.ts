// カート内の商品アイテム
export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

// 配送先住所
export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// 支払い方法
export interface PaymentMethod {
  type: 'credit_card' | 'paypal' | 'bank_transfer';
  details: Record<string, unknown>;
}

// 在庫割り当て済みアイテム
export interface AllocatedItem {
  productId: string;
  quantity: number;
  warehouseId: string;
}

// 注文処理の状態遷移を表現する判別共用体
export type OrderProcessingState = 
  | { 
      kind: 'Input'; // 初期入力状態
      userId: string; 
      cartId: string; 
      paymentMethod: PaymentMethod;
    }
  | { 
      kind: 'ValidatedCart'; // カート検証完了状態
      userId: string; 
      cartItems: CartItem[]; 
      shippingAddress: Address; 
      paymentMethod: PaymentMethod;
      subtotal: number;
    }
  | { 
      kind: 'CalculatedShipping'; // 配送料計算完了状態
      userId: string; 
      cartItems: CartItem[]; 
      shippingAddress: Address; 
      paymentMethod: PaymentMethod;
      subtotal: number;
      shippingCost: number;
      totalAmount: number;
    }
  | { 
      kind: 'ProcessedPayment'; // 決済処理完了状態
      userId: string; 
      orderId: string; 
      cartItems: CartItem[]; 
      shippingAddress: Address;
      paymentId: string;
      totalAmount: number;
    }
  | { 
      kind: 'AllocatedInventory'; // 在庫割り当て完了状態
      userId: string; 
      orderId: string; 
      cartItems: CartItem[]; 
      shippingAddress: Address;
      paymentId: string;
      totalAmount: number;
      allocatedItems: AllocatedItem[];
    }
  | { 
      kind: 'Completed'; // 注文完了状態
      userId: string; 
      orderId: string; 
      totalAmount: number;
      estimatedDelivery: Date;
      trackingNumber: string;
    }
  | {
      kind: 'Failed'; // 注文失敗状態
      userId: string;
      orderId?: string;
      error: OrderError;
      failedAt: Date;
    };

// 注文処理で発生する可能性のあるエラー型
export type OrderError = 
  | { type: 'CartNotFound'; cartId: string } // カートが見つからない
  | { type: 'InvalidCart'; reason: string } // カートが無効
  | { type: 'PaymentFailed'; reason: string; paymentId?: string } // 決済失敗
  | { type: 'InsufficientInventory'; productId: string; requested: number; available: number } // 在庫不足
  | { type: 'ShippingCalculationFailed'; reason: string } // 配送料計算失敗
  | { type: 'UnknownError'; message: string }; // 予期しないエラー