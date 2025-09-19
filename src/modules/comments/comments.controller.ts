import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators';
import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';

import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { Comment } from './entities/comment.entity';

@Controller('users/:id/work-items/:workItemId/comments')
@UseGuards(AuthGuard, SelfOrRolesGuard)
@ApiBearerAuth('access-token')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List comments for a work item' })
  @ApiOkResponse({ type: [Comment] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Work item not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findAll(
    @Param('id') ownerId: string,
    @Param('workItemId') workItemId: string,
  ): Promise<Comment[]> {
    return this.commentsService.findAll(ownerId, workItemId);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a comment on a work item' })
  @ApiCreatedResponse({ type: Comment })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Work item not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async create(
    @Param('id') ownerId: string,
    @Param('workItemId') workItemId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.create(ownerId, workItemId, dto);
  }

  @Patch(':commentId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiOkResponse({ type: Comment })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async update(
    @Param('id') ownerId: string,
    @Param('workItemId') workItemId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.update(ownerId, workItemId, commentId, dto);
  }

  @Delete(':commentId')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiNoContentResponse({ description: 'Comment deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async delete(
    @Param('id') ownerId: string,
    @Param('workItemId') workItemId: string,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.commentsService.delete(ownerId, workItemId, commentId);
  }
}
