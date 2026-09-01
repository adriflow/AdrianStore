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
    // Dueño autenticado con negocio asignado: la comprobación de que el
    // recurso pertenece a su negocio la hace cada controlador (el nombre
    // del parámetro de ruta varía: id de negocio, slug, id de producto...).
    if (user.role === 'owner' && user.storeId) {
      return true;
    }
    return false;
  }
}
