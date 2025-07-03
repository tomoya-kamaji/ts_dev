import { okAsync, errAsync } from 'neverthrow';
import { processOrder, processOrderWithFallback, OrderProcessingDependencies } from './processOrder';
import { OrderProcessingState, OrderError, PaymentMethod } from '../model/state';

// テスト用のモックデータ
const mockPaymentMethod: PaymentMethod = {
  type: 'credit_card',
  details: { cardNumber: '****1234' }
};

const mockInput: Extract<OrderProcessingState, { kind: 'Input' }> = {
  kind: 'Input',
  userId: 'user123',
  cartId: 'cart456',
  paymentMethod: mockPaymentMethod
};

// テスト用のモック依存関係
const createMockDependencies = (): OrderProcessingDependencies => ({
  cartRepo: {
    findById: jest.fn().mockReturnValue(okAsync({
      id: 'cart456',
      userId: 'user123',
      items: [
        { productId: 'prod1', productName: 'Product 1', price: 1000, quantity: 2 },
        { productId: 'prod2', productName: 'Product 2', price: 2000, quantity: 1 }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    })),
    getUserShippingAddress: jest.fn().mockReturnValue(okAsync({
      street: '123 Main St',
      city: 'Tokyo',
      postalCode: '100-0001',
      country: 'JP'
    }))
  },
  shippingService: {
    calculateShippingCost: jest.fn().mockReturnValue(okAsync(500))
  },
  productRepo: {
    getProductDetails: jest.fn().mockReturnValue(okAsync({
      id: 'prod1',
      name: 'Product 1',
      weight: 100,
      dimensions: { length: 10, width: 10, height: 5 }
    }))
  },
  paymentService: {
    processPayment: jest.fn().mockReturnValue(okAsync({
      paymentId: 'payment123',
      status: 'success' as const,
      transactionId: 'tx456'
    }))
  },
  orderRepo: {
    create: jest.fn().mockReturnValue(okAsync('order789'))
  },
  inventoryService: {
    checkAvailability: jest.fn().mockReturnValue(okAsync(true)),
    allocateStock: jest.fn().mockReturnValue(okAsync({
      productId: 'prod1',
      quantity: 2,
      warehouseId: 'wh1',
      reservationId: 'res123',
      expiresAt: new Date(Date.now() + 3600000)
    }))
  },
  warehouseService: {
    findOptimalWarehouse: jest.fn().mockReturnValue(okAsync('wh1'))
  },
  orderUpdateRepo: {
    updateOrderStatus: jest.fn().mockReturnValue(okAsync(undefined))
  },
  notificationService: {
    sendOrderCompletionNotification: jest.fn().mockReturnValue(okAsync(undefined))
  }
});

// 修正されたShippingServiceモック
const createMockShippingService = () => ({
  calculateShippingCost: jest.fn().mockReturnValue(okAsync(500)),
  createShipment: jest.fn().mockReturnValue(okAsync({
    shipmentId: 'ship123',
    trackingNumber: 'TRK456789',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 3600000),
    carrier: 'Express Delivery'
  }))
});

