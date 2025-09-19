import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators';
import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';

import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import {
  CreateWorkItemDto,
  ReorderWorkItemsDto,
  UpdateWorkItemDto,
} from './dto';
import { WorkItem } from './entities/work-item.entity';
import { WorkItemsService } from './work-items.service';

@Controller('users/:id/work-items')
@UseGuards(AuthGuard, SelfOrRolesGuard)
@ApiBearerAuth('access-token')
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List work items for a user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiOkResponse({ type: [WorkItem] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findAll(
    @Param('id') requesterId: string,
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ): Promise<PaginatedResponse<WorkItem>> {
    return this.workItemsService.findAll(
      requesterId,
      organizationId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : 10,
      status,
    );
  }

  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get work item stats for a user' })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiOkResponse({ description: 'Work item statistics' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getStats(
    @Param('id') requesterId: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<{
    total: number;
    done: number;
    open: number;
    highPriority: number;
    completion: number;
  }> {
    return this.workItemsService.getStats(requesterId, organizationId);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a work item' })
  @ApiCreatedResponse({ type: WorkItem })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async create(
    @Param('id') requesterId: string,
    @Body() dto: CreateWorkItemDto,
    @Query('organizationId') organizationId?: string,
  ): Promise<WorkItem> {
    return this.workItemsService.create(requesterId, dto, organizationId);
  }

  @Patch(':workItemId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a work item' })
  @ApiOkResponse({ type: WorkItem })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Work item not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async update(
    @Param('id') requesterId: string,
    @Param('workItemId') workItemId: string,
    @Body() dto: UpdateWorkItemDto,
    @Query('organizationId') organizationId?: string,
  ): Promise<WorkItem> {
    return this.workItemsService.update(
      requesterId,
      workItemId,
      dto,
      organizationId,
    );
  }

  @Post('reorder')
  @Roles('admin')
  @ApiOperation({ summary: 'Reorder work items' })
  @ApiNoContentResponse({ description: 'Reordered' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async reorder(
    @Param('id') requesterId: string,
    @Body() dto: ReorderWorkItemsDto,
    @Query('organizationId') organizationId?: string,
  ): Promise<void> {
    return this.workItemsService.reorder(requesterId, dto, organizationId);
  }

  @Delete(':workItemId')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a work item' })
  @ApiNoContentResponse({ description: 'Work item deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Work item not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async delete(
    @Param('id') requesterId: string,
    @Param('workItemId') workItemId: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<void> {
    return this.workItemsService.delete(
      requesterId,
      workItemId,
      organizationId,
    );
  }
}
