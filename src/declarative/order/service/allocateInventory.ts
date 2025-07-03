import { ResultAsync, errAsync } from 'neverthrow';
import { OrderProcessingState, OrderError, AllocatedItem } from '../model/state';

// 在庫管理サービスのインターface
export interface InventoryService {
  checkAvailability(productId: string, quantity: number): ResultAsync<boolean, Error>;
  allocateStock(productId: string, quantity: number): ResultAsync<InventoryAllocation, Error>;
}

// 倉庫情報サービス
export interface WarehouseService {
  findOptimalWarehouse(productId: string, quantity: number): ResultAsync<string, Error>;
}

// 在庫割り当て結果
export interface InventoryAllocation {
  productId: string;
  quantity: number;
  warehouseId: string;
  reservationId: string;
  expiresAt: Date;
}

// 在庫割り当てサービス
export const allocateInventory = (deps: {
  inventoryService: InventoryService;
  warehouseService: WarehouseService;
}) => 
  (processed: Extract<OrderProcessingState, { kind: 'ProcessedPayment' }>): ResultAsync<Extract<OrderProcessingState, { kind: 'AllocatedInventory' }>, OrderError> => {
    
    // 各商品の在庫を確認・割り当て
    const allocateItemStock = (item: { productId: string; quantity: number }) => {
      return deps.inventoryService.checkAvailability(item.productId, item.quantity)
        .mapErr((): OrderError => ({ 
          type: 'UnknownError', 
          message: `Failed to check availability for product ${item.productId}` 
        }))
        .andThen((isAvailable) => {
          if (!isAvailable) {
            // 利用可能な在庫数を取得して詳細なエラーを返す
            return errAsync<InventoryAllocation, OrderError>({
              type: 'InsufficientInventory',
              productId: item.productId,
              requested: item.quantity,
              available: 0 // 実際の実装では利用可能数を取得
            });
          }
          
          // 最適な倉庫を選択
          return deps.warehouseService.findOptimalWarehouse(item.productId, item.quantity)
            .mapErr((): OrderError => ({ 
              type: 'UnknownError', 
              message: `Failed to find warehouse for product ${item.productId}` 
            }))
            .andThen((warehouseId) => {
              // 在庫を割り当て
              return deps.inventoryService.allocateStock(item.productId, item.quantity)
                .mapErr((): OrderError => ({ 
                  type: 'InsufficientInventory',
                  productId: item.productId,
                  requested: item.quantity,
                  available: 0 // 実際の実装では利用可能数を取得
                }))
                .map((allocation) => ({
                  ...allocation,
                  warehouseId
                }));
            });
        });
    };

    // 全商品の在庫を並列で割り当て
    const allocationPromises = processed.cartItems.map(item => 
      allocateItemStock(item)
    );

    return ResultAsync.combine(allocationPromises)
      .map((allocations) => {
        // AllocatedItem形式に変換
        const allocatedItems: AllocatedItem[] = allocations.map(allocation => ({
          productId: allocation.productId,
          quantity: allocation.quantity,
          warehouseId: allocation.warehouseId
        }));

        return {
          kind: 'AllocatedInventory' as const,
          userId: processed.userId,
          orderId: processed.orderId,
          cartItems: processed.cartItems,
          shippingAddress: processed.shippingAddress,
          paymentId: processed.paymentId,
          totalAmount: processed.totalAmount,
          allocatedItems
        };
      });
  };