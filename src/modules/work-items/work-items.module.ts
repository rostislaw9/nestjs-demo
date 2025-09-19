import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';
import { ActivitiesModule } from 'src/modules/activities/activities.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';

import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';

import { WorkItem } from './entities/work-item.entity';
import { WorkItemsController } from './work-items.controller';
import { WorkItemsGateway } from './work-items.gateway';
import { WorkItemsService } from './work-items.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkItem, OrganizationMember]),
    ActivitiesModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [WorkItemsController],
  providers: [WorkItemsService, WorkItemsGateway, AuthGuard, SelfOrRolesGuard],
  exports: [WorkItemsGateway],
})
export class WorkItemsModule {}
