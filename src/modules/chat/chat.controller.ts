import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators';
import { AuthGuard, SelfOrRolesGuard } from 'src/common/guards';

import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { EditMessageDto } from './dto/edit-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { DirectMessage } from './entities/direct-message.entity';

@ApiBearerAuth('access-token')
@Roles('admin')
@UseGuards(AuthGuard, SelfOrRolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users/:id/messages')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send a direct message' })
  @ApiOkResponse({ type: DirectMessage })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async send(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: SendMessageDto,
  ): Promise<DirectMessage> {
    const message = await this.chatService.send(userId, dto);
    this.chatGateway.emitMessage(message);
    return message;
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List DM conversations' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async conversations(@Param('id', ParseUUIDPipe) userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get(':peerId')
  @ApiOperation({ summary: 'Get conversation with a peer' })
  @ApiOkResponse({ type: [DirectMessage] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async conversation(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('peerId', ParseUUIDPipe) peerId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ): Promise<DirectMessage[]> {
    return this.chatService.getConversation(
      userId,
      peerId,
      limit ? Number(limit) : 50,
      before,
    );
  }

  @Post(':peerId/read')
  @ApiOperation({ summary: 'Mark messages from peer as read' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async markRead(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('peerId', ParseUUIDPipe) peerId: string,
  ): Promise<void> {
    await this.chatService.markRead(userId, peerId);
    this.chatGateway.emitRead(userId, peerId);
  }

  @Patch(':peerId/:messageId')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiOkResponse({ type: DirectMessage })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async editMessage(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('peerId', ParseUUIDPipe) peerId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: EditMessageDto,
  ): Promise<DirectMessage> {
    const message = await this.chatService.editMessage(userId, messageId, dto);
    this.chatGateway.emitEdited(message, peerId);
    return message;
  }

  @Delete(':peerId/:messageId')
  @ApiOperation({ summary: 'Delete a single message' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteMessage(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('peerId', ParseUUIDPipe) peerId: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<void> {
    await this.chatService.deleteMessage(userId, messageId);
    this.chatGateway.emitDeleted(messageId, userId, peerId);
  }

  @Delete(':peerId')
  @ApiOperation({ summary: 'Delete all messages with a peer' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deleteConversation(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('peerId', ParseUUIDPipe) peerId: string,
  ): Promise<void> {
    await this.chatService.deleteConversation(userId, peerId);
    this.chatGateway.emitConversationDeleted(userId, peerId);
  }
}
