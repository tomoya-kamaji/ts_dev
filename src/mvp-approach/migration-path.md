# PMF前後の設計移行戦略

## MVP期（0-6ヶ月）：速度最優先
### 原則
- **動くものを早く**：完璧さより動作を優先
- **型安全性は最低限確保**：バグの早期発見のため
- **将来への準備は軽く**：完全なリファクタリングは避ける

### コード例
```typescript
// ✅ MVP期の良い例
class OrderService {
  async createOrder(items: CartItem[]): Promise<Order> {
    // シンプルで直接的
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return this.orderRepo.create({ items, total, status: 'pending' });
  }
}

// ❌ MVP期に避けるべき例
class OrderDomain {
  constructor(private orderPolicy: OrderPolicy) {} // 過度な抽象化
  createOrder(specification: OrderSpecification): Result<Order, DomainError> {
    // 複雑すぎる
  }
}
```

## トラクション獲得期（6ヶ月-1年）：選択的改善
### 原則
- **痛い部分から改善**：バグが多発する領域を優先
- **新機能はより良い設計で**：既存は触らず、新規分のみ
- **テストを増やす**：リファクタリングの準備

### 移行例
```typescript
// 段階1：エラーハンドリングをResult型に
async createUser(input: CreateUserInput): Promise<Result<User, UserError>> {
  if (!this.isValidEmail(input.email)) {
    return err({ type: 'INVALID_EMAIL' }); // 型安全に改善
  }
  // 残りは既存のまま
}

// 段階2：重要な部分にドメインロジック導入
class User {
  updateProfile(name: string): Result<void, string> {
    // コアなビジネスルールのみエンティティに移行
  }
}
```

## 成長期（1年+）：本格的なDDD
### 原則
- **安定したドメインから移行**：仕様変更が少ない部分
- **チーム全体で理解**：一人だけの知識にしない
- **段階的置き換え**：一気に全て変更しない

## 判断基準：いつ移行するか

### 🚨 緊急でリファクタリングが必要な兆候
```typescript
// バグが頻発する
if (user.status === 'active' && user.isPremium && !user.isExpired) {
  // この条件分岐があちこちに散らばっている
}

// 仕様変更の影響範囲が予測できない
// 新機能追加のたびに既存機能が壊れる
// テストが書けない・書いても意味がない
```

### 📊 段階的移行の優先順位

#### 🔥 最優先（すぐやる）
1. **型定義の整理**：`any`の撲滅、interfaceの明確化
2. **エラーハンドリング**：Result型の導入
3. **テストの追加**：リファクタリングの安全網

#### 🟡 中優先（PMF後3-6ヶ月）
1. **コアドメインのエンティティ化**：最も重要なビジネスロジック
2. **Repository抽象化**：テスタビリティとデータ層の分離
3. **バリデーションの集約**：散らばったルールの整理

#### 🟢 低優先（安定してから）
1. **完全なDDD適用**：集約ルート、ドメインサービス
2. **イベントドリブン**：複雑な連携処理
3. **CQRS導入**：パフォーマンス要件が厳しい場合

## 実践的なヒント

### MVP期に「やっておくと後で楽」なこと
```typescript
// ✅ 設定は外部化
const config = {
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'mock',
  PAYMENT_SERVICE: process.env.PAYMENT_SERVICE || 'mock'
};

// ✅ インターフェースで依存関係分離
interface EmailService {
  send(to: string, subject: string, body: string): Promise<boolean>;
}

// ✅ ドメイン用語を型名に使う
type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered';
// 後で enum や判別共用体に変更しやすい
```

### 「技術的負債」vs「機能負債」
```typescript
// 技術的負債：後で直せる
function calculateDiscount(user: any, items: any[]): number {
  // 動くけど型が甘い → 後で改善
}

// 機能負債：今すぐ直すべき
function calculateDiscount(user: User, items: Item[]): number {
  if (user.type === 'premium') {
    return items.length * 100; // ビジネスロジックが間違っている
  }
}
```

## 失敗パターン

### ❌ 完璧主義の罠
```typescript
// MVP期なのに時間をかけすぎ
class OrderDomainService {
  constructor(
    private orderPolicy: OrderPolicy,
    private pricingStrategy: PricingStrategy,
    private inventoryValidator: InventoryValidator
    // ... 10個の依存関係
  ) {}
}
```

### ❌ 無計画な積み上げ
```typescript
// 型もテストもない無法地帯
function doSomething(data) {
  // 何でもあり → 後で手が付けられない
}
```

### ✅ 現実的なバランス
```typescript
// シンプルだが最低限の型安全性
function calculateShipping(items: Item[], address: Address): number {
  // 今は単純計算、後で複雑化に備えて分離
  return this.shippingCalculator.calculate(items, address);
}
```