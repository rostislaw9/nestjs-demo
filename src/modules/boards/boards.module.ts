import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';
import { AuthModule } from 'src/modules/auth/auth.module';
import { OrganizationMember } from 'src/modules/organizations/entities/organization-member.entity';
import { UsersModule } from 'src/modules/users/users.module';

import { BoardsController } from './boards.controller';
import { BoardsGateway } from './boards.gateway';
import { BoardsService } from './boards.service';
import { BoardElement } from './entities/board-element.entity';
import { BoardMember } from './entities/board-member.entity';
import { Board } from './entities/board.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board,
      BoardMember,
      BoardElement,
      OrganizationMember,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService, BoardsGateway, AuthGuard, SelfOrRolesGuard],
  exports: [BoardsGateway],
})
export class BoardsModule {}
