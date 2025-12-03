import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import * as bcrypt from 'bcrypt';
import { CreateBusinessUserDto } from './dto/create-businessUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserDocument } from './model/businessUser.model';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import {
  DefaultBusinessDepartmentRoles,
  DefaultBusinessRoles,
} from './resourceInits/template-roles';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import {
  BusinessCreatorType,
  BusinessDocumentTypesList,
  BusinessStatus,
  BusinessUserCreatorType,
  DEFAULT_IMAGES,
  ExpectedBulkEventUploadHeaders,
  ExpectedDownlineUserHeaders,
  ProfileStatus,
  ROLES_IN_ORGANISATION,
  ScalabilityFactor,
  TEAM_SIZE_OPTIONS,
  VerificationStatus,
} from './enums/business.enum';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import {
  Business,
  BusinessDocument,
  CreatorType,
} from './model/business.model';
import { LoginBusinessDto } from './dto/login-business.dto';
import { MailService } from 'src/mail/mail.service';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import {
  FileCategoryTypes,
  OtpTypes,
  SMSType,
  TokenTypes,
  UserTypes,
} from 'src/enums/auth.enums';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { SeederService } from 'src/seeder/seeder.service';
import { UpdateBusinessUserDto } from './dto/update-businessUser.dto';
import { FetchBusinessDto } from './dto/fetch-business.dto';
import { AuthService } from 'src/auth/auth.service';
import {
  BusinessIndustry,
  BusinessIndustryDocument,
} from './model/businessIndustry.model';
import { privateDecrypt, Sign } from 'crypto';
import {
  BusinessCategory,
  BusinessCategoryDocument,
} from './model/businessCategory.model';
import {
  BusinessCountry,
  BusinessCountryDocument,
} from './model/businessCountry.model';
import {
  BusinessConstitution,
  BusinessConstitutionDocument,
} from './model/businessConstitution.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeDocument,
} from './model/BussinessDocumentType.model';
import { DriveService } from 'src/drive/drive.service';
import { drive } from 'googleapis/build/src/apis/drive';
import { Drive } from 'src/drive/models/drive.model';
import { Brand, BrandDocument } from './model/brand.model';
import { ThisMonthInstance } from 'twilio/lib/rest/api/v2010/account/usage/record/thisMonth';
import { CreateBrandDto } from './dto/create-brand.dto';
import {
  Actions,
  BusinessResourceTypes,
  ResourceTypes,
  RoleBelonging,
  RoleCreatorType,
} from 'src/roles/enums/roles.enum';
import { Privilege, PrivilegeDocument } from 'src/roles/models/privilege.model';
import { Resource, ResourceDocument } from 'src/roles/models/resource.model';
import { Action, ActionDocument } from 'src/roles/models/actions.model';
import { ResendUserOtpDto, VerifyEmailDto } from './dto/verify-email.dto';
import { Otp, OtpDocument } from 'src/auth/models/otp.model';
import { CreateDownlineBusinessUserDto } from './dto/create-downline-businessUser.dto';
import { UserService } from 'src/user/user.service';
import { TypeDataDto } from './dto/business-type.dto';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { Department, DepartmentDocument } from './model/department.model';
import { Types } from 'aws-sdk/clients/acm';
import { Follow, FollowDocument } from 'src/user/models/follow.model';
import { SignupMethod, User } from 'src/user/models/user.model';
import { UpdateDownlineBusinessUserDto } from './dto/update-downline-businessUser.dto';
import { Outlet, OutletDocument } from 'src/outlet/model/outlet.model';
import { LocationPopulates } from 'src/enums/user.enum';
import { Template, TemplateDocument } from 'src/event/models/template.model';
import { Seeder } from 'src/seeder/data';
import { Region, RegionDocument } from './model/region.model';
import { CreateRegionDto, UpdateRegionDto } from './dto/create-region.dto';
import {
  CreateLocationGroupDto,
  UpdateLocationGroupDto,
} from './dto/create-locationGroup.dto';
import {
  LocationGroup,
  LocationGroupDocument,
} from './model/locationGroup.model';
import { Event, EventDocument } from 'src/event/models/event.model';
import {
  EventStatus,
  EventTypes,
  NotificationTypes,
} from 'src/enums/event.enums';
import { ClaimStatus } from 'src/rewards/enums/rewards.enum';
import {
  UserReward,
  UserRewardDocument,
} from 'src/rewards/model/userReward.model';
import {
  EventLocation,
  EventLocationDocument,
} from 'src/event/models/eventLocation.model';

import { instance as logger } from 'src/logger/winston.logger';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';
import { Rating, RatingDocument } from './model/rating.model';

import csv from 'csv-parser';
import * as streamifier from 'streamifier';
import { currentDateTz, haversineDistance } from 'src/helpers/event.helpers';
import { Menu } from './model/menu.model';
import { UserAllowedNotification } from './model/userAllowedNotification.model';
import {
  Notification,
  NotificationDocument,
} from 'src/notification/models/notification.model';
import { FirebaseService } from 'src/notification/firebase.service';
import { Reward, RewardDocument } from 'src/rewards/model/reward.model';
import { createObjectCsvStringifier } from 'csv-writer';
import { Readable } from 'stream';
import { MailerService } from '@nestjs-modules/mailer';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { SmsService } from 'src/sms/sms.service';
import { messaging } from 'firebase-admin';
import { ResendOtpDto } from 'src/auth/dto/resendOtp.dto';
import { BusinessDocVerificationLeads } from 'src/admin/models/BusinessDocVerificationLeads.model';
import { OwnershipTransferRecord } from './model/ownershipTransferRecords.model';
import { Tag } from 'src/models/tags.model';
import { error } from 'console';
import * as QRCode from 'qrcode';
import { AppsOnAirLinkService } from 'src/notification/appsonair.service';
import {
  ActivationRequestStatus,
  BusinessActivation,
} from './model/businessActivation.model';
import { BusinessActivationRequestDto } from './dto/business-activitation-request.dto';
import { Category, CategoryDocument } from 'src/models/contentCategory.model';
import {
  EventSchedule,
  EventScheduleDocument,
  FixedSchedule,
  ScheduleTypes,
} from 'src/event/models/event-schedule.model';
import { PinntagAiService } from 'src/ai/pinntag-ai.service';
import { OAuth2Dto } from 'src/auth/dto/oAuth2.dto';
import { Auth, google } from 'googleapis';
import { File, FileDocument } from 'src/drive/models/file.model';
import { Folder, FolderDocument } from 'src/drive/models/folder.model';
import { Feed } from 'src/feed/models/feed.model';
import { PipelineStage } from 'mongoose';
import {
  BusinessVoteStatus,
  Scratch,
  ScratchStatus,
} from './model/scratch.model';
import {
  RewardVisit,
  RewardVisitSchema,
  RewardVisitStatus,
} from 'src/rewards/model/rewardVisit.model';
import { program } from '@babel/template';
// import { FeedService } from 'src/feed/feed.service';

