import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';
import { ActivitiesModule } from 'src/modules/activities/activities.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';

import { OrganizationMember } from './entities/organization-member.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember]),
    ActivitiesModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, AuthGuard, SelfOrRolesGuard],
})
export class OrganizationsModule {}
