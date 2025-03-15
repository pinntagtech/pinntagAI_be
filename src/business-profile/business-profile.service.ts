import { Injectable } from '@nestjs/common';
import { createBusinessProfileDto } from './dto/createBusinessProfile.dto';
import mongoose, { Model } from 'mongoose';
import {
  FollowingStatus,
  ImagePopulates,
  LocationPopulates,
  Roles,
  TransactionPopulates,
  UserPopulates,
} from 'src/enums/user.enum';
import { InjectModel } from '@nestjs/mongoose';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from './models/businessProfile.model';
import { User, UserDocument } from 'src/user/models/user.model';
import { Follow, FollowDocument } from 'src/user/models/follow.model';
import { AuthService } from 'src/auth/auth.service';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { CreateStaffDto } from './dto/createStaff.dto';
import { Role, RoleDocument } from 'src/roles/models/role.model';
import { Gallery, GalleryDocument } from './models/gallery.model';
import { UpdateBusinessProfileDto } from './dto/updateBusinessProfile.dto';
import { UpdateLocationDto } from './dto/updateLocation.dto';
import { Image, ImageDocument } from 'src/event/models/image.model';
import { S3Service } from 'src/s3.service';
import { PostToSocialMediaDto } from '../event/dto/postToSocialMedia.dto';
import { FacebookService } from 'src/user/facebook.service';
import {
  BusinessLocation,
  BusinessLocationDocument,
} from './models/businessLocation.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import {
  Subscription,
  SubscriptionDocument,
} from 'src/subscription/models/subscription.model';
import {
  SubscriptionProduct,
  SubscriptionProductDocument,
} from 'src/subscription/models/subscriptionProduct.model';
import {
  SubscriptionServiceTypes,
  SubscriptionServices,
  TransactionStatus,
} from 'src/enums/auth.enums';
import {
  Transaction,
  TransactionDocument,
} from 'src/user/models/transaction.model';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { StripeService } from 'src/stripe/stripe.service';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import * as nodeSchedule from 'node-schedule';
import { currentDateTz } from 'src/helpers/event.helpers';
import { Template, TemplateDocument } from 'src/event/models/template.model';
import {
  Notification,
  NotificationDocument,
} from 'src/notification/models/notification.model';
import { SeederService } from 'src/seeder/seeder.service';

