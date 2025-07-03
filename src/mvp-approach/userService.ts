// PMF前のアプローチ：「将来への準備」を仕込む

// 1. 型定義は最初からしっかり作る（後で変更が大変）
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending'; // 将来の拡張を見据えた設計
  createdAt: Date;
  updatedAt: Date;
}

// 2. エラー型だけは定義しておく（後でResult型に移行しやすい）
export type UserError = 
  | 'EMAIL_EXISTS'
  | 'INVALID_EMAIL'
  | 'USER_NOT_FOUND';

// 3. インターフェースで依存関係を分離（テスト・モック化しやすい）
export interface UserRepository {
  create(data: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// 4. サービス層は直接的だが、メソッド分割は意識
export class UserService {
  constructor(private userRepo: UserRepository) {}

  // 最小限のバリデーション + 明確なエラーメッセージ
  async createUser(input: CreateUserInput): Promise<User> {
    if (!this.isValidEmail(input.email)) {
      throw new Error('INVALID_EMAIL'); // 後でResult型に変更しやすい形
    }

    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error('EMAIL_EXISTS');
    }

    return this.userRepo.create({
      ...input,
      status: 'pending', // デフォルト値はここで設定
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async updateProfile(userId: string, updates: ProfileUpdateInput): Promise<User> {
    // 今は単純だが、後でドメインロジックを移しやすい構造
    const validatedUpdates = this.validateProfileUpdates(updates);
    
    return this.userRepo.update(userId, {
      ...validatedUpdates,
      updatedAt: new Date() // 今はここで管理、後でドメインに移行
    });
  }

  // プライベートメソッドで将来の分離を準備
  private isValidEmail(email: string): boolean {
    return email.includes('@') && email.length > 3;
  }

  private validateProfileUpdates(updates: ProfileUpdateInput): ProfileUpdateInput {
    const validated = { ...updates };
    
    if (updates.name && updates.name.trim().length < 2) {
      throw new Error('INVALID_NAME');
    }
    
    return validated;
  }
}

// 5. 型定義は将来を見据えて
interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

interface ProfileUpdateInput {
  name?: string;
  avatar?: string;
}