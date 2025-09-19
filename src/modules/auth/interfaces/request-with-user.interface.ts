import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface RequestWithUser<
  Params = Record<string, string>,
  Query = Record<string, string>,
  Body = Record<string, any>,
> extends Request<Query, any, Body, Params> {
  user?: DecodedIdToken;
}
