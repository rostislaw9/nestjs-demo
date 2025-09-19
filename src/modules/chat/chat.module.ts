import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';
import { AuthModule } from 'src/modules/auth/auth.module';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersModule } from 'src/modules/users/users.module';

import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { DirectMessage } from './entities/direct-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DirectMessage, User]),
    AuthModule,
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, AuthGuard, SelfOrRolesGuard],
  exports: [ChatService],
})
export class ChatModule {}
