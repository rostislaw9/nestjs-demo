import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, RolesGuard, SelfOrRolesGuard } from 'src/common/guards';
import { AuthModule } from 'src/modules/auth/auth.module';
import { RedisModule } from 'src/modules/cache/redis.module';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';

import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OrganizationMember]),
    RedisModule,
    AuthModule,
  ],
  providers: [UsersService, AuthGuard, RolesGuard, SelfOrRolesGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
