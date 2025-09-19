import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from 'src/common/decorators';
import { Role } from 'src/common/enums';
import { isDev } from 'src/common/utils';
import { RequestWithUser } from 'src/modules/auth/interfaces';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isDev()) return true;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user?.email) {
      throw new UnauthorizedException('User information is missing');
    }

    const repoUser = await this.usersService.findByEmail(user.email);
    if (!repoUser) {
      throw new UnauthorizedException('User not found');
    }

    const hasRole = requiredRoles.some((role) => repoUser.roles.includes(role));
    if (!hasRole) {
      throw new UnauthorizedException('Insufficient permissions');
    }

    return true;
  }
}
