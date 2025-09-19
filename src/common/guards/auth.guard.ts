import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { isDev } from 'src/common/utils';
import { AuthService } from 'src/modules/auth/auth.service';
import { RequestWithUser } from 'src/modules/auth/interfaces';

@Injectable()
export class AuthGuard {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isDev()) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorizationHeader = request.headers['authorization'];

    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    const decodedToken = await this.authService.verifyToken(token);
    request.user = decodedToken;

    return true;
  }
}
