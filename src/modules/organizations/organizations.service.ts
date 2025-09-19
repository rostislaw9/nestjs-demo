import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';

import { ActivitiesService } from 'src/modules/activities/activities.service';
import { ActivityType } from 'src/modules/activities/entities/activity.entity';
import { UsersService } from 'src/modules/users/users.service';

import {
  AddMemberDto,
  CreateOrganizationDto,
  UpdateMemberDto,
  UpdateOrganizationDto,
} from './dto';
import {
  OrganizationMember,
  OrganizationRole,
} from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly members: Repository<OrganizationMember>,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async findForUser(userId: string): Promise<Organization[]> {
    this.assertUuid(userId);

    const memberships = await this.members.find({
      where: { userId },
      relations: ['organization', 'organization.members'],
      order: { createdAt: 'ASC' },
    });

    return memberships.map((membership) => membership.organization);
  }

  async create(
    ownerId: string,
    dto: CreateOrganizationDto,
  ): Promise<Organization> {
    const owner = await this.usersService.findOne(ownerId);

    this.assertUuid(ownerId);

    const organization = this.organizations.create({
      ownerId,
      name: dto.name,
      description: dto.description,
    });
    const saved = await this.organizations.save(organization);

    await this.members.save(
      this.members.create({
        organizationId: saved.id,
        userId: ownerId,
        role: OrganizationRole.OWNER,
      }),
    );

    await this.activitiesService.create({
      userId: ownerId,
      type: ActivityType.ORGANIZATION_CREATED,
      description: `${owner?.displayName ?? owner.email} created organization "${saved.name}"`,
      metadata: { organizationId: saved.id, organizationName: saved.name },
    });

    return this.findOneForUser(ownerId, saved.id);
  }

  async findMembers(
    requesterId: string,
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    await this.assertOrganizationAccess(requesterId, organizationId);

    return this.members.find({
      where: { organizationId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async addMember(
    requesterId: string,
    organizationId: string,
    dto: AddMemberDto,
  ): Promise<OrganizationMember> {
    const requester = await this.usersService.findOne(requesterId);

    const requesterMembership = await this.assertOrganizationAccess(
      requesterId,
      organizationId,
    );

    if (requesterMembership.role === OrganizationRole.MEMBER) {
      throw new UnauthorizedException('Only owners and admins can add members');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new NotFoundException(`User ${dto.email} not found`);

    const existing = await this.members.findOne({
      where: { organizationId, userId: user.id },
    });
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    const membership = await this.members.save(
      this.members.create({
        organizationId,
        userId: user.id,
        role: dto.role ?? OrganizationRole.MEMBER,
      }),
    );

    await this.activitiesService.create({
      userId: requesterId,
      type: ActivityType.ORGANIZATION_MEMBER_ADDED,
      description: `${requester?.displayName ?? requester.email} added ${user?.displayName ?? user.email} to an organization`,
      metadata: {
        organizationId,
        addedUserId: user.id,
        addedUserEmail: user.email,
      },
    });

    return this.members.findOneOrFail({
      where: { id: membership.id },
      relations: ['user'],
    });
  }

  async updateMember(
    requesterId: string,
    organizationId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<OrganizationMember> {
    const requesterMembership = await this.assertOrganizationAccess(
      requesterId,
      organizationId,
    );

    if (requesterMembership.role === OrganizationRole.MEMBER) {
      throw new UnauthorizedException(
        'Only owners and admins can change member roles',
      );
    }

    const membership = await this.members.findOne({
      where: { id: memberId, organizationId },
    });
    if (!membership) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    if (membership.role === OrganizationRole.OWNER) {
      throw new UnauthorizedException('Cannot change the owner role');
    }

    membership.role = dto.role;
    return this.members.save(membership);
  }

  async removeMember(
    requesterId: string,
    organizationId: string,
    memberId: string,
  ): Promise<void> {
    const requesterMembership = await this.assertOrganizationAccess(
      requesterId,
      organizationId,
    );

    const membership = await this.members.findOne({
      where: { id: memberId, organizationId },
    });
    if (!membership) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    if (membership.role === OrganizationRole.OWNER) {
      throw new UnauthorizedException('Cannot remove the owner');
    }

    if (
      requesterMembership.role === OrganizationRole.MEMBER &&
      membership.userId !== requesterId
    ) {
      throw new UnauthorizedException('Members can only remove themselves');
    }

    await this.members.delete({ id: memberId });
  }

  async update(
    requesterId: string,
    organizationId: string,
    dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const requester = await this.usersService.findOne(requesterId);

    const requesterMembership = await this.assertOrganizationAccess(
      requesterId,
      organizationId,
    );

    if (requesterMembership.role === OrganizationRole.MEMBER) {
      throw new UnauthorizedException(
        'Only owners and admins can edit organizations',
      );
    }

    const organization = await this.organizations.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    Object.assign(
      organization,
      Object.fromEntries(
        Object.entries(dto).filter(([, value]) => value !== undefined),
      ),
    );

    const saved = await this.organizations.save(organization);

    await this.activitiesService.create({
      userId: requesterId,
      type: ActivityType.ORGANIZATION_UPDATED,
      description: `${requester?.displayName ?? requester.email} updated organization "${saved.name}"`,
      metadata: { organizationId: saved.id, organizationName: saved.name },
    });

    return this.findOneForUser(requesterId, saved.id);
  }

  async delete(requesterId: string, organizationId: string): Promise<void> {
    const requester = await this.usersService.findOne(requesterId);

    const requesterMembership = await this.assertOrganizationAccess(
      requesterId,
      organizationId,
    );

    if (requesterMembership.role !== OrganizationRole.OWNER) {
      throw new UnauthorizedException('Only owners can delete organizations');
    }

    const organization = await this.organizations.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    await this.organizations.delete({ id: organizationId });

    await this.activitiesService.create({
      userId: requesterId,
      type: ActivityType.ORGANIZATION_DELETED,
      description: `${requester?.displayName ?? requester.email} deleted organization "${organization.name}"`,
      metadata: {
        organizationId,
        organizationName: organization.name,
      },
    });
  }

  private async findOneForUser(userId: string, organizationId: string) {
    await this.assertOrganizationAccess(userId, organizationId);

    const organization = await this.organizations.findOne({
      where: { id: organizationId },
      relations: ['members'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    return organization;
  }

  private async assertOrganizationAccess(
    userId: string,
    organizationId: string,
  ) {
    this.assertUuid(userId);
    this.assertUuid(organizationId);

    const membership = await this.members.findOne({
      where: { userId, organizationId },
    });

    if (!membership) {
      throw new UnauthorizedException('Organization access denied');
    }

    return membership;
  }

  private assertUuid(value: string) {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID format: ${value}`);
    }
  }
}