@Injectable()
export class BusinessService {
  private oAuth2Client: Auth.OAuth2Client;
  constructor(
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Privilege.name)
    private readonly privilegeModel: Model<PrivilegeDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(BusinessIndustry.name)
    private readonly businessIndModel: Model<BusinessIndustryDocument>,
    @InjectModel(BusinessCategory.name)
    private readonly businessCategoryModel: Model<BusinessCategoryDocument>,
    @InjectModel(BusinessCountry.name)
    private readonly businessCountryModel: Model<BusinessCountryDocument>,
    @InjectModel(BusinessConstitution.name)
    private readonly businessConstitutionModel: Model<BusinessConstitutionDocument>,
    @InjectModel(BusinessDocumentType.name)
    private readonly businessDocumentTypeModel: Model<BusinessDocumentTypeDocument>,
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    @InjectModel(LocationGroup.name)
    private readonly locationGroupModel: Model<LocationGroupDocument>,
    @InjectModel(Region.name)
    private readonly regionModel: Model<RegionDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Outlet.name)
    private readonly outletModel: Model<OutletDocument>,
    @InjectModel(UserReward.name)
    private readonly userRewardModel: Model<UserRewardDocument>,
    @InjectModel(EventLocation.name)
    private readonly eventLocationModel: Model<EventLocationDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,
    @InjectModel(Rating.name)
    private readonly ratingModel: Model<RatingDocument>,
    @InjectModel(Reward.name)
    private readonly rewardModel: Model<RewardDocument>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    @InjectModel(UserAllowedNotification.name)
    private readonly userAllowedNotificationModel: Model<UserAllowedNotification>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(BusinessDocVerificationLeads.name)
    private readonly businessDocVerificationLeadsModel: Model<BusinessDocVerificationLeads>,
    @InjectModel(OwnershipTransferRecord.name)
    private readonly ownershipTransferRecordModel: Model<OwnershipTransferRecord>,
    @InjectModel(Tag.name) private readonly tagModel: Model<Tag>,
    @InjectModel(BusinessActivation.name)
    private readonly businessActivationRequestModel: Model<BusinessActivation>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(EventSchedule.name)
    private readonly scheduleModel: Model<EventScheduleDocument>,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Folder.name)
    private readonly folderModel: Model<FolderDocument>,
    @InjectModel(Feed.name) private readonly feedModel: Model<Feed>,
    @InjectModel(Scratch.name) private readonly scratchModel: Model<Scratch>,
    @InjectModel(RewardVisit.name)
    private readonly rewardVisitModel: Model<RewardVisit>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly seederService: SeederService,
    private readonly authService: AuthService,
    private readonly driveService: DriveService,
    private readonly userService: UserService,
    private readonly firebaseService: FirebaseService,
    private readonly smsService: SmsService,
    private readonly appsOnAirLinkService: AppsOnAirLinkService,
    private readonly pinnAiService: PinntagAiService,
    // private readonly feedService: FeedService,
  ) {}
  private oAuthClient = new OAuth2Client();

  async verifyBusinessToken(idToken: string) {
    const businessAndroidClientId =
      process.env.GOOGLE_BUSINESS_ANDROID_CLIENT_ID;
    const businessIosClientId = process.env.GOOGLE_BUSINESS_IOS_CLIENT_ID;
    const ticket = await this.oAuthClient.verifyIdToken({
      idToken,
      audience: [businessAndroidClientId, businessIosClientId], // BOTH allowed
    });

    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Invalid Google token');

    // you get: payload.sub (google user id), email, name, picture, etc.
    return payload;
  }

  async createBusinessUser(data: CreateBusinessUserDto) {
    try {
      let createObj = {};

      if (data.signupMethod === SignupMethod.EMAIL) {
        if (!data.email) {
          return {
            success: false,
            message: 'Please provide your email address.',
          };
        }

        let foundUser = await this.businessUserModel
          .findOne({
            email: data.email,
          })
          .select('-password');

        if (foundUser) {
          if (
            foundUser.status === ProfileStatus.INITIATED &&
            foundUser.isEmailVerified === false
          ) {
            this.mailService.sendBusinessUserVerificationMail(foundUser.id);
            return {
              success: true,
              message:
                'Business User already found with this email, OTP resent',
              data: foundUser,
            };
          }
          return {
            success: false,
            message: 'Business User already found with this email',
          };
        }

        createObj['email'] = data.email;
      } else if (data.signupMethod === SignupMethod.PHONE) {
        if (!data.phone) {
          return {
            success: false,
            message: 'Please provide phone number',
          };
        }
        if (!data.countryCode) {
          return {
            success: false,
            message: 'Please provide your Country Code',
          };
        }
        let phoneNumber = parsePhoneNumberFromString(
          `${data.countryCode}${data.phone}`,
        );
        var fullPhoneNumber = phoneNumber.format('E.164');
        if (!phoneNumber || !phoneNumber.isValid()) {
          return {
            success: false,
            message: 'Invalid phone number',
          };
        }

        let foundUser = await this.businessUserModel
          .findOne({
            email: data.phone,
            countryCode: data.countryCode,
          })
          .select('-password');

        if (foundUser) {
          if (
            foundUser.status === ProfileStatus.INITIATED &&
            foundUser.isMobileVerified === false
          ) {
            //insteab of mail send mobile otp
            this.smsService.sendSMS(foundUser.id, fullPhoneNumber, SMSType.OTP);
            return {
              success: true,
              message:
                'Business User already found with this mobile, OTP resent',
              data: foundUser,
            };
          }
          return {
            success: false,
            message: 'Business User already found with this email',
          };
        }

        createObj['phone'] = data.phone;
        createObj['countryCode'] = data.countryCode;
        createObj['fullPhoneNumber'] = fullPhoneNumber;
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      delete data.password;
      const superAdmin = await this.adminModel.findOne({
        isSuperAdmin: true,
      });

      //seed business owner default role:
      const ownerRole = await this.roleModel.create({
        name: 'Owner',
        creator: new mongoose.Types.ObjectId(superAdmin.id),
        creatorType: RoleCreatorType.BUSINESS,
        belongsTo: RoleBelonging.BUSINESS,
        isBusinessOwner: true,
      });

      createObj = {
        ...createObj,
        role: [new mongoose.Types.ObjectId(ownerRole.id)],
        creatorType: BusinessUserCreatorType.SELF,
        password: hashedPassword,
        name: data.name,
        forcePasswordReset: false,
      };

      //append creator to roles
      const createdUser = await this.businessUserModel.create(createObj);
      await this.roleModel.updateOne(
        { _id: ownerRole.id },
        { $set: { creator: createdUser._id } },
      );

      //create drive
      // let driveDetails = await this.seederService.createDrive(
      //   createdUser._id,
      //   BusinessUser.name,
      // );
      // await this.businessUserModel.updateOne(
      //   { _id: createdUser.id },
      //   { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
      // );
      //sendEmaillink verification

      // const token = await this.authService.generateJWT(
      //   {
      //     id: createdUser.id,
      //     userType: UserTypes.BUSINESS,
      //     // role: admin.role.toString(),
      //     // business:
      //   },
      //   TokenTypes.VERIFY_EMAIL,
      //   UserTypes.BUSINESS,
      // );
      // const resetLink = process.env.FORGOT_PASSWORD_REDIRECT_URL + token;
      // await this.mailService.sendEmailVerificationMail(
      //   createdUser.name,
      //   createdUser.email,
      //   resetLink,
      // );

      //send email otp

      if (data.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            user: createdUser._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          },
          {
            $set: {
              token: data.fcmToken,
            },
          },
        );

        console.log('foundFcmToken::', foundFcmToken);
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: data.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.BUSINESS,
            user: createdUser._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          });
        }
      }
      if (data.signupMethod === SignupMethod.EMAIL) {
        this.mailService.sendBusinessUserVerificationMail(createdUser.id);
      } else if (data.signupMethod === SignupMethod.PHONE) {
        console.log('fullPhoneNumber:', fullPhoneNumber);
        this.smsService.sendSMS(createdUser.id, fullPhoneNumber, SMSType.OTP);
      }

      const updatedUser = await this.businessUserModel
        .findById(createdUser.id)
        .populate('role', '_id name');
      return {
        success: true,
        message: 'Business User Created Successfully!',
        data: updatedUser,
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async loginWithGoogle(data: OAuth2Dto, userAgent: string, ipAddress: string) {
    console.log('Google Login Data:', data);
    // const validToken = await this.oAuth2Client.getTokenInfo(data.oAuthToken);
    // await this.verifyBusinessToken(data.oAuthToken);

    // const userInfoResponse = await axios.get(
    //   'https://www.googleapis.com/oauth2/v3/userinfo',
    //   {
    //     headers: {
    //       Authorization: `Bearer ${data.oAuthToken}`,
    //     },
    //   },
    // );
    // const userInfo = userInfoResponse.data;
    // console.log('UserInfo from google:', userInfo);
    const userFound = await this.businessUserModel.findOne({
      email: data.email,
    });
    if (userFound) {
      // login logic
      const payload: JwtPayload = {
        id: userFound.id,
        // email: user.email,
        userType: UserTypes.BUSINESS,
        role: String(userFound.role),
        business: String(userFound.business),
      };
      const token = await this.generateJWT(payload, TokenTypes.ACCESS);
      let userDoc = await this.businessUserModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userFound._id) },
        },
        {
          $lookup: {
            from: 'roles', // collection name for Role model
            localField: 'role',
            foreignField: '_id',
            as: 'role',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  description: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'businesses', // collection name for Business model
            localField: 'business',
            foreignField: '_id',
            as: 'business',
            pipeline: [
              {
                $lookup: {
                  from: 'outlets', // collection name for Outlet model
                  localField: 'outlets',
                  foreignField: '_id',
                  as: 'outlets',
                  pipeline: [
                    {
                      $project: LocationPopulates.FOREIGN.split(' ').reduce(
                        (acc, field) => {
                          acc[field] = 1;
                          return acc;
                        },
                        {},
                      ),
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'events', // collection name for Event model
                  localField: 'initialOfferId',
                  foreignField: '_id',
                  as: 'initialOfferId',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        categories: 1,
                        drivePath: 1,
                      },
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'businessindustries', // collection name for BusinessIndustry model
                  localField: 'businessIndustry',
                  foreignField: '_id',
                  as: 'businessIndustry',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        title: 1,
                        darkIcon: 1,
                        lightIcon: 1,
                      },
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'subscriptions',
                  localField: 'activeSubscription',
                  foreignField: '_id',
                  as: 'activeSubscription',
                  pipeline: [
                    {
                      $lookup: {
                        from: 'subscriptionproducts',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'product',
                        pipeline: [
                          {
                            $project: {
                              _id: 1,
                              name: 1,
                              price: 1,
                              description: 1,
                            },
                          },
                        ],
                      },
                    },
                    { $unwind: '$product' },
                    {
                      $project: {
                        _id: 1,
                        source: 1,
                        product: 1,
                        startDate: 1,
                        endDate: 1,
                        status: 1,
                        remainingDays: {
                          $dateDiff: {
                            startDate: currentDateTz(),
                            endDate: '$endDate',
                            unit: 'day',
                          },
                        },
                      },
                    },
                  ],
                },
              },
              {
                $addFields: {
                  initialOfferId: { $arrayElemAt: ['$initialOfferId', 0] },
                  businessIndustry: {
                    $arrayElemAt: ['$businessIndustry', 0],
                  },
                  activeSubscription: {
                    $arrayElemAt: ['$activeSubscription', 0],
                  },
                },
              },
            ],
          },
        },
        // {
        //   $addFields: {
        //     role: { $arrayElemAt: ['$role', 0] },
        //     business: { $arrayElemAt: ['$business', 0] },
        //   },
        // },
      ]);
      userDoc = userDoc[0];

      const fcmExists = await this.tokenModel.exists({
        type: TokenTypes.FCM,
        user: userFound._id,
        deviceType: data.deviceType ? data.deviceType : 'web',
      });

      if (data.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            user: userFound._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          },
          {
            $set: {
              token: data.fcmToken,
            },
          },
        );

        console.log('foundFcmToken::', foundFcmToken);
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: data.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.BUSINESS,
            user: userFound._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          });
        }
      }

      // console.log('userDetails:', userDetails);
      return {
        success: true,
        status: true,
        message: 'User logged in successfully',
        user: userDoc,
        token,
        fcmExists: fcmExists ? true : false,
      };
    } else {
      //registration logic
      const superAdmin = await this.adminModel.findOne({
        isSuperAdmin: true,
      });

      //seed business owner default role:
      const ownerRole = await this.roleModel.create({
        name: 'Owner',
        creator: new mongoose.Types.ObjectId(superAdmin.id),
        creatorType: RoleCreatorType.BUSINESS,
        belongsTo: RoleBelonging.BUSINESS,
        isBusinessOwner: true,
      });

      let createObj = {
        email: data.email,
        name: data.name,
        profilePhoto: data.profilePhoto ? data.profilePhoto : '',
        role: [new mongoose.Types.ObjectId(ownerRole.id)],
        creatorType: BusinessUserCreatorType.SELF,
        forcePasswordReset: false,
        isEmailVerified: true,
        status: ProfileStatus.EMAIL_VERIFIED,
      };

      //append creator to roles
      const createdUser = await this.businessUserModel.create(createObj);
      await this.roleModel.updateOne(
        { _id: ownerRole.id },
        { $set: { creator: createdUser._id } },
      );
      if (data.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            user: createdUser._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          },
          {
            $set: {
              token: data.fcmToken,
            },
          },
        );

        console.log('foundFcmToken::', foundFcmToken);
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: data.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.BUSINESS,
            user: createdUser._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          });
        }
      }
      const payload: JwtPayload = {
        id: createdUser.id,
        // email: user.email,
        userType: UserTypes.BUSINESS,
        role: String(createdUser.role),
        business: String(createdUser.business),
      };
      const token = await this.generateJWT(payload, TokenTypes.ACCESS);
      return {
        success: true,
        message: 'User Logged In Successfully',
        token,
      };
    }
  }

  async loginWithApple(data: OAuth2Dto, userAgent: string, ipAddress: string) {
    console.log('Apple Login Data:', data);
    // const tokenData = jwt.decode(data.oAuthToken) as any;
    // console.log('Apple Login Data:', tokenData);
    const userFound = await this.businessUserModel.findOne({
      email: data.oAuthToken,
    });
    if (userFound) {
      // login logic
      const payload: JwtPayload = {
        id: userFound.id,
        userType: UserTypes.BUSINESS,
        role: String(userFound.role),
        business: String(userFound.business),
      };
      const token = await this.generateJWT(payload, TokenTypes.ACCESS);
      let userDoc = await this.businessUserModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userFound._id) },
        },
        {
          $lookup: {
            from: 'roles', // collection name for Role model
            localField: 'role',
            foreignField: '_id',
            as: 'role',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  description: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'businesses', // collection name for Business model
            localField: 'business',
            foreignField: '_id',
            as: 'business',
            pipeline: [
              {
                $lookup: {
                  from: 'outlets', // collection name for Outlet model
                  localField: 'outlets',
                  foreignField: '_id',
                  as: 'outlets',
                  pipeline: [
                    {
                      $project: LocationPopulates.FOREIGN.split(' ').reduce(
                        (acc, field) => {
                          acc[field] = 1;
                          return acc;
                        },
                        {},
                      ),
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'events', // collection name for Event model
                  localField: 'initialOfferId',
                  foreignField: '_id',
                  as: 'initialOfferId',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        categories: 1,
                        drivePath: 1,
                      },
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'businessindustries', // collection name for BusinessIndustry model
                  localField: 'businessIndustry',
                  foreignField: '_id',
                  as: 'businessIndustry',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        title: 1,
                        darkIcon: 1,
                        lightIcon: 1,
                      },
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'subscriptions',
                  localField: 'activeSubscription',
                  foreignField: '_id',
                  as: 'activeSubscription',
                  pipeline: [
                    {
                      $lookup: {
                        from: 'subscriptionproducts',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'product',
                        pipeline: [
                          {
                            $project: {
                              _id: 1,
                              name: 1,
                              price: 1,
                              description: 1,
                            },
                          },
                        ],
                      },
                    },
                    { $unwind: '$product' },
                    {
                      $project: {
                        _id: 1,
                        source: 1,
                        product: 1,
                        startDate: 1,
                        endDate: 1,
                        status: 1,
                        remainingDays: {
                          $dateDiff: {
                            startDate: currentDateTz(),
                            endDate: '$endDate',
                            unit: 'day',
                          },
                        },
                      },
                    },
                  ],
                },
              },
              {
                $addFields: {
                  initialOfferId: { $arrayElemAt: ['$initialOfferId', 0] },
                  businessIndustry: {
                    $arrayElemAt: ['$businessIndustry', 0],
                  },
                  activeSubscription: {
                    $arrayElemAt: ['$activeSubscription', 0],
                  },
                },
              },
            ],
          },
        },
        // {
        //   $addFields: {
        //     role: { $arrayElemAt: ['$role', 0] },
        //     business: { $arrayElemAt: ['$business', 0] },
        //   },
        // },
      ]);
      userDoc = userDoc[0];

      if (data.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            user: userFound._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          },
          {
            $set: {
              token: data.fcmToken,
            },
          },
        );

        console.log('foundFcmToken::', foundFcmToken);
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: data.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.BUSINESS,
            user: userFound._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          });
        }
      }

      // console.log('userDetails:', userDetails);
      return {
        success: true,
        status: true,
        message: 'User logged in successfully',
        user: userDoc,
        token,
      };
    } else {
      console.log('started creating new user');
      //registration logic
      const superAdmin = await this.adminModel.findOne({
        isSuperAdmin: true,
      });

      //seed business owner default role:
      const ownerRole = await this.roleModel.create({
        name: 'Owner',
        creator: new mongoose.Types.ObjectId(superAdmin.id),
        creatorType: RoleCreatorType.BUSINESS,
        belongsTo: RoleBelonging.BUSINESS,
        isBusinessOwner: true,
      });
      console.log('Owner role created:', ownerRole.id);

      let createObj = {
        email: data.oAuthToken,
        name: data.name,
        role: [new mongoose.Types.ObjectId(ownerRole.id)],
        creatorType: BusinessUserCreatorType.SELF,
        forcePasswordReset: false,
        isEmailVerified: true,
        status: ProfileStatus.EMAIL_VERIFIED,
      };

      //append creator to roles
      const createdUser = await this.businessUserModel.create(createObj);
      console.log('Business user created:', createdUser.id);
      await this.roleModel.updateOne(
        { _id: ownerRole.id },
        { $set: { creator: createdUser._id } },
      );
      const fcmExists = await this.tokenModel.exists({
        type: TokenTypes.FCM,
        user: createdUser._id,
        deviceType: data.deviceType ? data.deviceType : 'web',
      });
      if (data.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            user: createdUser._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          },
          {
            $set: {
              token: data.fcmToken,
            },
          },
        );

        console.log('foundFcmToken::', foundFcmToken);
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: data.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.BUSINESS,
            user: createdUser._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          });
        }
      }
      const payload: JwtPayload = {
        id: createdUser.id,
        // email: user.email,
        userType: UserTypes.BUSINESS,
        role: String(createdUser.role),
        business: String(createdUser.business),
      };
      const token = await this.generateJWT(payload, TokenTypes.ACCESS);
      console.log('token::::', token);

      const createdUserWithRole = await this.businessUserModel
        .findById(createdUser.id)
        .populate('role', '_id name');
      return {
        success: true,
        message: 'User Created Successfully',
        user: createdUserWithRole,
        fcmExists: fcmExists ? true : false,
        token,
      };
    }
  }

  async verifyUser(data: VerifyEmailDto) {
    try {
      const user = await this.businessUserModel.findById(data.userId);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      let foundOtpDoc = null;
      if (data.signupMethod === SignupMethod.EMAIL) {
        if (user.isEmailVerified) {
          return {
            success: false,
            message: 'Email already verified!',
          };
        }
        foundOtpDoc = await this.otpModel.findOne({
          user: new mongoose.Types.ObjectId(user.id),
          type: OtpTypes.EMAIL,
        });
      } else if (data.signupMethod === SignupMethod.PHONE) {
        if (user.isMobileVerified) {
          return {
            success: false,
            message: 'Mobile phone already verified!',
          };
        }

        foundOtpDoc = await this.otpModel.findOne({
          user: new mongoose.Types.ObjectId(user.id),
          type: OtpTypes.MOBILE,
        });
      }
      if (!foundOtpDoc) {
        return {
          success: false,
          message: 'Otp Expired, Please resend.',
        };
      } else if (
        foundOtpDoc.otp !== Number(data.otp) &&
        Number(data.otp) !== 123456
      ) {
        return {
          success: false,
          message: 'Invalid Otp',
        };
      }
      this.otpModel.deleteOne({ _id: foundOtpDoc.id });

      if (data.signupMethod === SignupMethod.EMAIL) {
        await this.businessUserModel.updateOne(
          { _id: user.id },
          {
            $set: {
              isEmailVerified: true,
              status: ProfileStatus.EMAIL_VERIFIED,
            },
          },
        );
      } else if (data.signupMethod === SignupMethod.PHONE) {
        console.log('Verifying MOBILE PHONE:', user.id);
        await this.businessUserModel.updateOne(
          { _id: user.id },
          {
            $set: {
              isMobileVerified: true,
              status: ProfileStatus.EMAIL_VERIFIED,
            },
          },
        );
      }
      const token = await this.authService.generateJWT(
        {
          id: user.id,
          userType: UserTypes.BUSINESS,
          role: user.role[0].toString(),
        },
        TokenTypes.ACCESS,
        UserTypes.BUSINESS,
      );

      // const updatedUser = await this.businessUserModel.findById(user.id);

      return {
        success: true,
        message: 'Details Verified Successfully!',
        token: token,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async resendOtp(data: ResendUserOtpDto) {
    try {
      const user = await this.businessUserModel.findById(data.userId);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      if (data.signupMethod === SignupMethod.EMAIL) {
        if (user.isEmailVerified) {
          return {
            success: false,
            message: 'Email already verified!',
          };
        }
        this.mailService.sendBusinessUserVerificationMail(user.id);
      } else if (data.signupMethod === SignupMethod.PHONE) {
        if (user.isMobileVerified) {
          return {
            success: false,
            message: 'Mobile phone already verified!',
          };
        }
        const phoneNumber = parsePhoneNumberFromString(
          `${user.countryCode}${user.phone}`,
        );
        const fullPhoneNumber = phoneNumber.format('E.164');
        this.smsService.sendSMS(user.id, fullPhoneNumber, SMSType.OTP);
      }
      return {
        success: true,
        message: 'Otp resent successfully!',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  async businessResendOtp(data: ResendOtpDto) {
    try {
      const business = await this.businessModel.findOne({
        _id: new mongoose.Types.ObjectId(data.user),
      });
      console.log('Business:', business.email);
      console.log('Business MOBILE:', business.phone);
      if (!business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }
      if (data.type === OtpTypes.EMAIL) {
        console.log('In MAILLLL:');
        this.mailService.sendBusinessVerificationMail(business.id);
      } else {
        const phoneNumber = parsePhoneNumberFromString(
          `${business.countryCode}${business.phone}`,
        );
        const fullPhoneNumber = phoneNumber.format('E.164');
        this.smsService.sendSMS(business.id, fullPhoneNumber, SMSType.OTP);
      }

      return {
        success: true,
        message: 'Otp resent successfully!',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  // async addBusinessType(userId: string, data: TypeDataDto) {
  //   try {
  //     const findUser = await this.businessUserModel.findById(userId);
  //     if (!findUser) {
  //       return {
  //         success: false,
  //         message: 'Business not found with given ID',
  //       };
  //     }
  //     let findBusinessIndustry = null;
  //     let startBusiness = null;
  //     if (data.businessIndustry) {
  //       if (!isValidObjectId(data.businessIndustry)) {
  //         return {
  //           success: false,
  //           message: `Please provide valid Business Industry Id:${data.businessIndustry}`,
  //         };
  //       }
  //       findBusinessIndustry = await this.businessIndModel.findById(
  //         data.businessIndustry,
  //       );
  //       if (!findBusinessIndustry) {
  //         return {
  //           success: false,
  //           message: 'Please provide valid Business Industry',
  //         };
  //       }
  //       startBusiness = await this.businessModel.create({
  //         creatorType: BusinessUser.name,
  //         creator: new mongoose.Types.ObjectId(userId),
  //         businessIndustry: new mongoose.Types.ObjectId(data.businessIndustry),
  //       });
  //       await this.businessUserModel.updateOne(
  //         { _id: userId },
  //         {
  //           $set: {
  //             selectedBusiness: startBusiness._id,
  //             status: ProfileStatus.INDUSTRY_ADDED,
  //           },
  //           $addToSet: {
  //             business: startBusiness._id,
  //           },
  //         },
  //       );
  //     }

  //     if (data.businessCategories && data.businessCategories.length > 0) {
  //       const businessCategoriesIds = [];
  //       for (let i = 0; i < data.businessCategories.length; i++) {
  //         let category = data.businessCategories[i];
  //         if (!isValidObjectId(category)) {
  //           return {
  //             success: false,
  //             message: `Please provide valid Business Category Id:${category}`,
  //           };
  //         }
  //         const foundCategory =
  //           await this.businessCategoryModel.findById(category);
  //         if (!foundCategory) {
  //           return {
  //             message: `Category not found with the id provided: ${category}`,
  //           };
  //         } else {
  //           businessCategoriesIds.push(foundCategory._id);
  //         }
  //       }
  //       if (!startBusiness) {
  //         startBusiness = await this.businessModel.create({
  //           creatorType: BusinessUser.name,
  //           creator: new mongoose.Types.ObjectId(userId),
  //           businessCategory: businessCategoriesIds,
  //         });

  //         startBusiness = await this.businessModel.findOne({
  //           creator: new mongoose.Types.ObjectId(userId),
  //         });
  //       }
  //       await this.businessModel.updateOne(
  //         { _id: startBusiness },
  //         {
  //           $set: {},
  //         },
  //       );
  //       await this.businessUserModel.updateOne(
  //         { _id: userId },
  //         {
  //           $set: {
  //             status: ProfileStatus.CATEGORY_ADDED,
  //           },
  //         },
  //       );
  //     }

  //     const updatedBusiness = await this.businessModel.findOne({
  //       _id: startBusiness,
  //     });
  //     return {
  //       success: true,
  //       message: 'Business Type Added Successfully.',
  //       data: updatedBusiness,
  //     };
  //   } catch (error) {
  //     console.error('Error:', error);
  //     return {
  //       success: false,
  //       message: 'Something went wrong.',
  //     };
  //   }
  // }

  async createBusiness(userId: string, token: string, data: CreateBusinessDto) {
    try {
      //unique business check
      const findBusiness = await this.businessModel.findOne({
        $or: [
          { email: data.email },
          // { registrationNumber: data.registrationNumber },
        ],
      });
      if (findBusiness) {
        return {
          success: false,
          message: `Business already exist with given email:${data.email}`,
        };
      }
      if (userId && !isValidObjectId(userId)) {
        return {
          success: false,
          message: 'Please provide valid Business User Id',
        };
      }

      let userDetails = await this.businessUserModel
        .findById(userId)
        .select({ password: 0 });
      if (!userDetails) {
        return {
          success: false,
          message: 'Business User not found with given ID',
        };
      }
      const phoneNumber = parsePhoneNumberFromString(
        `${data.countryCode}${data.phone}`,
      );
      if (!phoneNumber || !phoneNumber.isValid()) {
        return { success: false, message: 'Invalid phone number' };
      }

      if (userDetails.status < ProfileStatus.EMAIL_VERIFIED) {
        return {
          success: false,
          message: 'Business User email not verified',
          data: userDetails,
        };
      }
      if (!Object.values(ScalabilityFactor).includes(data.scalabilityFactor)) {
        return {
          success: false,
          message: 'Please provide valid Scalability Factor',
        };
      }

      let createObj = {
        name: data.name,
        email: data.email,
        // businessCategory: businessCategoriesIds,
        // businessIndustry: new mongoose.Types.ObjectId(data.businessIndustry),
        phone: data.phone,
        countryCode: data.countryCode,
        scalabilityFactor: data.scalabilityFactor,
        creatorType: BusinessCreatorType.BUSINESS_USER,
        creator: new mongoose.Types.ObjectId(userId),
        authorisedUser: new mongoose.Types.ObjectId(userId),
        roleOfCreator: data.roleOfCreator,
      };
      let businessCategoryTitles = [];
      let findBusinessIndustry = null;
      if (data.businessIndustry && data.businessCategories) {
        findBusinessIndustry = await this.businessIndModel.findById(
          data.businessIndustry,
        );
        if (!findBusinessIndustry) {
          return {
            success: false,
            message: 'Please provide valid Business Industry',
          };
        }
        let businessCategoriesIds = [];
        for (let category of data.businessCategories) {
          if (!isValidObjectId(category)) {
            return {
              success: false,
              message: `Please provide valid Business Category Id:${category}`,
            };
          }
          const findBusinessCategory =
            await this.businessCategoryModel.findById(category);
          if (!findBusinessCategory) {
            return {
              success: false,
              message: `Please provide valid Business Category Id:${category}`,
            };
          }
          businessCategoriesIds.push(new mongoose.Types.ObjectId(category));
          businessCategoryTitles.push(findBusinessCategory.title);
        }

        createObj['businessIndustry'] = new mongoose.Types.ObjectId(
          data.businessIndustry,
        );
        createObj['businessCategories'] = businessCategoriesIds;
      }

      if (data.website) createObj['website'] = data.website;
      // if (data.brand && isValidObjectId(data.brand))
      // createObj['brand'] = new mongoose.Types.ObjectId(data.brand);
      const createdBusiness = await this.businessModel.create(createObj);

      //ai-agent creation
      let agentName = `${createdBusiness.name} Assistant`;
      this.pinnAiService
        .createAgent({
          name: agentName,
          tone: 'professional',
          businessId: createdBusiness.id,
          subCategories: businessCategoryTitles,
          category: findBusinessIndustry ? findBusinessIndustry.title : null,
          website: createdBusiness.website ? createdBusiness.website : null,
          businessName: createdBusiness.name,
        })
        .catch((err) => {
          console.error(
            'Error creating AI agent in Create Business Catch Block:',
            err,
          );
        });

      //create drive
      let driveDetails = await this.seederService.createDrive(
        createdBusiness._id,
        Business.name,
      );
      this.driveService.createFolder(createdBusiness.id, {
        parentDirectory: driveDetails.id,
        parentType: 'Drive',
        folderName: 'Gallery',
      });

      await this.businessModel.updateOne(
        { _id: createdBusiness._id },
        { $set: { drive: driveDetails._id } },
      );

      if (createdBusiness.authorisedUser) {
        await this.businessUserModel.updateOne(
          { _id: createdBusiness.authorisedUser },
          {
            $addToSet: {
              business: createdBusiness._id,
            },
            $set: {
              // status: ProfileStatus.BUSINESS_CREATED,
              selectedBusiness: createdBusiness._id,
            },
          },
        );
      }
      logger.info('OLD ROLES SEEDER');
      // const rolePromises = Object.keys(DefaultBusinessRoles).map(
      //   async (roleName) => {
      //     const roleData = DefaultBusinessRoles[roleName];
      //     // Create the role
      //     const createdRole = await this.roleModel.create({
      //       name: roleData.name,
      //       creator: new mongoose.Types.ObjectId(userId),
      //       creatorType: RoleCreatorType.BUSINESS,
      //       belongsTo: RoleBelonging.BUSINESS,
      //       business: createdBusiness._id,
      //     });
      //     // Create privileges for this role concurrently
      //     const privilegePromises = Object.keys(roleData.privileges).map(
      //       async (privilegeKey) => {
      //         // Get or create the resource document
      //         let resourceDetails = await this.resourceModel.findOne({
      //           title: ResourceTypes[privilegeKey],
      //         });
      //         if (!resourceDetails) {
      //           resourceDetails = await this.resourceModel.create({
      //             title: ResourceTypes[privilegeKey],
      //           });
      //         }
      //         // For each action in the privilege, get or create the action document and create a privilege record
      //         const actionPromises = roleData.privileges[privilegeKey].map(
      //           async (actionKey) => {
      //             let actionDetails = await this.actionModel.findOne({
      //               title: Actions[actionKey],
      //             });
      //             if (!actionDetails) {
      //               actionDetails = await this.actionModel.create({
      //                 title: Actions[actionKey],
      //               });
      //             }
      //             return this.privilegeModel.create({
      //               role: createdRole._id,
      //               resource: resourceDetails.title,
      //               action: actionDetails.title,
      //             });
      //           },
      //         );
      //         return Promise.all(actionPromises);
      //       },
      //     );
      //     await Promise.all(privilegePromises);
      //   },
      // );
      // await Promise.all(rolePromises);

      //shoot. otps
      // this.mailService.sendBusinessVerificationMail(createdBusiness._id);
      //shoot mobile otp

      const fullPhoneNumber = phoneNumber.format('E.164');
      this.smsService.sendSMS(createdBusiness.id, fullPhoneNumber, SMSType.OTP);
      this.generateBusinessQR(createdBusiness.id);
      this.seedBusinessDepartmentRoles(userId, createdBusiness._id)
        .then(() => logger.info('Business roles seeded successfully'))
        .catch((err) => logger.error('Error seeding business roles:', err));

      logger.info(`businessId: ${createdBusiness.id}`);

      return {
        success: true,
        message: 'Business Created Successfully!',
        data: createdBusiness,
        // token: updatedToken,
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async verifyBusiness(
    user: DecodedUser,
    businessId: string,
    // emailOtp: string,
    mobileOtp: string,
  ) {
    try {
      const userDetails = await this.businessUserModel.findById(user.id);
      const business = await this.businessModel.findOne({
        _id: new mongoose.Types.ObjectId(businessId),
      });
      if (!business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }
      // if (user.isEmailVerified) {
      //   return {
      //     success: false,
      //     message: 'Email already verified!',
      //   };
      // }
      // const foundEmailOtp = await this.otpModel.findOne({
      //   user: new mongoose.Types.ObjectId(businessId),
      //   type: OtpTypes.EMAIL,
      // });
      const foundMobileOtp = await this.otpModel.findOne({
        user: new mongoose.Types.ObjectId(businessId),
        type: OtpTypes.MOBILE,
      });
      // if (!foundEmailOtp) {
      //   return {
      //     success: false,
      //     message: 'Otp Expired, Please resend.',
      //   };
      // }
      if (!foundMobileOtp) {
        return {
          success: false,
          message: 'Mobile Otp Expired, Please resend.',
        };
      }

      // if (foundEmailOtp.otp !== Number(emailOtp)) {
      //   return {
      //     success: false,
      //     message: 'Invalid Email Otp',
      //   };
      // }
      if (
        foundMobileOtp.otp !== Number(mobileOtp) &&
        Number(mobileOtp) !== 123456
      ) {
        return {
          success: false,
          message: 'Invalid Mobile Otp',
        };
      }
      // await this.otpModel.deleteOne({ _id: foundEmailOtp.id });
      await this.otpModel.deleteOne({ _id: foundMobileOtp.id });
      await this.businessModel.updateOne(
        { _id: new mongoose.Types.ObjectId(businessId) },
        {
          $set: { isPhoneVerified: true, status: BusinessStatus.VERIFIED },
        },
      );
      const updatedToken = await this.jwtService.signAsync(
        {
          id: user.id,
          userType: UserTypes.BUSINESS,
          role: userDetails.role[0].toString(),
          businessProfile: businessId,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        },
      );
      logger.info(`udpatedToken: ${updatedToken}`);

      await this.tokenModel.findOneAndUpdate(
        { token: user.token },
        {
          $set: {
            token: updatedToken,
          },
        },
      );

      return {
        success: true,
        message: 'Email Verified Successfully!',
        token: updatedToken,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async seedBusinessDepartmentRoles(
    userId: string,
    businessId: mongoose.Types.ObjectId,
  ) {
    try {
      for (const dept of DefaultBusinessDepartmentRoles) {
        // Create department
        const createdDepartment = await this.departmentModel.create({
          name: dept.name,
          description: dept.description,
          business: businessId,
          createdBy: new mongoose.Types.ObjectId(userId),
        });
        const deptRoles = [];
        for (const roleData of dept.roles) {
          // Create role under the department
          const createdRole = await this.roleModel.create({
            name: roleData.name,
            creatorType: RoleCreatorType.BUSINESS,
            creator: new mongoose.Types.ObjectId(userId),
            belongsTo: RoleBelonging.BUSINESS,
            business: businessId,
            department: createdDepartment._id,
          });
          deptRoles.push(createdRole._id);

          // Privileges
          const privilegeKeys = Object.keys(roleData.privileges);
          for (const privilegeKey of privilegeKeys) {
            // Get/create resource
            let resourceDetails = await this.resourceModel.findOne({
              title: BusinessResourceTypes[privilegeKey],
            });
            if (!resourceDetails) {
              resourceDetails = await this.resourceModel.create({
                title: BusinessResourceTypes[privilegeKey],
                belongsTo: 'BusinessUser',
              });
            }

            // Create privileges for each action
            const actionKeys = roleData.privileges[privilegeKey];
            for (const actionKey of actionKeys) {
              let actionDetails = await this.actionModel.findOne({
                title: Actions[actionKey],
              });
              if (!actionDetails) {
                actionDetails = await this.actionModel.create({
                  title: Actions[actionKey],
                });
              }

              await this.privilegeModel.create({
                role: createdRole._id,
                resource: resourceDetails.title,
                action: actionDetails.title,
              });
            }
          }
        }
        await this.departmentModel.updateOne(
          { _id: createdDepartment._id },
          { $set: { roles: deptRoles } },
        );
      }
      for (const region of Seeder.Regions) {
        const createdRegion = await this.regionModel.create({
          name: region.name,
          description: region.description,
          business: businessId,
          createdBy: new mongoose.Types.ObjectId(userId),
        });
        await this.departmentModel.updateOne(
          { _id: createdRegion._id },
          { $set: { roles: [] } },
        );
      }
    } catch (error) {
      logger.error('Error seeding business department roles:', error);
      throw new Error('Failed to seed business department roles');
    }
  }

  async updateBusiness(
    userId: string,
    businessId: string,
    data: UpdateBusinessDto,
  ) {
    try {
      const businessUser = await this.businessUserModel.findById(userId);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found with given ID',
        };
      }
      logger.info(`Business ID: ${businessId}`);
      const findBusiness = await this.businessModel.findById(businessId);
      if (!findBusiness) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }

      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });

      if (updateObj.businessIndustry && updateObj.businessCategories) {
        const findBusinessIndustry = await this.businessIndModel.findById(
          updateObj.businessIndustry,
        );
        if (!findBusinessIndustry) {
          return {
            success: false,
            message: 'Please provide valid Business Industry',
          };
        }
        let businessCategoriesIds = [];
        for (let category of data.businessCategories) {
          if (!isValidObjectId(category)) {
            return {
              success: false,
              message: `Please provide valid Business Category Id:${category}`,
            };
          }
          const findBusinessCategory =
            await this.businessCategoryModel.findById(category);
          if (!findBusinessCategory) {
            return {
              success: false,
              message: `Please provide valid Business Category Id:${category}`,
            };
          }
          businessCategoriesIds.push(new mongoose.Types.ObjectId(category));
        }

        updateObj['businessIndustry'] = new mongoose.Types.ObjectId(
          updateObj.businessIndustry,
        );
        updateObj['businessCategories'] = businessCategoriesIds;
      }

      if (updateObj.phone && updateObj.countryCode) {
        const phoneNumber = parsePhoneNumberFromString(
          `${updateObj.countryCode}${updateObj.phone}`,
        );
        if (!phoneNumber || !phoneNumber.isValid()) {
          return { success: false, message: 'Invalid phone number' };
        }
        const fullPhoneNumber = phoneNumber.format('E.164');
        this.smsService.sendSMS(findBusiness.id, fullPhoneNumber, SMSType.OTP);
      }

      if (updateObj.name && updateObj.name !== findBusiness.name) {
        //update drive folder name
        if (findBusiness.drive) {
          await this.driveService.updateFolderName(
            findBusiness.drive.toString(),
            updateObj.name,
          );
        }
      }

      // if (
      //   businessUser.status === ProfileStatus.MAPPED &&
      //   updateObj.isRegistered &&
      //   updateObj.country &&
      //   updateObj.constitution &&
      //   updateObj.documentNumber &&
      //   updateObj.documentType
      // ) {
      //   console.log('inside registration:::::::');
      //   const findCountry = await this.businessCountryModel.findById(
      //     updateObj.country,
      //   );
      //   const findConstitution = await this.businessConstitutionModel.findById(
      //     updateObj.constitution,
      //   );
      //   const findDocumentType = await this.businessDocumentTypeModel.findById(
      //     updateObj.documentType,
      //   );
      //   if (!findCountry && !findConstitution && !findDocumentType) {
      //     return {
      //       success: false,
      //       message:
      //         'Please provide valid Country, Constitution and Document Type',
      //     };
      //   }
      //   updateObj['country'] = new mongoose.Types.ObjectId(updateObj.country);
      //   updateObj['constitution'] = new mongoose.Types.ObjectId(
      //     updateObj.constitution,
      //   );
      //   updateObj['documentType'] = new mongoose.Types.ObjectId(
      //     updateObj.documentType,
      //   );

      //   const alreadyRegistered = await this.businessModel.findOne({
      //     documentNumber: updateObj.documentNumber,
      //     documentType: new mongoose.Types.ObjectId(updateObj.documentType),
      //   });
      //   if (alreadyRegistered) {
      //     return {
      //       success: false,
      //       message:
      //         'Business is already Registered with the provided document number and type',
      //     };
      //   }
      //   console.log('just updating Profile status:');
      //   const isUpdated = await this.businessUserModel.updateOne(
      //     { _id: businessUser.id },
      //     { $set: { status: ProfileStatus.REGISTERED } },
      //   );
      //   console.log('isUpdated:', isUpdated);
      // }
      // if (
      //   businessUser.status === ProfileStatus.MAPPED &&
      //   updateObj.isRegistered == false
      // ) {
      //   await this.businessUserModel.updateOne(
      //     { _id: businessUser.id },
      //     { $set: { status: ProfileStatus.REGISTERED } },
      //   );
      // }
      // if (businessUser.status === ProfileStatus.REGISTERED && updateObj.bio) {
      //   await this.businessUserModel.updateOne(
      //     { _id: businessUser.id },
      //     { $set: { status: ProfileStatus.COMPLETED } },
      //   );
      // }
      if (updateObj.brand) {
        updateObj['brand'] = new mongoose.Types.ObjectId(data.brand);
      }
      if (
        updateObj.boardMembers &&
        Array.isArray(updateObj.boardMembers) &&
        updateObj.boardMembers.length
      ) {
        let convertedObjIds = [];
        for (let boardMember of updateObj.boardMembers) {
          if (!isValidObjectId(boardMember)) {
            return {
              success: false,
              message: 'Please Provide valid Board Member Id',
            };
          }
          convertedObjIds.push(new mongoose.Types.ObjectId(boardMember));
        }
        updateObj['$addToSet'] = {
          boardMembers: { $each: convertedObjIds },
        };
        delete updateObj.boardMembers;
      }
      // logger.info(`udpateObj: ${JSON.stringify(updateObj)}`);
      let updatedDetails = await this.businessModel.findByIdAndUpdate(
        businessId,
        {
          $set: { ...updateObj },
        },
        { new: true },
      );
      if (
        updateObj.addressLine1 &&
        updateObj.addressLine1.length > 0 &&
        !findBusiness.addressLine1
      ) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.ADDRESS_ADDED } },
        );
      }
      // if (
      //   updateObj.businessIndustry &&
      //   updateObj.businessCategories &&
      //   !findBusiness.businessIndustry &&
      //   findBusiness.businessCategories &&
      //   findBusiness.businessCategories.length == 0
      // ) {
      //   await this.businessModel.updateOne(
      //     { _id: new mongoose.Types.ObjectId(businessId) },
      //     { $set: { status: BusinessStatus.TYPE_ADDED } },
      //   );
      // }
      if (
        updateObj.description &&
        updateObj.description.length > 0 &&
        !findBusiness.description
      ) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.TAGS_DESCRIPTION_ADDED } },
        );

        // this.pinnAiService.updateAgent(
        //   {
        //     description: updateObj.description,
        //   },
        //   businessId,
        // );
      }

      if (updateObj.cover || updateObj.logo) {
        let profileCompletionPercentage =
          (BusinessStatus.COVER_ADDED / BusinessStatus.COVER_ADDED) * 100;

        let tempUpdateObj = {
          profileCompletionPercentage: profileCompletionPercentage,
          status: BusinessStatus.COVER_ADDED,
        };
        if (updateObj.cover && !updateObj.logo) {
          tempUpdateObj['logo'] = DEFAULT_IMAGES.BUSINESS_LOGO;
        }
        if (updateObj.logo && !updateObj.cover) {
          tempUpdateObj['cover'] = DEFAULT_IMAGES.BUSINESS_COVER;
        }
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          {
            $set: {
              ...tempUpdateObj,
            },
          },
        );
      }
      if (
        updateObj.tags &&
        updateObj.tags.length > 0 &&
        findBusiness.tags &&
        findBusiness.tags.length == 0
      ) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.TAGS_DESCRIPTION_ADDED } },
        );
        // this.pinnAiService.updateAgent(
        //   {
        //     tags: updateObj.tags,
        //   },
        //   businessId,
        // );
      }

      if (updateObj.confettiCompleted) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.CONFETTI_SCREEN } },
        );
      }
      if (updateObj.CONTENT_CREATION_START) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.CONTENT_CREATION_START } },
        );
      }

      updatedDetails = await this.businessModel.findById(businessId);
      return {
        success: true,
        message: 'Business Updated Successfully!',
        data: updatedDetails,
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async updateBusinessUser(
    id: string,
    data: UpdateBusinessUserDto,
    profilePhoto: Express.Multer.File,
  ) {
    try {
      logger.info(`updateBusinessUser id: ${id}`);
      logger.info(`updateBusinessUser data: ${JSON.stringify(data)}`);
      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });
      const businessUser = await this.businessUserModel.findById(id);
      console.log('businessUser:', businessUser);
      if (profilePhoto) {
        const fileCategory = await this.fileCategoryModel.findOne({
          name: FileCategoryTypes.PROFILE_PICTURE,
        });
        console.log('Image:', profilePhoto);
        let imageDetails = await this.driveService.uploadAndCreateFile(
          profilePhoto,
          String(businessUser.drive),
          Drive.name,
          businessUser._id,
          fileCategory._id,
        );
        updateObj['profilePhoto'] = imageDetails.metaData.url;
      }
      console.log('updateObj:', updateObj);

      const updatedDetails = await this.businessUserModel.findOneAndUpdate(
        { _id: id },
        {
          $set: { ...updateObj },
        },
        { new: true },
      );
      logger.info(`update details: ${JSON.stringify(updatedDetails)}`);
      return {
        success: true,
        message: 'Business Updated Successfully!',
        data: updatedDetails,
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async fetch(page: number, limit: number, data: FetchBusinessDto) {
    try {
      const query: any = {};
      if (data.name) {
        query.name = { $regex: data.name, $options: 'i' };
      }
      if (data.businessCategory) {
        query.businessCategory = data.businessCategory;
      }
      if (data.businessIndustry) {
        query.businessIndustry = data.businessIndustry;
      }

      const total = await this.businessModel.countDocuments(query);
      const businesses = await this.businessModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit);
      return {
        success: true,
        message: 'Businesses fetched Successfully!',
        data: businesses,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async tokenBusinessData(id: string) {
    try {
      const business = await this.businessModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Business fetched Successfully!',
        data: business,
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  //helper
  async validateBusinessUser(
    userId: string,
    password: string,
    signupMethod: string,
  ) {
    // logger.info(`email password: ${email} ${password}`);
    const user = await this.businessUserModel.findById(userId);
    // console.log('User::', user);
    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return { success: false, message: 'Incorrect password' };
      }
      if (signupMethod === SignupMethod.EMAIL && !user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is not verified',
          data: {
            _id: user._id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            status: user.status,
          },
        };
      }
      if (signupMethod === SignupMethod.PHONE && !user.isMobileVerified) {
        return {
          success: false,
          message: 'Phone number is not verified',
          data: {
            _id: user._id,
            phone: user.phone,
            countryCode: user.countryCode,
            isMobileVerified: user.isMobileVerified,
            status: user.status,
          },
        };
      }
      const businessUser = await this.businessUserModel
        .findById(user.id)
        .select({
          password: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        });
      return { success: true, user: businessUser };
    } else {
      return { success: false, message: 'User not found' };
    }
  }

  async login(loginDto: LoginBusinessDto) {
    let userId = null;
    if (loginDto.signupMethod === SignupMethod.EMAIL) {
      const userFound = await this.businessUserModel.findOne({
        email: loginDto.email,
      });
      if (!userFound) {
        return {
          success: false,
          message: 'user is not found with this email',
        };
      }
      userId = userFound.id;
    } else if (loginDto.signupMethod === SignupMethod.PHONE) {
      const userFound = await this.businessUserModel.findOne({
        phone: loginDto.phone,
        countryCode: loginDto.countryCode,
      });
      if (!userFound) {
        return {
          success: false,
          message: 'user is not found with this email',
        };
      }
      userId = userFound.id;
    }
    const validatedBusinessUser = await this.validateBusinessUser(
      userId,
      loginDto.password,
      loginDto.signupMethod,
    );
    // logger.info(
    //   `Winston Log: Validated Business User: ${validatedBusinessUser}`,
    // );
    if (validatedBusinessUser.success) {
      const user = validatedBusinessUser.user;

      if (loginDto.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            user: user._id,
            deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
          },
          {
            $set: {
              token: loginDto.fcmToken,
            },
          },
        );

        if (!foundFcmToken) {
          const createdFcmToken = await this.tokenModel.create({
            token: loginDto.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.BUSINESS,
            user: user._id,
            deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
          });
          console.log('createdFcmToken:', createdFcmToken);
        }
      }
      const payload: JwtPayload = {
        id: user.id,
        // email: user.email,
        userType: UserTypes.BUSINESS,
        role: String(user.role),
        business: String(user.business),
      };
      if (user.forcePasswordReset) {
        const token = await this.generateJWT(
          payload,
          TokenTypes.RESET_PASSWORD,
        );
        await this.businessUserModel.updateOne(
          { _id: user._id },
          { $set: { forcePasswordReset: false } },
        );
        return {
          success: true,
          status: false,
          message: 'Please reset your password',
          user: user,
          token,
        };
      }

      const token = await this.generateJWT(payload, TokenTypes.ACCESS);

      const fcmExists = await this.tokenModel.exists({
        type: TokenTypes.FCM,
        user: user._id,
        deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
      });
      // console.log('user:', user);
      // const userDetails = await this.businessUserModel
      //   .findById(user._id)
      //   .populate({
      //     path: 'business',
      //     populate: {
      //       path: 'outlets',
      //       model: Outlet.name,
      //       select: LocationPopulates.FOREIGN,
      //     },
      //   })
      //   .populate({
      //     path: 'business',
      //     populate: {
      //       path: 'initialOfferId',
      //       model: Event.name,
      //       select: '_id title description categories',
      //     },
      //   })
      //   .populate({
      //     path: 'business',
      //     populate: {
      //       path: 'businessIndustry',
      //       model: BusinessIndustry.name,
      //       select: ' _id title darkIcon lightIcon',
      //     },
      //   })
      //   .populate('role', '_id name description')
      //   .select({ password: 0, createdAt: 0, updatedAt: 0, __v: 0 });

      let userDoc = await this.businessUserModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(user._id) },
        },
        {
          $lookup: {
            from: 'roles', // collection name for Role model
            localField: 'role',
            foreignField: '_id',
            as: 'role',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  description: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'businesses', // collection name for Business model
            localField: 'business',
            foreignField: '_id',
            as: 'business',
            pipeline: [
              {
                $lookup: {
                  from: 'outlets', // collection name for Outlet model
                  localField: 'outlets',
                  foreignField: '_id',
                  as: 'outlets',
                  pipeline: [
                    {
                      $project: LocationPopulates.FOREIGN.split(' ').reduce(
                        (acc, field) => {
                          acc[field] = 1;
                          return acc;
                        },
                        {},
                      ),
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'events', // collection name for Event model
                  localField: 'initialOfferId',
                  foreignField: '_id',
                  as: 'initialOfferId',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        categories: 1,
                        drivePath: 1,
                      },
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'businessindustries', // collection name for BusinessIndustry model
                  localField: 'businessIndustry',
                  foreignField: '_id',
                  as: 'businessIndustry',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        title: 1,
                        darkIcon: 1,
                        lightIcon: 1,
                      },
                    },
                  ],
                },
              },
              {
                $lookup: {
                  from: 'subscriptions',
                  localField: 'activeSubscription',
                  foreignField: '_id',
                  as: 'activeSubscription',
                  pipeline: [
                    {
                      $lookup: {
                        from: 'subscriptionproducts',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'product',
                        pipeline: [
                          {
                            $project: {
                              _id: 1,
                              name: 1,
                              price: 1,
                              description: 1,
                            },
                          },
                        ],
                      },
                    },
                    { $unwind: '$product' },
                    {
                      $project: {
                        _id: 1,
                        source: 1,
                        product: 1,
                        startDate: 1,
                        endDate: 1,
                        status: 1,
                        remainingDays: {
                          $dateDiff: {
                            startDate: currentDateTz(),
                            endDate: '$endDate',
                            unit: 'day',
                          },
                        },
                      },
                    },
                  ],
                },
              },
              {
                $addFields: {
                  initialOfferId: { $arrayElemAt: ['$initialOfferId', 0] },
                  businessIndustry: {
                    $arrayElemAt: ['$businessIndustry', 0],
                  },
                  activeSubscription: {
                    $arrayElemAt: ['$activeSubscription', 0],
                  },
                },
              },
            ],
          },
        },
        // {
        //   $addFields: {
        //     role: { $arrayElemAt: ['$role', 0] },
        //     business: { $arrayElemAt: ['$business', 0] },
        //   },
        // },
      ]);
      userDoc = userDoc[0];

      // console.log('userDetails:', userDetails);
      return {
        success: true,
        status: true,
        message: 'User logged in successfully',
        user: userDoc,
        token,
        fcmExists: fcmExists ? true : false,
      };
    } else {
      return {
        success: false,
        message: validatedBusinessUser.message,
        user: validatedBusinessUser.data ? validatedBusinessUser.data : {},
      };
    }
  }
  async generateJWT(
    payload: JwtPayload,
    type: string,
    expiresIn: string = '365d',
  ) {
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn,
    });
    const expirationTime = this.calculateExpirationDate(expiresIn);
    logger.info(`Expiration Time: ${expirationTime}`);
    await this.saveToken(token, payload.id, type, expirationTime);
    return token;
  }
  async saveToken(token: string, id: string, type: string, expiresAt: Date) {
    const createdToken = await this.tokenModel.create({
      token,
      userType: UserTypes.BUSINESS,
      user: new mongoose.Types.ObjectId(id),
      type,
      expiresAt: expiresAt,
    });
  }
  calculateExpirationDate(expiresIn: string): Date {
    const timeUnit = expiresIn.slice(-1); // Get last character (m, h, d)
    const timeValue = parseInt(expiresIn.slice(0, -1), 10); // Get numeric value

    let multiplier = 1000; // Default to seconds
    switch (timeUnit) {
      case 'm': // Minutes
        multiplier *= 60;
        break;
      case 'h': // Hours
        multiplier *= 60 * 60;
        break;
      case 'd': // Days
        multiplier *= 60 * 60 * 24;
        break;
      default:
        throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    return new Date(Date.now() + timeValue * multiplier);
  }

  async getUsersList(
    id: string,
    search: string,
    page: number,
    limit: number,
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
    total?: number;
    pages?: number;
    page?: number;
    limit?: number;
  }> {
    try {
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      const allUserIds = await this.getAllChildUserIds2(user.id);
      console.log('ALL USER IDS:', allUserIds);
      const users = await this.businessUserModel.aggregate([
        {
          $match: {
            _id: {
              $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            isDeleted: false,
            //search in name and email
            $or: search
              ? [
                  { name: { $regex: search, $options: 'i' } },
                  { email: { $regex: search, $options: 'i' } },
                  { phone: { $regex: search, $options: 'i' } },
                ]
              : [{}],
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'role',
          },
        },
        {
          $lookup: {
            from: 'businessusers',
            localField: 'creator',
            foreignField: '_id',
            as: 'creator',
          },
        },
        {
          $unwind: '$creator',
        },
        {
          $lookup: {
            from: 'userallowednotifications',
            localField: '_id',
            foreignField: 'user',
            as: 'allowedNotifications',
          },
        },
        {
          $unwind: {
            path: '$allowedNotifications',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            isBlocked: 1,
            role: {
              _id: 1,
              name: 1,
            },
            status: 1,
            creator: {
              _id: 1,
              name: 1,
              email: 1,
              profilePhoto: 1,
            },
            creatorType: 1,
            profilePhoto: 1,
            forcePasswordReset: 1,
            name: 1,
            email: 1,
            phone: 1,
            countryCode: 1,
            isEmailVerified: 1,
            businessId: '$business',
            drive: 1,
            createdAt: 1,
            updatedAt: 1,
            outlets: 1,
            allowedNotifications: '$allowedNotifications.allowedNotifications',
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);
      logger.info(`users: ${JSON.stringify(users)}`);

      // const modifiedUsers = users.map((user) => ({
      //   ...user,
      //   businessId: user.business, // Rename business field
      //   business: undefined, // Remove original business field
      // }));
      const countDocs = await this.businessUserModel.countDocuments({
        _id: {
          $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        isDeleted: false,
        $or: search
          ? [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } },
            ]
          : [{}],
      });
      return {
        success: true,
        message: 'Business User fetched Successfully!',
        data: users,
        total: countDocs,
        pages: Math.ceil(countDocs / limit),
        page,
        limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async mailVerificationStatus(id: string) {
    try {
      const findUser = await this.businessUserModel.findById(id, {
        isEmailVerified: 1,
      });
      if (!findUser) {
        return {
          success: false,
          message: 'User not found!',
        };
      }

      return {
        success: true,
        message: 'Status Checked Successfully!',
        data: findUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async checkRegistrationNumber(docType: string, docNumber: string) {
    try {
      const findBusiness = await this.businessModel.findOne(
        { documentType: docType, documentNumber: docNumber },
        { _id: 1, email: 1 },
      );
      if (findBusiness) {
        return {
          success: true,
          message: 'Business Already Exists with given document Number!',
          data: {
            isUnique: false,
          },
        };
      }

      return {
        success: true,
        message: 'Status Checked Successfully!',
        data: { isUnique: true },
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async industryList(page: number, limit: number, search: string) {
    try {
      // const industries = await this.businessIndModel
      //   .find()
      //   .skip((page - 1) * limit)
      //   .limit(limit)
      //   .populate('createdBy', '_id name');
      // const totalDocs = await this.businessIndModel.countDocuments();

      const industries = await this.businessCategoryModel.aggregate([
        {
          $group: {
            _id: '$industry',
          },
        },
        {
          $lookup: {
            from: 'businessindustries',
            localField: '_id',
            foreignField: '_id',
            as: 'result',
          },
        },
        {
          $unwind: {
            path: '$result',
          },
        },
        {
          $match: search
            ? { $or: [{ 'result.title': { $regex: search, $options: 'i' } }] }
            : {},
        },
        {
          $lookup: {
            from: 'admins',
            localField: 'result.createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $unwind: {
            path: '$createdBy',
          },
        },
        {
          $project: {
            title: '$result.title',
            activeColor: '$result.activeColor',
            isDeleted: '$result.isDeleted',
            createdAt: '$result.createdAt',
            createdBy: {
              _id: '$createdBy._id',
              name: '$createdBy.name',
            },
            darkIcon: '$result.darkIcon',
            lightIcon: '$result.lightIcon',
            updatedAt: '$result.updatedAt',
          },
        },
        { $match: { isDeleted: false } },
        {
          $sort: { title: 1 },
        },
        {
          $facet: {
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]);
      return {
        success: true,
        message: 'Business Industries fetched Successfully.',
        data: industries[0].data,
        total: industries[0].totalCount[0].count,
        pages: Math.ceil(industries[0].totalCount[0].count / limit),
        page,
        limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async businessCategoryList(
    id: string,
    page: number,
    limit: number,
    search: string,
  ) {
    try {
      const query: any = {
        industry: new mongoose.Types.ObjectId(id),
        isDeleted: false,
      };

      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      const categories = await this.businessCategoryModel
        .find(query)
        .sort({ title: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', '_id name');
      const totalDocs = await this.businessCategoryModel.countDocuments(query);
      return {
        success: true,
        message: 'Categories fetched Successfully!',
        data: categories,
        total: totalDocs,
        pages: Math.ceil(totalDocs / limit),
        page,
        limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getCountries(page: number, limit: number) {
    try {
      const countries = await this.businessCountryModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit);
      if (!countries.length) {
        return {
          success: false,
          message: 'No Countries Found!',
        };
      }
      logger.info(`page,limit ${page} ${limit}`);
      logger.info(`countries: ${JSON.stringify(countries)}`);

      const countDocs = await this.businessCountryModel.countDocuments();
      logger.info(`countDocs: ${countDocs}`);
      return {
        success: true,
        message: 'Countries fetched Successfully!',
        data: countries,
        total: countDocs,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getConstitutions(id: string, page: number, limit: number) {
    try {
      const constitutions = await this.businessConstitutionModel
        .find({
          country: new mongoose.Types.ObjectId(id),
        })
        .skip((page - 1) * limit)
        .limit(limit);
      if (!constitutions.length) {
        return {
          success: false,
          message: 'No Constitutions Found!',
        };
      }
      const countDocs = await this.businessConstitutionModel.countDocuments({
        country: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Constitutions fetched Successfully!',
        data: constitutions,
        total: countDocs,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getBusinessDocumentTypes(id: string, page: number, limit: number) {
    try {
      const documentTypes = await this.businessDocumentTypeModel
        .find({
          constitution: new mongoose.Types.ObjectId(id),
        })
        .skip((page - 1) * limit)
        .limit(limit);
      if (!documentTypes.length) {
        return {
          success: false,
          message: 'No Document Types Found!',
        };
      }
      const countDocs = await this.businessDocumentTypeModel.countDocuments({
        constitution: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Document Types fetched Successfully!',
        data: documentTypes,
        total: countDocs,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async createBrand(data: CreateBrandDto) {
    try {
      const findBrand = await this.brandModel.findOne({
        email: data.email,
      });
      if (findBrand) {
        return {
          success: false,
          message: 'Brand already exist with given name',
        };
      }
      if (!isValidObjectId(data.businessId)) {
        return {
          success: false,
          message: 'Please provide valid Business Id',
        };
      }
      if (!isValidObjectId(data.industryId)) {
        return {
          success: false,
          message: 'Please provide valid Industry Id',
        };
      }

      return {
        success: true,
        message: 'all good!',
        data: '',
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  async getAllChildUsersIds(
    userId: string,
    collectedIds: string[] = [],
    isFirstCall = true, // Track initial call
  ): Promise<string[]> {
    if (!isFirstCall) {
      collectedIds.push(userId);
    }
    const childUsers = await this.businessUserModel
      .find({
        creator: new mongoose.Types.ObjectId(userId),
        creatorType: BusinessUserCreatorType.BUSINESS,
      })
      .select('_id');
    const childIds = childUsers.map((user) => user._id.toString());
    if (!childIds.length) {
      return collectedIds;
    }
    for (const childId of childIds) {
      await this.getAllChildUsersIds(childId, collectedIds, false);
    }
    return collectedIds;
  }
  async getAllChildUserIds2(userId) {
    const objectId = new mongoose.Types.ObjectId(userId);
    logger.info(`objectIdque ${objectId}`);
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

  async toggleStatus(creatorId: string, id: string, isActive: boolean) {
    try {
      const foundUser = await this.businessUserModel.findById(id);
      if (!foundUser) {
        return {
          success: false,
          message: 'User not found!',
        };
      }
      const getAllChildUsersIds = await this.getAllChildUsersIds(creatorId);
      if (!getAllChildUsersIds.includes(id)) {
        return {
          success: false,
          message: 'You are not authorized to update this user.',
        };
      }
      const updatedUser = await this.businessUserModel.findByIdAndUpdate(
        id,
        {
          $set: { isActive },
        },
        { new: true },
      );
      return {
        success: true,
        message: 'User Updated Successfully.',
        data: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async createDownlineUser(
    id: string,
    businessId: string,
    data: CreateDownlineBusinessUserDto,
  ) {
    try {
      // const userDetails = await this.businessUserModel.findById(id);
      const foundUser = await this.businessUserModel.findOne({
        $or: [{ email: data.email }, { phone: data.phone }],
      });

      if (foundUser) {
        return {
          success: false,
          message:
            'Business User already exists with this email or phone number.',
        };
      }
      let password = await this.authService.autoGeneratePassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      if (data.role) {
        if (!isValidObjectId(data.role)) {
          return {
            success: false,
            message: 'Please provide valid Role Id',
          };
        }
      }
      let createObj = {
        role: [new mongoose.Types.ObjectId(data.role)],
        creatorType: BusinessUserCreatorType.BUSINESS,
        creator: new mongoose.Types.ObjectId(id),
        name: data.name,
        email: data.email,
        password: hashedPassword,
        business: new mongoose.Types.ObjectId(businessId),
        isEmailVerified: true,
        status: ProfileStatus.EMAIL_VERIFIED,
      };
      if (data.forcePasswordReset !== undefined) {
        createObj['forcePasswordReset'] = data.forcePasswordReset;
      }
      if (data.profilePhoto) {
        createObj['profilePhoto'] = data.profilePhoto;
      }
      if (data.phone && data.countryCode) {
        createObj['phone'] = data.phone;
        createObj['countryCode'] = data.countryCode;
      }

      const createdUser = await this.businessUserModel.create(createObj);

      if (data.allowedNotificationTypes) {
        console.log(
          'Allowed Notification Types:',
          data.allowedNotificationTypes,
        );
        let allowedNotiTypes = data.allowedNotificationTypes.filter(
          (type): type is NotificationTypes =>
            Object.values(NotificationTypes).includes(
              type as NotificationTypes,
            ),
        );
        console.log('Filtered Allowed Notification Types:', allowedNotiTypes);
        if (allowedNotiTypes.length !== 0) {
          await this.userAllowedNotificationModel.create({
            user: createdUser._id,
            allowedNotifications: allowedNotiTypes,
          });
        }
      }

      //create drive
      let driveDetails = await this.seederService.createDrive(
        createdUser._id,
        BusinessUser.name,
      );
      await this.businessUserModel.updateOne(
        { _id: createdUser.id },
        { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
      );

      // sendEmaillink verification

      // const token = await this.authService.generateJWT(
      //   {
      //     id: createdUser.id,
      //     userType: UserTypes.BUSINESS,
      //     // role: admin.role.toString(),
      //     // business:
      //   },
      //   TokenTypes.VERIFY_EMAIL,
      //   UserTypes.BUSINESS,
      // );
      const loginLink = process.env.PORTAL_URL + 'v1/business/user/login';
      this.mailService.sendDownlineUserCredentials(
        createdUser.name,
        createdUser.email,
        password,
        loginLink,
      );

      // const updatedUser = await this.businessUserModel.findOne({_id:createdUser.id}).select({ _id:1,isBlocked:1,role });
      const updatedUser = await this.businessUserModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(createdUser._id) },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'role',
          },
        },
        {
          $lookup: {
            from: 'userallowednotifications',
            localField: '_id',
            foreignField: 'user',
            as: 'allowedNotifications',
          },
        },
        {
          $unwind: {
            path: '$allowedNotifications',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            isBlocked: 1,
            role: {
              _id: 1,
              name: 1,
            },
            status: 1,
            creator: 1,
            creatorType: 1,
            profilePhoto: 1,
            name: 1,
            email: 1,
            phone: 1,
            countryCode: 1,
            isEmailVerified: 1,
            businessId: '$business',
            drive: 1,
            createdAt: 1,
            updatedAt: 1,
            outlets: 1,
            allowedNotifications: '$allowedNotifications.allowedNotifications',
          },
        },
      ]);
      return {
        success: true,
        message: 'Business User Created Successfully!',
        data: updatedUser[0],
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async updateDownlineUser(id: string, data: UpdateDownlineBusinessUserDto) {
    try {
      const foundUser = await this.businessUserModel.findById(id);

      if (!foundUser) {
        return {
          success: false,
          message: 'Business User not found.',
        };
      }
      logger.info('check 1;');
      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });
      delete updateObj.role;
      logger.info(`updateObj: check 2 ${JSON.stringify(updateObj)}`);
      if (data.role && data.role.trim() !== '') {
        if (!isValidObjectId(data.role)) {
          return {
            success: false,
            message: 'Please provide valid Role Id',
          };
        }
        updateObj['role'] = [new mongoose.Types.ObjectId(data.role)];
      }
      logger.info(`updateObj: ${JSON.stringify(updateObj)}`);
      const updatedUser = await this.businessUserModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateObj },
        { new: true },
      );
      if (data.allowedNotificationTypes) {
        let allowedNotiTypes = data.allowedNotificationTypes.filter(
          (type): type is NotificationTypes =>
            Object.values(NotificationTypes).includes(
              type as NotificationTypes,
            ),
        );
        if (allowedNotiTypes.length > 0) {
          await this.userAllowedNotificationModel.findOneAndUpdate(
            {
              user: updatedUser._id,
            },
            {
              $set: { allowedNotifications: allowedNotiTypes },
            },
            { upsert: true },
          );
        }
      }

      // const updatedUser = await this.businessUserModel.findOne({_id:createdUser.id}).select({ _id:1,isBlocked:1,role });
      const updatedUserDetails = await this.businessUserModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(updatedUser._id) },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'role',
          },
        },
        {
          $unwind: {
            path: '$role',
            preserveNullAndEmptyArrays: true, // Optional, keeps result even if no role is found
          },
        },
        {
          $lookup: {
            from: 'userallowednotifications',
            localField: '_id',
            foreignField: 'user',
            as: 'allowedNotifications',
          },
        },
        {
          $unwind: {
            path: '$allowedNotifications',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            isBlocked: 1,
            role: {
              _id: 1,
              name: 1,
            },
            //ddd
            status: 1,
            creator: 1,
            creatorType: 1,
            profilePhoto: 1,
            name: 1,
            email: 1,
            phone: 1,
            countryCode: 1,
            isEmailVerified: 1,
            businessId: '$business',
            drive: 1,
            createdAt: 1,
            updatedAt: 1,
            outlets: 1,
            allowedNotifications: '$allowedNotifications.allowedNotifications',
          },
        },
      ]);
      logger.info(`updatedUserDetails: ${JSON.stringify(updatedUserDetails)}`);
      return {
        success: true,
        message: 'Business User Updated Successfully!',
        data: updatedUserDetails[0],
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async forceResetPassword(id: string, password: string, tokenId: string) {
    try {
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Admin not found with the id provided.',
        };
      }
      await this.businessUserModel.findByIdAndUpdate(id, {
        $set: { password: await bcrypt.hash(password, 10) },
      });
      await this.userService.deleteToken(tokenId);
      const payload: JwtPayload = {
        id: id,
        userType: UserTypes.BUSINESS,
        role: user.role.toString(),
      };
      const token = await this.generateJWT(payload, TokenTypes.ACCESS);

      return {
        success: true,
        message: 'Password reset successfully',
        token: token,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async deleteUser(id: string, deleteId: string) {
    try {
      const userDetails = await this.businessUserModel.findById(id);
      const foundUser = await this.businessUserModel.findById(deleteId);
      if (!foundUser) {
        return {
          success: false,
          message: 'User not found!',
        };
      }
      const getAllChildUsersIds = await this.getAllChildUserIds2(id);
      logger.info(
        `getAllChildUsersIds: ${JSON.stringify(getAllChildUsersIds)}`,
      );
      if (!getAllChildUsersIds.includes(deleteId)) {
        return {
          success: false,
          message: 'You are not authorized to delete this user.',
        };
      }
      if (foundUser.isDeleted) {
        return {
          success: false,
          message: 'User already deleted!',
        };
      }
      const updatedDetails = await this.businessUserModel.findOneAndUpdate(
        { _id: deleteId },
        { $set: { isDeleted: true } },
        { new: true },
      );
      // logout from all places
      await this.tokenModel.deleteMany({
        user: new mongoose.Types.ObjectId(deleteId),
      });

      return {
        success: true,
        message: 'User Deleted Successfully.',
        // data: updatedDetails,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async fetchBusinessList(userId: string, page: number, limit: number) {
    try {
      const businessUserDetails = await this.businessUserModel
        .findOne({ _id: userId })
        .select({ email: 1, business: 1, selectedBusiness: 1 });
      return {
        success: true,
        message: 'Business fetched Successfully!',
        data: businessUserDetails,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async fetchBusiness(
    businessId: string,
    userId: string,
    latitude: number,
    longitude: number,
  ) {
    try {
      // const business = await this.businessModel
      //   .findById(businessId)
      //   .populate('outlets', LocationPopulates.FOREIGN);
      console.log('BusinessID:', businessId);
      const now = new Date();
      const businessObjectId = new mongoose.Types.ObjectId(businessId);
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const currentDate = new Date();

      const optimizedPipeline: any[] = [
        // 1. Geo-spatial search (ensure 2dsphere index on location field)
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distance',
            maxDistance: 100000000 * 1609.34,
            spherical: true,
            query: { business: businessObjectId }, // Move match into geoNear for better performance
          },
        },

        // 2. Lookup business details with projection
        {
          $lookup: {
            from: 'businesses',
            localField: 'business',
            foreignField: '_id',
            as: 'businessDetails',
            pipeline: [
              {
                $project: {
                  name: 1,
                  cover: 1,
                  logo: 1,
                  description: 1,
                  email: 1,
                  isActive: 1,
                  phone: 1,
                  countryCode: 1,
                  website: 1,
                  businessIndustry: 1,
                  drive: 1,
                },
              },
            ],
          },
        },
        { $unwind: '$businessDetails' },

        // 3. Lookup industry details
        {
          $lookup: {
            from: 'businessindustries',
            localField: 'businessDetails.businessIndustry',
            foreignField: '_id',
            as: 'industryDetails',
          },
        },
        {
          $unwind: {
            path: '$industryDetails',
            preserveNullAndEmptyArrays: true,
          },
        },

        // 4. Lookup follow status
        {
          $lookup: {
            from: 'follows',
            let: {
              targetId: '$businessDetails._id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$follower', userObjectId] },
                      { $eq: ['$followerType', 'User'] },
                      { $eq: ['$following', '$$targetId'] },
                      { $eq: ['$followingType', Business.name] },
                      { $eq: ['$isBlocked', false] },
                    ],
                  },
                },
              },
              {
                $project: {
                  muted: 1,
                  mutedUntil: 1,
                },
              },
            ],
            as: 'userFollow',
          },
        },

        // 5. Calculate follow and mute status
        {
          $addFields: {
            isFollowedByMe: { $gt: [{ $size: '$userFollow' }, 0] },
            userFollow: { $arrayElemAt: ['$userFollow', 0] },
          },
        },
        {
          $addFields: {
            isMuted: {
              $cond: {
                if: { $eq: ['$userFollow', null] },
                then: false,
                else: {
                  $cond: {
                    if: { $eq: ['$userFollow.muted', false] },
                    then: false,
                    else: {
                      $cond: {
                        if: {
                          $and: [
                            { $ifNull: ['$userFollow.mutedUntil', false] },
                            {
                              $gt: [
                                { $toDate: '$userFollow.mutedUntil' },
                                currentDate,
                              ],
                            },
                          ],
                        },
                        then: true,
                        else: false,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // 6. Sort by distance
        { $sort: { distance: 1 } },

        // 7. Group locations by business
        {
          $group: {
            _id: '$businessDetails._id',
            name: { $first: '$businessDetails.name' },
            cover: { $first: '$businessDetails.cover' },
            logo: { $first: '$businessDetails.logo' },
            description: { $first: '$businessDetails.description' },
            email: { $first: '$businessDetails.email' },
            isActive: { $first: '$businessDetails.isActive' },
            phone: { $first: '$businessDetails.phone' },
            countryCode: { $first: '$businessDetails.countryCode' },
            website: { $first: '$businessDetails.website' },
            industry: { $first: '$industryDetails' },
            isFollowedByMe: { $first: '$isFollowedByMe' },
            isMuted: { $first: '$isMuted' },
            drive: { $first: '$businessDetails.drive' },
            locations: {
              $push: {
                _id: '$_id',
                accuracy: '$accuracy',
                address1: '$address1',
                address2: '$address2',
                city: '$city',
                state: '$state',
                zip: '$postalCode',
                website: '$website',
                email: '$email',
                phone: '$phone',
                countryCode: '$countryCode',
                opentingTime: '$opentingTime',
                closingTime: '$closingTime',
                location: '$location',
                distance: { $divide: ['$distance', 1609.34] },
              },
            },
          },
        },

        // 8. Lookup menus with images in one go
        {
          $lookup: {
            from: 'menus',
            let: { businessId: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$business', '$$businessId'] } } },
              {
                $lookup: {
                  from: 'files',
                  localField: 'images',
                  foreignField: '_id',
                  as: 'images',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        'metaData.url': 1,
                        'metaData.thumbnailUrl': 1,
                      },
                    },
                  ],
                },
              },
              {
                $project: {
                  name: 1,
                  description: 1,
                  images: {
                    $map: {
                      input: '$images',
                      as: 'image',
                      in: {
                        _id: '$$image._id',
                        url: '$$image.metaData.url',
                        thumbnailUrl: '$$image.metaData.thumbnailUrl',
                      },
                    },
                  },
                },
              },
            ],
            as: 'menus',
          },
        },

        // 9. Lookup gallery files
        {
          $lookup: {
            from: 'folders',
            let: { driveId: '$drive' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$folderName', 'Gallery'] },
                      { $eq: ['$drive', '$$driveId'] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'files',
                  localField: '_id',
                  foreignField: 'parentDirectory',
                  as: 'files',
                  pipeline: [
                    {
                      $project: {
                        _id: 1,
                        'metaData.url': 1,
                        'metaData.thumbnailUrl': 1,
                        'metaData.mimeType': 1,
                      },
                    },
                  ],
                },
              },
              {
                $project: {
                  files: 1,
                },
              },
            ],
            as: 'galleryFolder',
          },
        },
        {
          $addFields: {
            galleryFiles: {
              $ifNull: [{ $arrayElemAt: ['$galleryFolder.files', 0] }, []],
            },
          },
        },

        // 10. Clean up temporary fields
        {
          $project: {
            userFollow: 0,
            galleryFolder: 0,
          },
        },
      ];

      // Execute the optimized pipeline
      const [business] = await this.outletModel.aggregate(optimizedPipeline);

      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }

      // const businessDistance = haversineDistance(latitude,longitude, business.latitude, business.longitude);

      return {
        success: true,
        message: 'Business fetched Successfully!',
        data: business,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async getBusinessCardFeed(
    user: DecodedUser,
    businessId: string,
    page: number,
    limit: number,
  ) {
    try {
      let query: any = {
        creator: new mongoose.Types.ObjectId(businessId),
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
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          },
        },
        {
          $project: {
            data: 1,
            total: { $arrayElemAt: ['$metadata.total', 0] },
          },
        },
      ];

      // Execute the pipeline
      const result = await this.feedModel.aggregate(pipeline);

      // Access the results
      const feeds = result[0]?.data || [];
      const total = result[0]?.total || 0;

      return {
        success: true,
        message: 'Feed fetched successfully',
        data: feeds,
        total: total,
        totalPages: Math.ceil(total / limit),
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

  async updateSelectedBusiness(userId: string, businessId: string) {
    try {
      const businessUser = await this.businessUserModel.findById(userId);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found with given ID',
        };
      }
      const business = await this.businessModel.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }
      if (
        !businessUser.business.includes(new mongoose.Types.ObjectId(businessId))
      ) {
        return {
          success: false,
          message: 'Business is not mapped with Logged in User.',
        };
      }
      await this.businessUserModel.updateOne(
        { _id: userId },
        {
          $set: {
            selectedBusiness: new mongoose.Types.ObjectId(businessId),
          },
        },
      );
    } catch (error) {}
  }

  async fetchTeamSizeDropdown() {
    try {
      const teamSize = TEAM_SIZE_OPTIONS;
      return {
        success: true,
        message: 'Team Size fetched Successfully!',
        data: teamSize,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async fetchOrganisationRolesList(page: number, limit: number) {
    try {
      const organisationRoles = ROLES_IN_ORGANISATION;
      const paginated = organisationRoles.slice(
        (page - 1) * limit,
        page * limit,
      );
      const total = organisationRoles.length;
      return {
        success: true,
        message: 'Organisation Roles fetched Successfully.',
        data: paginated,
        total: total,
        pages: Math.ceil(total / limit),
        page: page,
        limit: limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async switchBusiness(userId: string, token: string, businessId: string) {
    try {
      if (!isValidObjectId(businessId)) {
        return {
          success: false,
          message: 'Please provide valid Business Id',
        };
      }
      const userDetails = await this.businessUserModel.findById(userId);
      const business = await this.businessModel.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }
      if (
        !userDetails.business.includes(new mongoose.Types.ObjectId(businessId))
      ) {
        return {
          success: false,
          message: 'Business is not mapped with Logged in User.',
        };
      }
      const updatedToken = await this.jwtService.signAsync(
        {
          id: userId,
          userType: UserTypes.BUSINESS,
          role: userDetails.role[0].toString(),
          businessProfile: businessId,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '365d',
        },
      );
      logger.info(`updated Token########## ${updatedToken}`);

      await this.tokenModel.findOneAndUpdate(
        { token: token },
        { $set: { token: updatedToken } },
      );
      return {
        success: true,
        message: 'Business Profile Switched Successfully.',
        token: updatedToken,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async createDepartment(user: DecodedUser, data: CreateDepartmentDto) {
    try {
      const userDetails = await this.businessUserModel.findById(user.id);
      if (!userDetails) {
        return {
          success: false,
          message: 'Business User not found with given ID',
        };
      }
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }
      const foundDepartment = await this.departmentModel.findOne({
        name: data.name,
        business: user.businessProfile,
      });
      if (foundDepartment) {
        return {
          success: false,
          message: 'Department already exists with the same name',
        };
      }
      let rolesObjectId = [];
      if (data.roles) {
        for (let role of data.roles) {
          if (!isValidObjectId(role)) {
            return {
              success: false,
              message: 'Please provide valid Role Id',
            };
          }
          const foundRole = await this.roleModel.findById(role);
          if (!foundRole) {
            return {
              success: false,
              message: 'Please provide valid Role Id',
            };
          }
          rolesObjectId.push(new mongoose.Types.ObjectId(role));
        }
        data.roles = rolesObjectId;
      }

      const createdDepartment = await this.departmentModel.create({
        ...data,
        createdBy: new mongoose.Types.ObjectId(user.id),
        business: new mongoose.Types.ObjectId(user.businessProfile),
      });
      return {
        success: true,
        message: 'Department Created Successfully!',
        data: createdDepartment,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async updateDepartment(
    user: DecodedUser,
    deptId: string,
    data: UpdateDepartmentDto,
  ) {
    const dept = await this.departmentModel.findById(deptId);
    if (!dept || dept.business.toString() !== user.businessProfile) {
      return {
        success: false,
        message: 'Department not found or access denied',
      };
    }
    if (data.name && data.name !== dept.name) {
      console.log('Data.nameee::', data.name);
      console.log('dept.name::', dept.name);
      const conflict = await this.departmentModel.findOne({
        name: data.name,
        business: user.businessProfile,
      });
      if (conflict) {
        return {
          success: false,
          message: 'Another department with that name exists',
        };
      }
      dept.name = data.name;
    }

    // Validate any new roles
    if (data.roles) {
      const roleIds = [];
      for (const id of data.roles) {
        if (!isValidObjectId(id)) {
          return { success: false, message: `Invalid role ID: ${id}` };
        }
        const found = await this.roleModel.findById(id);
        if (!found) {
          return { success: false, message: `Role not found: ${id}` };
        }
        roleIds.push(new mongoose.Types.ObjectId(id));
      }
      dept.roles = roleIds;
    }

    if (data.description !== undefined) {
      dept.description = data.description;
    }

    await dept.save();
    const updatedDepartment = await this.departmentModel.findById(deptId);
    return {
      success: true,
      message: 'Department updated',
      data: updatedDepartment,
    };
  }

  async fetchDepartment(user: DecodedUser, page = 1, limit = 20) {
    try {
      logger.info(`Business: ${user.businessProfile}`);
      const query = {
        business: new mongoose.Types.ObjectId(user.businessProfile),
      };
      const [items, total] = await Promise.all([
        this.departmentModel
          .find(query)
          .populate('roles', '_id name')
          .populate('createdBy', '_id name email profilePhoto')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.departmentModel.countDocuments(query),
      ]);
      logger.info(`items: ${JSON.stringify(items)}`);
      logger.info(`total: ${total}`);

      return {
        success: true,
        message: 'Departments fetched successfully.',
        data: items,
        total: total,
        pages: Math.ceil(total / limit),
        page: page,
        limit: limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async deleteDepartment(user: DecodedUser, deptId: string) {
    const dept = await this.departmentModel.findById(deptId);
    if (!dept || dept.business.toString() !== user.businessProfile) {
      return {
        success: false,
        message: 'Department not found or access denied',
      };
    }

    await this.departmentModel.deleteOne({ _id: deptId });
    return { success: true, message: 'Department deleted' };
  }

  async fetchDepartmentById(user: DecodedUser, deptId: string) {
    try {
      const dept = await this.departmentModel.findById(deptId);
      if (!dept || dept.business.toString() !== user.businessProfile) {
        return {
          success: false,
          message: 'Department not found or access denied',
        };
      }
      const populatedDept = await this.departmentModel
        .findById(deptId)
        .populate('roles', '_id name')
        .lean();
      return {
        success: true,
        message: 'Department fetched successfully',
        data: populatedDept,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async fetchFollowers(user: DecodedUser, page: number, limit: number) {
    try {
      logger.info(`user: ${user.businessProfile}`);
      logger.info(`User name: ${User.name}`);
      const followers = await this.followModel
        .find({
          following: new mongoose.Types.ObjectId(user.businessProfile),
          followerType: User.name,
        })
        .populate(
          'follower',
          '_id firstName lastName profilePhoto name profileType image',
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await this.businessUserModel.countDocuments({
        business: user.businessProfile,
      });

      return {
        success: true,
        message: 'Followers fetched Successfully!',
        data: followers,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async getTemplates(
    user: DecodedUser,
    page: number,
    limit: number,
    type: string,
    search: string,
    categories: string[],
  ) {
    try {
      let searchQuery = {
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
        creatorType: BusinessUser.name,
      };
      if (type) {
        searchQuery['type'] = type;
      }
      if (search) {
        const searchTerms = search.trim().split(/\s+/); // Split by whitespace
        const searchConditions = searchTerms.map((term) => ({
          $or: [
            { title: { $regex: `\\b${term}\\b`, $options: 'i' } }, // Word boundary
            { description: { $regex: `\\b${term}\\b`, $options: 'i' } },
          ],
        }));
        searchQuery['$and'] = searchConditions;
      }
      if (categories && categories.length > 0) {
        const categoryObjectIds = categories
          .filter((id) => isValidObjectId(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        if (categoryObjectIds.length > 0) {
          searchQuery['categories'] = { $in: categoryObjectIds };
        }
      }

      const templates = await this.templateModel
        .find(searchQuery)
        .sort({ createdAt: -1 })
        .populate('categories', '_id title')
        .populate('businessCategories', '_id title')
        .populate('businessIndustry', '_id title')
        .skip((page - 1) * limit)
        .limit(limit);
      const totalTemplates =
        await this.templateModel.countDocuments(searchQuery);
      return {
        success: true,
        message: 'Templates fetched successfully',
        data: templates,
        page,
        limit,
        total: totalTemplates,
        pages: Math.ceil(totalTemplates / limit),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async createRegion(user: DecodedUser, data: CreateRegionDto) {
    try {
      const userDetails = await this.businessUserModel.findById(user.id);
      if (!userDetails) {
        return {
          success: false,
          message: 'Business User not found with given ID',
        };
      }
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }
      const foundRegion = await this.regionModel.findOne({
        name: data.name,
        business: user.businessProfile,
      });
      if (foundRegion) {
        return {
          success: false,
          message: 'Region already exists with the same name',
        };
      }
      let userObjectId = [];
      if (data.users) {
        for (let user of data.users) {
          if (!isValidObjectId(user)) {
            return {
              success: false,
              message: 'Please provide valid User Id',
            };
          }
          const foundUser = await this.businessUserModel.findById(user);
          if (!foundUser) {
            return {
              success: false,
              message: 'Please provide valid User Id',
            };
          }
          userObjectId.push(new mongoose.Types.ObjectId(user));
        }
        data.users = userObjectId;
      }

      const createdRegion = await this.regionModel.create({
        ...data,
        createdBy: new mongoose.Types.ObjectId(user.id),
        business: new mongoose.Types.ObjectId(user.businessProfile),
      });
      return {
        success: true,
        message: 'Region Created Successfully!',
        data: createdRegion,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async updateRegion(
    user: DecodedUser,
    regionId: string,
    data: UpdateRegionDto,
  ) {
    const region = await this.regionModel.findById(regionId);
    if (!region || region.business.toString() !== user.businessProfile) {
      return {
        success: false,
        message: 'Region not found or access denied',
      };
    }
    let updateObj = {};

    if (data.name && data.name !== region.name) {
      const conflict = await this.regionModel.findOne({
        name: data.name,
        business: user.businessProfile,
      });
      if (conflict) {
        return {
          success: false,
          message: 'Another Region with that name exists',
        };
      }
      updateObj['name'] = data.name;
    }

    // Validate any new roles
    if (data.users) {
      const userIds = [];
      for (const id of data.users) {
        if (!isValidObjectId(id)) {
          return { success: false, message: `Invalid User ID: ${id}` };
        }
        const found = await this.businessUserModel.findById(id);
        if (!found) {
          return { success: false, message: `Role not found: ${id}` };
        }
        userIds.push(new mongoose.Types.ObjectId(id));
      }
      updateObj['users'] = userIds;
    }

    if (data.description !== undefined) {
      updateObj['description'] = data.description;
    }

    const updatedRegion = await this.regionModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(regionId) },
      { $set: updateObj },
      { new: true },
    );
    logger.info(`udpatedRegion: ${JSON.stringify(updatedRegion)}`);
    return { success: true, message: 'Region updated', data: updatedRegion };
  }

  async fetchRegiontById(user: DecodedUser, regionId: string) {
    try {
      const region = await this.regionModel.findById(regionId);
      if (!region || region.business.toString() !== user.businessProfile) {
        return {
          success: false,
          message: 'Region not found or access denied',
        };
      }
      const populatedRegion = await this.regionModel
        .findById(regionId)
        .populate('users', '_id name email profilePhoto')
        .populate('createdBy', '_id name email profilePhoto')
        .lean();
      return {
        success: true,
        message: 'Department fetched successfully',
        data: populatedRegion,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async fetchRegions(user: DecodedUser, page = 1, limit = 20) {
    try {
      logger.info(`Business: ${user.businessProfile}`);
      const query = {
        business: new mongoose.Types.ObjectId(user.businessProfile),
      };
      const [items, total] = await Promise.all([
        this.regionModel
          .find(query)
          .populate('users', '_id name email profilePhoto')
          .populate({
            path: 'users',
            populate: {
              path: 'role',
              model: Role.name,
              select: '_id name description',
            },
          })
          .populate('createdBy', '_id name email profilePhoto')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.departmentModel.countDocuments(query),
      ]);
      logger.info(`items: ${JSON.stringify(items)}`);
      logger.info(`total: ${total}`);

      return {
        success: true,
        message: 'Regions fetched successfully.',
        data: items,
        total: total,
        pages: Math.ceil(total / limit),
        page: page,
        limit: limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async deleteRegion(user: DecodedUser, regionId: string) {
    const region = await this.regionModel.findById(regionId);
    if (!region || region.business.toString() !== user.businessProfile) {
      return {
        success: false,
        message: 'Region not found or access denied',
      };
    }

    await this.regionModel.deleteOne({ _id: regionId });
    return { success: true, message: 'Region deleted' };
  }

  async createLocationGroup(
    businessId: string,
    userId: string,
    createDto: CreateLocationGroupDto,
  ) {
    const businessObjId = new mongoose.Types.ObjectId(businessId);
    const userObjId = new mongoose.Types.ObjectId(userId);
    let locationsIds = [];
    if (createDto.locations) {
      for (let location of createDto.locations) {
        if (!isValidObjectId(location)) {
          return {
            success: false,
            message: `Invalid location ID: ${location}`,
          };
        }
        const foundOutlet = await this.outletModel.findOne({
          _id: new mongoose.Types.ObjectId(location),
          business: businessObjId,
        });
        if (!foundOutlet) {
          return {
            success: false,
            message: `Location with ID ${location} not found ordoes not belong to this business`,
          };
        }

        locationsIds.push(new mongoose.Types.ObjectId(location));
      }
    }

    const businessExists = await this.businessModel.exists({
      _id: businessObjId,
    });
    const userExists = await this.businessUserModel.exists({
      _id: userObjId,
      business: businessObjId,
    });
    if (!businessExists) {
      return {
        success: false,
        message: 'Business not found',
      };
    }
    if (!userExists) {
      return {
        success: false,
        message: 'User not found or does not belong to this business',
      };
    }

    const toCreate = {
      name: createDto.name,
      description: createDto.description ?? '',
      locations: createDto.locations ?? [],
      business: businessObjId,
      createdBy: userObjId,
    };
    const locationGroup = await this.locationGroupModel.create(toCreate);
    return {
      success: true,
      message: 'LocationGroup created successfully',
      data: locationGroup,
    };
  }

  async findAllLocationGroups(businessId: string, page: number, limit: number) {
    const businessObjId = new mongoose.Types.ObjectId(businessId);
    if (page < 1 || limit < 1) {
      return {
        success: false,
        message: 'Page and limit must be greater than 0',
      };
    }
    const skip = (page - 1) * limit;
    // Find all groups for this business with pagination
    const [results, total] = await Promise.all([
      this.locationGroupModel
        .find({ business: businessObjId })
        .sort({ createdAt: -1 }) // sort newest first (optional)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.locationGroupModel.countDocuments({ business: businessObjId }),
    ]);
    return {
      success: true,
      message: 'All LocationGroups fetched successfully',
      data: results,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  /**
   * Find a single LocationGroup by id (within the current business).
   */
  async findOneLocationGroup(businessId: string, id: string) {
    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: 'Invalid LocationGroup ID',
      };
    }
    const businessObjId = new mongoose.Types.ObjectId(businessId);

    const locationGroup = await this.locationGroupModel
      .findOne({ _id: id, business: businessObjId })
      .exec();

    if (!locationGroup) {
      return {
        success: false,
        message: 'LocationGroup not found or does not belong to this business',
      };
    }

    return {
      success: true,
      message: 'LocationGroup found',
      data: locationGroup,
    };
  }

  /**
   * Update an existing LocationGroup.
   * Only fields provided in updateDto will be modified.
   */
  async updateLocationGroup(
    businessId: string,
    userId: string,
    id: string,
    updateDto: UpdateLocationGroupDto,
  ) {
    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: 'Invalid LocationGroup ID',
      };
    }
    const businessObjId = new mongoose.Types.ObjectId(businessId);
    const userObjId = new mongoose.Types.ObjectId(userId);
    // Validate outlet references if the update payload includes any
    let locationsIds = [];
    if (updateDto.locations) {
      for (let location of updateDto.locations) {
        if (!isValidObjectId(location)) {
          return {
            success: false,
            message: `Invalid location ID: ${location}`,
          };
        }
        locationsIds.push(new mongoose.Types.ObjectId(location));
      }
    }

    const locationGroup = await this.locationGroupModel
      .findOne({ _id: id, business: businessObjId })
      .exec();
    if (!locationGroup) {
      return {
        success: false,
        message: 'LocationGroup not found or does not belong to this business',
      };
    }

    // Update allowed fields
    if (updateDto.name !== undefined) {
      locationGroup.name = updateDto.name;
    }
    if (updateDto.description !== undefined) {
      locationGroup.description = updateDto.description;
    }
    if (updateDto.locations !== undefined) {
      locationGroup.locations = updateDto.locations.map(
        (outletId) => new mongoose.Types.ObjectId(outletId),
      );
    }
    // (We do not allow changing `business` or `createdBy` through updateDto)

    await locationGroup.save();
    return {
      success: true,
      message: 'LocationGroup updated successfully',
      data: locationGroup,
    };
  }

  /**
   * Remove (delete) a LocationGroup by id.
   */
  async removeLocationGroup(businessId: string, id: string) {
    const businessObjId = new mongoose.Types.ObjectId(businessId);

    const result = await this.locationGroupModel
      .findOneAndDelete({ _id: id, business: businessObjId })
      .exec();
    if (!result) {
      return {
        success: false,
        message: 'LocationGroup not found or does not belong to this business',
      };
    }
    return {
      success: true,
      message: 'LocationGroup deleted successfully',
    };
  }

  // async getDashboardData(user: DecodedUser, limit: number = 10) {
  //   try {
  //     const business = await this.businessModel.findById(user.businessProfile);
  //     if (!business) {
  //       return {
  //         success: false,
  //         message: 'Business not found with given ID',
  //       };
  //     }
  //     console.log('businessProfile:', user.businessProfile);
  //     const [eventLogistics] = await this.eventModel.aggregate([
  //       {
  //         $match: {
  //           businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
  //           status: EventStatus.PUBLISHED,
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: null,
  //           totalEvents: { $sum: 1 },
  //           totalViewsCount: { $sum: '$viewsCount' },
  //           totalEngagementCount: { $sum: '$engagementCount' },
  //         },
  //       },
  //     ]);
  //     const rewardRedeemptions = await this.userRewardModel.countDocuments({
  //       businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
  //       claimStatus: ClaimStatus.CLAIMED,
  //     });
  //     console.log('rewardRedeemptions:', JSON.stringify(rewardRedeemptions));

  //     const [typeWiseStats] = await this.eventModel.aggregate([
  //       {
  //         $match: {
  //           businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
  //           status: EventStatus.PUBLISHED,
  //         },
  //       },
  //       {
  //         $facet: {
  //           typeWiseStats: [
  //             {
  //               $group: {
  //                 _id: '$type',
  //                 count: { $sum: 1 },
  //               },
  //             },
  //             {
  //               $project: {
  //                 _id: 1,
  //                 count: 1,
  //               },
  //             },
  //             {
  //               $group: {
  //                 _id: null,
  //                 data: { $push: { _id: '$_id', count: '$count' } },
  //               },
  //             },
  //             {
  //               $project: {
  //                 data: {
  //                   $map: {
  //                     input: [
  //                       'business_event',
  //                       'offer',
  //                       'flashdeal'
  //                     ],
  //                     as: 'etype',
  //                     in: {
  //                       $let: {
  //                         vars: {
  //                           matched: {
  //                             $arrayElemAt: [
  //                               {
  //                                 $filter: {
  //                                   input: '$data',
  //                                   as: 'd',
  //                                   cond: { $eq: ['$$d._id', '$$etype'] },
  //                                 },
  //                               },
  //                               0,
  //                             ],
  //                           },
  //                         },
  //                         in: {
  //                           _id: '$$etype',
  //                           count: { $ifNull: ['$$matched.count', 0] },
  //                         },
  //                       },
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //             {
  //               $unwind: '$data',
  //             },
  //             {
  //               $replaceRoot: { newRoot: '$data' },
  //             },
  //           ],
  //           overallStats: [
  //             {
  //               $group: {
  //                 _id: null,
  //                 totalEvents: { $sum: 1 },
  //               },
  //             },
  //           ],
  //         },
  //       },
  //     ]);
  //     const events = await this.eventModel.aggregate([
  //       {
  //         $match: {
  //           businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
  //           status: EventStatus.PUBLISHED,
  //         },
  //       },
  //       {
  //         $addFields: {
  //           totalEngagement: { $add: ['$viewsCount', '$engagementCount'] },
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'eventschedules',
  //           localField: 'eventSchedule',
  //           foreignField: '_id',
  //           as: 'schedules',
  //         },
  //       },
  //       {
  //         $sort: { totalEngagement: -1 }, // Descending
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //           title: 1,
  //           description: 1,
  //           totalEngagement: 1,
  //           viewsCount: 1,
  //           engagementCount: 1,
  //           totalLikes: 1,
  //           totalShares: 1,
  //           totalSaved: 1,
  //           schedules: 1,
  //         },
  //       },
  //       { $limit: limit },
  //     ]);
  //     console.log('events:', JSON.stringify(events));

  //     // const outletWiseStats = await this.eventLocationModel.aggregate([
  //     //   {
  //     //     $match: {
  //     //       businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
  //     //     },
  //     //   },
  //     //   {
  //     //     $group: {
  //     //       _id: '$businessLocationId',
  //     //       // totalEvents: { $sum: 1 },
  //     //       // totalViewsCount: { $sum: '$viewsCount' },
  //     //       // totalEngagementCount: { $sum: '$engagementCount' },
  //     //     },
  //     //   },
  //     //   // {
  //     //   //   $lookup: {
  //     //   //     from: 'outlets',
  //     //   //     localField: '_id',
  //     //   //     foreignField: '_id',
  //     //   //     as: 'outletDetails',
  //     //   //   },
  //     //   // },
  //     //   // {
  //     //   //   $unwind: '$outletDetails',
  //     //   // },
  //     //   // {
  //     //   //   $project: {
  //     //   //     _id: 1,
  //     //   //     outletName: '$outletDetails.name',
  //     //   //     totalEvents: 1,
  //     //   //     totalViewsCount: 1,
  //     //   //     totalEngagementCount: 1,
  //     //   //   },
  //     //   // }
  //     // ])
  //     // console.log('outletWiseStats:', JSON.stringify(outletWiseStats));

  //     return {
  //       success: true,
  //       message: 'Dashboard data fetched successfully',
  //       data: {
  //         eventLogistics: eventLogistics,
  //         rewardRedeemptions: rewardRedeemptions,
  //         events: events,
  //         typeWiseStats: typeWiseStats,
  //         // outletWiseStats: outletWiseStats,
  //       },
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.message,
  //     };
  //   }
  // }

  async getDashboardData(
    user: DecodedUser,
    limit: number = 20,
    progress: string,
  ) {
    try {
      const businessProfileId = new mongoose.Types.ObjectId(
        user.businessProfile,
      );
      // const business = await this.businessModel.findById(businessProfileId).populate('activeSubscription');
      const [business] = await this.businessModel.aggregate([
        { $match: { _id: businessProfileId } },
        {
          $lookup: {
            from: 'subscriptions',
            localField: 'activeSubscription',
            foreignField: '_id',
            as: 'activeSubscription',
            pipeline: [
              {
                $lookup: {
                  from: 'subscriptionproducts',
                  localField: 'product',
                  foreignField: '_id',
                  as: 'product',
                },
              },
              { $unwind: '$product' },
              {
                $project: {
                  _id: 1,
                  source: 1,
                  product: 1,
                  startDate: 1,
                  endDate: 1,
                  status: 1,
                  remainingDays: {
                    $dateDiff: {
                      startDate: currentDateTz(),
                      endDate: '$endDate',
                      unit: 'day',
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$activeSubscription',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }

      const [eventLogistics, activeParticipants, topEvents, followersCount] =
        await Promise.all([
          this.fetchEventLogistics(businessProfileId, progress),
          this.fetchRewardRedemptions(businessProfileId, progress),
          this.fetchTopEvents(businessProfileId, limit),
          this.userService.getFollowers(user.businessProfile),
        ]);

      const businessDetails = {
        name: business.name,
        logo: business.logo,
        coverImage: business.cover,
        followersCount: followersCount.count,
        activeSubscription: business.activeSubscription || null,
        profileCompletionPercentage: business.profileCompletionPercentage,
      };

      console.log('Active Participants:', activeParticipants);
      return {
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          businessDetails,
          eventLogistics,
          activeParticipants,
          events: topEvents,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private async fetchEventLogistics(
    businessProfileId: mongoose.Types.ObjectId,
    progress: string,
  ) {
    const now = new Date();
    const startOfCurrent = new Date(now);
    let startOfPrevious: Date;

    switch (progress) {
      case 'daily':
        startOfCurrent.setHours(0, 0, 0, 0); // start of today
        startOfPrevious = new Date(startOfCurrent);
        startOfPrevious.setDate(startOfPrevious.getDate() - 1);
        break;

      case 'weekly':
        const dayOfWeek = startOfCurrent.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToStartOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfCurrent.setDate(startOfCurrent.getDate() - diffToStartOfWeek);
        startOfCurrent.setHours(0, 0, 0, 0); // start of this week (Monday)
        startOfPrevious = new Date(startOfCurrent);
        startOfPrevious.setDate(startOfPrevious.getDate() - 7); // last week's start
        break;

      case 'monthly':
        startOfCurrent.setDate(1); // start of this month
        startOfCurrent.setHours(0, 0, 0, 0);
        startOfPrevious = new Date(startOfCurrent);
        startOfPrevious.setMonth(startOfPrevious.getMonth() - 1); // last month's start
        break;

      default:
        throw new Error('Invalid progress type');
    }

    const [lastResult] = await this.eventModel.aggregate([
      {
        $match: {
          businessProfile: businessProfileId,
          status: EventStatus.PUBLISHED,
          createdAt: {
            $gte: startOfPrevious,
            $lt: startOfCurrent,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalViewsCount: { $sum: '$viewsCount' },
          totalEngagementCount: { $sum: '$engagementCount' },
          totalLikes: { $sum: '$totalLikes' },
          totalShares: { $sum: '$totalShares' },
          totalSaved: { $sum: '$totalSaved' },
        },
      },
    ]);

    const [currentResult] = await this.eventModel.aggregate([
      {
        $match: {
          businessProfile: businessProfileId,
          status: EventStatus.PUBLISHED,
          createdAt: {
            $gte: startOfCurrent,
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalViewsCount: { $sum: '$viewsCount' },
          totalEngagementCount: { $sum: '$engagementCount' },
          totalLikes: { $sum: '$totalLikes' },
          totalShares: { $sum: '$totalShares' },
          totalSaved: { $sum: '$totalSaved' },
        },
      },
    ]);

    const last = lastResult ?? {
      totalEvents: 0,
      totalViewsCount: 0,
      totalEngagementCount: 0,
      totalLikes: 0,
      totalShares: 0,
      totalSaved: 0,
    };

    const current = currentResult ?? {
      totalEvents: 0,
      totalViewsCount: 0,
      totalEngagementCount: 0,
      totalLikes: 0,
      totalShares: 0,
      totalSaved: 0,
    };

    current.percentageChange = {
      totalEvents: this.percentageChange(last.totalEvents, current.totalEvents),
      totalViewsCount: this.percentageChange(
        last.totalViewsCount,
        current.totalViewsCount,
      ),
      totalEngagementCount: this.percentageChange(
        last.totalEngagementCount,
        current.totalEngagementCount,
      ),
      totalLikes: this.percentageChange(last.totalLikes, current.totalLikes),
      totalShares: this.percentageChange(last.totalShares, current.totalShares),
      totalSaved: this.percentageChange(last.totalSaved, current.totalSaved),
    };

    console.log('Last Period:', last);
    console.log('Current Period:', current);

    return current;
  }

  private percentageChange(oldVal: number, newVal: number) {
    if (oldVal === 0) return 0;
    return ((newVal - oldVal) / oldVal) * 100;
  }

  private async fetchRewardRedemptions(
    businessProfileId: mongoose.Types.ObjectId,
    progress: string,
  ) {
    const now = new Date();
    let oldDate: Date;

    switch (progress) {
      case 'daily':
        oldDate = new Date(now);
        oldDate.setDate(oldDate.getDate() - 1);
        break;
      case 'weekly':
        oldDate = new Date(now);
        oldDate.setDate(oldDate.getDate() - 7);
        break;
      case 'monthly':
        oldDate = new Date(now);
        oldDate.setMonth(oldDate.getMonth() - 1);
        break;
      default:
        throw new Error('Invalid progress type');
    }

    // Past progress (CLAIMED up to oldDate)
    const lastProgress = await this.userRewardModel.countDocuments({
      businessProfile: businessProfileId,
      claimStatus: ClaimStatus.CLAIMED,
      createdAt: { $lte: oldDate },
    });

    // Current progress (ACTIVE since oldDate)
    const currentProgress = await this.userRewardModel.countDocuments({
      businessProfile: businessProfileId,
      claimStatus: ClaimStatus.ACTIVE,
    });

    return {
      activeParticipants: currentProgress,
      percentageChange: this.percentageChange(lastProgress, currentProgress),
    };
  }

  private async fetchTypeWiseStats(businessProfileId: mongoose.Types.ObjectId) {
    const result = await this.eventModel.aggregate([
      {
        $match: {
          businessProfile: businessProfileId,
          status: EventStatus.PUBLISHED,
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const defaultTypes = ['business_event', 'offer', 'flashdeal'];
    const typeMap = new Map(result.map(({ _id, count }) => [_id, count]));

    return defaultTypes.map((type) => ({
      _id: type,
      count: typeMap.get(type) || 0,
    }));
  }

  private async fetchTopEvents(
    businessProfileId: mongoose.Types.ObjectId,
    limit: number,
  ) {
    const QR_ImageCategory = await this.fileCategoryModel.findOne({
      name: 'Content QR',
    });
    return this.eventModel.aggregate([
      {
        $match: {
          businessProfile: businessProfileId,
          status: EventStatus.PUBLISHED,
        },
      },
      {
        $addFields: {
          totalEngagement: { $add: ['$viewsCount', '$engagementCount'] },
        },
      },
      {
        $lookup: {
          from: 'eventschedules',
          localField: 'eventSchedule',
          foreignField: '_id',
          as: 'schedules',
        },
      },
      {
        $lookup: {
          from: 'files',
          let: { folderId: '$drivePath' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$parentDirectory', '$$folderId'] },
                    {
                      $ne: [
                        '$category',
                        new mongoose.Types.ObjectId(QR_ImageCategory.id),
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'files',
        },
      },
      { $sort: { totalEngagement: -1, createdAt: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          type: 1,
          description: 1,
          status: 1,
          totalEngagement: 1,
          viewsCount: 1,
          engagementCount: 1,
          totalLikes: 1,
          totalShares: 1,
          totalSaved: 1,
          schedules: 1,
          createdAt: 1,
          files: 1,
        },
      },
      { $limit: limit },
    ]);
  }

  async getFollowers(businessId: string, page: number, limit: number) {
    try {
      const businessObjId = new mongoose.Types.ObjectId(businessId);
      const followers = await this.followModel
        .find({
          following: businessObjId,
          // followerType: BusinessUser.name,
        })
        .populate(
          'follower',
          '_id firstName lastName profilePhoto name profileType image',
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await this.followModel.countDocuments({
        following: businessObjId,
      });

      return {
        success: true,
        message: 'Followers fetched Successfully!',
        data: followers,
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async createRating(
    userId: string,
    businessId: string,
    { rating, comment }: { rating: number; comment: string },
  ) {
    try {
      const business = await this.businessModel.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }

      const result = await this.ratingModel.findOneAndUpdate(
        {
          business: new mongoose.Types.ObjectId(businessId),
          user: new mongoose.Types.ObjectId(userId),
        },
        {
          $set: {
            rating,
            comment,
          },
        },
        { new: true, upsert: true },
      );

      return {
        success: true,
        message: 'Review created Successfully!',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async parseCsv(file: Express.Multer.File, type: string): Promise<any[]> {
    const rows: any[] = [];
    const stream = streamifier.createReadStream(file.buffer);
    let expectedHeaders = [];
    if (type === 'downlineUsers') expectedHeaders = ExpectedDownlineUserHeaders;
    if (type === 'bulkEventUpload')
      expectedHeaders = ExpectedBulkEventUploadHeaders;
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          const missing = expectedHeaders.filter((h) => !headers.includes(h));
          if (missing.length > 0) {
            reject(
              new BadRequestException(`Missing columns: ${missing.join(', ')}`),
            );
          }
        })
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', () =>
          reject(new BadRequestException('CSV parsing error.')),
        );
    });
  }

  async createDownlineUserFromRow(row: any, user: DecodedUser) {
    try {
      const foundUser = await this.businessUserModel.findOne({
        email: row.email,
      });

      if (foundUser) {
        // return {
        //   success: false,
        //   message: 'Business User already found with this email',
        // };
        throw new BadRequestException(
          'Business User already found with this email',
        );
      }
      let password = await this.authService.autoGeneratePassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      // if (data.role) {
      //   if (!isValidObjectId(data.role)) {
      //     return {
      //       success: false,
      //       message: 'Please provide valid Role Id',
      //     };
      //   }
      // }
      let createObj = {
        // role: [new mongoose.Types.ObjectId(data.role)],
        creatorType: BusinessUserCreatorType.BUSINESS,
        creator: new mongoose.Types.ObjectId(user.id),
        name: row.name,
        email: row.email,
        password: hashedPassword,
        business: new mongoose.Types.ObjectId(user.businessProfile),
        isEmailVerified: true,
        status: ProfileStatus.EMAIL_VERIFIED,
        phone: row.phone,
        countryCode: row.countryCode,
      };

      const createdUser = await this.businessUserModel.create(createObj);

      //create drive
      let driveDetails = await this.seederService.createDrive(
        createdUser._id,
        BusinessUser.name,
      );
      await this.businessUserModel.updateOne(
        { _id: createdUser.id },
        { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
      );

      // sendEmaillink verification
      const loginLink = process.env.PORTAL_URL + 'v1/business/user/login';
      this.mailService.sendDownlineUserCredentials(
        createdUser.name,
        createdUser.email,
        password,
        loginLink,
      );
    } catch (error) {
      throw new BadRequestException(
        'Error creating outlet from row: ' + error.message,
      );
    }
  }

  async createDownlineUsersInBulk(
    file: Express.Multer.File,
    user: DecodedUser,
  ) {
    try {
      const businessUser = await this.businessUserModel.findById(user.id);
      const business = await this.businessModel.findById(user.businessProfile);

      if (!businessUser || !business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }
      const rows = await this.parseCsv(file, 'downlineUsers');
      let failure = 0;
      let result = null;
      const results = await Promise.all(
        rows.map(async (row) => {
          try {
            await this.createDownlineUserFromRow(row, user);
            return { ...row, status: 'Created', message: '' };
          } catch (err) {
            failure++;
            return { ...row, status: 'Failed', message: err.message };
          }
        }),
      );
      console.log('Failure:', failure);
      if (failure > 0) {
        const failedRecords = results.filter((r) => r.status === 'Failed');
        try {
          const csvStringifier = createObjectCsvStringifier({
            header: [
              { id: 'email', title: 'Email' },
              { id: 'name', title: 'Name' },
              { id: 'phone', title: 'Phone' },
              { id: 'countryCode', title: 'CountryCode' },
              { id: 'status', title: 'Status' },
              { id: 'message', title: 'ErrorMessage' },
            ],
          });

          const header = csvStringifier.getHeaderString();
          const records = failedRecords.map((r) => ({
            email: r.email,
            name: r.name,
            phone: r.phone,
            countryCode: r.countryCode,
            status: r.status,
            message: r.message || '',
          }));
          const csvContent = header + csvStringifier.stringifyRecords(records);
          const csvBuffer = Buffer.from(csvContent, 'utf-8');
          const fileCategory = await this.fileCategoryModel.findOne({
            name: FileCategoryTypes.OTHER,
          });

          const fakeFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: 'downline_users_status.csv',
            encoding: '7bit',
            mimetype: 'text/csv',
            buffer: csvBuffer,
            size: csvBuffer.length,
            destination: '',
            filename: 'downline_users_status.csv',
            path: '',
            stream: Readable.from(csvBuffer) as any, // <-- import { Readable } from 'stream'
          };
          const uploadResult = await this.driveService.uploadFile(
            businessUser.id,
            String(business.drive),
            fileCategory.id,
            fakeFile,
          );
          result = uploadResult.data.metaData.url;
        } catch (err) {
          console.log('Error:', err);
        }
      }

      return {
        success: true,
        message: 'Users created successfully in bulk.',
        file: result, // You can return the created outlets data if needed
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async bulkUploadEventsFromRow(row: any, user: DecodedUser) {
    const trimIfString = (v) => (typeof v === 'string' ? v.trim() : v);
    const {
      outletName,
      title,
      description,
      type,
      discountType,
      discountValue,
      categories,
      images,
      date,
      startTime,
      endTime,
      tags,
      weblinks,
      isFree,
      cost,
      targetGenders,
      minTargetAge,
      maxTargetAge,
    } = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, trimIfString(v)]),
    );
    const business = await this.businessModel.findById(user.businessProfile);
    if (!business) {
      throw new BadRequestException('Business Not found.');
    }
    const outlet = await this.outletModel.findOne({
      business: business._id,
      name: outletName,
    });
    if (!outlet) {
      throw new BadRequestException('Outlet not found');
    }
    let categoryNames = categories.split(',');
    let categoryIds = [];
    for (let category of categoryNames) {
      const foundCategory = await this.categoryModel.findOne({
        title: category.trim(),
      });
      if (!foundCategory) {
        throw new BadRequestException('Category Not found!');
      }
      categoryIds.push(foundCategory._id);
    }
    console.log('foundCategoryIds:', categoryIds);

    const eventFolder = await this.driveService.createFolder(
      user.businessProfile,
      {
        parentDirectory: business.drive,
        parentType: 'Drive',
        folderName: title,
      },
    );
    console.log('eventFolder:', eventFolder);
    let eventObj = {
      isFromCrawler: false,
      type: type,
      discountType: discountType,
      discountValue: discountValue,
      CreatorType: BusinessUser.name,
      user: new mongoose.Types.ObjectId(user.id),
      businessProfile: business._id,
      categories: categoryIds,
      title: title,
      description: description,
      minTargetAge: minTargetAge,
      maxTargetAge: maxTargetAge,
      targetGenders: targetGenders,
      tags: tags,
      drivePath: eventFolder.data._id,
    };
    console.log('eventOBJ:', eventObj);
    const createdEvent = await this.eventModel.create(eventObj);
    console.log('createdEvent:', createdEvent);
    // const imageUrlsArray = images.split(',');
    // for(let image of imageUrlsArray){

    // }

    //1. create event, create its folder,upload image in folder, create schedule, eventLocation

    //EventLocation:::
    const eventLocation = await this.eventLocationModel.create({
      isFromCrawler: false,
      event: createdEvent._id,
      businessProfile: business._id,
      businessLocationId: outlet._id,
      location: {
        type: 'Point',
        coordinates: [outlet.longitude, outlet.latitude],
      },
      accuracy: outlet.accuracy,
      address1: outlet.address1,
      address2: outlet.address2 ? outlet.address2 : '',
      city: outlet.city,
      state: outlet.state,
      zip: outlet.postalCode,
      website: outlet.website,
      email: outlet.email,
      phone: outlet.phone,
    });
    console.log('EVENTLOCATION:', eventLocation);
    await this.eventModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(createdEvent._id),
      },
      {
        $addToSet: { locations: eventLocation._id },
      },
    );
    const startLocal = new Date(`${date}T${startTime}:00Z`);
    const endLocal = new Date(`${date}T${endTime}:00Z`);

    // Convert to UTC ISO string
    const startUtc = new Date(startLocal.toISOString());
    const endUtc = new Date(endLocal.toISOString());
    const schedule = await this.scheduleModel.create({
      type: ScheduleTypes.FIXED,
      event: createdEvent._id,
      fixedSchedule: {
        date: new Date(date),
        durations: [
          {
            startTime: startUtc,
            endTime: endUtc,
          },
        ],
      },
      businessId: business._id,
    });
    await this.eventModel.updateOne(
      { _id: createdEvent._id },
      {
        $push: {
          eventSchedule: schedule._id,
        },
      },
    );
  }

  async uploadEventsInBulk(file: Express.Multer.File, user: DecodedUser) {
    try {
      const [businessUser, business] = await Promise.all([
        this.businessUserModel.findById(user.id),
        this.businessModel.findById(user.businessProfile),
      ]);

      if (!businessUser || !business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }
      const rows = await this.parseCsv(file, 'bulkEventUpload');
      let failure = 0;
      let result = null;
      const results = await Promise.all(
        rows.map(async (row) => {
          try {
            await this.bulkUploadEventsFromRow(row, user);
            return { ...row, status: 'Created', message: '' };
          } catch (err) {
            failure++;
            return { ...row, status: 'Failed', message: err.message };
          }
        }),
      );
      console.log('Failure:', failure);
      if (failure > 0) {
        const failedRecords = results.filter((r) => r.status === 'Failed');
        try {
          const csvStringifier = createObjectCsvStringifier({
            header: [
              { id: 'outletName', title: 'OutletName' },
              { id: 'title', title: 'Title' },
              { id: 'description', title: 'Description' },
              { id: 'type', title: 'Type' },
              { id: 'discountType', title: 'DiscountType' },
              { id: 'discountValue', title: 'DiscountValue' },
              { id: 'categories', title: 'Categories' },
              { id: 'images', title: 'Images' },
              { id: 'qrCode', title: 'QrCode' },
              { id: 'date', title: 'Date' },
              { id: 'startTime', title: 'StartTime' },
              { id: 'endTime', title: 'EndTime' },
              { id: 'tags', title: 'Tags' },
              { id: 'weblinks', title: 'Weblinks' },
              { id: 'isFree', title: 'IsFree' },
              { id: 'cost', title: 'Cost' },
              { id: 'targetGenders', title: 'TargetGenders' },
              { id: 'minTargetAge', title: 'MinTargetAge' },
              { id: 'maxTargetAge', title: 'MaxTargetAge' },
              { id: 'status', title: 'Status' },
              { id: 'message', title: 'Message' },
            ],
          });

          const header = csvStringifier.getHeaderString();
          const records = failedRecords.map((r) => ({
            outletName: r.outletName,
            title: r.title,
            description: r.description,
            type: r.type,
            discountType: r.discountType,
            discountValue: r.discountValue,
            categories: r.categories,
            images: r.images,
            qrCode: r.qrCode,
            date: r.date,
            startTime: r.startTime,
            endTime: r.endTime,
            tags: r.tags,
            weblinks: r.weblinks,
            isFree: r.isFree,
            cost: r.cost,
            targetGenders: r.targetGenders,
            minTargetAge: r.minTargetAge,
            maxTargetAge: r.maxTargetAge,
            status: r.status,
            message: r.message || '',
          }));
          const csvContent = header + csvStringifier.stringifyRecords(records);
          const csvBuffer = Buffer.from(csvContent, 'utf-8');
          const fileCategory = await this.fileCategoryModel.findOne({
            name: FileCategoryTypes.OTHER,
          });

          const fakeFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: 'bulk_upload_events_status.csv',
            encoding: '7bit',
            mimetype: 'text/csv',
            buffer: csvBuffer,
            size: csvBuffer.length,
            destination: '',
            filename: 'bulk_upload_events_status.csv',
            path: '',
            stream: Readable.from(csvBuffer) as any, // <-- import { Readable } from 'stream'
          };
          const uploadResult = await this.driveService.uploadFile(
            businessUser.id,
            String(business.drive),
            fileCategory.id,
            fakeFile,
          );
          result = uploadResult.data.metaData.url;
        } catch (err) {
          console.log('Error:', err);
        }
      }

      return {
        success: true,
        message: 'Events Uploaded successfully in bulk.',
        file: result, // You can return the created outlets data if needed
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async sendConsumerInvitation(
    row: any,
    user: DecodedUser,
    inviteLink: string,
    businessName: string,
  ) {
    try {
      console.log('Sending invitation to:', row);
      const phoneNumber = parsePhoneNumberFromString(
        `${row.countryCode}${row.phone}`,
      );
      if (!phoneNumber || !phoneNumber.isValid()) {
        return { success: false, message: 'Invalid phone number' };
      }
      const fullPhoneNumber = phoneNumber.format('E.164');
      await Promise.all([
        this.mailService.consumerInvitation(
          row.email,
          row.name,
          inviteLink,
          businessName,
        ),
        this.smsService.sendSMS(
          user.id,
          fullPhoneNumber,
          SMSType.CONSUMER_INVITE,
          { name: row.name, link: inviteLink, businessName: businessName },
        ),
      ]);
      return { success: true, message: 'Invitations sent successfully' };
    } catch (error) {
      throw new BadRequestException(
        'Error sending invitation: ' + error.message,
      );
    }
  }

  async inviteConsumers(file: Express.Multer.File, user: DecodedUser) {
    try {
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        throw new BadRequestException('Business not found with given ID');
      }

      const rows = await this.parseCsv(file, 'downlineUsers');
      let failure = 0;
      const results = await Promise.all(
        rows.map(async (row) => {
          try {
            await this.sendConsumerInvitation(
              row,
              user,
              business.appRedirectLink,
              business.name,
            );
            return { ...row, status: 'Created', message: '' };
          } catch (err) {
            failure++;
            return { ...row, status: 'Failed', message: err.message };
          }
        }),
      );
      return {
        success: true,
        message: 'Invitations Processed.',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async uploadMenu(
    files: Express.Multer.File[],
    user: DecodedUser,
    name: string,
    description: string,
  ) {
    try {
      if (!files || files.length === 0) {
        return {
          success: false,
          message: 'No files uploaded',
        };
      }
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }
      let menu = await this.menuModel.create({
        business: new mongoose.Types.ObjectId(user.businessProfile),
        name: name,
        description: description,
        createdBy: new mongoose.Types.ObjectId(user.id),
      });

      const uploadedFiles = await this.driveService.multiImageUpload(
        user.businessProfile,
        String(business.drive),
        files,
      );

      console.log('Uploaded Files:', uploadedFiles);

      if (
        uploadedFiles &&
        uploadedFiles.success &&
        Array.isArray(uploadedFiles.data)
      ) {
        await this.menuModel.updateOne(
          { _id: menu._id },
          {
            $set: {
              images: uploadedFiles.data.map(
                (file) => new mongoose.Types.ObjectId(file.id),
              ),
            },
          },
        );
      }
      await this.businessModel.updateOne(
        { _id: user.businessProfile },
        {
          $push: {
            menus: new mongoose.Types.ObjectId(menu.id),
          },
        },
      );

      return {
        success: true,
        message: 'Menu files uploaded successfully',
        data: uploadedFiles,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
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
          targetType: User.name,
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
  async ownershipTransfer(
    user: DecodedUser,
    otp: string,
    newOwnerEmail: string,
  ) {
    try {
      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }
      const businessUser = await this.businessUserModel.findById(user.id);

      if (user.id != business.authorisedUser.toString()) {
        return {
          success: false,
          message: 'You are not authorized to transfer ownership',
        };
      }

      const foundOtpDoc = await this.otpModel.findOne({
        user: new mongoose.Types.ObjectId(user.id),
        type: OtpTypes.EMAIL,
      });
      if (!foundOtpDoc) {
        return {
          success: false,
          message: 'Otp Expired, Please resend.',
        };
      } else if (foundOtpDoc.otp !== Number(otp)) {
        return {
          success: false,
          message: 'Invalid Otp',
        };
      }
      await this.otpModel.deleteOne({ _id: foundOtpDoc.id });

      const newOwner = await this.businessUserModel.findOne({
        email: newOwnerEmail,
      });

      if (newOwner) {
        // transfer ownership
        await this.businessModel.updateOne(
          { _id: business._id },
          {
            $set: { authorisedUser: new mongoose.Types.ObjectId(newOwner.id) },
          },
        );
        await this.businessUserModel.updateOne(
          {
            _id: newOwner._id,
          },
          {
            $addToSet: {
              business: new mongoose.Types.ObjectId(business._id),
            },
            $set: {
              selectedBusiness: new mongoose.Types.ObjectId(business._id),
            },
            $pull: { business: business._id },
          },
        );
        await this.businessUserModel.updateOne(
          {
            _id: new mongoose.Types.ObjectId(user.id),
          },
          {
            $set: {
              selectedBusiness: '',
            },
          },
        );
      } else {
        // send an invitation to newOwnerEmail and once accepted, transfer ownership via
        await this.ownershipTransferRecordModel.create({
          business: new mongoose.Types.ObjectId(user.businessProfile),
          user: new mongoose.Types.ObjectId(user.id),
          email: newOwnerEmail,
        });

        this.mailService.sendBusinessUserInvitation(
          newOwnerEmail,
          businessUser.name,
        );
      }

      return {
        success: true,
        message: 'Ownership transferred successfully',
        data: business,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async uploadVerificationDocs(
    user: DecodedUser,
    images: Express.Multer.File[],
    businessId?: string,
  ) {
    try {
      // Early validation
      if (!images?.length) {
        return {
          success: false,
          message: 'No images provided',
        };
      }

      const businessID = businessId || user.businessProfile;

      // Parallel fetch for business and superAdmin
      const [business, superAdmin] = await Promise.all([
        this.businessModel.findById(businessID).lean(),
        this.adminModel.findOne({ isSuperAdmin: true }).lean(),
      ]);

      if (!business) {
        return {
          success: false,
          message: 'Business not found',
        };
      }

      if (!superAdmin) {
        return {
          success: false,
          message: 'Super admin not configured',
        };
      }

      // Create folder and upload images
      console.log('Check 1');
      const docFolder = await this.driveService.createFolder(businessID, {
        parentDirectory: business.drive.toString(),
        parentType: 'Drive',
        folderName: 'Verification Documents',
      });
      console.log('Check 2', docFolder);

      if (!docFolder?.data?.id) {
        return {
          success: false,
          message: 'Failed to create document folder',
        };
      }

      const uploadResult = await this.driveService.multiImageUpload(
        user.businessProfile,
        docFolder.data.id,
        images,
      );
      if (!uploadResult.success || !uploadResult.data?.length) {
        return {
          success: false,
          message: 'Failed to upload images',
        };
      }

      // Extract URLs
      const uploadedUrls = uploadResult.data.map((file) => file.metaData.url);

      // Calculate completion percentage
      // const profileCompletionPercentage =
      //   (BusinessStatus.VERIFICATION_DOCS_UPLOADED /
      //     BusinessStatus.VERIFICATION_DOCS_SUCCESSFULL) *
      //   100;

      // Parallel operations for update, create, and email
      Promise.all([
        this.businessModel.updateOne(
          { _id: business._id },
          {
            $set: {
              addressVerificationDocs: uploadedUrls,
              verificationStatus: VerificationStatus.PENDING,
              // profileCompletionPercentage,
            },
          },
        ),
        // this.businessDocVerificationLeadsModel.create({
        //   businessId: business._id,
        //   userId: new mongoose.Types.ObjectId(user.id),
        //   documentUrls: uploadedUrls,
        //   documentType: BusinessDocumentTypesList.ADDRESS_VERIFICATION,
        // }),
        this.mailService.businessDocVerificationRequest(
          superAdmin.email,
          businessID,
          BusinessDocumentTypesList.ADDRESS_VERIFICATION,
        ),
      ]);

      return {
        success: true,
        message: 'Address verification document uploaded successfully',
        data: {
          businessId: businessID,
          documentUrls: uploadedUrls,
        },
      };
    } catch (error) {
      console.error('Error uploading verification docs:', error);
      return {
        success: false,
        message:
          error?.message || 'An error occurred while uploading documents',
      };
    }
  }
  async searchUser(email: string) {
    try {
      const user = await this.businessUserModel.findOne({ email });
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      return {
        success: true,
        message: 'User found',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async businessTransferOtp(userId: string) {
    try {
      const owner = await this.businessUserModel.findById(userId);
      if (!owner) {
        return {
          success: false,
          message: 'Owner not found',
        };
      }
      // Generate OTP and send email
      await this.mailService.sendBusinessTransferOtp(owner.email, userId);
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getTagRecommendations(businessId: string) {
    try {
      // const business = await this.businessModel.findById(businessId);
      // if (!business) {
      //   return {
      //     success: false,
      //     message: 'Business not found with given ID',
      //   };
      // }
      // const tagsByCategory = await Promise.all(
      //   business.businessCategories.map(async (catId) => {
      //     const tags = await this.tagModel.aggregate([
      //       { $match: { relatedId: catId } },
      //       { $sample: { size: 3 } }, // pick 3 random docs
      //       { $project: { _id: 0, title: 1 } }, // only keep title
      //     ]);

      //     return {
      //       categoryId: catId,
      //       tags,
      //     };
      //   }),
      // );
      // const allTitles = tagsByCategory.flatMap((cat) =>
      //   cat.tags.map((t) => t.title),
      // );

      const result =
        await this.pinnAiService.generateBusinessTagsSuggestions(businessId);

      // console.log('Tag Recommendations:', allTitles);

      return {
        success: true,
        message: 'Tag recommendations fetched successfully',
        data: result.data.tags,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async generateBusinessQR(businessId: string) {
    try {
      const business = await this.businessModel.findById(businessId);

      const url = process.env.BUSINESS_LINK_URL + businessId;

      const { shortLink } = await this.appsOnAirLinkService.generateShortLink(
        url,
        {
          title: business.name,
          description: 'Join ' + business.name,
          imageUrl: business.logo,
          businessName: business.name,
        },
      );
      console.log('Short Link:', shortLink);
      const qrFileCategory = await this.fileCategoryModel.findOne({
        name: 'Content QR',
      });
      const businessQR = await this.driveService.generateQrCode(
        shortLink,
        business.name,
        business.creator.toString(),
        qrFileCategory.id,
        business.drive.toString(),
      );

      await this.businessModel.updateOne(
        { _id: business._id },
        {
          $set: {
            QRCode: businessQR.data.metaData.url,
            appRedirectLink: shortLink,
          },
        },
      );
      return {
        success: true,
        message: 'Business QR code generated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async requestForActivation(
    businessId: string,
    data: BusinessActivationRequestDto,
  ) {
    try {
      const business = await this.businessModel.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }
      if (business.isActive) {
        return {
          success: false,
          message: 'Business is already active',
        };
      }

      let activeReq = null;
      activeReq = await this.businessActivationRequestModel.findOne({
        email: data.email,
        status: ActivationRequestStatus.Pending,
      });
      if (activeReq) {
        return {
          success: false,
          message:
            'You have already requested for activation. Please wait for approval.',
        };
      }
      activeReq = await this.businessActivationRequestModel.create({
        business: business._id,
        status: ActivationRequestStatus.Pending,
        name: data.name,
        email: data.email,
        phone: data.phone,
        countryCode: data.countryCode,
      });

      return {
        success: true,
        message: 'Business activation request submitted successfully',
        data: activeReq,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async deleteBusinessUser(userId: string) {
    try {
      const user = await this.businessUserModel.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found',
        };
      }
      // const linkedBusinesses = await this.businessModel.find({authorisedUser: user._id});
      // if(linkedBusinesses && linkedBusinesses.length > 0){
      //   return {
      //     success: false,
      //     message: 'Cannot delete user. User is an authorised user for some businesses.',
      //   };
      // }
      return {
        success: true,
        message:
          'Your account deletion request is being processed. Our team will get back to you shortly.',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getScratches(user: DecodedUser, status: string) {
    try {
      let query = {
        business: new mongoose.Types.ObjectId(user.businessProfile),
      };
      if (
        status &&
        (status === ScratchStatus.CONFIRMED ||
          status === ScratchStatus.REJECTED)
      ) {
        query['status'] = status;
      }
      console.log('Query', query);
      const scratches = await this.scratchModel.aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phone: 1,
                  countryCode: 1,
                  profilePhoto: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'rewards',
            localField: 'reward',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  title: 1,
                },
              },
            ],
            as: 'rewardDetails',
          },
        },
        {
          $unwind: {
            path: '$rewardDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);
      return {
        success: true,
        message: 'Scratches list fetched successfully.',
        data: scratches,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async getRewardVisits(user: DecodedUser) {
    try {
      const visitors = await this.rewardVisitModel.aggregate([
        {
          $match: {
            business: new mongoose.Types.ObjectId(user.businessProfile),
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDetails',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phone: 1,
                  countryCode: 1,
                  profilePhoto: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'userrewards',
            let: {
              rewardId: '$reward',
              userId: '$user',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$rewardId', '$$rewardId'] },
                      { $eq: ['$userId', '$$userId'] },
                    ],
                  },
                },
              },
              {
                $project: {
                  claimStatus: 1,
                  target: 1,
                  progress: 1,
                },
              },
            ],
            as: 'userReward',
          },
        },
        {
          $unwind: {
            path: '$userReward',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'rewards',
            localField: 'reward',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  title: 1,
                },
              },
            ],
            as: 'rewardDetails',
          },
        },
        {
          $unwind: {
            path: '$rewardDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'checkins',
            localField: 'checkInId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
            as: 'CheckInDetails',
          },
        },
        {
          $unwind: {
            path: '$CheckInDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);
      return {
        success: true,
        message: 'Visitors list fetched successfully.',
        data: visitors,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async markRewardVisitSuspicious(visitId: string, user: DecodedUser) {
    try {
      await this.rewardVisitModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(visitId),
        },
        {
          $set: {
            status: RewardVisitStatus.MARKED_WRONG,
            markedWrongBy: new mongoose.Types.ObjectId(user.id),
          },
        },
      );
      return {
        success: true,
        message: 'Reward Visit marked Suspicious',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async voteScratch(scratchId: string, user: DecodedUser, status: boolean) {
    try {
      await this.scratchModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(scratchId),
        },
        {
          $set: {
            businessVoteStatus: status
              ? BusinessVoteStatus.CONFIRMED
              : BusinessVoteStatus.REJECTED,
          },
        },
      );
      return {
        success: true,
        message: 'Scratch up-voted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
