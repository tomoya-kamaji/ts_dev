// ドメイン層のRepository インターフェース

import { User } from '../entities/User';

export interface UserRepository {
  // 基本CRUD
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;

  // 検索系
  findByStatus(status: User['status']): Promise<User[]>;
  search(criteria: UserSearchCriteria): Promise<User[]>;
  count(): Promise<number>;
}

// 検索条件
export interface UserSearchCriteria {
  email?: string;
  name?: string;
  status?: User['status'];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}