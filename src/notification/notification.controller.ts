import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  BadRequestException,
  Query,
  Post,
  Body,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { NotificationTypes } from 'src/enums/event.enums';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('all')
  @UseGuards(JwtGuard2)
  async findAll(
    @TokenDecoder() user: DecodedUser,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const result = await this.notificationService.findAll(
      user,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    if (result.success) {
      return {
        notifications: result.notifications,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      };
    }
  }

  @Get('unread')
  @UseGuards(JwtGuard2)
  async findUnread(@TokenDecoder() user: DecodedUser, @Query('page') page: string,
    @Query('limit') limit: string) {
    const notifications = await this.notificationService.findUnread(user, page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10);
    return { notifications, count: notifications.length };
  }

  @Get('read/:id')
  @UseGuards(JwtGuard2)
  async findOne(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.findOne(id, user);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return result.notification;
  }

  @Get('read')
  @UseGuards(JwtGuard2)
  async readAll(@TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.readAll(user);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message };
  }

  @Delete('remove/:id')
  @UseGuards(JwtGuard2)
  async remove(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.remove(id, user);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message };
  }

  @Get('unread/count')
  @UseGuards(JwtGuard2)
  async countUnread(@TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.countUnread(user);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { count: result.count };
  }
  @Get('types')
  async getNotificationTypes() {
    const types = Object.values(NotificationTypes);
    return { types };
  }

  @Post('broadcast')
  @UseGuards(JwtGuard2)
  async createBroadcast(@TokenDecoder() user: DecodedUser, @Body() data: CreateBroadcastDto) {
    const result = await this.notificationService.createBroadcast(user, data);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message };
  }



}
