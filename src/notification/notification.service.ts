import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './models/notification.model';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async findAll(userId: string) {
    //Only 30 days notifications
    return await this.notificationModel
      .find({
        user: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      })
      .sort({ createdAt: -1 })
      .populate('targetUser', '_id id name profilePhoto');
  }

  async findUnread(userId: string) {
    return await this.notificationModel
      .find({
        user: new mongoose.Types.ObjectId(userId),
        isRead: false,
      })
      .sort({ createdAt: -1 })
      .populate('targetUser', '_id id name profilePhoto');
  }

  async findOne(id: string, userId: string) {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        {
          _id: id,
          user: new mongoose.Types.ObjectId(userId),
        },
        { $set: { isRead: true, updatedAt: Date.now() } },
        { new: true },
      )
      .populate('targetUser', '_id id name profilePhoto');
    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }
    return {
      success: true,
      notification,
    };
  }

  async readAll(userId: string) {
    await this.notificationModel.updateMany(
      {
        user: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      { $set: { isRead: true, updatedAt: Date.now() } },
    );
    return {
      success: true,
      message: 'All notifications are read',
    };
  }

  async remove(id: string, userId: string) {
    const notification = await this.notificationModel.findOneAndDelete({
      _id: id,
      user: new mongoose.Types.ObjectId(userId),
    });
    if (!notification) {
      return {
        success: false,
        message: 'Notification not found',
      };
    }
    return {
      success: true,
      message: 'Notification deleted',
    };
  }
}
