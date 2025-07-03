import { Result, ok, err } from 'neverthrow';
import { User } from './domain/User';
import { UserRepository } from './repository/UserRepository';

// 改善されたサービス層
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

export type UserServiceError = 
  | { type: 'EMAIL_ALREADY_EXISTS' }
  | { type: 'USER_NOT_FOUND' }
  | { type: 'INVALID_CREDENTIALS' }
  | { type: 'DOMAIN_ERROR'; message: string }
  | { type: 'EMAIL_SEND_FAILED' }
  | { type: 'UNKNOWN_ERROR'; message: string };

// 外部サービスのインターface（変更なし）
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

// 改善されたUserService
export class UserService {
  constructor(
    private userRepo: UserRepository,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private tokenService: TokenService
  ) {}

  // ユーザー登録：ドメインロジックをエンティティに委譲
  async registerUser(input: CreateUserInput): Promise<Result<User, UserServiceError>> {
    // 1. ドメインエンティティ作成（バリデーション含む）
    const userResult = User.create(input.email, input.name);
    if (userResult.isErr()) {
      return err({ type: 'DOMAIN_ERROR', message: userResult.error });
    }

    const user = userResult.value;

    // 2. 重複チェック
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      return err({ type: 'EMAIL_ALREADY_EXISTS' });
    }

    // 3. パスワードハッシュ化（今回は簡略化）
    await this.passwordService.hash(input.password);

    // 4. ユーザー保存 - Repositoryは純粋にsaveのみ
    try {
      const savedUser = await this.userRepo.save(user);

      // 5. 確認メール送信
      const verificationToken = this.tokenService.generateVerificationToken();
      const emailSent = await this.emailService.sendVerificationEmail(
        savedUser.email, 
        verificationToken
      );

      if (!emailSent) {
        console.warn(`Failed to send verification email to ${savedUser.email}`);
      }

      return ok(savedUser);
    } catch (error) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'User creation failed' 
      });
    }
  }

  // プロフィール更新：ドメインロジックをエンティティに委譲
  async updateProfile(
    userId: string, 
    updates: UpdateProfileInput
  ): Promise<Result<User, UserServiceError>> {
    // 1. ユーザーを取得
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return err({ type: 'USER_NOT_FOUND' });
    }

    // 2. ドメインエンティティに更新を委譲
    const updateResult = user.updateProfile(updates.name, updates.avatar);
    if (updateResult.isErr()) {
      return err({ type: 'DOMAIN_ERROR', message: updateResult.error });
    }

    // 3. 永続化
    try {
      const savedUser = await this.userRepo.save(user);
      return ok(savedUser);
    } catch (error) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: error instanceof Error ? error.message : 'Profile update failed' 
      });
    }
  }

  // メール確認：ドメインロジックをエンティティに委譲
  async verifyEmail(userId: string): Promise<Result<User, UserServiceError>> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return err({ type: 'USER_NOT_FOUND' });
    }

    // ドメインエンティティに処理を委譲
    user.verifyEmail();

    try {
      const savedUser = await this.userRepo.save(user);

      // ウェルカムメール送信
      await this.emailService.sendWelcomeEmail(savedUser.email, savedUser.name)
        .catch(error => console.warn('Failed to send welcome email:', error));

      return ok(savedUser);
    } catch (error) {
      return err({ 
        type: 'UNKNOWN_ERROR', 
        message: 'Email verification failed' 
      });
    }
  }

  // ログイン（変更なし）
  async loginUser(input: LoginInput): Promise<Result<{ user: User; token: string }, UserServiceError>> {
    if (!input.email || !input.password) {
      return err({ 
        type: 'DOMAIN_ERROR', 
        message: 'Email and password are required' 
      });
    }

    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      return err({ type: 'INVALID_CREDENTIALS' });
    }

    const isValidPassword = await this.passwordService.verify(input.password, 'stored_hash');
    if (!isValidPassword) {
      return err({ type: 'INVALID_CREDENTIALS' });
    }

    const token = this.tokenService.generateJWT(user.id);
    return ok({ user, token });
  }

  // 単純な取得メソッド
  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }
}