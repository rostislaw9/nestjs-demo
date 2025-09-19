import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';

import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpsertElementDto } from './dto/upsert-element.dto';
import { BoardElement } from './entities/board-element.entity';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boards: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly boardMembers: Repository<BoardMember>,
    @InjectRepository(BoardElement)
    private readonly elements: Repository<BoardElement>,
    @InjectRepository(OrganizationMember)
    private readonly orgMembers: Repository<OrganizationMember>,
  ) {}

  async listForUser(
    userId: string,
    page?: number,
    limit = 10,
  ): Promise<PaginatedResponse<Board>> {
    const qb = this.boards
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.members', 'member')
      .leftJoinAndSelect('member.user', 'memberUser')
      .where('board.ownerId = :userId', { userId })
      .orWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('bm.boardId')
          .from(BoardMember, 'bm')
          .where('bm.userId = :userId')
          .getQuery();
        return `board.id IN ${sub}`;
      })
      .setParameter('userId', userId)
      .orderBy('board.createdAt', 'DESC');

    const totalCount = await qb.getCount();

    if (page !== undefined) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const data = await qb.getMany();
    const currentPage = page ?? 1;
    const totalPages = Math.ceil(totalCount / limit);

    return { data, totalCount, totalPages, currentPage, limit };
  }

  async create(userId: string, dto: CreateBoardDto): Promise<Board> {
    if (dto.organizationId) {
      await this.assertOrgMember(userId, dto.organizationId);
    }

    const board = this.boards.create({
      title: dto.title,
      description: dto.description,
      ownerId: userId,
      organizationId: dto.organizationId,
    });
    const saved = await this.boards.save(board);

    await this.boardMembers.save(
      this.boardMembers.create({ boardId: saved.id, userId }),
    );

    return this.findOneOrFail(saved.id, userId);
  }

  async findOneOrFail(boardId: string, userId: string): Promise<Board> {
    const board = await this.boards.findOne({
      where: { id: boardId },
      relations: ['members', 'members.user'],
    });
    if (!board) throw new NotFoundException('Board not found');
    await this.assertAccess(userId, board);
    return board;
  }

  async updateBoard(
    boardId: string,
    userId: string,
    dto: UpdateBoardDto,
  ): Promise<Board> {
    const board = await this.boards.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException();
    if (dto.title !== undefined) board.title = dto.title;
    if (dto.description !== undefined) board.description = dto.description;
    return this.boards.save(board);
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.boards.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException();
    await this.boards.delete(boardId);
  }

  async addMember(
    boardId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<BoardMember> {
    const board = await this.boards.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== requesterId) throw new ForbiddenException();

    if (board.organizationId) {
      await this.assertOrgMember(targetUserId, board.organizationId);
    }

    const existing = await this.boardMembers.findOne({
      where: { boardId, userId: targetUserId },
    });
    if (existing) return existing;

    return this.boardMembers.save(
      this.boardMembers.create({ boardId, userId: targetUserId }),
    );
  }

  async removeMember(
    boardId: string,
    requesterId: string,
    targetUserId: string,
  ): Promise<void> {
    const board = await this.boards.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== requesterId && requesterId !== targetUserId) {
      throw new ForbiddenException();
    }
    await this.boardMembers.delete({ boardId, userId: targetUserId });
  }

  async getElements(boardId: string, userId: string): Promise<BoardElement[]> {
    await this.findOneOrFail(boardId, userId);
    return this.elements.find({
      where: { boardId },
      order: { zIndex: 'ASC', createdAt: 'ASC' },
    });
  }

  async upsertElement(
    boardId: string,
    userId: string,
    dto: UpsertElementDto,
  ): Promise<BoardElement> {
    await this.findOneOrFail(boardId, userId);

    if (dto.id) {
      const existing = await this.elements.findOne({
        where: { id: dto.id, boardId },
      });
      if (!existing) throw new NotFoundException('Element not found');

      Object.assign(existing, {
        type: dto.type,
        data: dto.data,
        color: dto.color ?? existing.color,
        strokeWidth: dto.strokeWidth ?? existing.strokeWidth,
        zIndex: dto.zIndex ?? existing.zIndex,
      });
      return this.elements.save(existing);
    }

    const el = this.elements.create({
      boardId,
      authorId: userId,
      type: dto.type,
      data: dto.data,
      color: dto.color ?? '#000000',
      strokeWidth: dto.strokeWidth ?? 2,
      zIndex: dto.zIndex ?? 0,
    });
    return this.elements.save(el);
  }

  async deleteElement(
    boardId: string,
    elementId: string,
    userId: string,
  ): Promise<void> {
    const el = await this.elements.findOne({
      where: { id: elementId, boardId },
    });
    if (!el) throw new NotFoundException('Element not found');

    const board = await this.boards.findOne({ where: { id: boardId } });
    if (el.authorId !== userId && board?.ownerId !== userId) {
      throw new ForbiddenException();
    }
    await this.elements.delete(elementId);
  }

  async clearBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.boards.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException();
    if (board.ownerId !== userId) throw new ForbiddenException();
    await this.elements.delete({ boardId });
  }

  private async assertAccess(userId: string, board: Board): Promise<void> {
    if (board.ownerId === userId) return;
    const member = await this.boardMembers.findOne({
      where: { boardId: board.id, userId },
    });
    if (!member) throw new ForbiddenException('No access to this board');
  }

  private async assertOrgMember(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const m = await this.orgMembers.findOne({
      where: { userId, organizationId },
    });
    if (!m) throw new ForbiddenException('Not a member of this organization');
  }
}
