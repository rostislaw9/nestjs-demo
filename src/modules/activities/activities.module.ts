import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';
import { AuthModule } from 'src/modules/auth/auth.module';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';
import { UsersModule } from 'src/modules/users/users.module';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity } from './entities/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, OrganizationMember]),
    AuthModule,
    UsersModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, AuthGuard, SelfOrRolesGuard],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
