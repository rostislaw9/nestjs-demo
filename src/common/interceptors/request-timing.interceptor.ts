import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as chalk from 'chalk';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const userId = req.user?.id || 'anonymous';
    const requestId = req.requestId || 'no-request-id';
    const start = Date.now();

    console.log(
      chalk.yellow.bold('[INT START]') +
        chalk.white(` ${method} ${url}`) +
        chalk.cyan(` [user: ${userId}]`) +
        chalk.white(` [${requestId}]`),
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - start;
        const size = data ? JSON.stringify(data).length : 0;
        const durationColor = duration > 100 ? chalk.red : chalk.gray;

        console.log(
          chalk.green.bold('[INT END]') +
            chalk.white(` ${method} ${url}`) +
            chalk.cyan(` [user: ${userId}] `) +
            durationColor(`${duration}ms`) +
            chalk.blue(` ${size}b`) +
            chalk.white(` [${requestId}]`),
        );
      }),
      map((data) => ({
        data,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
