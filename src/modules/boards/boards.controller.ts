import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators';
import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';

import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpsertElementDto } from './dto/upsert-element.dto';
import { BoardElement } from './entities/board-element.entity';
import { Board } from './entities/board.entity';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard, SelfOrRolesGuard)
@Controller('users/:id/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List boards for user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: [Board] })
  async list(
    @Param('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponse<Board>> {
    return this.boardsService.listForUser(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a board' })
  @ApiCreatedResponse({ type: Board })
  async create(
    @Param('id') userId: string,
    @Body() dto: CreateBoardDto,
  ): Promise<Board> {
    return this.boardsService.create(userId, dto);
  }

  @Get(':boardId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get board by id' })
  @ApiOkResponse({ type: Board })
  async getOne(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
  ): Promise<Board> {
    return this.boardsService.findOneOrFail(boardId, userId);
  }

  @Patch(':boardId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update board title/description' })
  @ApiOkResponse({ type: Board })
  async update(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ): Promise<Board> {
    return this.boardsService.updateBoard(boardId, userId, dto);
  }

  @Delete(':boardId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a board' })
  @ApiNoContentResponse()
  async delete(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
  ): Promise<void> {
    return this.boardsService.deleteBoard(boardId, userId);
  }

  @Post(':boardId/members/:targetUserId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add a member to the board' })
  @ApiNoContentResponse()
  async addMember(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<void> {
    await this.boardsService.addMember(boardId, userId, targetUserId);
  }

  @Delete(':boardId/members/:targetUserId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the board' })
  @ApiNoContentResponse()
  async removeMember(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
    @Param('targetUserId') targetUserId: string,
  ): Promise<void> {
    return this.boardsService.removeMember(boardId, userId, targetUserId);
  }

  @Get(':boardId/elements')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all elements on a board' })
  @ApiOkResponse({ type: [BoardElement] })
  async getElements(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
  ): Promise<BoardElement[]> {
    return this.boardsService.getElements(boardId, userId);
  }

  @Post(':boardId/elements')
  @Roles('admin')
  @ApiOperation({ summary: 'Create or update an element' })
  @ApiCreatedResponse({ type: BoardElement })
  async upsertElement(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
    @Body() dto: UpsertElementDto,
  ): Promise<BoardElement> {
    return this.boardsService.upsertElement(boardId, userId, dto);
  }

  @Delete(':boardId/elements/:elementId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an element' })
  @ApiNoContentResponse()
  async deleteElement(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
    @Param('elementId') elementId: string,
  ): Promise<void> {
    return this.boardsService.deleteElement(boardId, elementId, userId);
  }

  @Delete(':boardId/elements')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear all elements (owner only)' })
  @ApiNoContentResponse()
  async clearBoard(
    @Param('id') userId: string,
    @Param('boardId') boardId: string,
  ): Promise<void> {
    return this.boardsService.clearBoard(boardId, userId);
  }
}
