import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { Feed, FeedVisibility } from './models/feed.model';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { User, UserDocument } from 'src/user/models/user.model';

@Injectable()
export class FeedService {
  constructor(
    @InjectModel(Feed.name) private readonly feedModel: Model<Feed>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
      let userId = new mongoose.Types.ObjectId(user.id);

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
            isLiked: {
              $in: [userId, { $ifNull: ['$likes', []] }],
            },
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
            as: 'businessDetails',
          },
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
            isLiked: 1,
            totalLikes: 1,
            businessDetails: {
              logo: '$businessDetails.logo',
              cover: '$businessDetails.cover',
              name: '$businessDetails.name',
              id: '$businessDetails._id',
            },
          },
        },

        // Sort and limit (optional)
        { $sort: { createdAt: -1 } },
      ];
      const feed = await this.feedModel.aggregate(pipeline);

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
  async getBusinessCardFeed(
    user: DecodedUser,
    page: number,
    limit: number,
  ) {
    try {
      let query: any = {
        creator: new mongoose.Types.ObjectId(user.businessProfile),
      };
      let userId = new mongoose.Types.ObjectId(user.id);
      let pipeline: PipelineStage[] = [
        { $match: query },
        {
          $addFields: {
            isLiked: {
              $in: [userId, { $ifNull: ['$likes', []] }],
            },
          },
        },
        // {
        //   $match: {
        //     $or: [
        //       { visibility: { $ne: FeedVisibility.FOLLOWERS } },
        //       { isFollowedByMe: true },
        //     ],
        //   },
        // },

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
            as: 'businessDetails',
          },
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
            isLiked: 1,
            totalLikes: 1,
            businessDetails: {
              logo: '$businessDetails.logo',
              cover: '$businessDetails.cover',
              name: '$businessDetails.name',
              id: '$businessDetails._id',
            },
          },
        },

        // Sort and limit (optional)
        { $sort: { createdAt: -1 } },
      ];
      const feed = await this.feedModel.aggregate(pipeline);

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
  async getPopularFeed(
    user: DecodedUser,
    type: string,
    page: number,
    limit: number,
  ) {
    try {
      let query: any = {
        visibility: FeedVisibility.PUBLIC
      };
      let userId = new mongoose.Types.ObjectId(user.id);

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
            isLiked: {
              $in: [userId, { $ifNull: ['$likes', []] }],
            },
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
            as: 'businessDetails',
          },
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
            isLiked: 1,
            totalLikes: 1,
            businessDetails: {
              logo: '$businessDetails.logo',
              cover: '$businessDetails.cover',
              name: '$businessDetails.name',
              id: '$businessDetails._id',
            },
          },
        },

        // Sort and limit (optional)
        { $sort: { totalLikes: -1, createdAt: -1 } },
      ];
      const feed = await this.feedModel.aggregate(pipeline);

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

  async getBusinessFeed(
    user: DecodedUser,
    visibility: string,
    type: string,
    page: number,
    limit: number,
  ) {
    try {
      let query: any = {
        creator: new mongoose.Types.ObjectId(user.businessProfile),
      };

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
            as: 'businessDetails',
          },
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
            totalLikes: 1,
            // businessDetails: {
            //   logo: '$businessDetails.logo',
            //   cover: '$businessDetails.cover',
            //   name: '$businessDetails.name',
            //   id: '$businessDetails._id',
            // },
          },
        },
        // Sort and limit (optional)
        { $sort: { createdAt: -1 } },
      ];
      console.log('query:', query);
      console.log('pipeline:::', pipeline);
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

  async likeFeed(
    feedId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; liked?: boolean }> {
    // Validate feedId
    if (!mongoose.isValidObjectId(feedId)) {
      return {
        success: false,
        message: 'Please provide a valid event id',
      };
    }

    // Fetch user and feed in parallel
    const [user, feed] = await Promise.all([
      this.userModel.findById(userId).select('_id name profilePhoto').lean(),
      this.feedModel
        .findById(feedId)
        .select('_id feedType visibility likes totalLikes')
        .lean(),
    ]);

    // Early return if either not found
    if (!feed) {
      return {
        success: false,
        message: 'feed not found',
      };
    }

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    console.log('FEED:', feed);
    const feedObjectId = new mongoose.Types.ObjectId(feedId);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isLiked = Array.isArray(feed?.likes)
      ? feed.likes.some((id) => id.toString() === userId)
      : false;
    console.log('ISLIKED', isLiked);
    if (isLiked) {
      // Unlike: execute updates in parallel
      await this.feedModel.updateOne(
        { _id: feedObjectId },
        { $pull: { likes: userObjectId }, $inc: { totalLikes: -1 } },
      );

      return {
        success: true,
        message: 'feed unliked',
        liked: false,
      };
    } else {
      // Like: execute updates in parallel
      await this.feedModel.updateOne(
        { _id: feedObjectId },
        { $addToSet: { likes: userObjectId }, $inc: { totalLikes: 1 } },
      );

      // Fire notification asynchronously (don't await)
      // this.businessService.businessNotification(
      //   userId,
      //   feedId,
      //   NotificationTypes.EVENT,
      //   `${user.name} liked your event ${event.title}`,
      // );

      return {
        success: true,
        message: 'Feed liked',
        liked: true,
      };
    }
  }
}
