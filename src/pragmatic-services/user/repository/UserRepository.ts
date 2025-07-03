import { User } from '../domain/User';

// 純粋なRepositoryインターface - ドメインオブジェクトのみを扱う
export interface UserRepository {
  // 検索系 - ドメインオブジェクトを返す
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  
  // 永続化 - ドメインオブジェクトを受け取り、永続化後のオブジェクトを返す
  save(user: User): Promise<User>;
  
  // 削除
  remove(user: User): Promise<void>;
}

// 実装例：Prismaを使った具体的なRepository
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: any) {} // PrismaClientの型

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!userData) return null;

    return User.fromPersistence(userData);
  }

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!userData) return null;

    return User.fromPersistence(userData);
  }

  async save(user: User): Promise<User> {
    const data = user.toPersistence();
    
    let savedData;
    if (data.id) {
      // 更新
      savedData = await this.prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          avatar: data.avatar,
          isVerified: data.isVerified,
          updatedAt: data.updatedAt
        }
      });
    } else {
      // 新規作成
      savedData = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          avatar: data.avatar,
          isVerified: data.isVerified,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        }
      });
    }

    return User.fromPersistence(savedData);
  }

  async remove(user: User): Promise<void> {
    await this.prisma.user.delete({
      where: { id: user.id }
    });
  }
}

// インメモリ実装（テスト用）
export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private nextId = 1;

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<User> {
    const data = user.toPersistence();
    
    let savedUser: User;
    if (data.id) {
      // 更新 - 既存のエンティティを更新
      savedUser = user;
    } else {
      // 新規作成 - IDを付与して新しいエンティティを作成
      const newId = this.nextId.toString();
      this.nextId++;
      
      savedUser = User.fromPersistence({
        ...data,
        id: newId
      });
    }
    
    this.users.set(savedUser.id, savedUser);
    return savedUser;
  }

  async remove(user: User): Promise<void> {
    this.users.delete(user.id);
  }

  // テスト用ヘルパー
  clear(): void {
    this.users.clear();
    this.nextId = 1;
  }
}