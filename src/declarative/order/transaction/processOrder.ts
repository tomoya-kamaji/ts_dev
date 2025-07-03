import { ResultAsync, okAsync } from "neverthrow";
import { OrderProcessingState, OrderError } from "../model/state";
import { validateCart, CartRepository } from "../service/validateCart";
import {
  calculateShipping,
  ShippingService,
  ProductRepository,
} from "../service/calculateShipping";
import {
  processPayment,
  PaymentService,
  OrderRepository,
} from "../service/processPayment";
import {
  allocateInventory,
  InventoryService,
  WarehouseService,
} from "../service/allocateInventory";
import {
  completeOrder,
  OrderUpdateRepository,
  NotificationService,
} from "../service/completeOrder";

// 注文処理に必要な全依存関係をまとめたインターface
export interface OrderProcessingDependencies {
  cartRepo: CartRepository;
  shippingService: ShippingService;
  productRepo: ProductRepository;
  paymentService: PaymentService;
  orderRepo: OrderRepository;
  inventoryService: InventoryService;
  warehouseService: WarehouseService;
  orderUpdateRepo: OrderUpdateRepository;
  notificationService: NotificationService;
}

// 注文処理の完全なワークフロー
export const processOrder =
  (deps: OrderProcessingDependencies) =>
  (
    input: Extract<OrderProcessingState, { kind: "Input" }>
  ): ResultAsync<
    Extract<OrderProcessingState, { kind: "Completed" }>,
    OrderError
  > => {
    // 各サービス関数をカリー化して依存関係を注入
    const validateCartFn = validateCart({
      cartRepo: deps.cartRepo,
    });

    const calculateShippingFn = calculateShipping({
      shippingService: deps.shippingService,
      productRepo: deps.productRepo,
    });

    const processPaymentFn = processPayment({
      paymentService: deps.paymentService,
      orderRepo: deps.orderRepo,
    });

    const allocateInventoryFn = allocateInventory({
      inventoryService: deps.inventoryService,
      warehouseService: deps.warehouseService,
    });

    const completeOrderFn = completeOrder({
      shippingService: deps.shippingService,
      orderUpdateRepo: deps.orderUpdateRepo,
      notificationService: deps.notificationService,
    });

    // 関数合成による状態遷移の実行
    return okAsync(input)
      .andThen(validateCartFn)
      .andThen(calculateShippingFn)
      .andThen(processPaymentFn)
      .andThen(allocateInventoryFn)
      .andThen(completeOrderFn);
  };

// 注文処理のエラーハンドリング付きバージョン
export const processOrderWithFallback =
  (deps: OrderProcessingDependencies) =>
  (
    input: Extract<OrderProcessingState, { kind: "Input" }>
  ): ResultAsync<OrderProcessingState, never> => {
    return processOrder(deps)(input)
      .mapErr(
        (error): Extract<OrderProcessingState, { kind: "Failed" }> => ({
          kind: "Failed",
          userId: input.userId,
          orderId: undefined, // 注文ID生成前にエラーが発生した場合
          error,
          failedAt: new Date(),
        })
      )
      .map((completed): OrderProcessingState => completed)
      .orElse((failed) => okAsync(failed));
  };

// 注文処理の進捗監視用関数
export const processOrderWithProgress =
  (
    deps: OrderProcessingDependencies,
    onProgress?: (state: OrderProcessingState) => void
  ) =>
  (
    input: Extract<OrderProcessingState, { kind: "Input" }>
  ): ResultAsync<OrderProcessingState, never> => {
    const withProgress = <T extends OrderProcessingState>(
      result: ResultAsync<T, OrderError>
    ): ResultAsync<T, OrderError> => {
      return result.map((state) => {
        onProgress?.(state);
        return state;
      });
    };

    const validateCartFn = validateCart({ cartRepo: deps.cartRepo });
    const calculateShippingFn = calculateShipping({
      shippingService: deps.shippingService,
      productRepo: deps.productRepo,
    });
    const processPaymentFn = processPayment({
      paymentService: deps.paymentService,
      orderRepo: deps.orderRepo,
    });
    const allocateInventoryFn = allocateInventory({
      inventoryService: deps.inventoryService,
      warehouseService: deps.warehouseService,
    });
    const completeOrderFn = completeOrder({
      shippingService: deps.shippingService,
      orderUpdateRepo: deps.orderUpdateRepo,
      notificationService: deps.notificationService,
    });

    return okAsync(input)
      .andThen((state) => {
        onProgress?.(state);
        return okAsync(state);
      })
      .andThen(validateCartFn)
      .andThen(withProgress)
      .andThen(calculateShippingFn)
      .andThen(withProgress)
      .andThen(processPaymentFn)
      .andThen(withProgress)
      .andThen(allocateInventoryFn)
      .andThen(withProgress)
      .andThen(completeOrderFn)
      .andThen(withProgress)
      .mapErr(
        (error): Extract<OrderProcessingState, { kind: "Failed" }> => ({
          kind: "Failed",
          userId: input.userId,
          orderId: undefined,
          error,
          failedAt: new Date(),
        })
      )
      .map((completed): OrderProcessingState => completed)
      .orElse((failed) => {
        onProgress?.(failed);
        return okAsync(failed);
      });
  };
