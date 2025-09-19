import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Get API health status' })
  @ApiOkResponse({ description: 'API health status retrieved' })
  getHealth() {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
    };
  }
}
