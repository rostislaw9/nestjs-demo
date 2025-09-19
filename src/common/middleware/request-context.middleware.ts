import { Injectable, NestMiddleware } from '@nestjs/common';
import * as chalk from 'chalk';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || randomUUID();
    (req as any).requestId = requestId;

    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      const statusColor =
        res.statusCode >= 500
          ? chalk.red
          : res.statusCode >= 400
            ? chalk.yellow
            : res.statusCode >= 300
              ? chalk.cyan
              : chalk.green;

      console.log(
        chalk.blue.bold('[MW]') +
          chalk.white(` ${req.method} ${req.originalUrl} → `) +
          statusColor(res.statusCode) +
          chalk.gray(` (${duration}ms)`) +
          chalk.white(` [${requestId}]`),
      );
    });

    res.setHeader('x-request-id', String(requestId));
    next();
  }
}
