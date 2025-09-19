import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as chalk from 'chalk';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any)?.message || 'Internal server error';

    const requestId = (request as any).requestId || 'no-request-id';
    const userId = (request as any).user?.id || 'anonymous';

    const color =
      status >= 500 ? chalk.red : status >= 400 ? chalk.yellow : chalk.blue;

    console.log(
      color.bold(`[EXCEPTION]`) +
        color(
          ` ${request.method} ${request.url} ${status} [user: ${userId}] [${requestId}]`,
        ),
    );

    if (status >= 500 && exception instanceof Error && exception.stack) {
      console.log(chalk.red(exception.stack));
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId,
      error: message,
    });
  }
}
