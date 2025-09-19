import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';

import { EditMessageDto } from './dto/edit-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { DirectMessage } from './entities/direct-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(DirectMessage)
    private readonly messages: Repository<DirectMessage>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async send(senderId: string, dto: SendMessageDto): Promise<DirectMessage> {
    const recipient = await this.users.findOne({
      where: { id: dto.recipientId },
    });
    if (!recipient) {
      throw new NotFoundException(`User with ID ${dto.recipientId} not found`);
    }

    const msg = this.messages.create({
      senderId,
      recipientId: dto.recipientId,
      body: dto.body,
    });
    const saved = await this.messages.save(msg);

    return this.messages.findOne({
      where: { id: saved.id },
      relations: ['sender', 'recipient'],
    }) as Promise<DirectMessage>;
  }

  async getConversation(
    userId: string,
    peerId: string,
    limit = 50,
    before?: string,
  ): Promise<DirectMessage[]> {
    const qb = this.messages
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.recipient', 'recipient')
      .where(
        '(dm.senderId = :userId AND dm.recipientId = :peerId) OR (dm.senderId = :peerId AND dm.recipientId = :userId)',
        { userId, peerId },
      )
      .orderBy('dm.createdAt', 'DESC')
      .take(limit);

    if (before) {
      qb.andWhere(
        'dm.createdAt < (SELECT "createdAt" FROM direct_messages WHERE id = :before)',
        { before },
      );
    }

    const rows = await qb.getMany();
    return rows.reverse();
  }

  async getConversations(userId: string): Promise<
    {
      peer: User;
      lastMessage: DirectMessage | null;
      unreadCount: number;
    }[]
  > {
    const raw = await this.messages
      .createQueryBuilder('dm')
      .select([
        'CASE WHEN dm."senderId" = :uid THEN dm."recipientId" ELSE dm."senderId" END AS "peerId"',
        'MAX(dm."createdAt") AS "lastAt"',
      ])
      .where('dm."senderId" = :uid OR dm."recipientId" = :uid', { uid: userId })
      .groupBy(
        'CASE WHEN dm."senderId" = :uid THEN dm."recipientId" ELSE dm."senderId" END',
      )
      .setParameter('uid', userId)
      .getRawMany<{ peerId: string; lastAt: Date }>();

    const results = await Promise.all(
      raw.map(async ({ peerId }) => {
        const peer = await this.users.findOne({ where: { id: peerId } });
        if (!peer) return null;

        const lastMessage = await this.messages.findOne({
          where: [
            { senderId: userId, recipientId: peerId },
            { senderId: peerId, recipientId: userId },
          ],
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });

        const unreadCount = await this.messages.count({
          where: { senderId: peerId, recipientId: userId, read: false },
        });

        return { peer: plainToInstance(User, peer), lastMessage, unreadCount };
      }),
    );

    return (
      results.filter(Boolean) as {
        peer: User;
        lastMessage: DirectMessage | null;
        unreadCount: number;
      }[]
    ).sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? 0).getTime() -
        new Date(a.lastMessage?.createdAt ?? 0).getTime(),
    );
  }

  async editMessage(
    userId: string,
    messageId: string,
    dto: EditMessageDto,
  ): Promise<DirectMessage> {
    const msg = await this.messages.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId)
      throw new ForbiddenException('Cannot edit this message');
    await this.messages.update(messageId, { body: dto.body, edited: true });
    return this.messages.findOne({
      where: { id: messageId },
      relations: ['sender', 'recipient'],
    }) as Promise<DirectMessage>;
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const msg = await this.messages.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId)
      throw new ForbiddenException('Cannot delete this message');
    await this.messages.delete(messageId);
  }

  async deleteConversation(userId: string, peerId: string): Promise<void> {
    await this.messages
      .createQueryBuilder()
      .delete()
      .where(
        '("senderId" = :userId AND "recipientId" = :peerId) OR ("senderId" = :peerId AND "recipientId" = :userId)',
        { userId, peerId },
      )
      .execute();
  }

  async markRead(userId: string, peerId: string): Promise<void> {
    await this.messages.update(
      { senderId: peerId, recipientId: userId, read: false },
      { read: true },
    );
  }
}