@Injectable()
export class BusinessProfileService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(Gallery.name)
    private readonly galleryModel: Model<GalleryDocument>,
    @InjectModel(BusinessLocation.name)
    private readonly businessLocationModel: Model<BusinessLocationDocument>,
    @InjectModel(Image.name) private readonly imageModel: Model<ImageDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(SubscriptionProduct.name)
    private readonly subscriptionProductModel: Model<SubscriptionProductDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly stripeService: StripeService,
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
    private readonly facebookService: FacebookService,
    private readonly mailService: MailService,
    private readonly seederService: SeederService,
  ) {}

  async createBusinessProfile(data: createBusinessProfileDto, userId: string) {
    const user = await this.userModel.findById(userId);
    // if (!user.hasSubscribedForBusiness && user.businessProfiles.length) {
    //   return {
    //     success: false,
    //     message:
    //       'You have already created a business profile. Please subscribe to create more business profiles.',
    //   };
    // }
    // if (user.hasSubscribedForBusiness) {
    //   const subscriptions = await this.subscriptionModel.find({
    //     user: new mongoose.Types.ObjectId(userId),
    //     endDate: { $gte: new Date() },
    //   });
    // }
    // if (!data.subscription) {
    //   const subscription = await this.subscriptionProductModel.findOne({
    //     name: 'Free',
    //   });
    //   const userSubscription = await this.subscriptionModel.findOne({
    //     user: new mongoose.Types.ObjectId(userId),
    //     product: subscription._id,
    //     endDate: { $gte: new Date() },
    //   });
    //   if (userSubscription) {
    //     data.subscription = userSubscription._id;
    //   } else {
    //     const createdFreeSubscription = await this.subscriptionModel.create({
    //       user: new mongoose.Types.ObjectId(userId),
    //       product: subscription._id,
    //       startDate: new Date(),
    //       endDate: new Date(
    //         new Date().setFullYear(new Date().getFullYear() + 1),
    //       ),
    //     });
    //     data.subscription = createdFreeSubscription._id;
    //   }
    // } else if (data.subscription) {
    //   if (!mongoose.isValidObjectId(data.subscription)) {
    //     return {
    //       success: false,
    //       message: 'Please provide a valid subscription id',
    //     };
    //   } else {
    //     const foundSubscription = await this.subscriptionModel.findOne({
    //       _id: new mongoose.Types.ObjectId(data.subscription),
    //       user: new mongoose.Types.ObjectId(userId),
    //       endDate: { $gte: new Date() },
    //     });
    //     if (!foundSubscription) {
    //       return {
    //         success: false,
    //         message: 'Subscription not found',
    //       };
    //     } else if (foundSubscription.isAttachedToBusiness) {
    //       return {
    //         success: false,
    //         message: 'Subscription already attached to a business profile',
    //       };
    //     } else {
    //       data.subscription = foundSubscription._id;
    //     }
    //   }
    // }
    let subscriptions = [];
    for (let s = 0; s < data.subscriptions.length; s++) {
      const subscriptionData = data.subscriptions[s];
      if (!SubscriptionServices.includes(subscriptionData.serviceType)) {
        return {
          success: false,
          message: `Invalid service type ${subscriptionData.serviceType}`,
        };
      }
      const foundSubscriptionProduct =
        await this.subscriptionProductModel.findById(subscriptionData.product);
      if (!foundSubscriptionProduct) {
        return {
          success: false,
          message: `Subscription product not found with id ${subscriptionData.product}`,
        };
      } else {
        subscriptionData.product = foundSubscriptionProduct._id;
      }
      subscriptions.push(subscriptionData);
    }
    delete data.subscriptions;
    if (data.locations.length) {
      for (let i = 0; i < data.locations.length; i++) {
        const loc = data.locations[i];
        if (!loc.latitude || !loc.longitude) {
          return {
            success: false,
            message: `Please provide latitude and longitude for object at index ${i}`,
          };
        }
      }
    }
    let locations = data.locations;
    delete data.locations;
    const createdBusinessProfile = await this.businessProfileModel.create({
      ...data,
      authorisedUser: new mongoose.Types.ObjectId(userId),
      createdBy: new mongoose.Types.ObjectId(userId),
    });
    // await this.subscriptionModel.updateOne(
    //   {
    //     _id: new mongoose.Types.ObjectId(data.subscription),
    //   },
    //   {
    //     $set: {
    //       isAttachedToBusiness: true,
    //       businessProfile: createdBusinessProfile._id,
    //     },
    //   },
    // );
    if (createdBusinessProfile) {
      let locIds = [];
      if (locations.length) {
        for (let l = 0; l < locations.length; l++) {
          const location = locations[l];
          const createdLocation = await this.businessLocationModel.create({
            ...location,
            businessProfile: createdBusinessProfile._id,
          });
          await this.businessProfileModel.updateOne(
            {
              _id: createdBusinessProfile._id,
            },
            { $push: { locations: createdLocation._id } },
          );
        }
      }

      const businessProfile = await this.businessProfileModel
        .findOne({ _id: createdBusinessProfile._id })
        .populate('locations', LocationPopulates.FOREIGN)
        .populate('subscription', '');

      // await this.galleryModel.create({
      //   businessProfile: createdBusinessProfile._id,
      // });

      await this.seederService.createDrive(
        createdBusinessProfile._id,
        BusinessProfile.name,
      );

      await this.userModel.updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        {
          $set: { isBusiness: true },
          $push: { businessProfiles: createdBusinessProfile._id },
        },
      );

      for (let s = 0; s < subscriptions.length; s++) {
        const subscriptionData = subscriptions[s];
        subscriptionData.endDate = new Date(subscriptionData.endDate);
        subscriptionData.startDate = new Date(subscriptionData.startDate);
        const transaction = subscriptionData.transaction;
        delete subscriptionData.transaction;
        const createdSubscription = await this.subscriptionModel.create({
          ...subscriptionData,
          user: new mongoose.Types.ObjectId(userId),
          businessProfile: createdBusinessProfile._id,
        });
        const createdTransaction = await this.transactionModel.create({
          ...transaction,
          status: TransactionStatus.SUCCESS,
          user: new mongoose.Types.ObjectId(userId),
          subscription: createdSubscription._id,
          businessProfile: createdBusinessProfile._id,
        });
        await this.subscriptionModel.updateOne(
          { _id: createdSubscription._id },
          {
            $set: {
              transaction: createdTransaction._id,
            },
          },
        );
        await this.businessProfileModel.updateOne(
          { _id: new mongoose.Types.ObjectId(createdBusinessProfile._id) },
          {
            $push: { subscriptions: createdSubscription._id },
          },
        );
      }
      const updatedBusinessProfile = await this.businessProfileModel
        .findById(createdBusinessProfile.id)
        .populate('locations', LocationPopulates.FOREIGN)
        .populate('authorisedUser', UserPopulates.FOREIGN)
        .populate('subscriptions', '-createdAt -updatedAt -__v')
        .populate('subscriptions.product', '-createdAt -updatedAt -__v')
        .populate('subscriptions.transaction', '-createdAt -updatedAt -__v');
      return {
        success: true,
        message: 'Business profile created successfully',
        businessProfile: updatedBusinessProfile,
      };
    } else {
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
  }

  async updateProfilePhoto(
    businessProfileId: string,
    image: Express.Multer.File,
  ): Promise<{
    success: boolean;
    message: string;
    businessProfile?: BusinessProfileDocument;
  }> {
    const businessProfile =
      await this.businessProfileModel.findById(businessProfileId);
    if (!businessProfile) {
      return {
        success: false,
        message: 'Business profile not found',
      };
    } else {
      const uploadResult = await this.s3Service.s3_upload(
        image.buffer,
        process.env.AWS_S3_BUCKET_NAME,
        manipulateImageName(image.originalname),
        'image/jpeg',
      );
      const updatedProfile = await this.businessProfileModel
        .findByIdAndUpdate(
          businessProfile,
          { $set: { profilePhoto: uploadResult.Location } },
          { new: true },
        )
        .populate('locations');
      return {
        success: true,
        message: 'Business profile updated successfully',
        businessProfile: updatedProfile,
      };
    }
  }

  async updateBusinessProfile(
    user: DecodedUser,
    body: UpdateBusinessProfileDto,
  ) {
    const businessProfile = user.businessProfile;
    // const foundUser = await this.userModel.findById(user.id);
    if (body.locations && body.locations.length > 0) {
      // const foundLocations = await this.businessLocationModel.find({
      //   businessProfile: new mongoose.Types.ObjectId(businessProfile),
      // });
      // if (!foundUser.hasSubscribedForBusiness) {
      // If user has not subscribed and is using the app since 1 month then he can't add more than 1 location
      // const userCreatedAt = foundUser['createdAt'];
      // const currentDate = new Date();
      // const difference = currentDate.getTime() - userCreatedAt.getTime();
      // const daysDifference = difference / (1000 * 3600 * 24);
      // if (daysDifference > 30 && foundLocations.length) {
      //   return {
      //     success: false,
      //     message:
      //       'You have not subscribed for business profile. You can only add 1 location.',
      //   };
      // }
      // }

      for (let l = 0; l < body.locations.length; l++) {
        const location = body.locations[l];
        if (location['_id']) {
          const id = location['_id'];
          delete location['_id'];
          await this.businessLocationModel.updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: location },
          );
        } else {
          if (!location.latitude || !location.longitude) {
            return {
              success: false,
              message: `Please provide latitude and longitude for object at index ${l}`,
            };
          }
          const locationDoc = await this.businessLocationModel.create({
            ...location,
            businessProfile: new mongoose.Types.ObjectId(businessProfile),
          });
          await this.businessProfileModel.updateOne(
            { _id: new mongoose.Types.ObjectId(businessProfile) },
            {
              $addToSet: { locations: locationDoc._id },
            },
          );
        }
      }
      delete body.locations;
    }
    const updatedBusinessProfile = await this.businessProfileModel
      .findByIdAndUpdate(businessProfile, body, {
        new: true,
      })
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('authorisedUser', UserPopulates.FOREIGN)
      .populate('subscription', '-createdAt -updatedAt -__v')
      .populate('subscriptions', '-createdAt -updatedAt -__v');
    if (updatedBusinessProfile) {
      return {
        success: true,
        message: 'Business profile updated successfully',
        businessProfile: updatedBusinessProfile,
      };
    } else {
      return {
        success: false,
        message: 'Business profile not found',
      };
    }
  }

  async addProrateSubscription(
    userId: string,
    businessProfile: string,
    data: CreateSubscriptionDto,
  ) {
    const user = await this.userModel.findById(userId);
    // const locations = data.locations;
    // for (let i = 0; i < locations.length; i++) {
    //   const loc = locations[i];
    //   if (!loc.latitude || !loc.longitude) {
    //     return {
    //       success: false,
    //       message: `Please provide latitude and longitude for object at index ${i}`,
    //     };
    //   }
    // }
    // let locIds = [];
    // for (let i = 0; i < locations.length; i++) {
    //   const location = locations[i];
    //   const createdLocation = await this.businessLocationModel.create({
    //     ...location,
    //     businessProfile: new mongoose.Types.ObjectId(businessProfile),
    //   });
    //   locIds.push(createdLocation._id);
    // }
    // await this.businessProfileModel.updateOne(
    //   { _id: new mongoose.Types.ObjectId(businessProfile) },
    //   {
    //     $push: { locations: { $each: locIds } },
    //   },
    // );
    const foundSubscriptionProduct =
      await this.subscriptionProductModel.findOne({
        stripeProductId: data.priceId,
      });
    if (!foundSubscriptionProduct) {
      return {
        success: false,
        message: 'Subscription product not found',
      };
    }
    console.log('found product----:->', foundSubscriptionProduct);
    const userSubscriptions = await this.subscriptionModel
      .find({
        user: new mongoose.Types.ObjectId(userId),
        product: foundSubscriptionProduct._id,
        endDate: { $gte: new Date() },
      })
      .populate('transaction', TransactionPopulates.FOREIGN)
      .sort({ createdAt: -1 })
      .limit(1);
    if (!userSubscriptions.length) {
      return {
        success: false,
        message: 'No active subscription found',
      };
    }
    console.log('active subscriptions=======-:->', userSubscriptions);

    // get existing location count
    const existingLocation = await this.businessProfileModel
      .findOne({ _id: new mongoose.Types.ObjectId(data.businessProfileId) })
      .lean();
    if (!existingLocation) {
      throw new Error('no business profile found!');
    }

    const existingLocationCount = existingLocation.locationCount;
    const subscription = await this.stripeService.createProrateSubscription(
      user.stripeCustomerId,
      userSubscriptions[0].transaction['transactionId'],
      data,
      userSubscriptions[0]._id.toString(),
      existingLocationCount,
    );
    if (subscription.id) {
      // const createdSubscription = await this.subscriptionModel.create({
      //   serviceType: SubscriptionServiceTypes.STRIPE,
      //   user: new mongoose.Types.ObjectId(userId),
      //   startDate: new Date(),
      //   endDate: new Date(subscription.current_period_end * 1000),
      //   product: foundSubscriptionProduct._id,
      //   businessProfile: new mongoose.Types.ObjectId(data.businessProfileId),
      // });
      // await this.transactionModel.create({
      //   user: new mongoose.Types.ObjectId(userId),
      //   businessProfile: new mongoose.Types.ObjectId(data.businessProfileId),
      //   quantity: data.quantity,
      //   subscription: userSubscriptions[0]._id,
      //   amount:
      //     (subscription.items.data[0].price.unit_amount / 100) * data.quantity,
      //   currency: subscription.items.data[0].price.currency,
      //   transactionId: subscription.id,
      //   isForProrate: true,
      // });
      // createdSubscription.transaction = createdTransaction._id;
      // await createdSubscription.save();

      await this.userModel.updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        {
          $set: { hasSubscribedForBusiness: true },
          // $push: { subscriptions: createdSubscription._id },
        },
      );
      // if (data.businessProfileId) {
      //   await this.businessProfileModel.updateOne(
      //     { _id: new mongoose.Types.ObjectId(data.businessProfileId) },
      //     {
      //       // $addToSet: { subscriptions: createdSubscription._id },
      //       $set: { locationCount: data.quantity },
      //     },
      //   );
      // }
      return {
        success: true,
        message: 'Subscription created successfully',
        data: subscription,
      };
    }
  }

  async getActiveSocialServices(businessProfile: string) {
    const profile = await this.businessProfileModel
      .findById(businessProfile)
      .select('isFacebookConnected isInstagramConnected isTwitterConnected');
    if (!profile) {
      return {
        success: false,
        message: 'Business profile not found',
      };
    } else {
      return {
        success: true,
        message: 'Social services fetched successfully',
        socialServices: profile,
      };
    }
  }

  async getLocationsOfBusinessProfile(id: string) {
    const locations = await this.businessLocationModel.find({
      businessProfile: new mongoose.Types.ObjectId(id),
    });
    return {
      success: true,
      message: 'Locations fetched successfully',
      locations,
    };
  }

  async deleteBusinessProfileLocation(id: string, businessProfile: string) {
    const location = await this.businessLocationModel.findById(id);
    if (!location) {
      return {
        success: false,
        message: 'Location not found',
      };
    } else {
      await this.businessLocationModel.findByIdAndDelete(id);
      const updatedProfile = await this.businessProfileModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(businessProfile) },
        {
          $pull: { locations: new mongoose.Types.ObjectId(id) },
        },
        { new: true },
      );
      return {
        success: true,
        updatedProfile,
        message: 'Location deleted successfully',
      };
    }
  }

  async updateBusinessProfileLocation(
    id: string,
    businessProfile: string,
    body: UpdateLocationDto,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid location id',
      };
    }
    const location = await this.businessLocationModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      businessProfile: new mongoose.Types.ObjectId(businessProfile),
    });
    if (!location) {
      return {
        success: false,
        message: 'Location not found',
      };
    } else {
      const updatedLocation =
        await this.businessLocationModel.findByIdAndUpdate(
          id,
          { $set: body },
          { new: true },
        );
      return {
        success: true,
        updatedLocation,
        message: 'Location updated successfully',
      };
    }
  }

  async getBusinessProfiles(userId: string) {
    //Fetch all business profiles where the authorised user is the user and the staff array contains the user
    const businessProfiles = await this.businessProfileModel
      .find({
        $or: [
          {
            authorisedUser: new mongoose.Types.ObjectId(userId),
          },
          {
            staff: {
              $in: [new mongoose.Types.ObjectId(userId)],
            },
          },
        ],
      })
      .populate('authorisedUser', UserPopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      // populate subscription and their products in single query
      .populate({
        path: 'subscriptions',
        populate: {
          path: 'product',
        },
      })
      .exec();

    //sort business profiles by alphabetical order
    businessProfiles.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return {
      success: true,
      message: 'Business profiles fetched successfully',
      businessProfiles,
    };
  }

  async getBusinessProfile(id: string, userId: string) {
    const businessProfileDoc = await this.businessProfileModel
      .findById(id)
      .populate('authorisedUser', UserPopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('subscriptions', '-createdAt -updatedAt -__v')
      .exec();
    if (!businessProfileDoc) {
      return {
        success: false,
        message: 'Business profile not found',
      };
    } else if (businessProfileDoc.authorisedUser._id.toString() == userId) {
      return {
        success: true,
        message: 'Business profile fetched successfully',
        businessProfile: businessProfileDoc,
      };
    } else {
      const isBlockedByMe = await this.followModel.findOne({
        follower: new mongoose.Types.ObjectId(id),
        following: new mongoose.Types.ObjectId(userId),
        isBlocked: true,
      });
      if (isBlockedByMe) {
        return {
          success: false,
          message: 'You are blocked by this business profile',
        };
      } else {
        return {
          success: true,
          message: 'Business profile fetched successfully',
          businessProfile: businessProfileDoc,
        };
      }
    }
  }

  async switchToBusinessProfile(id: string, userId: string) {
    if (!mongoose.isValidObjectId(id)) {
      return {
        success: false,
        message: 'Please provide a valid business profile id',
      };
    }
    const businessProfile = await this.businessProfileModel
      .findById(id)
      .populate('authorisedUser', UserPopulates.FOREIGN)
      .populate('locations', LocationPopulates.FOREIGN)
      .populate('subscriptions', '-createdAt -updatedAt -__v')
      .exec();
    if (!businessProfile) {
      return {
        success: false,
        message: 'Business profile not found with this id.',
      };
    } else {
      // if (businessProfile.authorisedUser.toString() !== userId) {
      //   return {
      //     success: false,
      //     message: 'You are not authorised to this business profile.',
      //   };
      // } else {
      const payload: JwtPayload = {
        id: userId,
        email: businessProfile.email,
        businessProfile: businessProfile.id,
        role: Roles.BUSINESS_PROFILE,
      };
      const token = await this.authService.generateJWT(payload);
      return {
        success: true,
        message: 'Data fetched successfully.',
        businessProfile,
        token,
      };
      // }
    }
  }

  async connectFacebook(token: string, user: DecodedUser) {
    const businessProfile = await this.businessProfileModel.findOne({
      _id: new mongoose.Types.ObjectId(user.businessProfile),
    });
    if (businessProfile.isFacebookConnected) {
      return {
        success: false,
        message: 'Facebook account already connected',
      };
    } else {
      const longLivedToken =
        await this.facebookService.fetchLongLivedToken(token);
      if (!longLivedToken.success) {
        return {
          success: false,
          message: 'Error connecting to Facebook',
        };
      }
      const result = await this.businessProfileModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(user.businessProfile),
        },
        {
          $set: {
            isFacebookConnected: true,
            facebookToken: {
              value: longLivedToken.data.access_token,
              age: new Date(),
            },
          },
        },
        { new: true },
      );
      return {
        success: true,
        message: 'Facebook account connected successfully',
        businessProfile: result,
      };
    }
  }

  async disconnectFacebook(user: DecodedUser) {
    const businessProfile = await this.businessProfileModel.findOne({
      _id: new mongoose.Types.ObjectId(user.businessProfile),
    });
    if (!businessProfile.isFacebookConnected) {
      return {
        success: false,
        message: 'Facebook account already disconnected',
      };
    } else {
      const result = await this.businessProfileModel.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(user.businessProfile),
        },
        {
          $set: {
            isFacebookConnected: false,
            facebookToken: {},
          },
        },
        { new: true },
      );
      return {
        success: true,
        message: 'Facebook account disconnected successfully',
        businessProfile: result,
      };
    }
  }

  async createStaffMember(businessProfile: string, data: CreateStaffDto) {
    let staffId = '';
    let result;
    if (data.alreadyExists) {
      const foundStaff = await this.userModel.findById(data.id);
      if (!foundStaff) {
        return {
          success: false,
          message: 'User not found with this id',
        };
      } else {
        staffId = data.id;
        result = {
          firstName: foundStaff.firstName,
          lastName: foundStaff.lastName,
          email: foundStaff.email,
          profilePhoto: foundStaff.profilePhoto,
        };
      }
    } else {
      const role = await this.roleModel.findOne({ name: Roles.STAFF });
      const foundStaff = await this.userModel.findOne({
        role: role._id,
        email: data.email,
      });
      if (foundStaff) {
        return {
          success: false,
          message: 'User already exists with this email',
        };
      }
      // encrypt password in data
      const hashedPassword = await bcrypt.hash(data.password, 10);
      delete data.password;
      const staffMember = await this.userModel.create({
        ...data,
        role: role._id,
        password: hashedPassword,
        isEmailVerified: true,
        isPhoneVerified: true,
        businessProfiles: [new mongoose.Types.ObjectId(businessProfile)],
        createdBy: new mongoose.Types.ObjectId(businessProfile),
      });
      await this.mailService.sendStaffInviteMail(data.email, data.password);
      staffId = staffMember.id;
      result = {
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
        profilePhoto: staffMember.profilePhoto,
      };
    }
    if (!staffId) {
      return {
        success: false,
        message: 'Something went wrong',
      };
    } else {
      await this.businessProfileModel.updateOne(
        { _id: new mongoose.Types.ObjectId(businessProfile) },
        {
          $addToSet: { staff: new mongoose.Types.ObjectId(staffId) },
        },
      );
      return {
        success: true,
        message: 'Staff member created successfully',
        staffMember: result,
      };
    }
  }

  async getStaffMembers(businessProfile: string) {
    const businessProfileDoc = await this.businessProfileModel
      .findOne({
        _id: new mongoose.Types.ObjectId(businessProfile),
      })
      .populate('staff', '-password -createdAt -updatedAt -__v');
    const owner = await this.userModel.findOne(
      {
        _id: businessProfileDoc.authorisedUser,
      },
      '-password -createdAt -updatedAt -__v',
    );
    return {
      success: true,
      message: 'Staff members fetched successfully',
      staffMembers: businessProfileDoc.staff,
      owner,
    };
  }

  async deleteStaffMember(id: string, businessProfile: string) {
    const staffMember = await this.userModel.findById(id);
    if (!staffMember) {
      return {
        success: false,
        message: 'Staff member not found',
      };
    } else {
      // if (staffMember.createdBy.toString() !== businessProfile) {
      //   return {
      //     success: false,
      //     message: 'You are not authorised to delete this staff member',
      //   };
      // }
      await this.businessProfileModel.updateOne(
        { _id: new mongoose.Types.ObjectId(businessProfile) },
        {
          $pull: { staff: new mongoose.Types.ObjectId(id) },
        },
      );
      await this.userModel.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $pull: {
            businessProfiles: new mongoose.Types.ObjectId(businessProfile),
          },
        },
      );
      return {
        success: true,
        message: 'Staff member deleted successfully',
      };
    }
  }

  async getGallery(businessProfileId: string) {
    const businessProfile = new mongoose.Types.ObjectId(businessProfileId);
    const gallery = await this.galleryModel
      .findOne({ businessProfile })
      .populate('images', ImagePopulates.FOREIGN);

    if (gallery) {
      return {
        success: true,
        message: 'Gallery fetched successfully',
        gallery,
      };
    } else {
      return {
        success: false,
        message: 'Gallery not found',
      };
    }
  }

  async uploadGalleryImage(
    businessProfileId: string,
    image: Express.Multer.File,
  ) {
    const businessProfile = new mongoose.Types.ObjectId(businessProfileId);
    const gallery = await this.galleryModel
      .findOne({ businessProfile })
      .populate('images', ImagePopulates.FOREIGN);
    if (!gallery) {
      return {
        success: false,
        message: 'Gallery not found',
      };
    } else {
      const uploadResult = await this.s3Service.s3_upload(
        image.buffer,
        process.env.AWS_S3_BUCKET_NAME,
        manipulateImageName(image.originalname),
        'image/jpeg',
      );
      const imageDoc = await this.imageModel.create({
        url: uploadResult.Location,
        gallery: gallery._id,
      });
      const updatedGallery = await this.galleryModel
        .findOneAndUpdate(
          { businessProfile },
          {
            $push: { images: imageDoc._id },
          },
          { new: true },
        )
        .populate('images', ImagePopulates.FOREIGN);
      return {
        success: true,
        message: 'Image uploaded successfully',
        gallery: updatedGallery,
      };
    }
  }

  async deleteGalleryImage(businessProfileId: string, imageId: string) {
    const businessProfile = new mongoose.Types.ObjectId(businessProfileId);
    const image = new mongoose.Types.ObjectId(imageId);
    const gallery = await this.galleryModel.findOne({ businessProfile });
    if (!gallery) {
      return {
        success: false,
        message: 'Gallery not found',
      };
    } else {
      await this.imageModel.findByIdAndDelete(image);
      const updatedGallery = await this.galleryModel.updateOne(
        { businessProfile },
        {
          $pull: { images: image },
        },
      );
      return {
        success: true,
        message: 'Image deleted successfully',
        gallery: updatedGallery,
      };
    }
  }

  async getTransactions(businessProfileId: string) {
    const transactions = await this.transactionModel
      .find({ businessProfile: new mongoose.Types.ObjectId(businessProfileId) })
      .populate('subscription', '-createdAt -updatedAt -__v')
      //populate product in subscription data
      .populate({
        path: 'subscription',
        populate: {
          path: 'product',
          select: '-createdAt -updatedAt -__v',
        },
      })
      .sort({ createdAt: -1 })
      .exec();
    return {
      success: true,
      message: 'Transactions fetched successfully',
      count: transactions.length,
      transactions,
    };
  }

  async deleteBusinessProfileData(id: string, userId: string) {
    await this.businessLocationModel.deleteMany({
      businessProfile: new mongoose.Types.ObjectId(id),
    });
    await this.galleryModel.deleteMany({
      businessProfile: new mongoose.Types.ObjectId(id),
    });
    await this.templateModel.deleteMany({
      businessProfile: new mongoose.Types.ObjectId(id),
    });
    await this.subscriptionModel.deleteMany({
      businessProfile: new mongoose.Types.ObjectId(id),
    });
    await this.transactionModel.deleteMany({
      businessProfile: new mongoose.Types.ObjectId(id),
    });
    await this.notificationModel.deleteMany({
      $or: [
        { user: new mongoose.Types.ObjectId(id) },
        { targetUser: new mongoose.Types.ObjectId(id) },
      ],
    });
    const subscriptions = await this.subscriptionModel
      .find({
        user: new mongoose.Types.ObjectId(userId),
        businessProfile: new mongoose.Types.ObjectId(id),
      })
      .populate('transaction');

    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = subscriptions[i];
      if (subscription.serviceType === SubscriptionServiceTypes.STRIPE) {
        await this.stripeService.cancelSubscription(
          subscription['transaction']['transactionId'],
        );
      }
    }
    await this.businessProfileModel.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
    });
    await this.userModel.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        $pull: { businessProfiles: new mongoose.Types.ObjectId(id) },
      },
    );
  }

  async deleteBusinessProfile(userId: string, businessProfileId: string) {
    const foundBusinessProfile =
      await this.businessProfileModel.findById(businessProfileId);
    if (!foundBusinessProfile) {
      return {
        success: false,
        message: 'Business profile not found',
      };
    }
    if (foundBusinessProfile.authorisedUser.toString() !== userId) {
      return {
        success: false,
        message: 'You are not authorised to delete this business profile',
      };
    } else {
      const updatedBusinessProfile =
        await this.businessProfileModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(businessProfileId) },
          { $set: { isDeleted: true } },
          { new: true },
        );
      if (updatedBusinessProfile) {
        const date = currentDateTz();
        date.setDate(date.getDate() + 30);
        nodeSchedule.scheduleJob(date, async () => {
          const latestProfileDetails = await this.businessProfileModel.findById(
            foundBusinessProfile.id,
          );
          if (latestProfileDetails.isDeleted) {
            await this.deleteBusinessProfileData(
              foundBusinessProfile.id,
              foundBusinessProfile.authorisedUser.toString(),
            );
          }
        });
        return {
          success: true,
          message: 'Business profile deleted successfully',
          businessProfile: updatedBusinessProfile,
        };
      } else {
        return {
          success: false,
          message: 'Something went wrong',
        };
      }
    }
  }

  async cancelDeleteBusinessProfile(userId: string, businessProfileId: string) {
    const foundBusinessProfile =
      await this.businessProfileModel.findById(businessProfileId);
    if (!foundBusinessProfile) {
      return {
        success: false,
        message: 'Business profile not found',
      };
    }
    if (foundBusinessProfile.authorisedUser.toString() !== userId) {
      return {
        success: false,
        message:
          'You are not authorised to cancel delete this business profile',
      };
    } else {
      const updatedBusinessProfile =
        await this.businessProfileModel.findByIdAndUpdate(
          businessProfileId,
          { $set: { isDeleted: false } },
          { new: true },
        );
      return {
        success: true,
        message: 'Business profile delete cancelled successfully',
        businessProfile: updatedBusinessProfile,
      };
    }
  }
}
