import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from 'src/common/decorators';
import { AuthGuard, RolesGuard, SelfOrRolesGuard } from 'src/common/guards';

import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'List of all users retrieved', type: [User] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @UseGuards(AuthGuard, SelfOrRolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user data by id' })
  @ApiOkResponse({ description: 'User data retrieved', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async getUser(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Get('by-email/:email')
  @Roles('admin')
  @UseGuards(AuthGuard, SelfOrRolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user data by email' })
  @ApiOkResponse({ description: 'User data retrieved', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  @Post('get-or-create')
  @Roles('admin')
  @UseGuards(AuthGuard, SelfOrRolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get existing or create a new user' })
  @ApiCreatedResponse({
    description: 'User retrieved or a new user created',
    type: User,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async getOrCreateUser(@Body() dto: CreateUserDto): Promise<User> {
    const user = await this.usersService.findByEmail(
      dto.email,
      dto.firebaseUID,
    );
    return user ?? (await this.usersService.create(dto));
  }

  @Post()
  @Roles('admin')
  @UseGuards(AuthGuard, SelfOrRolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(AuthGuard, SelfOrRolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user fields' })
  @ApiOkResponse({ description: 'User updated', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete user' })
  @ApiOkResponse({ description: 'User deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
