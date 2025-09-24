import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './models/user.model';
import mongoose, { Model } from 'mongoose';
import { Otp, OtpDocument } from 'src/auth/models/otp.model';
import { VerifyOtpDto } from 'src/auth/dto/verifyOtp.dto';
import { ResendOtpDto } from 'src/auth/dto/resendOtp.dto';
import { generateOtp } from 'src/helpers/auth.helpers';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import {
  SubscriptionServiceTypes,
  TokenTypes,
  UserTypes,
} from 'src/enums/auth.enums';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from '../business-profile/models/businessProfile.model';
import { ChangePasswordDto } from './dto/changePassword.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/updateProfile.dto';
import { Follow, FollowDocument } from './models/follow.model';
import { SubscriptionProduct } from 'src/subscription/models/subscription-product.model';
import {
  Subscription,
  SubscriptionDocument,
} from 'src/subscription/models/subscription.model';
import {
  Refferal,
  RefferalDocument,
} from '../subscription/models/refferal.model';
import { S3Service } from 'src/s3.service';
import {
  Notification,
  NotificationDocument,
} from 'src/notification/models/notification.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { Transaction } from '../subscription/models/transaction.model';
import { ContactUs, ContactUsDocument } from './models/contact-us.model';
import { ContactUsDto } from './dto/contact-us.dto';
import { Event, EventDocument } from 'src/event/models/event.model';
import { Report, ReportDocument } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventDocument,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateDocument } from 'src/event/models/template.model';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { NotificationTypes } from 'src/enums/event.enums';
import dayjs from 'dayjs';
import {
  FileUploadUtils,
  manipulateImageName,
} from 'src/helpers/upload.helpers';
import { MailService } from 'src/mail/mail.service';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { FirebaseService } from 'src/notification/firebase.service';
import { BusinessService } from 'src/business/business.service';
import { Reward, RewardDocument } from 'src/rewards/model/reward.model';
import { BusinessUserCreatorType } from 'src/business/enums/business.enum';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import { UserAllowedNotification } from 'src/business/model/userAllowedNotification.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    // @InjectModel(BusinessProfile.name) private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(SubscriptionProduct.name)
    private readonly subscriptionProductModel: Model<SubscriptionProduct>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Refferal.name)
    private readonly refferalModel: Model<RefferalDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(ContactUs.name)
    private readonly contactUsModel: Model<ContactUsDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(SavedEvent.name)
    private readonly savedEventModel: Model<SavedEventDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(UserAllowedNotification.name)
    private readonly userAllowedNotificationModel: Model<UserAllowedNotification>,
    private readonly logger: Logger,
    private readonly s3Service: S3Service,
    private readonly stripeService: StripeService,
    // private readonly businessService: BusinessService,
    private readonly driveService: DriveService,
    private readonly firebaseService: FirebaseService,
    // private readonly mailerService: MailService,
  ) {}

  // async getMyRefferalCode(userId: string) {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     return {
  //       success: false,
  //       message: 'User not found',
  //     };
  //   }
  //   const refferal = await this.refferalModel.findOne({ user: user._id });
  //   if (refferal) {
  //     return {
  //       success: true,
  //       message: 'Refferal code fetched successfully',
  //       data: refferal,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: 'Refferal code not found',
  //       data: refferal,
  //     };
  //   }
  // }

  // async getPaymentMethods(userId: string) {
  //   const user = await this.userModel.findById(userId);
  //   const paymentMethods = await this.stripeService.retrievePaymentMethods(
  //     user.stripeCustomerId,
  //   );
  //   if (paymentMethods) {
  //     return {
  //       success: true,
  //       message: 'Payment methods fetched successfully',
  //       data: paymentMethods,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: 'Payment methods not found',
  //     };
  //   }
  // }

  // async getSubscriptionProducts() {
  //   const subscriptionProducts =
  //     await this.stripeService.getSubscriptionProducts();
  //   if (subscriptionProducts) {
  //     return {
  //       success: true,
  //       message: 'Subscription products fetched successfully',
  //       data: subscriptionProducts,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: 'Subscription products not found',
  //     };
  //   }
  // }

  // async createSubscription(userId: string, data: CreateSubscriptionDto) {
  //   const user = await this.userModel.findById(userId);
  //   const foundSubscriptionProduct =
  //     await this.subscriptionProductModel.findOne({
  //       stripeProductId: data.priceId,
  //     });
  //   if (!foundSubscriptionProduct) {
  //     return {
  //       success: false,
  //       message: 'Subscription product not found',
  //     };
  //   }
  //   const dbSubscriptionId = new mongoose.Types.ObjectId();
  //   const subscription = await this.stripeService.createSubscription(
  //     user.stripeCustomerId,
  //     data,
  //     dbSubscriptionId,
  //   );
  //   if (subscription.id) {
  //     const latestSubscriptionInvoice =
  //       await this.stripeService.retriveInvoicesOfSubscription(subscription.id);
  //     const subscriptionItem = subscription.items.data[0];
  //     const price = subscriptionItem.price;
  //     const recurring = price.recurring;
  //     const interval = recurring.interval; // month, year
  //     const latestInvoice = latestSubscriptionInvoice.data[0];
  //     const invoiceEndDate = dayjs(subscription.current_period_end * 1000)
  //       .add(1, interval)
  //       .toDate();
  //     // const invoiceEndDate =
  //     //   foundSubscriptionProduct.durationType == DurationType.ANNUAL
  //     //     ? new Date(latestInvoice.period_start * 1000 + 31536000000)
  //     //     : new Date(latestInvoice.period_start * 1000 + 7884000000);
  //     const createdSubscription = await this.subscriptionModel.create({
  //       _id: dbSubscriptionId,
  //       serviceType: SubscriptionServiceTypes.STRIPE,
  //       user: new mongoose.Types.ObjectId(userId),
  //       startDate: new Date(subscription.current_period_start * 1000),
  //       endDate: new Date(subscription.current_period_end * 1000),
  //       invoiceStartDate: new Date(latestInvoice.period_start * 1000),
  //       invoiceEndDate,
  //       product: foundSubscriptionProduct._id,
  //       businessProfile: new mongoose.Types.ObjectId(data.businessProfileId),
  //       stripeSubscriptionId: subscription.id,
  //       isTrialActive: true,
  //     });
  //     const createdTransaction = await this.transactionModel.create({
  //       user: new mongoose.Types.ObjectId(userId),
  //       subscription: createdSubscription._id,
  //       amount: 0,
  //       quantity: data.quantity,
  //       businessProfile: new mongoose.Types.ObjectId(data.businessProfileId),
  //       currency: subscription.items.data[0].price.currency,
  //       transactionId: subscription.id,
  //       description: 'Subscription trial period',
  //       startDate: new Date(subscription.current_period_start * 1000),
  //       endDate: new Date(subscription.current_period_end * 1000),
  //     });
  //     createdSubscription.transaction = new mongoose.Types.ObjectId(
  //       createdTransaction.id,
  //     );
  //     await createdSubscription.save();

  //     // update subscription metadata
  //     // await this.stripeService.fetchAndUpdateSubscriptionMetadata(
  //     //   subscription.id,
  //     //   {
  //     //     dbSubscriptionId: createdSubscription._id.toString(),
  //     //   },
  //     // );

  //     await this.userModel.updateOne(
  //       { _id: new mongoose.Types.ObjectId(userId) },
  //       {
  //         $set: { hasSubscribedForBusiness: true },
  //         $push: { subscriptions: createdSubscription._id },
  //       },
  //     );
  //     if (data.businessProfileId) {
  //       await this.businessModel.updateOne(
  //         { _id: new mongoose.Types.ObjectId(data.businessProfileId) },
  //         {
  //           $addToSet: { subscriptions: createdSubscription._id },
  //         },
  //       );
  //     }
  //     return {
  //       success: true,
  //       message: 'Subscription created successfully',
  //       data: subscription,
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: 'Subscription not created',
  //     };
  //   }
  // }

  // async cancelSubscription(userId: string, subscriptionId: string) {
  //   const user = await this.userModel.findById(userId);
  //   const subscription = await this.subscriptionModel
  //     .findById(subscriptionId)
  //     .populate('transaction');
  //   if (!subscription) {
  //     return {
  //       success: false,
  //       message: 'Subscription not found',
  //     };
  //   }
  //   const canceledSubscription = await this.stripeService.cancelSubscription(
  //     subscription['transaction']['transactionId'],
  //   );
  //   if (canceledSubscription.id) {
  //     await this.subscriptionModel.updateOne(
  //       { _id: new mongoose.Types.ObjectId(subscriptionId) },
  //       { $set: { isCancelled: true } },
  //     );
  //     return {
  //       success: true,
  //       message: 'Subscription canceled successfully',
  //     };
  //   } else {
  //     return {
  //       success: false,
  //       message: 'Subscription not canceled',
  //     };
  //   }
  // }

  // async useRefferalCode(code: string, userId: string) {
  //   const refferal = await this.refferalModel.findOne({ refferalCode: code });
  //   if (!refferal) {
  //     return {
  //       success: false,
  //       message: 'Invalid refferal code',
  //     };
  //   }
  //   if (refferal.user.toString() == userId) {
  //     return {
  //       success: false,
  //       message: 'You cannot use your own refferal code',
  //     };
  //   } else if (refferal.isBlacklisted) {
  //     return {
  //       success: false,
  //       message: 'Refferal code is blacklisted',
  //     };
  //   } else {
  //     // Get discounted price of subscription products
  //     const subscriptionProductsDocs =
  //       await this.subscriptionProductModel.find();
  //     const subscriptionProducts = JSON.parse(
  //       JSON.stringify(subscriptionProductsDocs),
  //     );
  //     const discountedProducts = subscriptionProducts.map((product) => {
  //       product.price -= refferal.amount;
  //       return product;
  //     });
  //     return {
  //       success: true,
  //       data: discountedProducts,
  //       message: 'Refferal code used successfully',
  //     };
  //   }
  // }

  // async subscribe(userId: string, productId: string) {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     return {
  //       success: false,
  //       message: 'User not found',
  //     };
  //   }
  //   const subscriptionProduct =
  //     await this.subscriptionProductModel.findById(productId);
  //   if (!subscriptionProduct) {
  //     return {
  //       success: false,
  //       message: 'Subscription product not found',
  //     };
  //   }
  //   let endDate = new Date();
  //   if (subscriptionProduct.durationType == DurationType.ANNUAL) {
  //     endDate = new Date(Date.now() + 31536000000);
  //   } else if (subscriptionProduct.durationType == DurationType.QUARTER) {
  //     endDate = new Date(Date.now() + 7884000000);
  //   }
  //   const subscription = await this.subscriptionModel.create({
  //     user: new mongoose.Types.ObjectId(userId),
  //     subscriptionProduct: new mongoose.Types.ObjectId(productId),
  //     startDate: new Date(),
  //     endDate,
  //   });
  //   user.hasSubscribedForBusiness = true;
  //   user.subscription = subscription._id;
  //   await user.save();
  //   return {
  //     success: true,
  //     message: 'Subscribed successfully',
  //   };
  // }

  // async getSubscription(userId: string) {
  //   const user = await this.userModel.findById(userId);
  //   const subscription = await this.subscriptionModel
  //     .findOne({ user: new mongoose.Types.ObjectId(userId) })
  //     .populate('subscriptionProduct', {
  //       __v: 0,
  //       createdAt: 0,
  //       updatedAt: 0,
  //     });
  //   if (!subscription) {
  //     return {
  //       success: false,
  //       message: 'Subscription not found',
  //     };
  //   }
  //   return {
  //     success: true,
  //     message: 'Subscription fetched successfully',
  //     subscription,
  //   };
  // }

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select({ _v: 0, password: 0 })
      .populate('role', {
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      })
      .exec();
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    } else {
      return {
        success: true,
        message: 'Profile fetched successfully',
        user,
      };
    }
  }

  // async changePassword(data: ChangePasswordDto, userId: string) {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     return {
  //       success: false,
  //       message: 'User not found',
  //     };
  //   }
  //   const validatePassword = await bcrypt.compare(
  //     data.oldPassword,
  //     user.password,
  //   );
  //   if (!validatePassword) {
  //     return {
  //       success: false,
  //       message: 'Invalid old password',
  //     };
  //   } else {
  //     // user.password = data.newPassword;
  //     // await user.save();
  //     await this.userModel.updateOne(
  //       { _id: new mongoose.Types.ObjectId(userId) },
  //       {
  //         $set: { password: bcrypt.hashSync(data.newPassword, 10) },
  //       },
  //     );
  //     return {
  //       success: true,
  //       user,
  //       message: 'Password changed successfully',
  //     };
  //   }
  // }

  async updateProfilePhoto(userId: string, profilePhoto: Express.Multer.File) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    profilePhoto = await FileUploadUtils.compressImage(profilePhoto);
    const uploadResult = await this.s3Service.s3_upload(
      profilePhoto.buffer,
      process.env.AWS_S3_BUCKET_NAME,
      manipulateImageName(profilePhoto.originalname),
      'image/jpeg',
    );
    const [base, rest] = uploadResult.Location.split('amazonaws');
    const url = `${base}${process.env.AWS_REGION}.amazonaws${rest}`;
    const thumbnail = await FileUploadUtils.compressThumbnail(profilePhoto);
    const thumbnailS3 = await this.s3Service.s3_upload(
      thumbnail.buffer,
      process.env.AWS_S3_BUCKET_NAME,
      `thumbnails/${manipulateImageName(profilePhoto.originalname)}`,
      thumbnail.mimetype,
    );
    const thumbnailUrl = `${base}${process.env.AWS_REGION}.amazonaws${thumbnailS3.Location.split('amazonaws')[1]}`;

    user.profilePhoto = url;
    user.thumbnail = thumbnailUrl;
    await user.save();
    return {
      success: true,
      message: 'Profile photo updated successfully',
      user,
    };
  }
  async removeProfilePhoto(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    user.profilePhoto =
      'https://pinntag-assets.s3.us-east-1.amazonaws.com/Defaults/Default+user+logo.png';
    user.thumbnail =
      'https://pinntag-assets.s3.us-east-1.amazonaws.com/Defaults/Default+user+logo.png';
    await user.save();
    return {
      success: true,
      message: 'Profile photo removed successfully',
      user,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: data }, { new: true })
      .select({ _v: 0, password: 0 })
      .populate('role', {
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      });
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    } else {
      user.name = `${user.firstName} ${user.lastName}`;
      await user.save();
      return {
        success: true,
        message: 'Profile updated successfully',
        user,
      };
    }
  }

  // async searchUser(query: string, userId: string, emailOnly: boolean) {
  //   //Search users other that the logged in user and role not equal to admin
  //   const admin = await this.userModel.findOne({
  //     email: process.env.ADMIN_EMAIL,
  //   });
  //   let searchQuery = {};
  //   if (!emailOnly) {
  //     searchQuery = {
  //       _id: { $ne: new mongoose.Types.ObjectId(userId) },
  //       role: { $ne: admin.role },
  //       $or: [
  //         { firstName: { $regex: query, $options: 'i' } },
  //         { lastName: { $regex: query, $options: 'i' } },
  //         { email: { $regex: query, $options: 'i' } },
  //       ],
  //     };
  //   } else {
  //     searchQuery = {
  //       _id: { $ne: new mongoose.Types.ObjectId(userId) },
  //       role: { $ne: admin.role },
  //       email: { $regex: query, $options: 'i' },
  //     };
  //   }
  //   const users = await this.userModel
  //     .find(searchQuery)
  //     .select({ password: 0 })
  //     .populate('role', {
  //       __v: 0,
  //       createdAt: 0,
  //       updatedAt: 0,
  //     })
  //     .exec();
  //   return {
  //     success: true,
  //     message: 'Users fetched successfully',
  //     count: users.length,
  //     users,
  //   };
  // }

  async getUserById(id: string): Promise<User> {
    console.log('IDDD:', id);
    const user = await this.userModel.findById(id).select({ password: 0 });
    // .populate('role', {
    //   __v: 0,
    //   createdAt: 0,
    //   updatedAt: 0,
    // })
    // .populate('subscriptions')
    // .populate('refferal', 'id code isBlacklisted')
    // .exec();

    console.log('USERRRR:', user);
    return user;
  }

  async saveOtpToDb(id: string, otp: number, type: string) {
    const savedOtpDoc = await this.otpModel.create({
      otp,
      user: new mongoose.Types.ObjectId(id),
      type,
    });
    // this.logger.log(`Otp saved successfully ${savedOtpDoc}`);
  }

  async validateOtp(data: VerifyOtpDto) {
    const { user, type, otp } = data;
    const foundOtpDoc = await this.otpModel.findOne({
      user: new mongoose.Types.ObjectId(user),
      type,
    });
    if (!foundOtpDoc) {
      return {
        success: false,
        message: 'Otp Expired, Please resend.',
      };
    } else if (foundOtpDoc.otp !== otp) {
      return {
        success: false,
        message: 'Invalid Otp',
      };
    } else {
      return {
        success: true,
        message: 'Otp verified successfully',
        otp: foundOtpDoc,
      };
    }
  }

  async saveOtp(data: ResendOtpDto) {
    const { user, type } = data;
    const foundOtpDoc = await this.otpModel.findOne({
      user: new mongoose.Types.ObjectId(user),
      type,
    });
    // const otp = generateOtp();
    const otp = 123456;

    // if (!foundOtpDoc) {
    //   this.saveOtpToDb(user, otp, type);
    // } else {
    //   foundOtpDoc.otp = otp;
    //   await foundOtpDoc.save();
    // }

    await this.otpModel.deleteMany({
      user: new mongoose.Types.ObjectId(user),
      type: type,
    });
    this.saveOtpToDb(user, otp, type);

    return otp;
  }

  async saveToken(
    token: string,
    id: string,
    tokenType: string,
    userType: string,
    guestToken?: boolean,
  ) {
    if (guestToken) {
      return await this.tokenModel.create({
        token,
        type: TokenTypes.GUEST_USER,
        userType: UserTypes.GUEST,
        expiresAt: new Date(Date.now() + 86400000),
      });
    }
    return await this.tokenModel.create({
      token,
      userType: userType,
      user: new mongoose.Types.ObjectId(id),
      type: tokenType,
      expiresAt: new Date(Date.now() + 86400000),
    });
  }

  async saveToken2(token: string, id: string, type: string, expiresAt: Date) {
    const createdToken = await this.tokenModel.create({
      token,
      userType: UserTypes.USER,
      user: new mongoose.Types.ObjectId(id),
      type,
      expiresAt: expiresAt,
    });
  }

  async updateToken(token: string, id: string) {
    return await this.tokenModel.updateOne(
      { userId: new mongoose.Types.ObjectId(id), type: TokenTypes.ACCESS },
      {
        $set: {
          token,
          expiresAt: new Date(Date.now() + 86400000),
        },
      },
    );
  }

  async deleteToken(token: string) {
    return await this.tokenModel.deleteOne({ token: token });
  }

  async followUser(
    targetId: string,
    followingType: string,
    userId: string,
    followerType: string,
  ) {
    if (followingType == User.name) {
      const user = await this.userModel.findById(targetId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } else {
      const businessProfile = await this.businessModel.findById(targetId);
      if (!businessProfile) {
        return {
          success: false,
          message: 'Business not found',
        };
      }
    }
    // Dont allow user to follow himself
    if (targetId == userId) {
      return {
        success: false,
        message: 'You cannot follow yourself',
      };
    }
    const alreadyFollowed = await this.followModel.findOne({
      follower: new mongoose.Types.ObjectId(userId),
      following: new mongoose.Types.ObjectId(targetId),
      followerType,
      followingType,
    });
    if (!alreadyFollowed) {
      const follow = await this.followModel.create({
        follower: new mongoose.Types.ObjectId(userId),
        following: new mongoose.Types.ObjectId(targetId),
        followerType,
        followingType,
      });
      //Update following count of user
      await this.updateFollowingCount(
        followerType == User.name ? this.userModel : this.businessModel,
        userId,
        1,
      );
      //Update followers count of target user
      await this.updateFollowerCount(
        followingType == User.name ? this.userModel : this.businessModel,
        targetId,
        1,
      );
      if (followingType == User.name) {
        const user = await this.userModel.findById(targetId);
        let message = '';
        let targetType = '';
        if (followerType == User.name) {
          const follower = await this.userModel.findById(userId);
          message = `${follower.firstName} ${follower.lastName} has started following you`;
          targetType = User.name;
        } else if (followerType == Business.name) {
          const follower = await this.businessModel.findById(userId);
          message = `${follower.name} has started following you`;
          targetType = Business.name;
        }
        if (user) {
          await this.notificationModel.create({
            user: user._id,
            userType: User.name,
            message,
            type: NotificationTypes.FOLLOW,
            targetType,
            targetUser: new mongoose.Types.ObjectId(userId),
            isRead: false,
          });
        }
      } else if (followingType == Business.name) {
        const businessProfile = await this.businessModel
          .findById(targetId)
          .select({ _id: 1, name: 1, createdBy: 1 });

        let message = '';
        let targetType = '';
        if (followerType == User.name) {
          const follower = await this.userModel.findById(userId);
          message = `${follower.name} has started following your business ${businessProfile.name}`;
          targetType = User.name;
        } else if (followerType == Business.name) {
          const follower = await this.businessModel.findById(userId);
          message = `${follower.name} has started following your business ${businessProfile.name}`;
          targetType = Business.name;
        }
        // const user = await this.userModel.findById(businessProfile.creator);
        // if (user) {
        // await this.notificationModel.create({
        //   user: businessProfile._id,
        //   userType: Business.name,
        //   message,
        //   type: NotificationTypes.FOLLOW,
        //   targetType,
        //   targetUser: new mongoose.Types.ObjectId(userId),
        //   isRead: false,
        // });
        // const fcmTokens = await this.tokenModel.find({
        //   user: new mongoose.Types.ObjectId(userId),
        //   type: TokenTypes.FCM,
        // });

        // console.log('fcmTokens', fcmTokens);
        // for (let j = 0; j < fcmTokens.length; j++) {
        //   this.firebaseService.sendNotification(
        //     fcmTokens[j].token,
        //     'New Follower',
        //     message,
        //     { data: NotificationTypes.FOLLOW },
        //   );
        // }
        // }

        this.businessNotification(
          userId,
          businessProfile.id,
          NotificationTypes.FOLLOW,
          message,
        );
      }
    }
    const resp = followingType == User.name ? 'User' : 'Business';
    console.log('resp', resp);

    return {
      success: true,
      message: `${resp} followed successfully`,
    };
  }

  async unfollowUser(targetId: string, userId: string) {
    const follow = await this.followModel.findOne({
      follower: new mongoose.Types.ObjectId(userId),
      following: new mongoose.Types.ObjectId(targetId),
    });
    if (follow) {
      const followingType = follow.followingType;
      if (followingType == User.name) {
        const user = await this.userModel.findById(targetId);
        if (!user) {
          return {
            success: false,
            message: 'User not found',
          };
        }
      } else {
        const businessProfile = await this.businessModel.findById(targetId);
        if (!businessProfile) {
          return {
            success: false,
            message: 'User not found',
          };
        }
      }
      await this.followModel.deleteOne({ _id: follow._id });
      //Update following count of user
      await this.updateFollowingCount(
        follow.followerType == User.name ? this.userModel : this.businessModel,
        userId,
        -1,
      );
      //Update followers count of target user
      await this.updateFollowerCount(
        followingType == User.name ? this.userModel : this.businessModel,
        targetId,
        -1,
      );
    }
    const resp = follow.followingType == User.name ? 'User' : 'Business';
    return {
      success: true,
      message: `${resp} unfollowed successfully`,
    };
  }

  async getFollowers(userId: string) {
    const followers = await this.followModel
      .find({
        following: new mongoose.Types.ObjectId(userId),
      })
      .populate(
        'follower',
        '_id firstName lastName profilePhoto name profileType image',
      )
      .sort({ createdAt: -1 });
    //Sort followers by alphabetical order
    // followers.sort((a, b) => {
    //   const nameA = a.follower['firstName'].toUpperCase();
    //   const nameB = b.follower['firstName'].toUpperCase();
    //   return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    // });
    return {
      success: true,
      message: 'Followers fetched successfully',
      count: followers.length,
      followers,
    };
  }

  async getFollowing(userId: string) {
    const following = await this.followModel
      .find({
        follower: new mongoose.Types.ObjectId(userId),
        isBlocked: false,
      })
      .populate(
        'following',
        'firstName lastName profilePhoto name profileType image isDeleted cover logo',
      );
    // .sort({ createdAt: -1 });
    //Sort following by alphabetical order
    following.sort((a, b) => {
      const nameA = a.following['name'].toUpperCase();
      const nameB = b.following['name'].toUpperCase();
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });
    //if the following type is business profile then only select the profile which are not deleted
    const filteredFollowing = following.filter((follow) => {
      if (follow.following['profileType'] == Business.name) {
        return follow.following['isDeleted'] == false;
      }
      return true;
    });
    return {
      success: true,
      message: 'Following fetched successfully',
      count: filteredFollowing.length,
      following: filteredFollowing,
    };
  }

  // async blockUser(targetId: string, userId: string) {
  //   const follow = await this.followModel.findOne({
  //     follower: new mongoose.Types.ObjectId(userId),
  //     following: new mongoose.Types.ObjectId(targetId),
  //   });
  //   let result = {};
  //   if (!follow) {
  //     return {
  //       success: false,
  //       message: 'User not found in your following list',
  //     };
  //   } else {
  //     if (follow.followingType == User.name) {
  //       const user = await this.userModel.findById(targetId);
  //       if (!user) {
  //         return {
  //           success: false,
  //           message: 'User not found',
  //         };
  //       } else {
  //         result = user;
  //       }
  //     } else {
  //       const businessProfile = await this.businessModel.findById(targetId);
  //       if (!businessProfile) {
  //         return {
  //           success: false,
  //           message: 'User not found',
  //         };
  //       } else {
  //         result = businessProfile;
  //       }
  //     }
  //   }
  //   follow.isBlocked = true;
  //   await follow.save();
  //   return {
  //     success: true,
  //     message: 'User blocked successfully',
  //     user: result,
  //   };
  // }

  // async getTransactions(userId: string) {
  //   const transactions = await this.transactionModel
  //     .find({ user: new mongoose.Types.ObjectId(userId) })
  //     .populate('subscription', '-createdAt -updatedAt -__v')
  //     //populate product in subscription data
  //     .populate({
  //       path: 'subscription',
  //       populate: {
  //         path: 'product',
  //         select: '-createdAt -updatedAt -__v',
  //       },
  //     })
  //     .sort({ createdAt: -1 })
  //     .exec();
  //   return {
  //     success: true,
  //     message: 'Transactions fetched successfully',
  //     count: transactions.length,
  //     transactions,
  //   };
  // }

  public async updateFollowerCount(model: any, id: string, count: number) {
    await model.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $inc: { followersCount: count } },
    );
  }

  public async updateFollowingCount(
    model: any,
    // model: Model<UserDocument> | Model<BusinessProfileDocument>,
    id: string,
    count: number,
  ) {
    await model.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $inc: { followingCount: count } },
    );
  }

  async isEventSaved(eventId: string, userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      return user.savedEvents.includes(new mongoose.Types.ObjectId(eventId));
    } else {
      return false;
    }
  }

  async areEventsSaved(eventIds: string[], userId: string) {
    // Fetch the user document by ID
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      // Create a map to store the saved status for each event ID
      const savedStatusMap = new Map();
      // Check if each event ID is in the user's savedEvents array
      eventIds.forEach((eventId) => {
        savedStatusMap.set(
          eventId,
          user.savedEvents.includes(new mongoose.Types.ObjectId(eventId)),
        );
      });
      // Return an array of objects with eventId and isSaved status
      return eventIds.map((eventId) => ({
        eventId,
        isSaved: savedStatusMap.get(eventId),
      }));
    } else {
      // If user is not found, return all false statuses
      return eventIds.map((eventId) => ({ eventId, isSaved: false }));
    }
  }

  async areEventsLiked(eventIds: string[], userId: string) {
    // Fetch the user document by ID
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      // Create a map to store the liked status for each event ID
      const likedStatusMap = new Map();
      // Check if each event ID is in the user's likedEvents array
      eventIds.forEach((eventId) => {
        likedStatusMap.set(
          eventId,
          user.likedEvents.includes(new mongoose.Types.ObjectId(eventId)),
        );
      });
      // Return an array of objects with eventId and isLiked status
      return eventIds.map((eventId) => ({
        eventId,
        isLiked: likedStatusMap.get(eventId),
      }));
    } else {
      // If user is not found, return all false statuses
      return eventIds.map((eventId) => ({ eventId, isLiked: false }));
    }
  }

  async isEventLiked(eventId: string, userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      return user.likedEvents.includes(new mongoose.Types.ObjectId(eventId));
    } else {
      return false;
    }
  }

  async contactUs(userId: string, data: ContactUsDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    data.user = new mongoose.Types.ObjectId(userId);
    let result;
    const foundContactUs = await this.contactUsModel.findOne({
      user: new mongoose.Types.ObjectId(userId),
    });
    if (!foundContactUs) {
      const contactUs = await this.contactUsModel.create(data);
      result = contactUs;
    } else {
      foundContactUs.name = data.name;
      foundContactUs.email = data.email;
      foundContactUs.description = data.description;
      foundContactUs['updatedAt'] = new Date();
      await foundContactUs.save();
      result = foundContactUs;
    }
    return {
      success: true,
      message: 'Contact us request sent successfully',
      contactUs: result,
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    await this.userModel.deleteOne({
      _id: new mongoose.Types.ObjectId(userId),
    });
    await this.otpModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.businessModel.deleteMany({
      createdBy: new mongoose.Types.ObjectId(userId),
    });
    await this.eventModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.reportModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.savedEventModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.templateModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.notificationModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.subscriptionModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.contactUsModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.refferalModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    await this.tokenModel.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });
    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }

  async getAllChildUserIds2(userId) {
    const objectId = new mongoose.Types.ObjectId(userId);
    const result = await this.businessUserModel
      .aggregate([
        {
          $match: { _id: objectId },
        },
        {
          $graphLookup: {
            from: this.businessUserModel.collection.name,
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'creator',
            as: 'descendants',
            restrictSearchWithMatch: {
              creatorType: BusinessUserCreatorType.BUSINESS,
            },
          },
        },
        {
          $project: {
            _id: 0,
            descendantIds: {
              $map: {
                input: '$descendants',
                as: 'd',
                in: { $toString: '$$d._id' },
              },
            },
          },
        },
      ])
      .exec();

    return result[0]?.descendantIds || [];
  }

  async businessNotification(
    consumerId: string,
    contentId: string,
    notificationType: string,
    message: string,
  ) {
    try {
      console.log(
        'BUSINESS NOTIFICATION DATAAAA:',
        consumerId,
        contentId,
        notificationType,
        message,
      );
      let content = null;
      let business = null;
      if (
        notificationType == NotificationTypes.EVENT ||
        notificationType == NotificationTypes.REPORT
      ) {
        content = await this.eventModel.findById(contentId);
        business = await this.businessModel.findById(content.businessProfile);
      } else if (notificationType == NotificationTypes.REWARD) {
        content = await this.rewardModel.findById(contentId);
        business = await this.businessModel.findById(content.businessProfile);
      } else if (notificationType == NotificationTypes.FOLLOW) {
        business = await this.businessModel.findById(contentId);
      }

      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }

      const downlineUsers = await this.getAllChildUserIds2(
        business.authorisedUser,
      );
      console.log('Downline Users:', downlineUsers);
      let notifcationEnabledUsers = [];
      notifcationEnabledUsers.push(business.authorisedUser);
      for (const user of downlineUsers) {
        const isUserEnabled = await this.userAllowedNotificationModel.findOne({
          user: user,
          notificationType: notificationType,
        });
        if (isUserEnabled) {
          notifcationEnabledUsers.push(user);
        }
      }

      console.log('Notification Enabled Users:', notifcationEnabledUsers);

      for (const user of notifcationEnabledUsers) {
        let notiObj = {
          user: user,
          userType: BusinessUser.name,
          message,
          type: notificationType,
          targetType: Business.name,
          targetUser: new mongoose.Types.ObjectId(consumerId),
        };
        if (
          notificationType == NotificationTypes.EVENT ||
          notificationType == NotificationTypes.REPORT
        ) {
          notiObj['event'] = new mongoose.Types.ObjectId(contentId);
        } else if (notificationType == NotificationTypes.REWARD) {
          notiObj['reward'] = new mongoose.Types.ObjectId(contentId);
        } else if (notificationType == NotificationTypes.FOLLOW) {
          notiObj['business'] = new mongoose.Types.ObjectId(contentId);
        }

        await this.notificationModel.create({
          ...notiObj,
        });

        const fcmTokens = await this.tokenModel.find({
          user: new mongoose.Types.ObjectId(user),
          type: TokenTypes.FCM,
        });

        console.log('fcmTokens', fcmTokens);
        for (let j = 0; j < fcmTokens.length; j++) {
          this.firebaseService.sendNotification(
            fcmTokens[j].token,
            message,
            message,
            {
              data: { content: contentId, notificationType: notificationType },
            },
          );
        }
      }

      return {
        success: true,
        message: 'Downline users fetched successfully',
        data: downlineUsers,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
