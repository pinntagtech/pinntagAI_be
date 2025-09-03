import { BadRequestException, Injectable } from '@nestjs/common';
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
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { Broadcast } from './models/broadcast.model';
import { BroadcastStatus, NotificationTypes } from 'src/enums/event.enums';
import { FirebaseService } from './firebase.service';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import { TokenTypes } from 'src/enums/auth.enums';
import { User } from 'src/user/models/user.model';
import { Business } from 'src/business/model/business.model';
import { Queue, Worker } from 'bullmq';
import { RedisBullService } from './redisBull.service';
import { DriveService } from 'src/drive/drive.service';
const redisConfig = { host: 'localhost', port: 6379 }; // your Redis settings
const broadcastQueue = new Queue('broadcastQueue', { connection: redisConfig });

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Broadcast.name)
    private readonly broadcastModel: Model<Broadcast>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly redisBullService: RedisBullService,
    private readonly driveService: DriveService,
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
      console.log('Query for notifications:', query);

      const [notifications, totalCount] = await Promise.all([
        this.notificationModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('targetUser', '_id id name profilePhoto cover logo'),

        this.notificationModel.countDocuments(query),
      ]);
      console.log('Fetched notifications:', notifications);
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

  async countUnread(user: DecodedUser) {
    const unread = await this.notificationModel.find({
      user: new mongoose.Types.ObjectId(user.id),
      isRead: false,
    });
    return {
      success: true,
      message: 'Count fetched successfully.',
      count: unread.length,
    };
  }

  async createBroadcast(user: DecodedUser, data: CreateBroadcastDto,image: Express.Multer.File) {
    let isScheduled = false;
    if (data.isScheduled && data.isScheduled == 'true') {
      isScheduled = true;
    }
    let scheduleDate = null;
    if (isScheduled && data.schedule && data.schedule !== '') {
      scheduleDate = new Date(data.schedule);
    }
    if (isScheduled && (!scheduleDate || scheduleDate <= new Date())) {
      return {
        success: false,
        message: 'Invalid schedule date',
      };
    }
  
    let broadcastObj = {
      title: data.title,
      message: data.message,
      creator: new mongoose.Types.ObjectId(user.id),
      business: new mongoose.Types.ObjectId(user.businessProfile),
    };
    if (data.users && data.users !== '') {
      let users = data.users.split(',').map((id) => id.trim());
      broadcastObj['users'] = users.map(
        (userId) => new mongoose.Types.ObjectId(userId),
      );
    }
    if(image){
      const imageUrl = await this.driveService.noDriveUpload(image);
      broadcastObj['image'] = imageUrl;
    }

    const broadcast = await this.broadcastModel.create(broadcastObj);

    if (!isScheduled) {
      this.redisBullService.triggerBroadcast(broadcast.id);
    } else {
      await this.broadcastModel.updateOne(
        { _id: broadcast.id },
        { $set: { status: BroadcastStatus.SCHEDULED, schedule: scheduleDate } },
      );
      const delay = scheduleDate.getTime() - Date.now();
      await this.redisBullService.addBroadcastJob(broadcast.id, delay);
    }

    return {
      success: true,
      message: 'Broadcast created successfully.',
      data: broadcast,
    };
  }
  async getBroadcast(id: string) {
    const broadcast = await this.broadcastModel.findById(id);
    if (!broadcast) {
      return {
        success: false,
        message: 'Broadcast not found',
      };
    }
    return {
      success: true,
      message: 'Broadcast status fetched successfully',
      data: broadcast,
    };
  }
  async getBroadcasts(page:number,limit:number) {
    const broadcasts = await this.broadcastModel.find().skip((page - 1) * limit).limit(limit);
    const totalCount = await this.broadcastModel.countDocuments();
    if (!broadcasts || broadcasts.length === 0) {
      return {
        success: false,
        message: 'Broadcast not found',
      };
    }
    return {
      success: true,
      message: 'Broadcast status fetched successfully',
      data: broadcasts,
      total: totalCount,
    };
  }

  async cancelBroadcast(id: string) {
    const broadcast = await this.broadcastModel.findById(id);
    if (!broadcast) {
      return {
        success: false,
        message: 'Broadcast not found',
      };
    }
    if(broadcast.status === BroadcastStatus.COMPLETED || broadcast.status === BroadcastStatus.CANCELLED || broadcast.status === BroadcastStatus.FAILED) {
      return {
        success: false,
        message: `Broadcast cannot be cancelled as it is already in ${broadcast.status} status`,
      };
    }
    if(broadcast.schedulerId && broadcast.schedulerId !== '') {
      await this.redisBullService.removeBroadcastJob(broadcast.schedulerId);
    }

    const result = await this.broadcastModel.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: { status: BroadcastStatus.CANCELLED },
      },
    );

    return {
      success: true,
      message: 'Broadcast cancelled successfully',
      data: result,
    };
  }
}
