import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './models/notification.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { BusinessUser } from 'src/business/model/businessUser.model';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async findAll(user: DecodedUser, page: number = 1, limit: number = 10) {
    //Only 30 days notifications

    try {
      let userId = user.id;

      // if (user.userType === BusinessUser.name) {
      //   userId = user.businessProfile;
      // }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const query = {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: thirtyDaysAgo },
      };
      console.log("Query for notifications:", query);

      const [notifications, totalCount] = await Promise.all([
        this.notificationModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('targetUser', '_id id name profilePhoto cover logo'),

        this.notificationModel.countDocuments(query),
      ]);
      console.log("Fetched notifications:", notifications);
      return {
        success: true,
        notifications,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page,
        limit,
      };
    } catch (error) {
      throw new Error('Error fetching notifications: ' + error.message);
    }
  }

  async findUnread(user: DecodedUser, page: number = 1, limit: number = 10) {
    let userId = user.id;
    // if (user.userType === BusinessUser.name) {
    //   userId = user.businessProfile;
    // }
    return await this.notificationModel
      .find({
        user: new mongoose.Types.ObjectId(userId),
        isRead: false,
      })
      .sort({ createdAt: -1 })
      .populate('targetUser', '_id id name profilePhoto')
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async findOne(id: string, user: DecodedUser) {
    let userId = user.id;
    // if (user.userType === BusinessUser.name) {
    //   userId = user.businessProfile;
    // }
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

  async readAll(user: DecodedUser) {
    let userId = user.id;
    // if (user.userType === BusinessUser.name) {
    //   userId = user.businessProfile;
    // }
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

  async remove(id: string, user: DecodedUser) {
    let userId = user.id;
    // if (user.userType === BusinessUser.name) {
    //   userId = user.businessProfile;
    // }
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

  async countUnread(user: DecodedUser){
    const unread = await this.notificationModel
      .find({
        user: new mongoose.Types.ObjectId(user.id),
        isRead: false,
      });
    return {
      success: true,
      message: "Count fetched successfully.",
      count: unread.length,
    };
  }
}
