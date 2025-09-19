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

interface SelfOrRolesRequestParams {
  id?: string;
  userId?: string;
  email?: string;
}

interface SelfOrRolesRequestBody {
  id?: string;
  userId?: string;
  email?: string;
}

interface SelfOrRolesRequestQuery {
  id?: string;
  userId?: string;
  callerId?: string;
  email?: string;
}

@Injectable()
export class SelfOrRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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
      request.params?.email ?? request.body?.email ?? request.query?.email;
    const targetId =
      request.params?.id ??
      request.params?.userId ??
      request.body?.id ??
      request.body?.userId ??
      request.query?.id ??
      request.query?.userId;

    const currentUser = request.user as {
      id: string;
      email: string;
      roles: string[];
    };

    if (targetEmail && targetEmail === currentUser.email) return true;

    const isSelf = targetId === currentUser.id;
    const hasRole =
      requiredRoles?.some((role) => currentUser.roles?.includes(role)) ?? false;

    if (!isSelf && !hasRole)
      throw new UnauthorizedException('Insufficient permissions');

    return true;
  }
}
