import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators';
import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';

import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto';
import { Activity } from './entities/activity.entity';

@Controller('users/:id/activities')
@UseGuards(AuthGuard, SelfOrRolesGuard)
@ApiBearerAuth('access-token')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create activity log entry' })
  @ApiCreatedResponse({ type: Activity })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async create(
    @Param('id') userId: string,
    @Body() dto: CreateActivityDto,
  ): Promise<Activity> {
    return this.activitiesService.create({ ...dto, userId });
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get activity log for user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiOkResponse({ type: [Activity] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findByUser(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<PaginatedResponse<Activity>> {
    return this.activitiesService.findByUser(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : 10,
      organizationId,
    );
  }
}
