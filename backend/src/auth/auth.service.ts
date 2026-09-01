import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { StoreService } from '../store/store.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly storeService: StoreService,
    private readonly jwtService: JwtService,
  ) {}

  // Valida credenciales de superadmin (tabla users) o dueño de negocio (tabla stores).
  // Devuelve un objeto de identidad con role y, si aplica, storeId.
  async validateIdentity(username: string, password: string): Promise<any> {
    // 1. Buscar superadmin
    const user = await this.usersService.findByUsername(username);
    if (user && user.role === 'admin') {
      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      if (passwordMatches) {
        return { sub: user.id, username: user.username, role: 'admin' };
      }
      return null;
    }

    // 2. Buscar dueño de negocio
    const store = await this.storeService.findByUsername(username);
    if (store) {
      const passwordMatches = await bcrypt.compare(password, store.password_hash);
      if (passwordMatches) {
        return {
          sub: store.id,
          username: store.username,
          role: 'owner',
          storeId: store.id,
          storeName: store.name,
        };
      }
      return null;
    }

    return null;
  }

  // Login y devuelve JWT token
  async login(username: string, password: string): Promise<{ token: string; role: string; storeId?: string; storeName?: string }> {
    const identity = await this.validateIdentity(username, password);
    if (!identity) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = {
      sub: identity.sub,
      username: identity.username,
      role: identity.role,
      storeId: identity.storeId,
      storeName: identity.storeName,
    };
    return {
      token: this.jwtService.sign(payload),
      role: identity.role,
      storeId: identity.storeId,
      storeName: identity.storeName,
    };
  }

  // Usado por script seed para crear admin
  async registerAdmin(username: string, password: string): Promise<void> {
    const existing = await this.usersService.findByUsername(username);
    if (existing) return;
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
      throw new Error('La contraseña del administrador debe tener entre 8 y 72 caracteres');
    }
    const password_hash = await bcrypt.hash(password, 10);
    await this.usersService.createUser({ username, password_hash, role: 'admin' });
  }
}
