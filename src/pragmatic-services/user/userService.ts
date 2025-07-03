import { Result, ok, err } from 'neverthrow';
import { ulid } from 'ulid';

// 基本的な型定義
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// エラー型（実用的にシンプル）
export type UserServiceError = 
  | { type: 'EMAIL_ALREADY_EXISTS' }
  | { type: 'USER_NOT_FOUND' }
  | { type: 'INVALID_CREDENTIALS' }
  | { type: 'VALIDATION_ERROR'; field: string; message: string }
  | { type: 'EMAIL_SEND_FAILED' }
  | { type: 'UNKNOWN_ERROR'; message: string };

// 依存関係のインターface
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User | null>;
}

export interface PasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<boolean>;
  sendWelcomeEmail(email: string, name: string): Promise<boolean>;
}

export interface TokenService {
  generateVerificationToken(): string;
  generateJWT(userId: string): string;
  verifyJWT(token: string): { userId: string } | null;
}

// メインのユーザーサービス
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private tokenService: TokenService
  ) {}

  // ユーザー登録 - Result型で明示的なエラーハンドリング
  async registerUser(input: CreateUserInput): Promise<Result<User, UserServiceError>> {
    // 1. バリデーション
    const validationResult = this.validateRegistrationInput(input);
    if (validationResult.isErr()) return err(validationResult.error);

    // 2. 重複チェック
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      return err({ type: 'EMAIL_ALREADY_EXISTS' });
    }

    // 3. パスワードハッシュ化
    const hashedPassword = await this.passwordService.hash(input.password);

    // 4. ユーザー作成
    try {
      const user = await this.userRepo.create({
        email: input.email,
        name: input.name,
        isVerified: false,
      });

      // 5. 確認メール送信 - 失敗しても登録は成功とする
      const verificationToken = this.tokenService.generateVerificationToken();
      const emailSent = await this.emailService.sendVerificationEmail(
        user.email, 
        verificationToken
      );

      if (!emailSent) {
        // ログに記録するが、登録は成功として扱う
        console.warn(`Failed to send verification email to ${user.email}`);
      }

      return ok(user);
    } catch (error) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'User creation failed' 
      });
    }
  }

  // ログイン - 重要な部分のみResult型を使用
  async loginUser(input: LoginInput): Promise<Result<{ user: User; token: string }, UserServiceError>> {
    // バリデーション
    if (!input.email || !input.password) {
      return err({ 
        type: 'VALIDATION_ERROR', 
        field: 'email/password', 
        message: 'Email and password are required' 
      });
    }

    // ユーザー検索
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      return err({ type: 'INVALID_CREDENTIALS' });
    }

    // パスワード検証
    const isValidPassword = await this.passwordService.verify(input.password, 'stored_hash');
    if (!isValidPassword) {
      return err({ type: 'INVALID_CREDENTIALS' });
    }

    // JWTトークン生成
    const token = this.tokenService.generateJWT(user.id);

    return ok({ user, token });
  }

  // プロフィール更新 - シンプルな実装
  async updateProfile(
    userId: string, 
    updates: UpdateProfileInput
  ): Promise<Result<User, UserServiceError>> {
    try {
      const updatedUser = await this.userRepo.update(userId, {
        ...updates,
        updatedAt: new Date()
      });

      if (!updatedUser) {
        return err({ type: 'USER_NOT_FOUND' });
      }

      return ok(updatedUser);
    } catch (error) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'Profile update failed' 
      });
    }
  }

  // ユーザー取得 - 従来通りの実装
  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }

  // メール確認
  async verifyEmail(userId: string): Promise<Result<User, UserServiceError>> {
    try {
      const updatedUser = await this.userRepo.update(userId, {
        isVerified: true,
        updatedAt: new Date()
      });

      if (!updatedUser) {
        return err({ type: 'USER_NOT_FOUND' });
      }

      // ウェルカムメール送信（失敗しても処理は続行）
      await this.emailService.sendWelcomeEmail(updatedUser.email, updatedUser.name)
        .catch(error => console.warn('Failed to send welcome email:', error));

      return ok(updatedUser);
    } catch (error) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: 'Email verification failed' 
      });
    }
  }

  // プライベートヘルパーメソッド
  private validateRegistrationInput(input: CreateUserInput): Result<void, UserServiceError> {
    if (!input.email || !input.email.includes('@')) {
      return err({ 
        type: 'VALIDATION_ERROR', 
        field: 'email', 
        message: 'Valid email is required' 
      });
    }

    if (!input.password || input.password.length < 8) {
      return err({ 
        type: 'VALIDATION_ERROR', 
        field: 'password', 
        message: 'Password must be at least 8 characters' 
      });
    }

    if (!input.name || input.name.trim().length < 2) {
      return err({ 
        type: 'VALIDATION_ERROR', 
        field: 'name', 
        message: 'Name must be at least 2 characters' 
      });
    }

    return ok(undefined);
  }
}

// コントローラーでの使用例
export class UserController {
  constructor(private userService: UserService) {}

  async register(req: any, res: any) {
    const input: CreateUserInput = req.body;
    
    const result = await this.userService.registerUser(input);
    
    if (result.isErr()) {
      const error = result.error;
      
      switch (error.type) {
        case 'EMAIL_ALREADY_EXISTS':
          return res.status(409).json({ error: 'Email already registered' });
        case 'VALIDATION_ERROR':
          return res.status(400).json({ 
            error: 'Validation failed', 
            field: error.field, 
            message: error.message 
          });
        default:
          return res.status(500).json({ error: 'Registration failed' });
      }
    }
    
    return res.status(201).json({ 
      user: result.value,
      message: 'User registered successfully. Please check your email for verification.' 
    });
  }

  async login(req: any, res: any) {
    const input: LoginInput = req.body;
    
    const result = await this.userService.loginUser(input);
    
    if (result.isErr()) {
      const error = result.error;
      
      if (error.type === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      if (error.type === 'VALIDATION_ERROR') {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: 'Login failed' });
    }
    
    return res.status(200).json(result.value);
  }

  async updateProfile(req: any, res: any) {
    const userId = req.user.id; // 認証ミドルウェアから取得
    const updates: UpdateProfileInput = req.body;
    
    const result = await this.userService.updateProfile(userId, updates);
    
    if (result.isErr()) {
      if (result.error.type === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(500).json({ error: 'Profile update failed' });
    }
    
    return res.status(200).json(result.value);
  }
}