import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Permite acceso al superadmin y al dueño del negocio correspondiente.
// El superadmin siempre puede entrar al entorno de cualquier negocio.
@Injectable()
export class StoreOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }
    // Superadmin siempre tiene acceso
    if (user.role === 'admin') {
      return true;
    }
    // Dueño accede solo a su propio negocio
    if (user.role === 'owner' && user.storeId) {
      const paramStoreId = request.params?.storeId;
      if (!paramStoreId) {
        return true;
      }
      return user.storeId === paramStoreId;
    }
    return false;
  }
}
