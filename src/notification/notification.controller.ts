import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { UserGuard } from 'src/auth/guards/user.guard';
import { Response } from 'express';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('all')
  @UseGuards(UserGuard)
  async findAll(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const notifications = await this.notificationService.findAll(user.id);
    return res.status(HttpStatus.OK).json({ notifications });
  }

  @Get('unread')
  @UseGuards(UserGuard)
  async findUnread(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const notifications = await this.notificationService.findUnread(user.id);
    return res
      .status(HttpStatus.OK)
      .json({ notifications, count: notifications.length });
  }

  @Get('read/:id')
  @UseGuards(UserGuard)
  async findOne(
    @Res() res: Response,
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.notificationService.findOne(id, user.id);
    if (!result.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    } else {
      return res.status(HttpStatus.OK).json(result.notification);
    }
  }

  @Get('read')
  @UseGuards(UserGuard)
  async readAll(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.notificationService.readAll(user.id);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }

  @Delete('remove/:id')
  @UseGuards(UserGuard)
  async remove(
    @Param('id') id: string,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.notificationService.remove(id, user.id);
    return res
      .status(result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
      .json({
        message: result.message,
      });
  }
}
