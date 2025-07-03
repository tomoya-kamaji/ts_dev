import { ResultAsync, okAsync, errAsync } from 'neverthrow';
import { OrderProcessingState, OrderError, Address } from '../model/state';

// 配送料計算サービスのインターface
export interface ShippingService {
  calculateShippingCost(address: Address, weight: number, volume: number): ResultAsync<number, Error>;
}

// 商品情報を取得するリポジトリ
export interface ProductRepository {
  getProductDetails(productId: string): ResultAsync<ProductDetails | null, Error>;
}

// 商品詳細情報
export interface ProductDetails {
  id: string;
  name: string;
  weight: number; // グラム
  dimensions: {
    length: number;
    width: number;
    height: number;
  }; // cm
}

// 配送料計算サービス
export const calculateShipping = (deps: { 
  shippingService: ShippingService;
  productRepo: ProductRepository;
}) => 
  (validated: Extract<OrderProcessingState, { kind: 'ValidatedCart' }>): ResultAsync<Extract<OrderProcessingState, { kind: 'CalculatedShipping' }>, OrderError> => {
    
    // 各商品の詳細情報を取得
    const getProductDetails = (productId: string) => 
      deps.productRepo.getProductDetails(productId)
        .mapErr((): OrderError => ({ type: 'UnknownError', message: `Failed to fetch product details for ${productId}` }))
        .andThen((product) => {
          if (!product) {
            return errAsync<ProductDetails, OrderError>({ 
              type: 'InvalidCart', 
              reason: `Product ${productId} not found` 
            });
          }
          return okAsync(product);
        });

    // 全商品の詳細情報を並列取得
    const productDetailsPromises = validated.cartItems.map(item => 
      getProductDetails(item.productId)
    );

    return ResultAsync.combine(productDetailsPromises)
      .andThen((productDetails) => {
        // 総重量と総体積を計算
        let totalWeight = 0;
        let totalVolume = 0;

        validated.cartItems.forEach((item, index) => {
          const product = productDetails[index];
          const itemWeight = product.weight * item.quantity;
          const itemVolume = (product.dimensions.length * product.dimensions.width * product.dimensions.height) * item.quantity;
          
          totalWeight += itemWeight;
          totalVolume += itemVolume;
        });

        // 配送料を計算
        return deps.shippingService.calculateShippingCost(
          validated.shippingAddress,
          totalWeight,
          totalVolume
        )
        .mapErr((): OrderError => ({ 
          type: 'ShippingCalculationFailed', 
          reason: 'Failed to calculate shipping cost' 
        }))
        .map((shippingCost) => ({
          kind: 'CalculatedShipping' as const,
          userId: validated.userId,
          cartItems: validated.cartItems,
          shippingAddress: validated.shippingAddress,
          paymentMethod: validated.paymentMethod,
          subtotal: validated.subtotal,
          shippingCost,
          totalAmount: validated.subtotal + shippingCost
        }));
      });
  };