import { Job, Queue, Worker } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import mongoose, { Model } from 'mongoose';
import { Broadcast } from './models/broadcast.model';
import { InjectModel } from '@nestjs/mongoose';
import { TokenTypes } from 'src/enums/auth.enums';
import { FirebaseService } from './firebase.service';
import { BroadcastStatus, NotificationTypes } from 'src/enums/event.enums';
import {
  Notification,
  NotificationDocument,
} from './models/notification.model';
import { User } from 'src/user/models/user.model';
import { Business } from 'src/business/model/business.model';
import { UserService } from 'src/user/user.service';
import { Follow, FollowDocument } from 'src/user/models/follow.model';

@Injectable()
export class RedisBullService {
  private broadcastQueue: Queue;
  private worker: Worker;

  constructor(
    @InjectModel(Broadcast.name)
    private readonly broadcastModel: Model<Broadcast>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Follow.name) private readonly followModel: Model<FollowDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
  ) {
    const redisConfig = { host: 'localhost', port: 6379 };
    this.broadcastQueue = new Queue('broadcastQueue', {
      connection: redisConfig,
    });

    this.worker = new Worker(
      'broadcastQueue',
      async (job: Job) => {
        const { broadcastId } = job.data;
        console.log('Worker picked job:', job.id, job.data, broadcastId);

        switch (job.name) {
          case 'sendBroadcast':
            await this.triggerBroadcast(job.data.broadcastId);
            break;

          case 'deleteConsumer':
            await this.userService.deleteAccount(job.data.userId);
            break;

          default:
            console.warn(`Unknown job type: ${job.name}`);
        }

        // await this.triggerBroadcast(broadcastId);
      },
      { connection: redisConfig },
    );
  }

  async addBroadcastJob(broadcastId: string, delay: number) {
    console.log('Scheduleddddd and added to queue:', broadcastId);
    const job = await this.broadcastQueue.add(
      'sendBroadcast',
      { broadcastId },
      { delay },
    );
    console.log('Job added to queue:', job.id, job.data);
    await this.broadcastModel.updateOne(
      { _id: broadcastId },
      { $set: { schedulerId: job.id } },
    );
  }

  async addDeleteUserJob(userId: string, delay: number) {
    console.log('Scheduleddddd and added to queue:', userId);
    const job = await this.broadcastQueue.add(
      'deleteConsumer',
      { userId },
      { delay },
    );
    console.log('Job added to queue:', job.id, job.data);
  }

  async removeBroadcastJob(jobId: string) {
    const job = await this.broadcastQueue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log('Job removed from queue:', job.id);
    }
  }

  async triggerBroadcast(broadcastId: string) {
    try {
      const broadcast = await this.broadcastModel.findById(broadcastId);
      if (!broadcast) {
        throw new Error('Broadcast not found');
      }
      if (broadcast.status === BroadcastStatus.CANCELLED) {
        return {
          success: false,
          message: `Broadcast cannot be triggered as it is cancelled.`,
        };
      }

      for (const user of broadcast.users) {
        const follow = await this.followModel.findOne({
          follower: new mongoose.Types.ObjectId(user),
          following: new mongoose.Types.ObjectId(broadcast.business),
        });
        if (follow) {
          if (!follow.muted) {
            // const fcmTokens = await this.tokenModel.find({
            //   user: new mongoose.Types.ObjectId(user),
            //   type: TokenTypes.FCM,
            // });
            // for (const token of fcmTokens) {
            //   this.firebaseService.sendNotification(
            //     token.token,
            //     broadcast.title,
            //     broadcast.message,
            //     { data: NotificationTypes.BROADCAST, id: broadcast.id },
            //   );
            // }
          }
        } else {
          //send broadcast notification to non followers:::::
          // const fcmTokens = await this.tokenModel.find({
          //   user: new mongoose.Types.ObjectId(user),
          //   type: TokenTypes.FCM,
          // });
          // for (const token of fcmTokens) {
          //   this.firebaseService.sendNotification(
          //     token.token,
          //     broadcast.title,
          //     broadcast.message,
          //     { data: NotificationTypes.BROADCAST, id: broadcast.id },
          //   );
          // }
        }

        await this.notificationModel.create({
          user: new mongoose.Types.ObjectId(user),
          userType: User.name,
          title: broadcast.title,
          message: broadcast.message,
          image: broadcast.image ? broadcast.image : '',
          type: NotificationTypes.BROADCAST,
          targetType: Business.name,
          targetUser: new mongoose.Types.ObjectId(broadcast.business),
          broadcast: new mongoose.Types.ObjectId(broadcast.id),
        });
      }
      await this.broadcastModel.updateOne(
        { _id: broadcastId },
        { $set: { status: BroadcastStatus.COMPLETED } },
      );
    } catch (error) {
      await this.broadcastModel.updateOne(
        { _id: broadcastId },
        { $set: { status: BroadcastStatus.FAILED } },
      );
      console.error('Error triggering broadcast:', error);
    }
  }
}
