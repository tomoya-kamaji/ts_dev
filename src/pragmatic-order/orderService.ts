import { Result, ok, err } from 'neverthrow';

// 基本的な型定義（最小限）
export interface OrderInput {
  userId: string;
  cartId: string;
  paymentMethod: {
    type: 'credit_card' | 'paypal';
    token: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

// サービス層のエラー型（シンプルに）
export type OrderError = 
  | { type: 'CART_NOT_FOUND' }
  | { type: 'PAYMENT_FAILED'; reason: string }
  | { type: 'INSUFFICIENT_STOCK'; productId: string }
  | { type: 'UNKNOWN_ERROR'; message: string };

// 実用的なサービス層実装
export class OrderService {
  constructor(
    private cartRepo: CartRepository,
    private paymentService: PaymentService,
    private inventoryService: InventoryService,
    private orderRepo: OrderRepository
  ) {}

  // メインの注文処理 - 関数型の要素を適度に取り入れ
  async processOrder(input: OrderInput): Promise<Result<Order, OrderError>> {
    // 1. カート検証 - Result型を使って明示的なエラーハンドリング
    const cartResult = await this.validateCart(input.cartId, input.userId);
    if (cartResult.isErr()) return err(cartResult.error);

    const cart = cartResult.value;

    // 2. 在庫チェック - 従来のtry/catchと混在でも良い
    try {
      const stockCheck = await this.checkStock(cart.items);
      if (!stockCheck.isValid) {
        return err({ 
          type: 'INSUFFICIENT_STOCK', 
          productId: stockCheck.failedProductId! 
        });
      }
    } catch (error) {
      return err({ type: 'UNKNOWN_ERROR', message: 'Stock check failed' });
    }

    // 3. 注文作成
    const order = await this.createOrder(cart, input.userId);

    // 4. 決済処理 - Result型でエラーを明示的に扱う
    const paymentResult = await this.processPayment(order, input.paymentMethod);
    if (paymentResult.isErr()) {
      await this.markOrderAsFailed(order.id);
      return err(paymentResult.error);
    }

    // 5. 在庫確保と注文完了
    await this.reserveInventory(cart.items);
    await this.completeOrder(order.id);

    return ok({ ...order, status: 'completed' as const });
  }

  // 個別メソッド - 必要に応じてResult型を使用
  private async validateCart(cartId: string, userId: string): Promise<Result<Cart, OrderError>> {
    const cart = await this.cartRepo.findById(cartId);
    
    if (!cart) {
      return err({ type: 'CART_NOT_FOUND' });
    }
    
    if (cart.userId !== userId) {
      return err({ type: 'CART_NOT_FOUND' }); // セキュリティ上同じエラー
    }

    return ok(cart);
  }

  private async processPayment(
    order: Order, 
    paymentMethod: OrderInput['paymentMethod']
  ): Promise<Result<PaymentResult, OrderError>> {
    try {
      const result = await this.paymentService.charge({
        amount: order.total,
        paymentMethod,
        orderId: order.id
      });

      if (result.status === 'failed') {
        return err({ 
          type: 'PAYMENT_FAILED', 
          reason: result.failureReason || 'Unknown payment error' 
        });
      }

      return ok(result);
    } catch (error) {
      return err({ 
        type: 'PAYMENT_FAILED', 
        reason: error instanceof Error ? error.message : 'Payment service error' 
      });
    }
  }

  // シンプルなヘルパーメソッド - 従来通りでOK
  private async checkStock(items: OrderItem[]) {
    for (const item of items) {
      const available = await this.inventoryService.getAvailableStock(item.productId);
      if (available < item.quantity) {
        return { isValid: false, failedProductId: item.productId };
      }
    }
    return { isValid: true };
  }

  private async createOrder(cart: Cart, userId: string): Promise<Order> {
    const order: Order = {
      id: generateId(),
      userId,
      items: cart.items,
      total: cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      createdAt: new Date()
    };
    
    await this.orderRepo.save(order);
    return order;
  }

  private async reserveInventory(items: OrderItem[]): Promise<void> {
    // 実装は従来通り
    for (const item of items) {
      await this.inventoryService.reserve(item.productId, item.quantity);
    }
  }

  private async completeOrder(orderId: string): Promise<void> {
    await this.orderRepo.updateStatus(orderId, 'completed');
  }

  private async markOrderAsFailed(orderId: string): Promise<void> {
    await this.orderRepo.updateStatus(orderId, 'failed');
  }
}

// 使用例
export class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req: Request, res: Response) {
    const orderInput: OrderInput = req.body;
    
    const result = await this.orderService.processOrder(orderInput);
    
    // Result型を使った明確なエラーハンドリング
    if (result.isErr()) {
      const error = result.error;
      
      switch (error.type) {
        case 'CART_NOT_FOUND':
          return res.status(400).json({ error: 'Cart not found' });
        case 'PAYMENT_FAILED':
          return res.status(402).json({ error: 'Payment failed', reason: error.reason });
        case 'INSUFFICIENT_STOCK':
          return res.status(409).json({ error: 'Insufficient stock', productId: error.productId });
        default:
          return res.status(500).json({ error: 'Internal server error' });
      }
    }
    
    return res.status(201).json(result.value);
  }
}

// 必要な型定義（最小限）
interface Cart {
  id: string;
  userId: string;
  items: OrderItem[];
}

interface PaymentResult {
  id: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

interface CartRepository {
  findById(id: string): Promise<Cart | null>;
}

interface PaymentService {
  charge(params: { amount: number; paymentMethod: any; orderId: string }): Promise<PaymentResult>;
}

interface InventoryService {
  getAvailableStock(productId: string): Promise<number>;
  reserve(productId: string, quantity: number): Promise<void>;
}

interface OrderRepository {
  save(order: Order): Promise<void>;
  updateStatus(orderId: string, status: Order['status']): Promise<void>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2);
}