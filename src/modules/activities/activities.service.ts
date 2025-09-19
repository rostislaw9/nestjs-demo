import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';

import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';

import { CreateActivityDto } from './dto';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
    @InjectRepository(OrganizationMember)
    private readonly orgMembers: Repository<OrganizationMember>,
  ) {}

  async create(dto: CreateActivityDto): Promise<Activity> {
    const activity = this.activities.create(dto);
    return this.activities.save(activity);
  }

  async findByUser(
    userId: string,
    page?: number,
    limit = 10,
    organizationId?: string,
  ): Promise<PaginatedResponse<Activity>> {
    let where: FindOptionsWhere<Activity> = {};

    if (organizationId) {
      const membership = await this.orgMembers.findOne({
        where: { userId, organizationId },
      });
      if (!membership) {
        throw new UnauthorizedException('Organization access denied');
      }
      const members = await this.orgMembers.find({
        where: { organizationId },
        select: ['userId'],
      });
      const memberIds = members.map((m) => m.userId);
      where = { userId: In(memberIds), organizationId };
    } else {
      where = { userId };
    }

    const pagination: { skip?: number; take?: number } = {};
    if (page !== undefined) {
      pagination.skip = (page - 1) * limit;
      pagination.take = limit;
    }

    const [data, totalCount] = await this.activities.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      relations: ['user'],
      ...pagination,
    });

    const currentPage = page ?? 1;
    const totalPages = Math.ceil(totalCount / limit);

    return { data, totalCount, totalPages, currentPage, limit };
  }

  async findRecent(limit = 50): Promise<Activity[]> {
    return this.activities.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }
}
