import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { Feed, FeedVisibility } from './models/feed.model';
import mongoose, { Model, PipelineStage } from 'mongoose';
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
      let query: any = {};
      if (visibility) {
        query.visibility = visibility;
      }
      if (type) {
        query.feedType = type;
      }
      let pipeline: PipelineStage[] = [
        { $match: query },
        {
          $lookup: {
            from: 'follows',
            let: {
              userId: new mongoose.Types.ObjectId(user.id),
              targetId: '$creator',
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
              { visibility: { $ne: FeedVisibility.FOLLOWERS } },
              { isFollowedByMe: true },
            ],
          },
        },
        {
          $lookup: {
            from: 'media',
            let: { contentId: '$content', feedType: '$feedType' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$feedType', 'Media'] },
                      { $eq: ['$_id', '$$contentId'] },
                    ],
                  },
                },
              },
            ],
            as: 'mediaContent',
          },
        },
        {
          $lookup: {
            from: 'broadcasts',
            let: { contentId: '$content', feedType: '$feedType' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$feedType', 'Broadcast'] },
                      { $eq: ['$_id', '$$contentId'] },
                    ],
                  },
                },
              },
            ],
            as: 'broadcastContent',
          },
        },
        {
          $lookup: {
            from: 'news',
            let: { contentId: '$content', feedType: '$feedType' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$feedType', 'News'] },
                      { $eq: ['$_id', '$$contentId'] },
                    ],
                  },
                },
              },
            ],
            as: 'newsContent',
          },
        },
        {
          $lookup: {
            from: 'agendas',
            let: { contentId: '$content', feedType: '$feedType' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$$feedType', 'Agenda'] },
                      { $eq: ['$_id', '$$contentId'] },
                    ],
                  },
                },
              },
            ],
            as: 'agendaContent',
          },
        },
        // Merge all content into a single field
        {
          $addFields: {
            contentDetails: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$feedType', 'Media'] },
                    then: { $arrayElemAt: ['$mediaContent', 0] },
                  },
                  {
                    case: { $eq: ['$feedType', 'Broadcast'] },
                    then: { $arrayElemAt: ['$broadcastContent', 0] },
                  },
                  {
                    case: { $eq: ['$feedType', 'News'] },
                    then: { $arrayElemAt: ['$newsContent', 0] },
                  },
                  {
                    case: { $eq: ['$feedType', 'Agenda'] },
                    then: { $arrayElemAt: ['$agendaContent', 0] },
                  },
                ],
                default: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'businesses',
            localField: 'contentDetails.business',
            foreignField: '_id',
            as: 'businessDetails'
          }
        },
        {
        $unwind: {
          path: '$businessDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

        {
          $project: {
            feedType: 1,
            contentDetails: 1,
            createdAt: 1,
            visibility: 1,
            isFollowedByMe: 1,
            businessDetails: {
              logo: '$businessDetails.logo',
              cover: '$businessDetails.cover',
              name: '$businessDetails.name',
              id: '$businessDetails._id'
            }
          },    
        },

        // Sort and limit (optional)
        { $sort: { createdAt: -1 } },
      ];
      const feed = await this.feedModel.aggregate(pipeline);

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
