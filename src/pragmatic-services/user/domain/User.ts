import { Result, ok, err } from 'neverthrow';

// ドメインエンティティとしてのUser
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    private _name: string,
    private _avatar: string | undefined,
    private _isVerified: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // ファクトリーメソッド：新規ユーザー作成
  static create(email: string, name: string): Result<User, string> {
    // ドメインルールの検証
    if (!User.isValidEmail(email)) {
      return err('Invalid email format');
    }
    
    if (!User.isValidName(name)) {
      return err('Name must be at least 2 characters');
    }

    const now = new Date();
    return ok(new User(
      '', // IDは後でリポジトリが設定
      email,
      name,
      undefined,
      false,
      now,
      now
    ));
  }

  // ファクトリーメソッド：既存データから復元
  static fromPersistence(data: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.email,
      data.name,
      data.avatar,
      data.isVerified,
      data.createdAt,
      data.updatedAt
    );
  }

  // ゲッター
  get name(): string { return this._name; }
  get avatar(): string | undefined { return this._avatar; }
  get isVerified(): boolean { return this._isVerified; }
  get updatedAt(): Date { return this._updatedAt; }

  // ドメインメソッド：プロフィール更新
  updateProfile(name?: string, avatar?: string): Result<void, string> {
    if (name !== undefined) {
      if (!User.isValidName(name)) {
        return err('Name must be at least 2 characters');
      }
      this._name = name;
    }

    if (avatar !== undefined) {
      this._avatar = avatar;
    }

    this._updatedAt = new Date(); // ドメインがupdatedAtを管理
    return ok(undefined);
  }

  // ドメインメソッド：メール確認
  verifyEmail(): void {
    this._isVerified = true;
    this._updatedAt = new Date();
  }

  // ドメインメソッド：認証済みかチェック
  canPerformAction(): boolean {
    return this._isVerified;
  }

  // 永続化用のデータ変換
  toPersistence(): {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      email: this.email,
      name: this._name,
      avatar: this._avatar,
      isVerified: this._isVerified,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    };
  }

  // プライベートバリデーションメソッド
  private static isValidEmail(email: string): boolean {
    return email.includes('@') && email.length > 3;
  }

  private static isValidName(name: string): boolean {
    return name.trim().length >= 2;
  }
}