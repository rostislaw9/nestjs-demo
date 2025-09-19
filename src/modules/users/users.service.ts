import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { ILike, In, Repository } from 'typeorm';

import { RedisService } from 'src/modules/cache/redis.service';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';
import { WorkItemStatus } from 'src/modules/work-items/entities/work-item.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { LocationPrivacy, User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(OrganizationMember)
    private readonly orgMembers: Repository<OrganizationMember>,
    private readonly cache: RedisService,
  ) {}

  private userKey(id: string) {
    return `user:${id}`;
  }

  private emailKey(email: string) {
    return `user:email:${email}`;
  }

  async findOne(id: string): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }

    const cached = await this.cache.get(this.userKey(id));
    if (cached) {
      return plainToInstance(User, JSON.parse(cached));
    }

    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.cache.set(this.userKey(id), JSON.stringify(user));
    await this.cache.set(this.emailKey(user.email), JSON.stringify(user));

    return plainToInstance(User, user);
  }

  async findByEmail(email: string, firebaseUID?: string): Promise<User | null> {
    const cached = await this.cache.get(this.emailKey(email));
    if (cached) {
      return plainToInstance(User, JSON.parse(cached));
    }

    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    if (firebaseUID && firebaseUID !== user.firebaseUID) {
      user.firebaseUID = firebaseUID;
      await this.users.save(user);

      await this.cache.del(this.userKey(user.id));
      await this.cache.del(this.emailKey(email));
    }

    await this.cache.set(this.userKey(user.id), JSON.stringify(user));
    await this.cache.set(this.emailKey(email), JSON.stringify(user));

    return plainToInstance(User, user);
  }

  async searchByEmail(q: string): Promise<User[]> {
    const users = await this.users.find({
      where: { email: ILike(`%${q}%`) },
      take: 10,
      order: { email: 'ASC' },
    });
    return plainToInstance(User, users);
  }

  async searchColleagues(callerId: string, q: string): Promise<User[]> {
    const callerMemberships = await this.orgMembers.find({
      where: { userId: callerId },
      select: ['organizationId'],
    });
    if (!callerMemberships.length) return [];

    const orgIds = callerMemberships.map((m) => m.organizationId);

    const colleagueMembers = await this.orgMembers.find({
      where: { organizationId: In(orgIds) },
      select: ['userId'],
    });

    const colleagueIds = [
      ...new Set(
        colleagueMembers.map((m) => m.userId).filter((id) => id !== callerId),
      ),
    ];
    if (!colleagueIds.length) return [];

    const users = await this.users.find({
      where: { id: In(colleagueIds), email: ILike(`%${q}%`) },
      take: 10,
      order: { email: 'ASC' },
    });
    return plainToInstance(User, users);
  }

  async findAll(): Promise<User[]> {
    const users = await this.users.find();
    return plainToInstance(User, users);
  }

  async findAllWithStats(): Promise<
    Array<{
      user: User;
      workItemCount: number;
      completedCount: number;
    }>
  > {
    const users = await this.users.find({
      relations: ['workItems'],
    });

    return users.map((user) => ({
      user: plainToInstance(User, user),
      workItemCount: user.workItems?.length ?? 0,
      completedCount:
        user.workItems?.filter((item) => item.status === WorkItemStatus.DONE)
          .length ?? 0,
    }));
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.users.create(createUserDto);
    await this.users.save(user);

    await this.cache.set(this.userKey(user.id), JSON.stringify(user));
    await this.cache.set(this.emailKey(user.email), JSON.stringify(user));

    return plainToInstance(User, user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }

    const user = await this.users.preload({ id, ...updateUserDto });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.users.save(user);

    await this.cache.del(this.userKey(id));
    await this.cache.del(this.emailKey(updatedUser.email));

    return plainToInstance(User, updatedUser);
  }

  async delete(id: string): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }

    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.users.delete(id);

    await this.cache.del(this.userKey(id));
    await this.cache.del(this.emailKey(user.email));
  }

  async findUsersWithVisibleLocation(callerId: string): Promise<User[]> {
    if (!isUUID(callerId)) {
      throw new BadRequestException(`Invalid UUID format: ${callerId}`);
    }

    const callerMemberships = await this.orgMembers.find({
      where: { userId: callerId },
      select: ['organizationId'],
    });
    const callerOrgIds = callerMemberships
      .map((m) => m.organizationId)
      .filter((id) => isUUID(id));

    const query = this.users
      .createQueryBuilder('user')
      .leftJoin(OrganizationMember, 'orgMember', 'orgMember.userId = user.id')
      .where('user.latitude IS NOT NULL')
      .andWhere('user.longitude IS NOT NULL')
      .andWhere('user.id != :callerId', { callerId })
      .andWhere(
        callerOrgIds.length > 0
          ? `(user.locationPrivacy = :publicPrivacy 
              OR (user.locationPrivacy = :orgPrivacy 
                  AND orgMember.organizationId IN (:...callerOrgIds)))`
          : `user.locationPrivacy = :publicPrivacy`,
        {
          publicPrivacy: LocationPrivacy.PUBLIC,
          orgPrivacy: LocationPrivacy.ORGANIZATIONS,
          ...(callerOrgIds.length > 0 ? { callerOrgIds } : {}),
        },
      )
      .distinct(true);

    const users = await query.getMany();
    return plainToInstance(User, users);
  }
}
