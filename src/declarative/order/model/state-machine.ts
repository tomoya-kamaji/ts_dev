import { ResultAsync } from 'neverthrow';
import { OrderProcessingState, OrderError } from './state';

// 状態遷移関数の型定義

// 入力からカート検証への遷移
export type ValidateCartFn = (
  input: Extract<OrderProcessingState, { kind: 'Input' }>
) => ResultAsync<Extract<OrderProcessingState, { kind: 'ValidatedCart' }>, OrderError>;

// カート検証から配送料計算への遷移
export type CalculateShippingFn = (
  validated: Extract<OrderProcessingState, { kind: 'ValidatedCart' }>
) => ResultAsync<Extract<OrderProcessingState, { kind: 'CalculatedShipping' }>, OrderError>;

// 配送料計算から決済処理への遷移
export type ProcessPaymentFn = (
  calculated: Extract<OrderProcessingState, { kind: 'CalculatedShipping' }>
) => ResultAsync<Extract<OrderProcessingState, { kind: 'ProcessedPayment' }>, OrderError>;

// 決済処理から在庫割り当てへの遷移
export type AllocateInventoryFn = (
  processed: Extract<OrderProcessingState, { kind: 'ProcessedPayment' }>
) => ResultAsync<Extract<OrderProcessingState, { kind: 'AllocatedInventory' }>, OrderError>;

// 在庫割り当てから注文完了への遷移
export type CompleteOrderFn = (
  allocated: Extract<OrderProcessingState, { kind: 'AllocatedInventory' }>
) => ResultAsync<Extract<OrderProcessingState, { kind: 'Completed' }>, OrderError>;

// 失敗状態への遷移（任意の状態から）
export type FailOrderFn = (
  state: OrderProcessingState,
  error: OrderError
) => Extract<OrderProcessingState, { kind: 'Failed' }>;

// 状態遷移マシンの定義
export interface OrderStateMachine {
  validateCart: ValidateCartFn;
  calculateShipping: CalculateShippingFn;
  processPayment: ProcessPaymentFn;
  allocateInventory: AllocateInventoryFn;
  completeOrder: CompleteOrderFn;
  failOrder: FailOrderFn;
}

// 状態遷移パターンの検証用ヘルパー関数
export const isValidTransition = (
  from: OrderProcessingState['kind'],
  to: OrderProcessingState['kind']
): boolean => {
  const validTransitions: Record<OrderProcessingState['kind'], OrderProcessingState['kind'][]> = {
    'Input': ['ValidatedCart', 'Failed'],
    'ValidatedCart': ['CalculatedShipping', 'Failed'],
    'CalculatedShipping': ['ProcessedPayment', 'Failed'],
    'ProcessedPayment': ['AllocatedInventory', 'Failed'],
    'AllocatedInventory': ['Completed', 'Failed'],
    'Completed': [], // 終了状態
    'Failed': [] // 終了状態
  };

  return validTransitions[from].includes(to);
};

// 状態の進行度を取得する関数
export const getStateProgress = (state: OrderProcessingState): number => {
  const progressMap: Record<OrderProcessingState['kind'], number> = {
    'Input': 0,
    'ValidatedCart': 20,
    'CalculatedShipping': 40,
    'ProcessedPayment': 60,
    'AllocatedInventory': 80,
    'Completed': 100,
    'Failed': -1
  };

  return progressMap[state.kind];
};