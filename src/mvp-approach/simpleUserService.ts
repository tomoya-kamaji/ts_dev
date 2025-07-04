// MVP期のシンプルなアプローチ

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  updatedAt: Date;
}

// エラーは定数で管理（Result型は使わない）
export const UserErrors = {
  EMAIL_EXISTS: "EMAIL_EXISTS",
  INVALID_EMAIL: "INVALID_EMAIL",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_NAME: "INVALID_NAME",
} as const;

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface ProfileUpdateInput {
  name?: string;
  avatar?: string;
}

export interface UserRepository {
  create(data: Omit<User, "id">): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
}

// シンプルなサービス層 - 例外ベースのエラーハンドリング
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async createUser(input: CreateUserInput): Promise<User> {
    // バリデーション
    if (!this.isValidEmail(input.email)) {
      throw new Error(UserErrors.INVALID_EMAIL);
    }

    if (!this.isValidName(input.name)) {
      throw new Error(UserErrors.INVALID_NAME);
    }

    // 重複チェック
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error(UserErrors.EMAIL_EXISTS);
    }

    // ユーザー作成
    const now = new Date();
    return this.userRepo.create({
      email: input.email,
      name: input.name,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateProfile(
    userId: string,
    updates: ProfileUpdateInput
  ): Promise<User> {
    // 存在チェック
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error(UserErrors.USER_NOT_FOUND);
    }

    // バリデーション
    if (updates.name && !this.isValidName(updates.name)) {
      throw new Error(UserErrors.INVALID_NAME);
    }

    // 更新
    return this.userRepo.update(userId, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  // プライベートヘルパー
  private isValidEmail(email: string): boolean {
    return email.includes("@") && email.length > 3;
  }

  private isValidName(name: string): boolean {
    return name.trim().length >= 2;
  }
}

// コントローラーでのエラーハンドリング
export class UserController {
  constructor(private userService: UserService) {}

  async createUser(req: any, res: any) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case UserErrors.EMAIL_EXISTS:
            return res.status(409).json({ error: "Email already exists" });
          case UserErrors.INVALID_EMAIL:
            return res.status(400).json({ error: "Invalid email format" });
          case UserErrors.INVALID_NAME:
            return res
              .status(400)
              .json({ error: "Name must be at least 2 characters" });
          default:
            console.error("Unexpected error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateProfile(req: any, res: any) {
    try {
      const userId = req.user.id; // 認証ミドルウェアから
      const user = await this.userService.updateProfile(userId, req.body);
      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case UserErrors.USER_NOT_FOUND:
            return res.status(404).json({ error: "User not found" });
          case UserErrors.INVALID_NAME:
            return res.status(400).json({ error: "Invalid name" });
          default:
            console.error("Unexpected error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

// テスト例
export class UserServiceTest {
  private userService: UserService;
  private mockRepo: jest.Mocked<UserRepository>;

  beforeEach() {
    this.mockRepo = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    this.userService = new UserService(this.mockRepo);
  }

  async testCreateUser_Success() {
    // Arrange
    this.mockRepo.findByEmail.mockResolvedValue(null);
    this.mockRepo.create.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      name: "Test User",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Act
    const result = await this.userService.createUser({
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    // Assert
    expect(result.email).toBe("test@example.com");
    expect(this.mockRepo.create).toHaveBeenCalled();
  }

  async testCreateUser_EmailExists() {
    // Arrange
    this.mockRepo.findByEmail.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      name: "Existing User",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Act & Assert
    await expect(
      this.userService.createUser({
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      })
    ).rejects.toThrow(UserErrors.EMAIL_EXISTS);
  }
}
