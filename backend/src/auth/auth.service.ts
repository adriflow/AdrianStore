import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

  // Validate credentials against stored user
  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) return null;
    const { password_hash, ...result } = user;
    return result; // { id, username, role }
  }

  // Login and return JWT token
  async login(username: string, password: string): Promise<{ token: string }> {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = { sub: user.id, username: user.username, role: user.role };
    return { token: this.jwtService.sign(payload) };
  }

  // Used by seed script to create admin user
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
