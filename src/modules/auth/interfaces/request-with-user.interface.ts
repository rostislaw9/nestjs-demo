import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

import { User } from 'src/modules/users/entities/user.entity';

export interface RequestWithUser<
  Params = Record<string, string>,
  Query = Record<string, string>,
  Body = Record<string, any>,
> extends Request<Query, any, Body, Params> {
  user?: User | DecodedIdToken;
}
