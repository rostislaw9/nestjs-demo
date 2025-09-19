import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from 'src/common/decorators';
import { Role } from 'src/common/enums/roles.enum';
import { isDev } from 'src/common/utils';
import { RequestWithUser } from 'src/modules/auth/interfaces';
import { UsersService } from 'src/modules/users/users.service';

interface SelfOrRolesRequestParams {
  id?: string;
  email?: string;
}

interface SelfOrRolesRequestBody {
  id?: string;
  email?: string;
}

interface SelfOrRolesRequestQuery {
  id?: string;
  email?: string;
}

@Injectable()
export class SelfOrRolesGuard implements CanActivate {
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

    const request = context
      .switchToHttp()
      .getRequest<
        RequestWithUser<
          SelfOrRolesRequestParams,
          SelfOrRolesRequestQuery,
          SelfOrRolesRequestBody
        >
      >();

    const user = request.user;
    if (!user?.email) {
      throw new UnauthorizedException('User info is missing');
    }

    const targetEmail =
      request.params.email || request.body.email || request.query.email;
    const targetId = request.params.id || request.body.id || request.query.id;

    if (targetEmail && targetEmail === user.email) return true;

    const repoUser = await this.usersService.findByEmail(user.email);
    if (!repoUser) throw new UnauthorizedException('User not found');

    const isSelf = targetId === repoUser.id;
    const hasRole =
      requiredRoles?.some((role) => repoUser.roles.includes(role)) ?? false;

    if (!isSelf && !hasRole)
      throw new UnauthorizedException('Insufficient permissions');

    return true;
  }
}
