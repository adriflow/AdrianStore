import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { users } from './user.schema';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: string;
}

export class UsersService {
  async findByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] ?? null;
  }

  async createUser(data: { username: string; password_hash: string; role: string }): Promise<User> {
    const id = uuidv4();
    const user: User = { id, ...data };
    await db.insert(users).values(user);
    return user;
  }
}
