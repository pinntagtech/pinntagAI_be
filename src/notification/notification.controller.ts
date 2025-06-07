import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UserGuard } from 'src/auth/guards/user.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('all')
  @UseGuards(JwtGuard2)
  async findAll(@TokenDecoder() user: DecodedUser) {
    const notifications = await this.notificationService.findAll(user.id);
    return { notifications };
  }

  @Get('unread')
  @UseGuards(JwtGuard2)
  async findUnread(@TokenDecoder() user: DecodedUser) {
    const notifications = await this.notificationService.findUnread(user.id);
    return { notifications, count: notifications.length };
  }

  @Get('read/:id')
  @UseGuards(JwtGuard2)
  async findOne(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.findOne(id, user.id);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return result.notification;
  }

  @Get('read')
  @UseGuards(JwtGuard2)
  async readAll(@TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.readAll(user.id);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message };
  }

  @Delete('remove/:id')
  @UseGuards(JwtGuard2)
  async remove(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.remove(id, user.id);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return { message: result.message };
  }
}