describe('processOrder', () => {
  describe('成功ケース', () => {
    it('正常な注文処理フローを完了する', async () => {
      const deps = createMockDependencies();
      deps.shippingService = createMockShippingService();
      
      const result = await processOrder(deps)(mockInput);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const completedOrder = result.value;
        expect(completedOrder.kind).toBe('Completed');
        expect(completedOrder.userId).toBe('user123');
        expect(completedOrder.trackingNumber).toBe('TRK456789');
      }
    });

    it('各サービスが正しい順序で呼び出される', async () => {
      const deps = createMockDependencies();
      deps.shippingService = createMockShippingService();
      
      await processOrder(deps)(mockInput);
      
      expect(deps.cartRepo.findById).toHaveBeenCalledWith('cart456');
      expect(deps.paymentService.processPayment).toHaveBeenCalled();
      expect(deps.inventoryService.allocateStock).toHaveBeenCalled();
      expect(deps.orderUpdateRepo.updateOrderStatus).toHaveBeenCalled();
    });
  });

  describe('エラーケース', () => {
    it('カートが見つからない場合はエラーを返す', async () => {
      const deps = createMockDependencies();
      deps.cartRepo.findById = jest.fn().mockReturnValue(okAsync(null));
      
      const result = await processOrder(deps)(mockInput);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('CartNotFound');
      }
    });

    it('決済が失敗した場合はエラーを返す', async () => {
      const deps = createMockDependencies();
      deps.shippingService = createMockShippingService();
      deps.paymentService.processPayment = jest.fn().mockReturnValue(errAsync({
        code: 'PAYMENT_DECLINED',
        message: 'Card declined'
      }));
      
      const result = await processOrder(deps)(mockInput);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('PaymentFailed');
      }
    });

    it('在庫不足の場合はエラーを返す', async () => {
      const deps = createMockDependencies();
      deps.shippingService = createMockShippingService();
      deps.inventoryService.checkAvailability = jest.fn().mockReturnValue(okAsync(false));
      
      const result = await processOrder(deps)(mockInput);
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('InsufficientInventory');
      }
    });
  });
});

describe('processOrderWithFallback', () => {
  it('エラーが発生した場合でもFailed状態を返す', async () => {
    const deps = createMockDependencies();
    deps.cartRepo.findById = jest.fn().mockReturnValue(okAsync(null));
    
    const result = await processOrderWithFallback(deps)(mockInput);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const failedOrder = result.value;
      expect(failedOrder.kind).toBe('Failed');
      expect(failedOrder.userId).toBe('user123');
      if (failedOrder.kind === 'Failed') {
        expect(failedOrder.error.type).toBe('CartNotFound');
      }
    }
  });

  it('成功した場合はCompleted状態を返す', async () => {
    const deps = createMockDependencies();
    deps.shippingService = createMockShippingService();
    
    const result = await processOrderWithFallback(deps)(mockInput);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const completedOrder = result.value;
      expect(completedOrder.kind).toBe('Completed');
    }
  });
});

describe('テーブル駆動テスト', () => {
  interface TestCase {
    name: string;
    setup: (deps: OrderProcessingDependencies) => void;
    expectedResult: 'success' | 'error';
    expectedErrorType?: OrderError['type'];
  }

  const testCases: TestCase[] = [
    {
      name: '正常フロー',
      setup: (deps) => {
        deps.shippingService = createMockShippingService();
      },
      expectedResult: 'success'
    },
    {
      name: 'カートが存在しない',
      setup: (deps) => {
        deps.cartRepo.findById = jest.fn().mockReturnValue(okAsync(null));
      },
      expectedResult: 'error',
      expectedErrorType: 'CartNotFound'
    },
    {
      name: '配送先住所が未設定',
      setup: (deps) => {
        deps.cartRepo.getUserShippingAddress = jest.fn().mockReturnValue(okAsync(null));
      },
      expectedResult: 'error',
      expectedErrorType: 'InvalidCart'
    },
    {
      name: '決済処理失敗',
      setup: (deps) => {
        deps.shippingService = createMockShippingService();
        deps.paymentService.processPayment = jest.fn().mockReturnValue(errAsync({
          code: 'NETWORK_ERROR',
          message: 'Network timeout'
        }));
      },
      expectedResult: 'error',
      expectedErrorType: 'PaymentFailed'
    }
  ];

  testCases.forEach(({ name, setup, expectedResult, expectedErrorType }) => {
    it(name, async () => {
      const deps = createMockDependencies();
      setup(deps);
      
      const result = await processOrder(deps)(mockInput);
      
      if (expectedResult === 'success') {
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.kind).toBe('Completed');
        }
      } else {
        expect(result.isErr()).toBe(true);
        if (result.isErr() && expectedErrorType) {
          expect(result.error.type).toBe(expectedErrorType);
        }
      }
    });
  });
});