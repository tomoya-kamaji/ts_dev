import { ResultAsync, okAsync } from "neverthrow";
import { OrderProcessingState, OrderError } from "../model/state";
import { ulid } from "ulid";

// 配送サービスのインターface
export interface ShippingService {
  createShipment(request: ShipmentRequest): ResultAsync<ShipmentResult, Error>;
}

// 注文更新リポジトリ
export interface OrderUpdateRepository {
  updateOrderStatus(
    orderId: string,
    status: "completed",
    metadata: OrderCompletionMetadata
  ): ResultAsync<void, Error>;
}

// 通知サービス
export interface NotificationService {
  sendOrderCompletionNotification(
    userId: string,
    orderId: string,
    trackingNumber: string
  ): ResultAsync<void, Error>;
}

// 配送リクエスト
export interface ShipmentRequest {
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    warehouseId: string;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totalAmount: number;
}

// 配送結果
export interface ShipmentResult {
  shipmentId: string;
  trackingNumber: string;
  estimatedDelivery: Date;
  carrier: string;
}

// 注文完了メタデータ
export interface OrderCompletionMetadata {
  trackingNumber: string;
  estimatedDelivery: Date;
  shipmentId: string;
  completedAt: Date;
}

// 注文完了サービス
export const completeOrder =
  (deps: {
    shippingService: ShippingService;
    orderUpdateRepo: OrderUpdateRepository;
    notificationService: NotificationService;
  }) =>
  (
    allocated: Extract<OrderProcessingState, { kind: "AllocatedInventory" }>
  ): ResultAsync<
    Extract<OrderProcessingState, { kind: "Completed" }>,
    OrderError
  > => {
    // 配送リクエストを作成
    const shipmentRequest: ShipmentRequest = {
      orderId: allocated.orderId,
      items: allocated.cartItems.map((item) => {
        const allocatedItem = allocated.allocatedItems.find(
          (alloc) => alloc.productId === item.productId
        );
        return {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          warehouseId: allocatedItem?.warehouseId || "default",
        };
      }),
      shippingAddress: allocated.shippingAddress,
      totalAmount: allocated.totalAmount,
    };

    // 配送手配を実行
    return deps.shippingService
      .createShipment(shipmentRequest)
      .mapErr(
        (): OrderError => ({
          type: "UnknownError",
          message: "Failed to create shipment",
        })
      )
      .andThen((shipmentResult) => {
        // 注文ステータスを更新
        const completionMetadata: OrderCompletionMetadata = {
          trackingNumber: shipmentResult.trackingNumber,
          estimatedDelivery: shipmentResult.estimatedDelivery,
          shipmentId: shipmentResult.shipmentId,
          completedAt: new Date(),
        };

        return deps.orderUpdateRepo
          .updateOrderStatus(allocated.orderId, "completed", completionMetadata)
          .mapErr(
            (): OrderError => ({
              type: "UnknownError",
              message: "Failed to update order status",
            })
          )
          .map(() => ({ shipmentResult, completionMetadata }));
      })
      .andThen(({ shipmentResult }) => {
        // 顧客に完了通知を送信
        return deps.notificationService
          .sendOrderCompletionNotification(
            allocated.userId,
            allocated.orderId,
            shipmentResult.trackingNumber
          )
          .mapErr(
            (): OrderError => ({
              type: "UnknownError",
              message: "Failed to send completion notification",
            })
          )
          .map(() => shipmentResult);
      })
      .map((shipmentResult) => ({
        kind: "Completed" as const,
        userId: allocated.userId,
        orderId: allocated.orderId,
        totalAmount: allocated.totalAmount,
        estimatedDelivery: shipmentResult.estimatedDelivery,
        trackingNumber: shipmentResult.trackingNumber,
      }));
  };
