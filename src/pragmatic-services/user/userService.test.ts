import { UserService, CreateUserInput, LoginInput, UserServiceError } from './userService';

// モックの依存関係
const createMockDependencies = () => ({
  userRepo: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  passwordService: {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    verify: jest.fn()
  },
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true)
  },
  tokenService: {
    generateVerificationToken: jest.fn().mockReturnValue('verification_token'),
    generateJWT: jest.fn().mockReturnValue('jwt_token'),
    verifyJWT: jest.fn()
  }
});

const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('UserService', () => {
  let userService: UserService;
  let deps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    deps = createMockDependencies();
    userService = new UserService(
      deps.userRepo,
      deps.passwordService,
      deps.emailService,
      deps.tokenService
    );
  });

  describe('registerUser', () => {
    const validInput: CreateUserInput = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('正常にユーザー登録ができる', async () => {
      deps.userRepo.findByEmail.mockResolvedValue(null);
      deps.userRepo.create.mockResolvedValue(mockUser);

      const result = await userService.registerUser(validInput);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe(validInput.email);
        expect(deps.userRepo.create).toHaveBeenCalled();
        expect(deps.emailService.sendVerificationEmail).toHaveBeenCalled();
      }
    });

    it('メールアドレスが既に存在する場合はエラーを返す', async () => {
      deps.userRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.registerUser(validInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('EMAIL_ALREADY_EXISTS');
      }
    });

    it('無効なメールアドレスの場合はバリデーションエラーを返す', async () => {
      const invalidInput = { ...validInput, email: 'invalid-email' };

      const result = await userService.registerUser(invalidInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
        if (result.error.type === 'VALIDATION_ERROR') {
          expect(result.error.field).toBe('email');
        }
      }
    });

    it('短すぎるパスワードの場合はバリデーションエラーを返す', async () => {
      const invalidInput = { ...validInput, password: '123' };

      const result = await userService.registerUser(invalidInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
        if (result.error.type === 'VALIDATION_ERROR') {
          expect(result.error.field).toBe('password');
        }
      }
    });
  });

  describe('loginUser', () => {
    const validLoginInput: LoginInput = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('正常にログインができる', async () => {
      deps.userRepo.findByEmail.mockResolvedValue(mockUser);
      deps.passwordService.verify.mockResolvedValue(true);

      const result = await userService.loginUser(validLoginInput);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.user.email).toBe(validLoginInput.email);
        expect(result.value.token).toBe('jwt_token');
      }
    });

    it('存在しないメールアドレスの場合は認証エラーを返す', async () => {
      deps.userRepo.findByEmail.mockResolvedValue(null);

      const result = await userService.loginUser(validLoginInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_CREDENTIALS');
      }
    });

    it('間違ったパスワードの場合は認証エラーを返す', async () => {
      deps.userRepo.findByEmail.mockResolvedValue(mockUser);
      deps.passwordService.verify.mockResolvedValue(false);

      const result = await userService.loginUser(validLoginInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('INVALID_CREDENTIALS');
      }
    });

    it('空のメールアドレスの場合はバリデーションエラーを返す', async () => {
      const invalidInput = { ...validLoginInput, email: '' };

      const result = await userService.loginUser(invalidInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('updateProfile', () => {
    it('正常にプロフィール更新ができる', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      deps.userRepo.update.mockResolvedValue(updatedUser);

      const result = await userService.updateProfile('user123', { name: 'Updated Name' });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe('Updated Name');
      }
    });

    it('存在しないユーザーの場合はエラーを返す', async () => {
      deps.userRepo.update.mockResolvedValue(null);

      const result = await userService.updateProfile('nonexistent', { name: 'New Name' });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('USER_NOT_FOUND');
      }
    });
  });

  describe('verifyEmail', () => {
    it('正常にメール確認ができる', async () => {
      const verifiedUser = { ...mockUser, isVerified: true };
      deps.userRepo.update.mockResolvedValue(verifiedUser);

      const result = await userService.verifyEmail('user123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isVerified).toBe(true);
        expect(deps.emailService.sendWelcomeEmail).toHaveBeenCalled();
      }
    });
  });
});

// テーブル駆動テスト
describe('UserService - テーブル駆動テスト', () => {
  interface ValidationTestCase {
    name: string;
    input: CreateUserInput;
    expectedError?: UserServiceError['type'];
    expectedField?: string;
  }

  const validationTestCases: ValidationTestCase[] = [
    {
      name: '正常なデータ',
      input: { email: 'test@example.com', password: 'password123', name: 'Test User' }
    },
    {
      name: '無効なメールアドレス（@なし）',
      input: { email: 'testexample.com', password: 'password123', name: 'Test User' },
      expectedError: 'VALIDATION_ERROR',
      expectedField: 'email'
    },
    {
      name: '空のメールアドレス',
      input: { email: '', password: 'password123', name: 'Test User' },
      expectedError: 'VALIDATION_ERROR',
      expectedField: 'email'
    },
    {
      name: '短すぎるパスワード',
      input: { email: 'test@example.com', password: '123', name: 'Test User' },
      expectedError: 'VALIDATION_ERROR',
      expectedField: 'password'
    },
    {
      name: '空のパスワード',
      input: { email: 'test@example.com', password: '', name: 'Test User' },
      expectedError: 'VALIDATION_ERROR',
      expectedField: 'password'
    },
    {
      name: '短すぎる名前',
      input: { email: 'test@example.com', password: 'password123', name: 'A' },
      expectedError: 'VALIDATION_ERROR',
      expectedField: 'name'
    },
    {
      name: '空の名前',
      input: { email: 'test@example.com', password: 'password123', name: '' },
      expectedError: 'VALIDATION_ERROR',
      expectedField: 'name'
    }
  ];

  validationTestCases.forEach(({ name, input, expectedError, expectedField }) => {
    it(name, async () => {
      const deps = createMockDependencies();
      deps.userRepo.findByEmail.mockResolvedValue(null); // 重複なし
      deps.userRepo.create.mockResolvedValue(mockUser);
      
      const userService = new UserService(
        deps.userRepo,
        deps.passwordService,
        deps.emailService,
        deps.tokenService
      );

      const result = await userService.registerUser(input);

      if (expectedError) {
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe(expectedError);
          if (expectedField && result.error.type === 'VALIDATION_ERROR') {
            expect(result.error.field).toBe(expectedField);
          }
        }
      } else {
        expect(result.isOk()).toBe(true);
      }
    });
  });
});