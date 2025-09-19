import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, RolesGuard, SelfOrRolesGuard } from 'src/common/guards';
import { AuthModule } from 'src/modules/auth/auth.module';
import { RedisModule } from 'src/modules/cache/redis.module';

import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RedisModule, AuthModule],
  providers: [UsersService, AuthGuard, RolesGuard, SelfOrRolesGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
