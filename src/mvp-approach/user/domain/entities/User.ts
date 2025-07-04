// ドメインエンティティ

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatar?: string;
  readonly status: UserStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type UserStatus = "active" | "inactive" | "pending";

// ドメインロジック（MVP期は軽めに）
export class UserEntity {
  constructor(private user: User) {}

  get id(): string { return this.user.id; }
  get email(): string { return this.user.email; }
  get name(): string { return this.user.name; }
  get avatar(): string | undefined { return this.user.avatar; }
  get status(): UserStatus { return this.user.status; }
  get createdAt(): Date { return this.user.createdAt; }
  get updatedAt(): Date { return this.user.updatedAt; }

  // ドメインルール：プロフィール更新可能か
  canUpdateProfile(): boolean {
    return this.status === "active" || this.status === "pending";
  }

  // ドメインルール：アクティブユーザーか
  isActive(): boolean {
    return this.status === "active";
  }

  // ドメインルール：有効な名前か
  static isValidName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  // ドメインルール：有効なメールアドレスか
  static isValidEmail(email: string): boolean {
    return email.includes("@") && email.length > 3 && email.length <= 254;
  }

  // 値オブジェクトへの変換
  toPlainObject(): User {
    return { ...this.user };
  }
}