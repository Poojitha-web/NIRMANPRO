import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied. No user role assigned.');
    }

    const userRole = user.role.toUpperCase().replace(/\s+/g, '_');
    const hasRole = requiredRoles.some((r) => {
      const normalizedReq = r.toUpperCase().replace(/\s+/g, '_');
      return userRole === normalizedReq || userRole === 'ADMIN';
    });

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Action requires role: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
