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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators';
import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';

import {
  AddMemberDto,
  CreateOrganizationDto,
  UpdateMemberDto,
  UpdateOrganizationDto,
} from './dto';
import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

@Controller('users/:id/organizations')
@UseGuards(AuthGuard, SelfOrRolesGuard)
@ApiBearerAuth('access-token')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List organizations for a user' })
  @ApiOkResponse({ type: [Organization] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findForUser(@Param('id') userId: string): Promise<Organization[]> {
    return this.organizationsService.findForUser(userId);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create an organization' })
  @ApiCreatedResponse({ type: Organization })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async create(
    @Param('id') ownerId: string,
    @Body() dto: CreateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationsService.create(ownerId, dto);
  }

  @Get(':organizationId/members')
  @Roles('admin')
  @ApiOperation({ summary: 'List organization members' })
  @ApiOkResponse({ type: [OrganizationMember] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async findMembers(
    @Param('id') requesterId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<OrganizationMember[]> {
    return this.organizationsService.findMembers(requesterId, organizationId);
  }

  @Post(':organizationId/members')
  @Roles('admin')
  @ApiOperation({ summary: 'Add an existing user to an organization' })
  @ApiCreatedResponse({ type: OrganizationMember })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Organization or user not found' })
  @ApiConflictResponse({ description: 'User is already a member' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async addMember(
    @Param('id') requesterId: string,
    @Param('organizationId') organizationId: string,
    @Body() dto: AddMemberDto,
  ): Promise<OrganizationMember> {
    return this.organizationsService.addMember(
      requesterId,
      organizationId,
      dto,
    );
  }

  @Patch(':organizationId/members/:memberId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update member role' })
  @ApiOkResponse({ type: OrganizationMember })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Member not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async updateMember(
    @Param('id') requesterId: string,
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<OrganizationMember> {
    return this.organizationsService.updateMember(
      requesterId,
      organizationId,
      memberId,
      dto,
    );
  }

  @Delete(':organizationId/members/:memberId')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove member from organization' })
  @ApiNoContentResponse({ description: 'Member removed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Member not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async removeMember(
    @Param('id') requesterId: string,
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    return this.organizationsService.removeMember(
      requesterId,
      organizationId,
      memberId,
    );
  }

  @Patch(':organizationId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiOkResponse({ type: Organization })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async update(
    @Param('id') requesterId: string,
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationsService.update(requesterId, organizationId, dto);
  }

  @Delete(':organizationId')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiNoContentResponse({ description: 'Organization deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async delete(
    @Param('id') requesterId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<void> {
    return this.organizationsService.delete(requesterId, organizationId);
  }
}
