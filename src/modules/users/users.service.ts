import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';

import { RedisService } from 'src/modules/cache/redis.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly cache: RedisService,
  ) {}

  private userKey(id: string) {
    return `user:${id}`;
  }

  private emailKey(email: string) {
    return `user:email:${email}`;
  }

  async findOne(id: string): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }

    const cached = await this.cache.get(this.userKey(id));
    if (cached) {
      return plainToInstance(User, JSON.parse(cached));
    }

    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.cache.set(this.userKey(id), JSON.stringify(user));
    await this.cache.set(this.emailKey(user.email), JSON.stringify(user));

    return plainToInstance(User, user);
  }

  async findByEmail(email: string, firebaseUID?: string): Promise<User | null> {
    const cached = await this.cache.get(this.emailKey(email));
    if (cached) {
      return plainToInstance(User, JSON.parse(cached));
    }

    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    if (firebaseUID && firebaseUID !== user.firebaseUID) {
      user.firebaseUID = firebaseUID;
      await this.users.save(user);

      await this.cache.del(this.userKey(user.id));
      await this.cache.del(this.emailKey(email));
    }

    await this.cache.set(this.userKey(user.id), JSON.stringify(user));
    await this.cache.set(this.emailKey(email), JSON.stringify(user));

    return plainToInstance(User, user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.users.find();
    return plainToInstance(User, users);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.users.create(createUserDto);
    await this.users.save(user);

    await this.cache.set(this.userKey(user.id), JSON.stringify(user));
    await this.cache.set(this.emailKey(user.email), JSON.stringify(user));

    return plainToInstance(User, user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }

    const user = await this.users.preload({ id, ...updateUserDto });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.users.save(user);

    await this.cache.del(this.userKey(id));
    await this.cache.del(this.emailKey(updatedUser.email));

    return plainToInstance(User, updatedUser);
  }

  async delete(id: string): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }

    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.users.delete(id);

    await this.cache.del(this.userKey(id));
    await this.cache.del(this.emailKey(user.email));
  }
}
