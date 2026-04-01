import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "./roles.decorator.js";

const roleLevel: Record<Role, number> = {
  [Role.BENEVOLE]: 0,
  [Role.ADMIN]: 1,
  [Role.SUPER_ADMIN]: 2,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: { role?: Role } }>();
    const userRole = req.user?.role;

    const allowed = !!userRole && requiredRoles.some((role) => roleLevel[userRole] >= roleLevel[role]);

    if (!allowed) {
      throw new ForbiddenException("Permissions insuffisantes");
    }

    return true;
  }
}

