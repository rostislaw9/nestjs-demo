import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';
import { ActivitiesModule } from 'src/modules/activities/activities.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { WorkItem } from 'src/modules/work-items/entities/work-item.entity';
import { WorkItemsModule } from 'src/modules/work-items/work-items.module';

import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, WorkItem, OrganizationMember]),
    ActivitiesModule,
    AuthModule,
    UsersModule,
    WorkItemsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, AuthGuard, SelfOrRolesGuard],
})
export class CommentsModule {}
