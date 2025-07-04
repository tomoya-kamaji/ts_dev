// 型定義を活用した改良版UserService

import {
  User,
  CreateUserInput,
  ProfileUpdateInput,
  AdminUserUpdateInput,
  UserStatusUpdateInput,
  PasswordChangeInput,
  EmailChangeInput,
  UserSearchInput,
  UserResponse,
  UserListItem,
  toUserResponse,
  toUserListItem,
  isValidUserStatus
} from './userTypes';

export const UserErrors = {
  EMAIL_EXISTS: "EMAIL_EXISTS",
  INVALID_EMAIL: "INVALID_EMAIL",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_NAME: "INVALID_NAME",
  INVALID_STATUS: "INVALID_STATUS",
  WRONG_PASSWORD: "WRONG_PASSWORD",
  UNAUTHORIZED: "UNAUTHORIZED"
} as const;

export interface UserRepository {
  create(data: Omit<User, "id">): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
  search(criteria: UserSearchInput): Promise<User[]>;
  delete(id: string): Promise<void>;
}

export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private passwordService: PasswordService
  ) {}

  // 基本的なCRUD操作
  async createUser(input: CreateUserInput): Promise<UserResponse> {
    if (!this.isValidEmail(input.email)) {
      throw new Error(UserErrors.INVALID_EMAIL);
    }

    if (!this.isValidName(input.name)) {
      throw new Error(UserErrors.INVALID_NAME);
    }

    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error(UserErrors.EMAIL_EXISTS);
    }

    const hashedPassword = await this.passwordService.hash(input.password);
    const now = new Date();
    
    const user = await this.userRepo.create({
      email: input.email,
      name: input.name,
      status: "pending",
      createdAt: now,
      updatedAt: now
    });

    return toUserResponse(user);
  }

  // プロフィール更新（ユーザー自身）
  async updateProfile(userId: string, updates: ProfileUpdateInput): Promise<UserResponse> {
    const user = await this.findUserOrThrow(userId);

    if (updates.name && !this.isValidName(updates.name)) {
      throw new Error(UserErrors.INVALID_NAME);
    }

    const updatedUser = await this.userRepo.update(userId, {
      ...updates,
      updatedAt: new Date()
    });

    return toUserResponse(updatedUser);
  }

  // 管理者による更新
  async adminUpdateUser(userId: string, updates: AdminUserUpdateInput): Promise<UserResponse> {
    const user = await this.findUserOrThrow(userId);

    if (updates.name && !this.isValidName(updates.name)) {
      throw new Error(UserErrors.INVALID_NAME);
    }

    if (updates.status && !isValidUserStatus(updates.status)) {
      throw new Error(UserErrors.INVALID_STATUS);
    }

    const updatedUser = await this.userRepo.update(userId, {
      ...updates,
      updatedAt: new Date()
    });

    return toUserResponse(updatedUser);
  }

  // ステータス変更専用
  async updateUserStatus(userId: string, statusUpdate: UserStatusUpdateInput): Promise<UserResponse> {
    const user = await this.findUserOrThrow(userId);

    if (!isValidUserStatus(statusUpdate.status)) {
      throw new Error(UserErrors.INVALID_STATUS);
    }

    const updatedUser = await this.userRepo.update(userId, {
      status: statusUpdate.status,
      updatedAt: new Date()
    });

    // ログ出力（reason があれば）
    if (statusUpdate.reason) {
      console.log(`User ${userId} status changed to ${statusUpdate.status}: ${statusUpdate.reason}`);
    }

    return toUserResponse(updatedUser);
  }

  // パスワード変更
  async changePassword(userId: string, passwordChange: PasswordChangeInput): Promise<void> {
    const user = await this.findUserOrThrow(userId);
    
    // 現在のパスワード確認（実際の実装では保存されたハッシュと比較）
    const isCurrentPasswordValid = await this.passwordService.verify(
      passwordChange.currentPassword, 
      'stored_hash' // 実際は user.passwordHash など
    );
    
    if (!isCurrentPasswordValid) {
      throw new Error(UserErrors.WRONG_PASSWORD);
    }

    const newHashedPassword = await this.passwordService.hash(passwordChange.newPassword);
    
    await this.userRepo.update(userId, {
      // passwordHash: newHashedPassword, // 実際の実装
      updatedAt: new Date()
    });
  }

  // メールアドレス変更（確認フロー付き）
  async requestEmailChange(userId: string, emailChange: EmailChangeInput): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    if (!this.isValidEmail(emailChange.newEmail)) {
      throw new Error(UserErrors.INVALID_EMAIL);
    }

    // パスワード確認
    const isPasswordValid = await this.passwordService.verify(
      emailChange.password, 
      'stored_hash'
    );
    
    if (!isPasswordValid) {
      throw new Error(UserErrors.WRONG_PASSWORD);
    }

    // 新しいメールアドレスの重複チェック
    const existing = await this.userRepo.findByEmail(emailChange.newEmail);
    if (existing) {
      throw new Error(UserErrors.EMAIL_EXISTS);
    }

    // 実際の実装では確認メール送信
    console.log(`Email change requested for user ${userId}: ${emailChange.newEmail}`);
  }

  // 検索・一覧取得
  async searchUsers(criteria: UserSearchInput): Promise<UserListItem[]> {
    const users = await this.userRepo.search(criteria);
    return users.map(toUserListItem);
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await this.userRepo.findById(id);
    return user ? toUserResponse(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.userRepo.findByEmail(email);
    return user ? toUserResponse(user) : null;
  }

  // ヘルパーメソッド
  private async findUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error(UserErrors.USER_NOT_FOUND);
    }
    return user;
  }

  private isValidEmail(email: string): boolean {
    return email.includes("@") && email.length > 3;
  }

  private isValidName(name: string): boolean {
    return name.trim().length >= 2;
  }
}

