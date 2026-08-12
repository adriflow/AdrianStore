import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

const ADMIN_TOKEN = process.env.SUPER_ADMIN_TOKEN || 'superadmin123';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'] || request.query.adminToken;

    if (!token || token !== ADMIN_TOKEN) {
      throw new UnauthorizedException('Acceso denegado: token de administrador inválido');
    }

    return true;
  }
}
