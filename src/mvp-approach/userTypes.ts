// MVP期でも用意しておくべき型定義群

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

// 作成時の入力型（IDや日時は自動生成）
export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  // statusはデフォルトで'pending'になる
}

// プロフィール更新（ユーザー自身が更新できる項目）
export interface ProfileUpdateInput {
  name?: string;
  avatar?: string;
}

// 管理者用の更新（statusなども変更可能）
export interface AdminUserUpdateInput {
  name?: string;
  avatar?: string;
  status?: User['status'];
  // emailは変更不可（別途メール変更フローが必要）
}

// ステータス変更専用（明確性のため）
export interface UserStatusUpdateInput {
  status: User['status'];
  reason?: string; // ログ用
}

// パスワード変更専用
export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

// メールアドレス変更専用
export interface EmailChangeInput {
  newEmail: string;
  password: string; // 確認のため
}

// 検索・フィルター用
export interface UserSearchInput {
  email?: string;
  name?: string;
  status?: User['status'];
  createdAfter?: Date;
  createdBefore?: Date;
}

// レスポンス用（パスワードなどの機密情報を除外）
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: User['status'];
  createdAt: Date;
  updatedAt: Date;
}

// 一覧表示用（さらに最小限）
export interface UserListItem {
  id: string;
  name: string;
  email: string;
  status: User['status'];
}

// 型ガード・ユーティリティ
export const UserStatus = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
  PENDING: 'pending' as const
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// バリデーション用の型ガード
export function isValidUserStatus(status: string): status is User['status'] {
  return Object.values(UserStatus).includes(status as User['status']);
}

// User -> UserResponse への変換ヘルパー
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// User -> UserListItem への変換ヘルパー
export function toUserListItem(user: User): UserListItem {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status
  };
}