// 使用例を示すコントローラー
export class UserController {
  constructor(private userService: UserService) {}

  // プロフィール更新 - 型安全性が確保される
  async updateProfile(req: any, res: any) {
    try {
      const userId = req.user.id;
      
      // ProfileUpdateInput の型チェックが働く
      const updates: ProfileUpdateInput = {
        name: req.body.name,
        avatar: req.body.avatar
        // status は含まれない（型エラーになる）
      };
      
      const user = await this.userService.updateProfile(userId, updates);
      res.json(user);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // 管理者による更新
  async adminUpdateUser(req: any, res: any) {
    try {
      const { userId } = req.params;
      
      // AdminUserUpdateInput の型チェックが働く
      const updates: AdminUserUpdateInput = {
        name: req.body.name,
        avatar: req.body.avatar,
        status: req.body.status // 管理者は status も変更可能
      };
      
      const user = await this.userService.adminUpdateUser(userId, updates);
      res.json(user);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // ステータス変更専用API
  async updateUserStatus(req: any, res: any) {
    try {
      const { userId } = req.params;
      
      const statusUpdate: UserStatusUpdateInput = {
        status: req.body.status,
        reason: req.body.reason
      };
      
      const user = await this.userService.updateUserStatus(userId, statusUpdate);
      res.json(user);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: any) {
    if (error instanceof Error) {
      switch (error.message) {
        case UserErrors.USER_NOT_FOUND:
          return res.status(404).json({ error: "User not found" });
        case UserErrors.INVALID_NAME:
          return res.status(400).json({ error: "Invalid name" });
        case UserErrors.INVALID_STATUS:
          return res.status(400).json({ error: "Invalid status" });
        case UserErrors.UNAUTHORIZED:
          return res.status(403).json({ error: "Unauthorized" });
        default:
          console.error("Unexpected error:", error);
          return res.status(500).json({ error: "Internal server error" });
      }
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}