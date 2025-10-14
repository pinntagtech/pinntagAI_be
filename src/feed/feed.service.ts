import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { Feed } from './models/feed.model';
import mongoose, { Model } from 'mongoose';
import { Business } from 'src/business/model/business.model';

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Feed.name) private readonly feedModel: Model<Feed>,
  ) {}

  async getFeed(
    user: DecodedUser,
    visibility: string,
    type: string,
    page: number,
    limit: number,
  ) {
    try {
      const feed = await this.feedModel.aggregate([
        { $match: { visibility: visibility, feedType: type } },
        {
          $lookup: {
            from: 'follows',
            let: {
              userId: new mongoose.Types.ObjectId(user.id),
              targetId: '$businessDetails._id',
              targetType: Business.name,
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$follower', '$$userId'] },
                      { $eq: ['$followerType', 'User'] },
                      { $eq: ['$following', '$$targetId'] },
                      { $eq: ['$followingType', '$$targetType'] },
                      { $eq: ['$isBlocked', false] },
                    ],
                  },
                },
              },
            ],
            as: 'userFollow',
          },
        },
        {
          $addFields: {
            isFollowedByMe: { $gt: [{ $size: '$userFollow' }, 0] },
          },
        },
        {
          $match: {
            $or: [
              { visibility: { $ne: 'followers' } },
              { isFollowedByMe: true },
            ],
          },
        },
        {
          $match: { feedType: 'Broadcast' },
        },
        {
          $lookup: {
            from: 'broadcasts',
            localField: 'content',
            foreignField: '_id',
            as: 'contentDetails',
          },
        },

        // Merge with Event type
        {
          $unionWith: {
            coll: 'feeds',
            pipeline: [
              { $match: { feedType: 'Event' } },
              {
                $lookup: {
                  from: 'events',
                  localField: 'content',
                  foreignField: '_id',
                  as: 'contentDetails',
                },
              },
            ],
          },
        },

        // Merge with Video type
        {
          $unionWith: {
            coll: 'feeds',
            pipeline: [
              { $match: { feedType: 'Video' } },
              {
                $lookup: {
                  from: 'videos',
                  localField: 'content',
                  foreignField: '_id',
                  as: 'contentDetails',
                },
              },
            ],
          },
        },

        // Sort and limit (optional)
        { $sort: { createdAt: -1 } },
      ]);

      console.log('FEEEDDDD', feed);

      return {
        success: true,
        message: 'Feed fetched successfully',
        data: feed,
        total: 0,
        totalPages: 0,
        page: page,
        limit: limit,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch feed',
        error: error.message,
      };
    }
  }
}
