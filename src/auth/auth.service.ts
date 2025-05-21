import { Injectable, Logger } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { SignupMethod, User, UserDocument } from 'src/user/models/user.model';
import mongoose, { Model } from 'mongoose';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import {
  BusinessPopulates,
  CategoryPopulates,
  LocationPopulates,
  UserPopulates,
} from 'src/enums/user.enum';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { UserService } from 'src/user/user.service';
import { OtpTypes, SMSType, TokenTypes, UserTypes } from 'src/enums/auth.enums';
import { ResendOtpDto } from './dto/resendOtp.dto';
import { ResetPaswordDto } from './dto/resetPass.dto';
import { GuestLoginDto } from './dto/guestLogin.dto';
import {
  GuestSession,
  GuestSessionDocument,
} from './models/guestSession.model';
import { JwtPayload } from './interfaces/tokenPayload.interface';
import { DecodedUser } from './interfaces/decodedUser.interface';
import { Token, TokenDocument } from './models/token.model';
import { Refferal, RefferalDocument } from 'src/user/models/refferal.model';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';
import {
  EventLocation,
  EventLocationDocument,
} from 'src/event/models/eventLocation.model';
import { EventStatus, EventTypes } from 'src/enums/event.enums';
import { Category, CategoryDocument } from 'src/models/contentCategory.model';
import { Auth, google } from 'googleapis';
import { OAuth2Dto } from './dto/oAuth2.dto';
import { Otp, OtpDocument } from './models/otp.model';
import { Event, EventDocument } from 'src/event/models/event.model';
import { S3Service } from 'src/s3.service';
import { Follow, FollowDocument } from 'src/user/models/follow.model';
import * as nodeSchedule from 'node-schedule';
import {
  currentDateTz,
  getStringBodyDateTz,
  getStringDateCurrentTz,
  getStringDateTz,
  getZeroBodyDateTz,
  getZeroDateTz,
  haversineDistance,
} from 'src/helpers/event.helpers';
import { StripeService } from 'src/stripe/stripe.service';
import { AgeGroup, AgeGroupDocument } from 'src/models/ageGroup.model';
import { GetDashboardDto } from './dto/getDashboard.dto';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import {
  EventResponse,
  EventResponseDocument,
} from 'src/event/models/event-response.model';
import { ConfigureDashboardDto } from './dto/configureDashboard.dto';
import {
  DashboardConfig,
  DashboardConfigDocument,
} from './models/dashboardConfig.model';
import { UpdateConfigureDashboardDto } from './dto/updateDashConfig.dto';
import { RefreshFcmDto } from './dto/refreshFcm.dto';
import { Workbook } from 'exceljs';
import {
  PlatformConfig,
  PlatformConfigDocument,
} from './models/platformConfig.model';
import { PlatformConfigDto } from './dto/platformConfig.dto';
import { SignupAuthDto } from './dto/signup-auth.dto';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { PersonDetailDto } from './dto/personalDetail.dto';
import { SmsService } from 'src/sms/sms.service';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { SeederService } from 'src/seeder/seeder.service';
import { Roles } from 'src/roles/enums/roles.enum';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import { Outlet } from 'src/outlet/model/outlet.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { BusinessIndustry } from 'src/business/model/businessIndustry.model';
import {
  EventSchedule,
  EventScheduleDocument,
  ScheduleTypes,
} from 'src/event/models/event-schedule.model';

@Injectable()
export class AuthService {
  private oAuth2Client: Auth.OAuth2Client;
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(GuestSession.name)
    private readonly guestSessionModel: Model<GuestSessionDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    @InjectModel(Refferal.name)
    private readonly refferalModel: Model<RefferalDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(EventLocation.name)
    private readonly eventLocationModel: Model<EventLocationDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(AgeGroup.name)
    private readonly ageGroupModel: Model<AgeGroupDocument>,
    @InjectModel(EventResponse.name)
    private readonly eventResponseModel: Model<EventResponseDocument>,
    @InjectModel(DashboardConfig.name)
    private readonly dashboardConfigModel: Model<DashboardConfigDocument>,
    @InjectModel(PlatformConfig.name)
    private readonly platformConfigModel: Model<PlatformConfigDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(EventSchedule.name)
    private readonly eventScheduleModel: Model<EventScheduleDocument>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly s3Service: S3Service,
    private readonly stripeService: StripeService,
    private readonly smsService: SmsService,
    private readonly seederService: SeederService,
  ) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_SECRET;
    this.oAuth2Client = new google.auth.OAuth2(clientID, clientSecret);
  }

  async uploadPhoto(user: DecodedUser, image: Express.Multer.File) {
    if (!image) {
      return {
        success: false,
        message: 'Please provide an image',
      };
    }
    const uploadResult = await this.s3Service.s3_upload(
      image.buffer,
      process.env.AWS_S3_BUCKET_NAME,
      manipulateImageName(image.originalname),
      'image/jpeg',
    );
    return {
      success: true,
      message: 'Photo uploaded successfully',
      image: uploadResult.Location,
    };
  }

  async create(
    createAuthDto: CreateAuthDto,
    userAgent: string,
    ipAddress: string,
  ) {
    createAuthDto.email = createAuthDto.email.toLowerCase().trim();
    const foundUser = await this.userModel
      .findOne({ email: createAuthDto.email })
      .exec();
    if (foundUser) {
      return {
        success: false,
        message: 'User already exists',
      };
    } else {
      const role = await this.roleModel.findOne({ name: Roles.USER }).exec();
      const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);
      delete createAuthDto.password;
      const createdUser = await this.userModel.create({
        role: role._id,
        ...createAuthDto,
        password: hashedPassword,
        userAgent,
        ipAddress,
      });
      // Generate a random refferal code of 6 length with numbers and alphabets
      const refferalCode = await this.generateUniqueRefferalCode();
      const refferal = await this.refferalModel.create({
        user: createdUser._id,
        code: refferalCode,
      });
      await this.userModel.updateOne(
        { _id: new mongoose.Types.ObjectId(createdUser.id) },
        { $set: { refferal: refferal._id } },
      );
      await this.mailService.sendUserWelcomeMail(createdUser.id);
      await this.mailService.sendUserVerificationMail(createdUser.id);
      const user = await this.userService.getUserById(createdUser.id);
      const customer = await this.stripeService.createCustomer(
        createdUser.email,
        createdUser.name,
      );
      if (customer.id) {
        await this.userModel.updateOne(
          { _id: createdUser._id },
          { $set: { stripeCustomerId: customer.id } },
        );
      }
      if (createAuthDto.fcmToken) {
        await this.tokenModel.create({
          token: createAuthDto.fcmToken,
          type: TokenTypes.FCM,
          userType: UserTypes.USER,
          user: createdUser._id,
          deviceType: createAuthDto.deviceType
            ? createAuthDto.deviceType
            : 'web',
        });
      }
      const fcmExists = await this.tokenModel.exists({
        type: TokenTypes.FCM,
        userId: createdUser._id,
        deviceType: createAuthDto.deviceType ? createAuthDto.deviceType : 'web',
      });
      return {
        success: true,
        message: 'User created successfully',
        user,
        fcmExists: fcmExists ? true : false,
      };
    }
  }

  async signupOTP(
    signupAuthDto: SignupAuthDto,
    userAgent: string,
    ipAddress: string,
  ) {
    const { signupMethod, email, phone, countryCode } = signupAuthDto;

    if (!phone && !email) {
      return {
        success: false,
        message: 'Please provide email or phone number.',
      };
    }

    let createdUser;
    const role = await this.roleModel.findOne({ name: Roles.USER });
    if (signupMethod === SignupMethod.EMAIL) {
      const foundUser = await this.userModel.findOne({
        email: signupAuthDto.email,
      });
      if (foundUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      createdUser = await this.userModel.create({
        ...signupAuthDto,
        role: role._id,
        userAgent,
        ipAddress,
      });
      await this.mailService.sendUserWelcomeMail(createdUser.id);
      await this.mailService.sendUserVerificationMail(createdUser.id);
    } else if (signupMethod === SignupMethod.PHONE) {
      const phoneNumber = parsePhoneNumberFromString(`${countryCode}${phone}`);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return {
          success: false,
          message: 'Invalid phone number',
        };
      }
      let fullPhoneNumber = phoneNumber.format('E.164');
      const foundUser = await this.userModel.findOne({
        fullPhoneNumber: fullPhoneNumber,
      });
      if (foundUser) {
        return {
          success: false,
          message: 'User already exists with the given mobile number!',
        };
      } else {
        console.log('createAuthDto', signupAuthDto);
        createdUser = await this.userModel.create({
          ...signupAuthDto,
          fullPhoneNumber: fullPhoneNumber,
          role: role._id,
          userAgent,
          ipAddress,
        });

        await this.smsService.sendSMS(
          createdUser.id,
          fullPhoneNumber,
          SMSType.OTP,
        );
      }
    }
    const refferalCode = await this.generateUniqueRefferalCode();
    const refferal = await this.refferalModel.create({
      user: createdUser._id,
      code: refferalCode,
    });
    await this.userModel.updateOne(
      { _id: createdUser.id },
      { $set: { refferal: refferal._id } },
    );
    const customer = await this.stripeService.createCustomer(
      createdUser.email,
      createdUser.name,
    );
    if (customer.id) {
      await this.userModel.updateOne(
        { _id: createdUser._id },
        { $set: { stripeCustomerId: customer.id } },
      );
    }
    if (signupAuthDto.fcmToken) {
      await this.tokenModel.create({
        token: signupAuthDto.fcmToken,
        type: TokenTypes.FCM,
        userType: UserTypes.USER,
        user: createdUser._id,
        deviceType: signupAuthDto.deviceType ? signupAuthDto.deviceType : 'web',
      });
    }
    const fcmExists = await this.tokenModel.exists({
      type: TokenTypes.FCM,
      userId: createdUser._id,
      deviceType: signupAuthDto.deviceType ? signupAuthDto.deviceType : 'web',
    });
    const user = await this.userService.getUserById(createdUser.id);

    await this.seederService.createDrive(createdUser.id, User.name);
    return {
      success: true,
      message: 'User created successfully',
      user,
      fcmExists: fcmExists ? true : false,
    };
  }

  async updateContactDetails(
    updateAuthDto: UpdateAuthDto,
    id: string,
    userAgent: string,
    ipAddress: string,
  ) {
    const { email, phone, countryCode } = updateAuthDto;
    const foundUser = await this.userModel.findById(id, {
      isEmailVerified: 1,
      isPhoneVerified: 1,
    });
    if (!foundUser) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    if (foundUser.isEmailVerified && foundUser.isPhoneVerified) {
      return {
        success: false,
        message: 'Email and Mobile both already verified',
      };
    }
    if (foundUser.isPhoneVerified && !foundUser.isEmailVerified && !email) {
      return {
        success: false,
        message: 'Please Provide Email address to verify!',
      };
    }
    if (foundUser.isEmailVerified && !foundUser.isPhoneVerified) {
      if (!phone) {
        return {
          success: false,
          message: 'Please Provide mobile number to verify!',
        };
      }
      if (!countryCode) {
        return {
          success: false,
          message: 'Country Code is missing',
        };
      }
    }

    if (!foundUser.isEmailVerified && email) {
      const checkExistingEmail = await this.userModel.findOne({
        email,
      });

      if (checkExistingEmail) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      await this.userModel.updateOne(
        { _id: id },
        {
          $set: { email },
        },
      );
      await this.mailService.sendUserVerificationMail(id);
      return {
        success: true,
        message: 'Email saved successfully and OTP sent to verify it.',
      };
    }
    if (!foundUser.isPhoneVerified && phone && countryCode) {
      const phoneNumber = parsePhoneNumberFromString(`${countryCode}${phone}`);
      if (!phoneNumber || !phoneNumber.isValid()) {
        return {
          success: false,
          message: 'Invalid phone number',
        };
      }
      let fullPhoneNumber = phoneNumber.format('E.164');
      const checkExistingPhone = await this.userModel.findOne({
        fullPhoneNumber: fullPhoneNumber,
      });
      if (checkExistingPhone) {
        return {
          success: false,
          message: 'User already exists with the given mobile number!',
        };
      }
      await this.userModel.updateOne(
        { _id: id },
        {
          $set: {
            fullPhoneNumber: fullPhoneNumber,
            phone: phone,
            countryCode: countryCode,
          },
        },
      );
      //send mobile otp
      await this.smsService.sendSMS(id, fullPhoneNumber, SMSType.OTP);
      return {
        success: true,
        message: 'Phone Number saved successfully and OTP sent to verify it.',
      };
    }

    return {
      success: false,
      message: 'User cannot be updated successfully',
      // user,
      // fcmExists: fcmExists
    };
  }

  async updatePersonalDetails(
    personalDetailDTO: PersonDetailDto,
    id: string,
    userAgent: string,
    ipAddress: string,
  ) {
    console.log('personalDetailDTO::', personalDetailDTO);
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          ...personalDetailDTO,
        },
      },
    );

    return {
      success: true,
      message: 'User Personal Details updated successfully!',
    };
  }

  async verifyContactDetails(data: VerifyOtpDto) {
    const user = await this.userService.getUserById(data.user);
    if (!user) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    } else {
      const otpResult = await this.userService.validateOtp(data);
      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
        };
      } else {
        const updateObj =
          data.type == OtpTypes.EMAIL
            ? { isEmailVerified: true }
            : { isPhoneVerified: true };
        await this.userModel.updateOne(
          { _id: new mongoose.Types.ObjectId(data.user) },
          { $set: updateObj },
        );
        return {
          success: true,
          message: 'Otp verified successfully',
        };
      }
    }
  }

  async loginWithGoogle(data: OAuth2Dto, userAgent: string, ipAddress: string) {
    const validToken = await this.oAuth2Client.getTokenInfo(data.oAuthToken);

    // const ticket = await this.oAuth2Client.verifyIdToken({
    //   idToken: data.oAuthToken,
    //   // audience:
    //   //   '292637058686-gagsac0fra0t611e3o88qb2bhbber11d.apps.googleusercontent.com',
    // });

    // const payload = ticket.getPayload();
    const email = validToken.email;
    let user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      const role = await this.roleModel.findOne({ name: Roles.USER }).exec();
      let lastName = '';
      if (data.name) {
        const name = data.name.split(' ');
        lastName = name.length > 1 ? name[1] : '';
      }
      user = await this.userModel.create({
        role: role._id,
        firstName: data.name ? data.name.split(' ')[0] : '',
        lastName,
        profilePhoto: data.profilePhoto ? data.profilePhoto : '',
        email: validToken.email,
        isEmailVerified: true,
        isOAuth: true,
        oAuthProvider: 'google',
        userAgent,
        ipAddress,
      });
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.name,
      );
      if (customer.id) {
        user.stripeCustomerId = customer.id;
      }
      const refferalCode = await this.generateUniqueRefferalCode();
      const refferal = await this.refferalModel.create({
        user: user._id,
        code: refferalCode,
      });
      user.refferal = refferal._id as any;
      await user.save();
      // const jwtPayload: JwtPayload = {
      //   id: user.id,
      //   email: user.email,
      //   role: Roles.USER,
      // };
      // const token = await this.generateJWT(jwtPayload);
      // return {
      //   success: true,
      //   message: 'User information from google',
      //   user: user,
      //   token,
      // };
    } else {
      if (!user.stripeCustomerId) {
        const customer = await this.stripeService.createCustomer(
          user.email,
          user.name,
        );
        if (customer.id) {
          user.stripeCustomerId = customer.id;
          await user.save();
        }
      }
    }
    const jwtPayload: JwtPayload = {
      id: user.id,
      role: user.role.toString(),
      userType: UserTypes.USER,
    };
    const token = await this.generateJWT(
      jwtPayload,
      TokenTypes.ACCESS,
      UserTypes.USER,
    );
    if (data.fcmToken) {
      const foundFcmToken = await this.tokenModel.findOneAndUpdate(
        {
          type: TokenTypes.FCM,
          userId: user._id,
          deviceType: data.deviceType ? data.deviceType : 'web',
        },
        {
          $set: {
            token: data.fcmToken,
          },
        },
      );
      if (!foundFcmToken) {
        await this.tokenModel.create({
          token: data.fcmToken,
          type: TokenTypes.FCM,
          userType: UserTypes.USER,
          user: user._id,
          deviceType: data.deviceType ? data.deviceType : 'web',
        });
      }
    }
    const updatedUser = await this.userService.getUserById(user.id);
    return {
      success: true,
      message: 'User logged in successfully',
      user: updatedUser,
      token,
    };
  }

  async loginWithApple(data: OAuth2Dto, userAgent: string, ipAddress: string) {
    // let email,
    //   firstName,
    //   lastName = '';

    // const decodedObj = await this.jwtService.decode(data.oAuthToken);
    // if (decodedObj) {
    //   email = decodedObj['email'];
    //   firstName = decodedObj['firstName'];
    //   lastName = decodedObj['lastName'];
    // }
    let user = await this.userModel
      .findOne({ email: data.email })
      .populate('role', '_id name')
      .exec();
    if (!user) {
      const role = await this.roleModel.findOne({ name: Roles.USER }).exec();
      user = await this.userModel.create({
        role: role._id,
        firstName: data.name ? data.name.split(' ')[0] : '',
        lastName: data.name ? data.name.split(' ')[1] : '',
        profilePhoto: data.profilePhoto ? data.profilePhoto : '',
        email: data.email,
        isEmailVerified: true,
        isOAuth: true,
        oAuthProvider: 'apple',
        userAgent,
        ipAddress,
      });
      const refferalCode = await this.generateUniqueRefferalCode();
      const refferal = await this.refferalModel.create({
        user: user._id,
        code: refferalCode,
      });
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.name,
      );
      if (customer.id) {
        user.stripeCustomerId = customer.id;
      }
      user.refferal = refferal._id as any;
      await user.save();
      const jwtPayload: JwtPayload = {
        id: user.id,
        userType: UserTypes.USER,
        role: Roles.USER,
      };
      const token = await this.generateJWT(
        jwtPayload,
        TokenTypes.ACCESS,
        UserTypes.USER,
      );
      return {
        success: true,
        message: 'User information from apple',
        user: user,
        token,
      };
    } else {
      if (!user.stripeCustomerId) {
        const customer = await this.stripeService.createCustomer(
          user.email,
          user.name,
        );
        if (customer.id) {
          user.stripeCustomerId = customer.id;
          await user.save();
        }
      }
      const jwtPayload: JwtPayload = {
        id: user.id,
        userType: UserTypes.USER,
        role: user.role.toString(),
      };
      const token = await this.generateJWT(
        jwtPayload,
        TokenTypes.ACCESS,
        UserTypes.USER,
      );
      if (data.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            userId: user._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          },
          {
            $set: {
              token: data.fcmToken,
            },
          },
        );
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: data.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.USER,
            user: user._id,
            deviceType: data.deviceType ? data.deviceType : 'web',
          });
        }
      }
      const updatedUser = await this.userService.getUserById(user.id);
      return {
        success: true,
        message: 'User logged in successfully',
        user: updatedUser,
        token,
      };
    }
  }

  async continueWithFacebook(body: any) {
    const userFound = await this.userModel
      .findOne({ email: body.email })
      .exec();
    if (!userFound) {
      const user = await this.userModel.create({
        firstName: body.firstName,
        lastName: body.lastName,
        profilePhoto: body.picture,
        email: body.email,
        isOAuth: true,
        oAuthProvider: 'facebook',
      });
      return {
        success: true,
        message: 'User information from facebook',
        user: user,
      };
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      return {
        success: false,
        message: 'User not found with the email provided.',
      };
    } else {
      await this.mailService.sendForgotPasswordMail(user.id);
      return {
        success: true,
        id: user.id,
        message: 'Otp sent successfully',
      };
    }
  }

  async resetPassword(data: ResetPaswordDto) {
    const user = await this.userModel.findById(data.id).exec();
    if (!user) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    } else {
      const otpResult = await this.userService.validateOtp({
        user: user.id,
        type: OtpTypes.EMAIL,
        otp: data.otp,
      });
      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
        };
      } else {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        await this.userModel.updateOne(
          { _id: new mongoose.Types.ObjectId(data.id) },
          { $set: { password: hashedPassword } },
        );
        return {
          success: true,
          message: 'Password reset successfully',
        };
      }
    }
  }

  async refreshToken(user: DecodedUser) {
    const foundUser = await this.userService.getUserById(user.id);
    if (!foundUser) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    } else {
      if (user.isBusiness) {
        const businessProfile = await this.businessProfileModel.findById(
          user.businessProfile,
        );
        if (!businessProfile) {
          return {
            success: false,
            message: 'Business profile not found with the id provided.',
          };
        }
        const payload: JwtPayload = {
          id: user.id,
          userType: UserTypes.BUSINESS,
          business: businessProfile.id.toString(),
          role: user.role,
        };
        const token = await this.generateJWT(
          payload,
          TokenTypes.ACCESS,
          UserTypes.USER,
        );
        return {
          success: true,
          message: 'Token refreshed successfully',
          token,
        };
      } else {
        const payload: JwtPayload = {
          id: user.id,
          // email: user.email,
          userType: UserTypes.USER,
          role: Roles.USER,
        };
        const token = await this.generateJWT(
          payload,
          TokenTypes.ACCESS,
          UserTypes.USER,
        );
        return {
          success: true,
          message: 'Token refreshed successfully',
          token,
        };
      }
    }
  }

  async refreshFcmToken(userId: string, data: RefreshFcmDto) {
    const foundUser = await this.userModel.findById(userId);
    if (!foundUser) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    }
    const fcmTokenExists = await this.tokenModel.find({
      userId: foundUser._id,
      type: TokenTypes.FCM,
      deviceType: data.deviceType,
    });
    if (!fcmTokenExists.length) {
      await this.tokenModel.create({
        token: data.token,
        type: TokenTypes.FCM,
        userType: UserTypes.USER,
        user: foundUser._id,
        deviceType: data.deviceType,
      });
    } else {
      await this.tokenModel.updateMany(
        {
          userId: foundUser._id,
          type: TokenTypes.FCM,
          deviceType: data.deviceType,
        },
        { $set: { token: data.token } },
      );
    }
    return {
      success: true,
      message: 'Fcm token refreshed successfully',
      token: data.token,
    };
  }

  async login(loginDto: LoginDto) {
    const validatedUser = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (validatedUser.success) {
      const user = validatedUser.user;
      if (!user.isEmailVerified) {
        await this.mailService.sendUserVerificationMail(user.id);
        return {
          success: true,
          user: user.id,
          message:
            'Please verify your email to login, otp has been sent to the registered mail.',
        };
      }
      if (loginDto.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            userId: user._id,
            deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
          },
          {
            $set: {
              token: loginDto.fcmToken,
            },
          },
        );
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: loginDto.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.USER,
            user: user._id,
            deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
          });
        }
      }
      const payload: JwtPayload = {
        id: user.id,
        // email: user.email,
        userType: UserTypes.USER,
        role: Roles.USER,
      };
      const token = await this.generateJWT(
        payload,
        TokenTypes.ACCESS,
        UserTypes.USER,
      );
      const updatedUser = await this.userModel
        .findByIdAndUpdate(user.id, {
          $set: { isDeleted: false },
        })
        .populate('role', '_id name');
      if (!user.stripeCustomerId) {
        const customer = await this.stripeService.createCustomer(
          user.email,
          user.name,
        );
        if (customer.id) {
          user.stripeCustomerId = customer.id;
          await user.save();
        }
      }
      const fcmExists = await this.tokenModel.exists({
        type: TokenTypes.FCM,
        userId: user._id,
        deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
      });
      return {
        success: true,
        message: 'User logged in successfully',
        user: updatedUser,
        token,
        fcmExists: fcmExists ? true : false,
      };
    } else {
      return {
        success: false,
        message: validatedUser.message,
      };
    }
  }

  async loginOTP(
    loginDto: SignupAuthDto,
    userAgent: string,
    ipAddress: string,
  ) {
    try {
      const { email, phone, countryCode, signupMethod } = loginDto;
      let foundUser;
      if (!email && !phone) {
        return {
          success: false,
          message: 'Please provide email or phone number.',
        };
      }
      if (signupMethod === SignupMethod.PHONE) {
        if (!phone) {
          return {
            success: false,
            message: 'Please provide phone number',
          };
        }
        if (!countryCode) {
          return {
            success: false,
            message: 'Please provide your Country Code',
          };
        }
        const phoneNumber = parsePhoneNumberFromString(
          `${countryCode}${phone}`,
        );
        if (!phoneNumber || !phoneNumber.isValid()) {
          return {
            success: false,
            message: 'Invalid phone number',
          };
        }
        let fullPhoneNumber = phoneNumber.format('E.164');
        foundUser = await this.userModel.findOne({
          fullPhoneNumber: fullPhoneNumber,
        });
        if (!foundUser) {
          return {
            success: false,
            message: 'User not found!',
          };
        } else {
          //send mobile otp:::
          await this.smsService.sendSMS(
            foundUser.id,
            fullPhoneNumber,
            SMSType.OTP,
          );
        }
      } else if (signupMethod === SignupMethod.EMAIL) {
        foundUser = await this.userModel.findOne({
          email: loginDto.email,
        });
        if (!foundUser) {
          return {
            success: false,
            message: 'User not found!',
          };
        }
        await this.mailService.sendUserVerificationMail(foundUser.id);
      }
      await foundUser.updateOne(
        { _id: foundUser.id },
        { $set: { userAgent, ipAddress } },
      );
      if (loginDto.fcmToken) {
        const foundFcmToken = await this.tokenModel.findOneAndUpdate(
          {
            type: TokenTypes.FCM,
            userId: foundUser._id,
            deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
          },
          {
            $set: {
              token: loginDto.fcmToken,
            },
          },
        );
        if (!foundFcmToken) {
          await this.tokenModel.create({
            token: loginDto.fcmToken,
            type: TokenTypes.FCM,
            userType: UserTypes.USER,
            user: foundUser._id,
            deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
          });
        }
      }
      if (!foundUser.stripeCustomerId) {
        const customer = await this.stripeService.createCustomer(
          foundUser.email,
          foundUser.name,
        );
        if (customer.id) {
          foundUser.stripeCustomerId = customer.id;
          await this.userModel.updateOne(
            { _id: foundUser.id },
            { $set: { stripeCustomerId: customer.id } },
          );
        }
      }
      return {
        success: true,
        user: foundUser.id,
        message: `OTP has been sent to your registered ${email ? 'Email' : 'Mobile Number'}.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async adminLogin(loginDto: LoginDto) {
    const role = await this.roleModel.findOne({ name: Roles.ADMIN }).exec();
    const foundAdmin = await this.userModel.findOne({
      email: loginDto.email,
      role: role._id,
    });
    if (!foundAdmin) {
      return {
        success: false,
        message: 'Admin not found with the email provided.',
      };
    } else {
      const validPassword = await bcrypt.compare(
        loginDto.password,
        foundAdmin.password,
      );
      if (!validPassword) {
        return {
          success: false,
          message: 'Incorrect password',
        };
      }
      const payload: JwtPayload = {
        id: foundAdmin.id,
        userType: UserTypes.ADMIN,
        role: Roles.ADMIN,
      };
      const token = await this.generateJWT(
        payload,
        TokenTypes.ACCESS,
        UserTypes.ADMIN,
      );
      return {
        success: true,
        message: 'Admin logged in successfully',
        user: foundAdmin,
        token,
      };
    }
  }

  async adminLoginV2(loginDto: LoginDto) {
    const admin = await this.adminModel.findOne({
      email: loginDto.email,
    });
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found with the email provided.',
      };
    } else {
      const validPassword = await bcrypt.compare(
        loginDto.password,
        admin.password,
      );
      if (!validPassword) {
        return {
          success: false,
          message: 'Incorrect password',
        };
      }
      const payload: JwtPayload = {
        id: admin.id,
        userType: UserTypes.ADMIN,
        role: admin.role.toString(),
      };
      const token = await this.generateJWT(
        payload,
        TokenTypes.ACCESS,
        UserTypes.ADMIN,
      );
      return {
        success: true,
        message: 'Admin logged in successfully',
        user: admin,
        token,
      };
    }
  }

  async fcmReport() {
    const users = await this.userModel.find({
      createdAt: { $lte: new Date('2024-11-24') },
    });
    //Fetch fcm tokens for those users
    const fcmTokens = await this.tokenModel
      .find({
        type: TokenTypes.FCM,
        userId: { $in: users.map((user) => user._id) },
      })
      .populate('user', 'email name');
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('User Fcm Report');
    worksheet.columns = [
      {
        header: 'S.No',
        key: 'sno',
        width: 10,
      },
      {
        header: 'User ID',
        key: '_id',
        width: 50,
      },
      {
        header: 'Name',
        key: 'name',
        width: 20,
      },
      {
        header: 'Email',
        key: 'email',
        width: 40,
      },
    ];
    for (let i = 0; i < fcmTokens.length; i++) {
      worksheet.addRow({
        sno: i + 1,
        _id: fcmTokens[i].user['_id'],
        name: fcmTokens[i].user['name'],
        email: fcmTokens[i].user['email'],
      });
    }
    const fileBuffer = await workbook.xlsx.writeBuffer();
    await this.mailService.sendUserReports(
      users.length,
      fcmTokens.length,
      fileBuffer,
    );
  }

  async addDashboardConfiguration(data: ConfigureDashboardDto) {
    if (data.categories.length) {
      for (let i = 0; i < data.categories.length; i++) {
        const foundCategory = await this.categoryModel
          .findById(data.categories[i])
          .exec();
        if (!foundCategory) {
          return {
            message: `Category not found with the id provided: ${data.categories[i]}`,
          };
        } else {
          data.categories[i] = foundCategory._id;
        }
      }
    }
    const createdConfiguration = await this.dashboardConfigModel.create(data);
    return {
      success: true,
      message: 'Dashboard configuration added successfully',
      data: createdConfiguration,
    };
  }

  async getDashboardConfig() {
    const foundConfig = await this.dashboardConfigModel
      .find()
      .populate('categories', '_id name')
      .sort({ sortOrder: 1 });
    if (!foundConfig) {
      return {
        success: false,
        message: 'Dashboard configuration not found with the name provided.',
      };
    } else {
      return {
        success: true,
        message: 'Dashboard configuration found successfully',
        data: foundConfig,
      };
    }
  }

  async getDashboardAllConfigs() {
    const foundConfig = await this.dashboardConfigModel
      .find({}, { _id: 1, name: 1 })
      .sort({ sortOrder: 1 });
    if (!foundConfig) {
      return {
        success: false,
        message: 'Dashboard configuration not found with the name provided.',
      };
    } else {
      return {
        success: true,
        message: 'Dashboard configuration found successfully',
        data: foundConfig,
      };
    }
  }

  async updateDashboardConfiguration(
    id: string,
    data: UpdateConfigureDashboardDto,
  ) {
    const configExists = await this.dashboardConfigModel.exists({
      _id: new mongoose.Types.ObjectId(id),
    });
    if (!configExists) {
      return {
        success: false,
        message: 'Dashboard configuration not found with the id provided.',
      };
    } else {
      if (data.categories && data.categories.length) {
        data.categories = data.categories.map(
          (category) => new mongoose.Types.ObjectId(category),
        );
      }
      const updatedConfiguration =
        await this.dashboardConfigModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: data },
          { new: true },
        );
      if (updatedConfiguration) {
        return {
          success: true,
          message: 'Dashboard configuration updated successfully',
          data: updatedConfiguration,
        };
      } else {
        return {
          success: false,
          message: 'Error updating dashboard configuration',
        };
      }
    }
  }

  async deleteDashboardConfiguration(id: string) {
    const configExists = await this.dashboardConfigModel.exists({
      _id: new mongoose.Types.ObjectId(id),
    });
    if (!configExists) {
      return {
        success: false,
        message: 'Dashboard configuration not found with the id provided.',
      };
    } else {
      await this.dashboardConfigModel.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Dashboard configuration deleted successfully',
      };
    }
  }

  async getDashboardWeight() {
    const foundConfig = await this.platformConfigModel.findOne();
    if (!foundConfig) {
      return {
        success: false,
        message: 'Platform configuration not found',
      };
    } else {
      if (!foundConfig.distanceWeightage || !foundConfig.timeWeightage) {
        return {
          success: false,
          message: 'Dashboard weightage not found',
        };
      }
      return {
        success: true,
        message: 'Dashboard weightage found successfully',
        data: {
          distanceWeightage: foundConfig.distanceWeightage,
          timeWeightage: foundConfig.timeWeightage,
        },
      };
    }
  }

  async editDashboardWeight(data: PlatformConfigDto) {
    const foundConfig = await this.platformConfigModel.findOne();
    if (!foundConfig) {
      return {
        success: false,
        message: 'Platform configuration not found',
      };
    } else {
      if (!data.distanceWeightage || !data.timeWeightage) {
        return {
          success: false,
          message: 'Dashboard weightage not found',
        };
      }
      const updatedData = await this.platformConfigModel.findOneAndUpdate(
        {},
        { $set: data },
        { new: true },
      );
      return {
        success: true,
        message: 'Dashboard weightage updated successfully',
        data: updatedData,
      };
    }
  }

  async guestLogin(data: GuestLoginDto) {
    const { deviceId } = data;
    const foundSession = await this.guestSessionModel
      .findOne({ deviceId })
      .populate('token', 'token')
      .exec();
    let payload: JwtPayload;
    let token: string;
    if (!foundSession) {
      const createdSession = new this.guestSessionModel(data);
      payload = {
        id: createdSession.id,
        role: Roles.GUEST,
        userType: UserTypes.GUEST,
      };
      token = await this.generateJWT(
        payload,
        TokenTypes.ACCESS,
        UserTypes.GUEST,
      );
      const savedTokenDoc = await this.userService.saveToken(
        token,
        '',
        TokenTypes.GUEST_USER,
        UserTypes.GUEST,
        true,
      );
      createdSession.token = savedTokenDoc._id as any;
      await createdSession.save();
    } else {
      token = foundSession.token['token'];
    }

    return {
      success: true,
      message: 'Guest logged in successfully',
      user: 'guest',
      token,
    };
  }

  async verifyOtp(data: VerifyOtpDto) {
    const user = await this.userService.getUserById(data.user);
    if (!user) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    } else {
      const otpResult = await this.userService.validateOtp(data);
      if (!otpResult.success) {
        return {
          success: false,
          message: otpResult.message,
        };
      } else {
        const updateObj =
          data.type == OtpTypes.EMAIL
            ? { isEmailVerified: true }
            : { isPhoneVerified: true };
        await this.userModel.updateOne(
          { _id: new mongoose.Types.ObjectId(data.user) },
          { $set: updateObj },
        );
        const payload: JwtPayload = {
          id: data.user,
          userType: UserTypes.USER,
          role: Roles.USER,
        };
        const token = await this.generateJWT(
          payload,
          TokenTypes.ACCESS,
          UserTypes.USER,
        );
        return {
          success: true,
          message: 'Otp verified successfully',
          token,
          user,
        };
      }
    }
  }

  async resendOtp(data: ResendOtpDto) {
    const user = await this.userService.getUserById(data.user);
    console.log('User:', user);
    if (!user) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    } else {
      if (data.type === OtpTypes.EMAIL) {
        await this.mailService.sendUserVerificationMail(data.user);
      } else if (data.type === OtpTypes.MOBILE) {
        this.smsService.sendSMS(data.user, user.fullPhoneNumber, SMSType.OTP);
      }
      return {
        success: true,
        message: 'Otp resent successfully.',
      };
    }
  }

  // HELPERS
  async validateUser(email: string, password: string) {
    const foundUser = await this.userModel.findOne({ email });
    if (foundUser) {
      const validPassword = await bcrypt.compare(password, foundUser.password);
      if (!validPassword) {
        return { success: false, message: 'Incorrect password' };
      }
      const user = await this.userModel
        .findById(foundUser.id)
        .populate('role', '_id, name')
        .select({
          password: 0,
          isOAuth: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        })
        .populate('refferal', 'id code isBlacklisted')
        // .populate('subscriptions')
        .exec();
      return { success: true, user: user };
    } else {
      return { success: false, message: 'User not found' };
    }
  }

  async switchToUserProfile(userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    } else {
      const payload: JwtPayload = {
        id: userId,
        userType: UserTypes.USER,
        role: Roles.USER,
      };
      const token = await this.generateJWT(
        payload,
        TokenTypes.ACCESS,
        UserTypes.USER,
      );
      return {
        success: true,
        message: 'Switched to user profile successfully',
        user,
        token,
      };
    }
  }

  async generateJWT(payload: JwtPayload, tokenType: string, userType: string) {
    console.log('Payload::::', payload);
    let expireIn = '365d';
    if (tokenType === TokenTypes.RESET_PASSWORD) {
      expireIn = '15m';
    } else if (tokenType === TokenTypes.VERIFY_EMAIL) {
      expireIn = '1d';
    }
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: expireIn,
    });
    console.log('Token::::', token);
    // if (update) {
    //   await this.userService.updateToken(token, payload.id);
    // } else {
    await this.userService.saveToken(token, payload.id, tokenType, userType);
    // }
    return token;
  }

  async logout(user: DecodedUser, token: string, fcm: string) {
    if (user.isGuest) {
      await this.guestSessionModel.findByIdAndDelete(user.sessionId);
      await this.tokenModel.deleteOne({ token, type: TokenTypes.GUEST_USER });
    } else {
      await this.tokenModel.deleteOne({
        token,
        type: TokenTypes.ACCESS,
        userId: new mongoose.Types.ObjectId(user.id),
      });
    }
    if (fcm) {
      await this.tokenModel.deleteOne({
        token: fcm,
        type: TokenTypes.FCM,
        userId: new mongoose.Types.ObjectId(user.id),
      });
    }
    // await this.tokenModel.deleteMany({
    //   userId: new mongoose.Types.ObjectId(user.id),
    //   type: TokenTypes.FCM,
    // });
    return {
      success: true,
      message: 'User logged out successfully',
    };
  }

  async fetchEvents(
    userId: mongoose.Types.ObjectId,
    longitude: number,
    latitude: number,
    age: number,
    match: any,
    page: number,
    limit: number,
    start: Date,
    show?: boolean,
  ) {
    const result = await this.eventLocationModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: 10000000000,
          spherical: true,
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $match: {
          'event.status': EventStatus.PUBLISHED,
          ...match,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'event.categories',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      {
        $lookup: {
          from: 'images',
          localField: 'event.images',
          foreignField: '_id',
          as: 'images',
        },
      },
      {
        $lookup: {
          from: 'eventlocations',
          localField: 'event.locations',
          foreignField: '_id',
          as: 'locations',
        },
      },
      {
        $lookup: {
          from: 'agegroups',
          localField: 'event.ageGroupsAllowed',
          foreignField: '_id',
          as: 'ageGroupsAllowed',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'event.user',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $lookup: {
          from: 'businessprofiles',
          localField: 'event.businessProfile',
          foreignField: '_id',
          as: 'businessProfileDetails',
        },
      },
      {
        $unwind: {
          path: '$businessProfileDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $expr: {
            $cond: {
              if: {
                $eq: [{ $ifNull: ['$businessProfileDetails', null] }, null],
              },
              then: {},
              else: {
                $eq: ['$businessProfileDetails.isDeleted', false],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'event._id',
          foreignField: 'savedEvents',
          as: 'savedEvents',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'event._id',
          foreignField: 'likedEvents',
          as: 'likedEvents',
        },
      },
      {
        $addFields: {
          isSaved: {
            $in: [userId, '$savedEvents._id'],
          },
          isLiked: {
            $in: [userId, '$likedEvents._id'],
          },
          'event.isFollowedByMe': {
            $cond: {
              if: { $eq: ['$event.creatorType', 'User'] },
              then: {
                $cond: {
                  if: {
                    $ne: [
                      null,
                      {
                        $first: {
                          $filter: {
                            input: '$event.follows',
                            as: 'follow',
                            cond: {
                              $and: [
                                { $eq: ['$$follow.follower', userId] },
                                { $eq: ['$$follow.followerType', 'User'] },
                                {
                                  $eq: [
                                    '$$follow.following',
                                    '$userDetails._id',
                                  ],
                                },
                                { $eq: ['$$follow.followingType', 'User'] },
                                { $eq: ['$$follow.isBlocked', false] },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
              else: {
                $cond: {
                  if: {
                    $ne: [
                      null,
                      {
                        $first: {
                          $filter: {
                            input: '$event.follows',
                            as: 'follow',
                            cond: {
                              $and: [
                                { $eq: ['$$follow.follower', userId] },
                                { $eq: ['$$follow.followerType', 'User'] },
                                {
                                  $eq: [
                                    '$$follow.following',
                                    '$businessProfileDetails._id',
                                  ],
                                },
                                {
                                  $eq: [
                                    '$$follow.followingType',
                                    'BusinessProfile',
                                  ],
                                },
                                { $eq: ['$$follow.isBlocked', false] },
                              ],
                            },
                          },
                        },
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
      {
        $project: {
          _id: 1,
          distance: { $divide: ['$distance', 1000] },
          'event._id': 1,
          'event.title': 1,
          'event.creatorType': 1,
          'event.keywords': 1,
          'event.description': 1,
          'event.schedule': 1,
          'event.locations': {
            $map: {
              input: '$locations',
              as: 'location',
              in: {
                _id: '$$location._id',
                location: '$$location.location',
                businessLocationId: '$$location.businessLocationId',
                accuracy: '$$location.accuracy',
                address1: '$$location.address1',
                address2: '$$location.address2',
                city: '$$location.city',
                state: '$$location.state',
                zip: '$$location.zip',
                website: '$$location.website',
                email: '$$location.email',
                phone: '$$location.phone',
              },
            },
          },
          'event.type': 1,
          'event.status': 1,
          'event.targetGenders': 1,
          'event.promotionCode': 1,
          'event.isFree': 1,
          'event.participationCost': 1,
          'event.bookingUrl': 1,
          'event.notifyFollowers': 1,
          'event.RSVP': 1,
          'event.termsApplied': 1,
          'event.termsAndConditions': 1,
          'event.facebookPostId': 1,
          'event.specifyForEachDay': 1,
          'event.participants': 1,
          'event.creatorDetails': {
            $cond: {
              if: { $eq: ['$event.creatorType', 'User'] },
              then: {
                _id: '$userDetails._id',
                name: '$userDetails.name',
                profilePhoto: '$userDetails.profilePhoto',
                email: '$userDetails.email',
                bio: '$userDetails.bio',
                followersCount: '$userDetails.followersCount',
                profileType: 'User',
                phone: '$userDetails.phone',
                website: '',
                isFollowedByMe: '$event.isFollowedByMe',
                isDeleted: '$userDetails.isDeleted',
              },
              else: {
                _id: '$businessProfileDetails._id',
                name: '$businessProfileDetails.name',
                profilePhoto: '$businessProfileDetails.profilePhoto',
                email: '$businessProfileDetails.email',
                bio: '$businessProfileDetails.bio',
                followersCount: '$businessProfileDetails.followersCount',
                profileType: 'BusinessProfile',
                phone: '$businessProfileDetails.phone',
                website: '$businessProfileDetails.website',
                isFollowedByMe: '$event.isFollowedByMe',
                isDeleted: '$businessProfileDetails.isDeleted',
              },
            },
          },
          'categoryDetails.id': 1,
          'categoryDetails.name': 1,
          'categoryDetails.image': 1,
          images: { _id: 1, url: 1 },
          ageGroupsAllowed: { _id: 1, name: 1 },
          isSaved: 1,
          isLiked: 1,
        },
      },
      {
        $group: {
          _id: '$event._id',
          locationId: { $first: '$_id' },
          distance: { $min: '$distance' },
          title: { $first: '$event.title' },
          creatorType: { $first: '$event.creatorType' },
          keywords: { $first: '$event.keywords' },
          description: { $first: '$event.description' },
          schedule: { $first: '$event.schedule' },
          locations: { $first: '$event.locations' },
          type: { $first: '$event.type' },
          status: { $first: '$event.status' },
          targetGenders: { $first: '$event.targetGenders' },
          promotionCode: { $first: '$event.promotionCode' },
          isFree: { $first: '$event.isFree' },
          participationCost: { $first: '$event.participationCost' },
          bookingUrl: { $first: '$event.bookingUrl' },
          notifyFollowers: { $first: '$event.notifyFollowers' },
          RSVP: { $first: '$event.RSVP' },
          termsApplied: { $first: '$event.termsApplied' },
          termsAndConditions: { $first: '$event.termsAndConditions' },
          facebookPostId: { $first: '$event.facebookPostId' },
          specifyForEachDay: { $first: '$event.specifyForEachDay' },
          participants: { $first: '$event.participants' },
          creatorDetails: { $first: '$event.creatorDetails' },
          category: { $first: '$category' },
          images: { $first: '$images' },
          ageGroupsAllowed: { $first: '$ageGroupsAllowed' },
          isSaved: { $first: '$isSaved' },
          isLiked: { $first: '$isLiked' },
        },
      },
      {
        $addFields: {
          schedule: {
            $filter: {
              input: '$schedule',
              as: 'sched',
              cond: {
                // $or: [
                //   { $gte: ['$$sched.date', start] },
                // {
                $and: [
                  { $gte: ['$$sched.date', start] },
                  {
                    // $anyElementTrue: {
                    $map: {
                      input: '$$sched.durations',
                      as: 'duration',
                      in: {
                        $gte: ['$$duration.endTime', currentDateTz()],
                      },
                    },
                    // },
                  },
                ],
                // },
                // ],
              },
            },
          },
          distance: {
            $round: ['$distance', 2],
          },
        },
      },
      {
        $sort: {
          distance: 1,
          'schedule.durations.startTime': 1,
        },
      },
      {
        $skip: !page ? 0 : (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);
    // Post-processing to group events into distance batches and sort them accordingly
    result.forEach((event) => {
      event.locations.forEach((location) => {
        location.distance = haversineDistance(
          latitude,
          longitude,
          location.location.coordinates[1],
          location.location.coordinates[0],
        );
      });
      // Sort locations by distance
      event.locations.sort((a, b) => a.distance - b.distance);
    });
    // Determine the distance of the nearest and farthest events
    const nearestEventDistance = result.length ? result[0].distance : 0;
    const farthestEventDistance = result.length
      ? result[result.length - 1].distance
      : 0;
    const resultArranged = [];
    for (
      let distance = nearestEventDistance;
      distance <= farthestEventDistance;
      distance += 32.1869
    ) {
      // Group events within the current distance range
      const events = result.filter(
        (event) =>
          event.distance >= distance && event.distance < distance + 32.1869,
      );
      if (events.length) {
        let eventsData = JSON.parse(JSON.stringify(events)) as Array<any>;
        //Loop through the events and remove the schedules which are blank or are past the current time
        for (let i = 0; i < eventsData.length; i++) {
          //Write tha above filter with for loop
          if (!eventsData[i].schedule.length) {
            eventsData.splice(i, 1);
            i--;
          }
        }
        // Sort events by start time within the current distance range
        eventsData.sort((a, b) => {
          if (a.schedule[0] && b.schedule[0]) {
            if (a.schedule[0].durations[0] && b.schedule[0].durations[0]) {
              const aTime = new Date(
                a.schedule[0].durations[0].startTime,
              ).getTime();
              const bTime = new Date(
                b.schedule[0].durations[0].startTime,
              ).getTime();
              return aTime - bTime;
            }
          }
          return 0;
        });
        resultArranged.push(...eventsData); // Add sorted events to the final result
      }
    }
    return resultArranged; // Return the arranged result
  }

  async fetchEventsV2(
    userId: mongoose.Types.ObjectId,
    longitude: number,
    latitude: number,
    age: number,
    match: any,
    page: number,
    limit: number,
    start: Date,
    distance: number,
    startDate: any,
    endDate: any,
  ) {
    const now = new Date();
    startDate = startDate ? new Date(startDate) : now;
    endDate = endDate
      ? new Date(endDate)
      : new Date(now.setFullYear(now.getFullYear() + 2));
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Match:', match);
    const basePipeline: any[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          maxDistance: distance * 1000,
          spherical: true,
        },
      },
      // { $sort: { distance: 1 } },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: '$event' },
      {
        $match: {
          // 'event._id': new mongoose.Types.ObjectId('682a38a5a85d3ccb755163b0'),
          'event.status': EventStatus.PUBLISHED,
          ...match,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'event.categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
      {
        $lookup: {
          from: 'files',
          localField: 'event.drivePath',
          foreignField: 'parentDirectory',
          as: 'files',
        },
      },
      {
        $lookup: {
          from: 'files',
          localField: 'event.QR_CODE',
          foreignField: '_id',
          as: 'QR_CODE',
        },
      },
      {
        $unwind: { path: '$QR_CODE', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'event.businessProfile',
          foreignField: '_id',
          as: 'businessProfileDetails',
        },
      },
      {
        $unwind: {
          path: '$businessProfileDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $expr: {
            $cond: [
              { $eq: [{ $ifNull: ['$businessProfileDetails', null] }, null] },
              true,
              { $eq: ['$businessProfileDetails.isDeleted', false] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'event._id',
          foreignField: 'savedEvents',
          as: 'savedEvents',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'event._id',
          foreignField: 'likedEvents',
          as: 'likedEvents',
        },
      },
      {
        $addFields: {
          isSaved: {
            $in: [new mongoose.Types.ObjectId(userId), '$savedEvents._id'],
          },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(userId), '$likedEvents._id'],
          },
          'event.isFollowedByMe': {},
        },
      },
      {
        $group: {
          _id: '$event._id', // Group by event._id
          // event: { $first: '$event' }, // Preserve event object
          schedule: { $first: '$event.eventSchedule' },
          title: { $first: '$event.title' },
          keywords: { $first: '$event.keywords' },
          description: { $first: '$event.description' },
          type: { $first: '$event.type' },
          status: { $first: '$event.status' },
          notifyFollowers: { $first: '$event.notifyFollowers' },
          targetGenders: { $first: '$event.targetGenders' },
          promotionCode: { $first: '$event.promotionCode' },
          isFree: { $first: '$event.isFree' },
          participationCost: { $first: '$event.participationCost' },
          bookingUrl: { $first: '$event.bookingUrl' },
          RSVP: { $first: '$event.RSVP' },
          minTargetAge:{ $first: '$event.minTargetAge' },
          maxTargetAge:{ $first: '$event.maxTargetAge' },
          termsApplied: { $first: '$event.termsApplied' },
          termsAndConditions: { $first: '$event.termsAndConditions' },
          facebookPostId: { $first: '$event.facebookPostId' },
          specifyForEachDay: { $first: '$event.specifyForEachDay' },
          participants: { $first: '$event.participants' },
          creatorDetails: { $first: '$event.creatorDetails' },
          categories: { $first: '$categories' },
          businessProfileDetails: { $first: '$businessProfileDetails' },
          files: { $first: '$files' },
          QR_CODE: { $first: '$QR_CODE' },
          isLiked: { $first: '$isLiked' },
          isSaved: { $first: '$isSaved' },
          locations: {
            $push: {
              location: '$location',
              accuracy: '$accuracy',
              address1: '$address1',
              address2: '$address2',
              city: '$city',
              state: '$state',
              zip: '$zip',
              website: '$website',
              _id: '$_id',
              email: '$email',
              phone: '$phone',
              distance: '$distance',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'eventschedules',
          localField: 'schedule',
          foreignField: '_id',
          as: 'schedules',
        },
      },
      {
        $addFields: {
          schedules: {
            $filter: {
              input: '$schedules',
              as: 'schedule',
              cond: {
                $or: [
                  {
                    $and: [
                      { $eq: ['$$schedule.type', 'fixed'] },
                      {
                        $and: [
                          {
                            $gte: ['$$schedule.fixedSchedule.date', startDate],
                          },
                          { $lte: ['$$schedule.fixedSchedule.date', endDate] },
                        ],
                      },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$$schedule.type', 'recurring'] },
                      {
                        $and: [
                          {
                            $gte: [
                              '$$schedule.recurringSchedule.endDate',
                              startDate,
                            ],
                          },
                          {
                            $lte: [
                              '$$schedule.recurringSchedule.endDate',
                              endDate,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },

      // {
      //   $lookup: {
      //     from: 'users',
      //     localField: 'event.user',
      //     foreignField: '_id',
      //     as: 'userDetails',
      //   },
      // },
      // {
      //   $lookup: {
      //     from: 'businessusers',
      //     localField: 'event.user',
      //     foreignField: '_id',
      //     as: 'businessUserDetails',
      //   },
      // },
      // { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
      // {
      //   $unwind: {
      //     path: '$businessUserDetails',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },

      {
        $project: {
          _id: 1,
          title:1,
          description:1,
          notifyFollowers:1,
          keywords:1,
          targetGenders:1,
          promotionCode:1,
          type:1,
          status:1,
          isFree:1,
          participationCost:1,
          bookingUrl:1,
          termsAndConditions:1,
          ageGroupsAllowed:{
            minAge:'$minTargetAge',
            maxAge:'$maxTargetAge',
          },
          categories: {
            $map: {
              input: "$categories",
              as: "category",
              in: {
                _id: "$$category._id",
                title: "$$category.title",
                darkIcon: "$$category.darkIcon",
                lightIcon: "$$category.lightIcon",
                activeColor: "$$category.activeColor",
              },
            },
          },
          businessProfileDetails: {
            _id: '$businessProfileDetails._id',
            name: '$businessProfileDetails.name',
            profilePhoto: '$businessProfileDetails.profilePhoto',
            email: '$businessProfileDetails.email',
            bio: '$businessProfileDetails.bio',
            followersCount: '$businessProfileDetails.followersCount',
            profileType: 'BusinessProfile',
            phone: '$businessProfileDetails.phone',
            website: '$businessProfileDetails.website',
          },
          QR_CODE: {
            _id: '$QR_CODE._id',
            url: '$QR_CODE.metaData.url',
          },
          images: {
            $map: {
              input: '$files',
              as: 'file',
              in: {
                _id: '$$file._id',
                url: '$$file.metaData.url',
              },
            },
          },
          isLiked:1,
          isSaved:1,
          locations:1,
          schedules:1,
        },
      },
    ];

    const rows = await this.eventLocationModel.aggregate(basePipeline);
    console.log('Row EVENTS:', rows);
    const eventIds = rows.map((r) => r._id);
    // const schedules = await this.eventScheduleModel
    //   .find({ event: { $in: eventIds } })
    //   .lean();

    const filterFixed = (sch: any) => {
      if (
        !sch.fixedSchedule?.date ||
        !Array.isArray(sch.fixedSchedule?.durations)
      )
        return false;
      const d = new Date(sch.fixedSchedule.date);
      if (d < now) return false;
      const isToday = d.toDateString() === now.toDateString();
      return sch.fixedSchedule.durations.some((dur: any) => {
        const endMin = dur.endHour * 60 + dur.endMinute;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        return !isToday || endMin > nowMin;
      });
    };

    const getNextRecurring = (rec: any) => {
      if (!rec || !rec.startDate || !rec.endDate || !rec.weekDays) return null;
      const start = new Date(rec.startDate);
      const end = new Date(rec.endDate);
      if (now > end) return null;
      let check = new Date(Math.max(now.getTime(), start.getTime()));
      const names = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      for (let i = 0; i < 7; i++) {
        const dow = check.getUTCDay();
        if (rec.weekDays[names[dow]]?.included) return new Date(check);
        check.setUTCDate(check.getUTCDate() + 1);
        if (check > end) break;
      }
      return null;
    };

    // const result = rows.map((row) => {
    //   const evScheds = schedules.filter(
    //     (s) => s.event.toString() === row._id.toString(),
    //   );
    //   const upcomingDates = evScheds
    //     .map((sch) => {
    //       if (sch.type === ScheduleTypes.FIXED)
    //         return filterFixed(sch) ? new Date(sch.fixedSchedule.date) : null;
    //       if (sch.type === ScheduleTypes.RECURRING)
    //         return getNextRecurring(sch.recurringSchedule);
    //       return null;
    //     })
    //     .filter((d): d is Date => d !== null);

    //   row.latestSchedule =
    //     upcomingDates.length > 0
    //       ? new Date(Math.min(...upcomingDates.map((d) => d.getTime())))
    //       : null;

    //   return row;
    // });

    // // 5. Merge schedules and compute latestSchedule + inline filtering
    // const filteredEvents = rows
    //   .map((row) => {
    //     const evScheds = schedules.filter(
    //       (s) => s.event.toString() === row._id.toString(),
    //     );
    //     if (evScheds.length === 0) return null;

    //     const upcomingDates = evScheds
    //       .map((sch) => {
    //         if (sch.type === ScheduleTypes.FIXED)
    //           return filterFixed(sch) ? new Date(sch.fixedSchedule.date) : null;
    //         if (sch.type === ScheduleTypes.RECURRING)
    //           return getNextRecurring(sch.recurringSchedule);
    //         return null;
    //       })
    //       .filter((d) => d !== null) as Date[];

    //     if (evScheds.length === 0) return null;

    //     row.latestSchedule =
    //       upcomingDates.length > 0
    //         ? new Date(Math.min(...upcomingDates.map((d) => d.getTime())))
    //         : null;

    //     row.schedule = evScheds;
    //     return row;
    //   })
    //   .filter((row) => row !== null && row.schedule.length > 0);

    // // Optional: Sort if needed
    // filteredEvents.sort((a, b) => {
    //   if (!a.latestSchedule && !b.latestSchedule) return 0;
    //   if (!a.latestSchedule) return 1;
    //   if (!b.latestSchedule) return -1;
    //   return a.latestSchedule.getTime() - b.latestSchedule.getTime();
    // });

    // // 5. Merge schedules, compute latestSchedule, filter valid events
    // const currentTzTime = currentDateTz();
    
    // // const filteredEvents = rows
    // //   .map((row) => {
    // //     const evScheds = schedules
    // //       .filter((s) => s.event.toString() === row._id.toString())
    // //       .map((sch) => {
    // //         if (sch.type === ScheduleTypes.FIXED && filterFixed(sch)) {
    // //           return { date: sch.fixedSchedule.date };
    // //         } else if (sch.type === ScheduleTypes.RECURRING) {
    // //           const nextDate = getNextRecurring(sch.recurringSchedule);
    // //           return nextDate ? { date: nextDate.toISOString() } : null;
    // //         }
    // //         return null;
    // //       })
    // //       .filter((s) => s !== null) as { date: string }[];

    // //     if (evScheds.length === 0) return null;

    // //     const scheduleDates = evScheds.map((s) => new Date(s.date).getTime());
    // //     row.latestSchedule = new Date(Math.min(...scheduleDates));
    // //     row.schedule = evScheds;
    // //     return row;
    // //   })
    // //   .filter((row) => row !== null && row.schedule.length > 0);

    // // 6. Scoring logic based on distance + time to event
    // const maxDistance = Math.max(...filteredEvents.map((e) => e.distance));
    // const maxTimeToEvent = Math.max(
    //   ...filteredEvents.map((e) => {
    //     const nextSchedule = e.schedule.find(
    //       (s) => new Date(s.date).getTime() > currentTzTime.getTime(),
    //     );
    //     return nextSchedule
    //       ? new Date(nextSchedule.date).getTime() - currentTzTime.getTime()
    //       : 0;
    //   }),
    // );

    // const weightDistance = 0.5;
    // const weightTime = 0.5;

    // filteredEvents.forEach((event) => {
    //   const nearestSchedule = event.schedule.find(
    //     (s) => new Date(s.date).getTime() > currentTzTime.getTime(),
    //   );
    //   const timeToEvent = nearestSchedule
    //     ? new Date(nearestSchedule.date).getTime() - currentTzTime.getTime()
    //     : maxTimeToEvent;

    //   const normalizedDistance =
    //     Math.log(event.distance + 1) / Math.log(maxDistance + 1);
    //   const normalizedTime =
    //     Math.log(timeToEvent + 1) / Math.log(maxTimeToEvent + 1);

    //   event.score =
    //     weightDistance * normalizedDistance + weightTime * normalizedTime;
    // });

    // // Sort by ascending score
    // filteredEvents.sort((a, b) => a.score - b.score);

    console.log('OLD FLOWWWWWWWW::::::');

    // return { success: true, data: filteredEvents };

    // return { success: true, data: filteredEvents };

    // ✅ Sort after merging latestSchedule
    // result2.sort((a, b) => {
    //   if (!a.latestSchedule && !b.latestSchedule) return 0;
    //   if (!a.latestSchedule) return 1;
    //   if (!b.latestSchedule) return -1;
    //   return a.latestSchedule.getTime() - b.latestSchedule.getTime();
    // });

    // const result = await this.eventLocationModel.aggregate([
    //   {
    //     $geoNear: {
    //       near: { type: 'Point', coordinates: [longitude, latitude] },
    //       distanceField: 'distance',
    //       maxDistance: distance * 1000,
    //       spherical: true,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'events',
    //       localField: 'event',
    //       foreignField: '_id',
    //       as: 'event',
    //     },
    //   },
    //   { $unwind: '$event' },
    //   {
    //     $match: {
    //       'event.status': EventStatus.PUBLISHED,
    //       ...match,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'categories',
    //       localField: 'event.categories',
    //       foreignField: '_id',
    //       as: 'categories',
    //     },
    //   },
    //   { $unwind: '$categories' },
    //   {
    //     $lookup: {
    //       from: 'images',
    //       localField: 'event.images',
    //       foreignField: '_id',
    //       as: 'images',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'eventlocations',
    //       localField: 'event.locations',
    //       foreignField: '_id',
    //       as: 'locations',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'agegroups',
    //       localField: 'event.ageGroupsAllowed',
    //       foreignField: '_id',
    //       as: 'ageGroupsAllowed',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'event.user',
    //       foreignField: '_id',
    //       as: 'userDetails',
    //     },
    //   },
    //   { $unwind: '$userDetails' },
    //   {
    //     $lookup: {
    //       from: 'businessprofiles',
    //       localField: 'event.businessProfile',
    //       foreignField: '_id',
    //       as: 'businessProfileDetails',
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: '$businessProfileDetails',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $match: {
    //       $expr: {
    //         $cond: {
    //           if: {
    //             $eq: [{ $ifNull: ['$businessProfileDetails', null] }, null],
    //           },
    //           then: {},
    //           else: {
    //             $eq: ['$businessProfileDetails.isDeleted', false],
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'event._id',
    //       foreignField: 'savedEvents',
    //       as: 'savedEvents',
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'event._id',
    //       foreignField: 'likedEvents',
    //       as: 'likedEvents',
    //     },
    //   },
    //   {
    //     $addFields: {
    //       isSaved: {
    //         $in: [userId, '$savedEvents._id'],
    //       },
    //       isLiked: {
    //         $in: [userId, '$likedEvents._id'],
    //       },
    //       'event.isFollowedByMe': {
    //         $cond: {
    //           if: { $eq: ['$event.creatorType', 'User'] },
    //           then: {
    //             $cond: {
    //               if: {
    //                 $ne: [
    //                   null,
    //                   {
    //                     $first: {
    //                       $filter: {
    //                         input: '$event.follows',
    //                         as: 'follow',
    //                         cond: {
    //                           $and: [
    //                             { $eq: ['$$follow.follower', userId] },
    //                             { $eq: ['$$follow.followerType', 'User'] },
    //                             {
    //                               $eq: [
    //                                 '$$follow.following',
    //                                 '$userDetails._id',
    //                               ],
    //                             },
    //                             { $eq: ['$$follow.followingType', 'User'] },
    //                             { $eq: ['$$follow.isBlocked', false] },
    //                           ],
    //                         },
    //                       },
    //                     },
    //                   },
    //                 ],
    //               },
    //               then: true,
    //               else: false,
    //             },
    //           },
    //           else: {
    //             $cond: {
    //               if: {
    //                 $ne: [
    //                   null,
    //                   {
    //                     $first: {
    //                       $filter: {
    //                         input: '$event.follows',
    //                         as: 'follow',
    //                         cond: {
    //                           $and: [
    //                             { $eq: ['$$follow.follower', userId] },
    //                             { $eq: ['$$follow.followerType', 'User'] },
    //                             {
    //                               $eq: [
    //                                 '$$follow.following',
    //                                 '$businessProfileDetails._id',
    //                               ],
    //                             },
    //                             {
    //                               $eq: [
    //                                 '$$follow.followingType',
    //                                 'BusinessProfile',
    //                               ],
    //                             },
    //                             { $eq: ['$$follow.isBlocked', false] },
    //                           ],
    //                         },
    //                       },
    //                     },
    //                   },
    //                 ],
    //               },
    //               then: true,
    //               else: false,
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       distance: { $divide: ['$distance', 1000] },
    //       'event._id': 1,
    //       'event.title': 1,
    //       'event.creatorType': 1,
    //       'event.keywords': 1,
    //       'event.description': 1,
    //       'event.schedule': 1,
    //       'event.locations': {
    //         $map: {
    //           input: '$locations',
    //           as: 'location',
    //           in: {
    //             _id: '$$location._id',
    //             location: '$$location.location',
    //             businessLocationId: '$$location.businessLocationId',
    //             accuracy: '$$location.accuracy',
    //             address1: '$$location.address1',
    //             address2: '$$location.address2',
    //             city: '$$location.city',
    //             state: '$$location.state',
    //             zip: '$$location.zip',
    //             website: '$$location.website',
    //             email: '$$location.email',
    //             phone: '$$location.phone',
    //           },
    //         },
    //       },
    //       'event.type': 1,
    //       'event.status': 1,
    //       'event.targetGenders': 1,
    //       'event.promotionCode': 1,
    //       'event.isFree': 1,
    //       'event.participationCost': 1,
    //       'event.bookingUrl': 1,
    //       'event.notifyFollowers': 1,
    //       'event.RSVP': 1,
    //       'event.termsApplied': 1,
    //       'event.termsAndConditions': 1,
    //       'event.facebookPostId': 1,
    //       'event.specifyForEachDay': 1,
    //       'event.participants': 1,
    //       'event.creatorDetails': {
    //         $cond: {
    //           if: { $eq: ['$event.creatorType', 'User'] },
    //           then: {
    //             _id: '$userDetails._id',
    //             name: '$userDetails.name',
    //             profilePhoto: '$userDetails.profilePhoto',
    //             email: '$userDetails.email',
    //             bio: '$userDetails.bio',
    //             followersCount: '$userDetails.followersCount',
    //             profileType: 'User',
    //             phone: '$userDetails.phone',
    //             website: '',
    //             isFollowedByMe: '$event.isFollowedByMe',
    //             isDeleted: '$userDetails.isDeleted',
    //           },
    //           else: {
    //             _id: '$businessProfileDetails._id',
    //             name: '$businessProfileDetails.name',
    //             profilePhoto: '$businessProfileDetails.profilePhoto',
    //             email: '$businessProfileDetails.email',
    //             bio: '$businessProfileDetails.bio',
    //             followersCount: '$businessProfileDetails.followersCount',
    //             profileType: 'BusinessProfile',
    //             phone: '$businessProfileDetails.phone',
    //             website: '$businessProfileDetails.website',
    //             isFollowedByMe: '$event.isFollowedByMe',
    //             isDeleted: '$businessProfileDetails.isDeleted',
    //           },
    //         },
    //       },
    //       'categories._id': 1,
    //       'categories.name': 1,
    //       'categories.image': 1,
    //       images: { _id: 1, url: 1 },
    //       ageGroupsAllowed: { _id: 1, name: 1 },
    //       isSaved: 1,
    //       isLiked: 1,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: '$event._id',
    //       locationId: { $first: '$_id' },
    //       distance: { $min: '$distance' },
    //       title: { $first: '$event.title' },
    //       creatorType: { $first: '$event.creatorType' },
    //       keywords: { $first: '$event.keywords' },
    //       description: { $first: '$event.description' },
    //       schedule: { $first: '$event.schedule' },
    //       locations: { $first: '$event.locations' },
    //       type: { $first: '$event.type' },
    //       status: { $first: '$event.status' },
    //       targetGenders: { $first: '$event.targetGenders' },
    //       promotionCode: { $first: '$event.promotionCode' },
    //       isFree: { $first: '$event.isFree' },
    //       participationCost: { $first: '$event.participationCost' },
    //       bookingUrl: { $first: '$event.bookingUrl' },
    //       notifyFollowers: { $first: '$event.notifyFollowers' },
    //       RSVP: { $first: '$event.RSVP' },
    //       termsApplied: { $first: '$event.termsApplied' },
    //       termsAndConditions: { $first: '$event.termsAndConditions' },
    //       facebookPostId: { $first: '$event.facebookPostId' },
    //       specifyForEachDay: { $first: '$event.specifyForEachDay' },
    //       participants: { $first: '$event.participants' },
    //       creatorDetails: { $first: '$event.creatorDetails' },
    //       categories: { $addToSet: '$categories' },
    //       images: { $first: '$images' },
    //       ageGroupsAllowed: { $first: '$ageGroupsAllowed' },
    //       isSaved: { $first: '$isSaved' },
    //       isLiked: { $first: '$isLiked' },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       schedule: {
    //         $filter: {
    //           input: '$schedule',
    //           as: 'sched',
    //           cond: {
    //             // $or: [
    //             //   { $gte: ['$$sched.date', start] },
    //             // {
    //             $and: [
    //               { $gte: ['$$sched.date', start] },
    //               {
    //                 // $anyElementTrue: {
    //                 $map: {
    //                   input: '$$sched.durations',
    //                   as: 'duration',
    //                   in: {
    //                     $gte: ['$$duration.endTime', currentDateTz()],
    //                   },
    //                 },
    //                 // },
    //               },
    //             ],
    //             // },
    //             // ],
    //           },
    //         },
    //       },
    //       distance: {
    //         $round: ['$distance', 2],
    //       },
    //     },
    //   },
    //   {
    //     $sort: {
    //       distance: 1,
    //       'schedule.durations.startTime': 1,
    //     },
    //   },
    //   {
    //     $skip: !page ? 0 : (page - 1) * limit,
    //   },
    //   {
    //     $limit: limit,
    //   },
    // ]);
    // Post-processing to group events into distance batches and sort them accordingly
    // result.forEach((event) => {
    //   event.locations.forEach((location) => {
    //     location.distance = haversineDistance(
    //       latitude,
    //       longitude,
    //       location.location.coordinates[1],
    //       location.location.coordinates[0],
    //     );
    //   });
    //   // Sort locations by distance
    //   event.locations.sort((a, b) => a.distance - b.distance);
    // });
    // Determine the distance of the nearest and farthest events
    // const resultArranged = [];
    // const filteredEvents = result.filter((event) => {
    //   //Filter those events which are having the schedule length greater than 0
    //   return event.schedule.length > 0;
    // });
    // console.log('filteredEvents.........', filteredEvents.length);
    // for (let i = 0; i < filteredEvents.length; i++) {
    //   //Implementing a score mechanism, where score = event distance * the nearest schedule time to current time
    //   let score = 0;
    //   let nearestTime = 0;
    //   //Filter schedules which are greater than the current time and then sort them
    //   const filtereSchedules = filteredEvents[i].schedule.filter((schedule) => {
    //     const currentTime = currentDateTz().getTime();
    //     const endTime = anyDateTz(schedule.durations[0].endTime).getTime();
    //     return endTime > currentTime;
    //   });
    //   for (let j = 0; j < filtereSchedules.length; j++) {
    //     const currentTime = currentDateTz().getTime();
    //     const endTime = anyDateTz(
    //       filtereSchedules[j].durations[0].endTime,
    //     ).getTime();
    //     if (endTime > currentTime) {
    //       nearestTime = new Date(
    //         filtereSchedules[j].durations[0].startTime,
    //       ).getTime();
    //       break;
    //     }
    //   }
    //   score =
    //     (filteredEvents[i].distance > 0
    //       ? filteredEvents[i].distance
    //       : filteredEvents[i].distance + 1) *
    //     (nearestTime > 0 ? nearestTime : 1);
    //   filteredEvents[i].score = score;
    // }
    // filteredEvents.sort((a, b) => a.score - b.score);
    // resultArranged.push(...filteredEvents);
    // const maxDistance = Math.max(...filteredEvents.map((e) => e.distance));
    // const maxTimeToEvent = Math.max(
    //   ...filteredEvents.map((e) => {
    //     const nextSchedule = e.schedule.find(
    //       (s) => new Date(s.date).getTime() > currentDateTz().getTime(),
    //     );
    //     return nextSchedule
    //       ? new Date(nextSchedule.date).getTime() - currentDateTz().getTime()
    //       : 0;
    //   }),
    // );
    // // console.log('maxDistance.........', maxDistance);
    // // console.log('maxTimeToEvent.........', maxTimeToEvent);

    // let weightDistance = 0.5;
    // let weightTime = 0.5;
    // // const foundPlatformConfig = await this.platformConfigModel.findOne();
    // // if (foundPlatformConfig) {
    // //   if (foundPlatformConfig.distanceWeightage) {
    // //     weightDistance = foundPlatformConfig.distanceWeightage;
    // //   }
    // //   if (foundPlatformConfig.timeWeightage) {
    // //     weightTime = foundPlatformConfig.timeWeightage;
    // //   }
    // // }

    // filteredEvents.forEach((event) => {
    //   const nearestSchedule = event.schedule.find(
    //     (s) => new Date(s.date).getTime() > currentDateTz().getTime(),
    //   );
    //   const timeToEvent = nearestSchedule
    //     ? new Date(nearestSchedule.date).getTime() - currentDateTz().getTime()
    //     : maxTimeToEvent;

    //   const normalizedDistance =
    //     Math.log(event.distance + 1) / Math.log(maxDistance + 1);
    //   const normalizedTime =
    //     Math.log(timeToEvent + 1) / Math.log(maxTimeToEvent + 1);

    //   event.score =
    //     weightDistance * normalizedDistance + weightTime * normalizedTime;
    // });
    // // console.log(
    // //   'filteredEvents after normalization.........',
    // //   filteredEvents.length,
    // // );
    // // Sort events by ascending score
    // filteredEvents.sort((a, b) => a.score - b.score);

    // return result; // Return the arranged result

    // return filteredEvents; // Return the arranged result
    return rows;
  }

  async getDashboard(
    user: DecodedUser,
    latitude: number,
    longitude: number,
    maxDistance: number,
    search: string,
    categoryIds?: Array<string>,
    startDate?: any,
    endDate?: any,
  ) {
    let match = {};
    if (categoryIds.length) {
      match['event.category'] = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    const currentDate = currentDateTz();
    let start = getZeroDateTz(new Date());
    if (!startDate && !endDate) {
      // If no date is provided then the events should be fetched for the current date and future dates also the end time should be greater than the current time
      match['event.schedule.date'] = { $gte: start };
      match['event.schedule.durations.endTime'] = { $gte: currentDate };
    } else if (startDate && endDate) {
      start = getZeroBodyDateTz(startDate);
      const end = getZeroBodyDateTz(endDate);
      if (getStringBodyDateTz(start) === getStringBodyDateTz(end)) {
        if (
          getStringBodyDateTz(start) === getStringDateCurrentTz(currentDate) //2024-05-13T00:00:00.000Z == 2024-05-13T00:00:00.000Z
        ) {
          console.log('start is equals to current');
          // If the requested query is for today only then the end time should be greater than the current time
          match['event.schedule.date'] = getZeroDateTz(new Date());
          match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
        } else {
          console.log('start is not equals to current');
          // If the start and end date are the same e.g. 2024-06-01
          match['event.schedule.date'] = start;
        }
      } else if (end > start) {
        if (getStringBodyDateTz(start) === getStringDateTz(currentDate)) {
          // If the start date is today and the end date is greater than today e.g. [2024-05-13 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: currentDateTz() }, // 2024-05-13T00:00:00.000Z
            },
          };
        } else {
          // If the end date is greater than the start date e.g. [2024-06-01 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: start },
            },
          };
        }
      } else {
        // If the request date is in past
        match['event.schedule.date'] = { $gte: currentDate };
        match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
      }
    }

    if (search) {
      // Search matching business profile name
      const matchingBusinesses = await this.businessProfileModel.find({
        name: { $regex: search, $options: 'i' },
      });
      // keep the search queries as it is, just add the business profile ids to the match query if the event creatorType is BusinessProfile
      const businessProfileIds = matchingBusinesses.map(
        (business) => business._id,
      );
      match['$or'] = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.keywords': { $regex: search, $options: 'i' } },
        { 'event.businessProfile': { $in: businessProfileIds } },
      ];
    }

    let age = 0;
    if (!user.isGuest) {
      const foundUser = await this.userModel.findById(user.id);
      age = foundUser.age ? foundUser.age : 0;
    }

    const freeEventsMatch = {
      ...match,
      'event.type': { $ne: EventTypes.PRIVATE },
      'event.isFree': true,
    };
    const privateEventsMatch = {
      ...match,
      'event.participants': { $in: [new mongoose.Types.ObjectId(user.id)] },
      'event.type': EventTypes.PRIVATE,
    };
    console.log('match....', match);
    console.log('start????', start);
    console.log('current time``````````````', currentDateTz());
    const freeEvents = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      freeEventsMatch,
      1,
      15,
      start,
      maxDistance,
      '',
      '',
    );
    const privateEvents = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      privateEventsMatch,
      1,
      15,
      start,
      maxDistance,
      '',
      '',
    );

    let data = {};
    const dashboardConfigs = await this.dashboardConfigModel.find().sort({
      sortOrder: 1,
    });
    console.log('dashboardConfigs', dashboardConfigs.length);
    for (let i = 0; i < dashboardConfigs.length; i++) {
      const config = dashboardConfigs[i];
      console.log('config name', config.name);
      if (match['event.category']) {
        delete match['event.category'];
      }
      if (config.name == 'Food & Drinks') {
        console.log('query after type:----->', match);
      }
      let query = { ...match };
      if (categoryIds.length) {
        const sameCategories = [];
        categoryIds.forEach((id) => {
          if (config.categories.includes(new mongoose.Types.ObjectId(id))) {
            sameCategories.push(new mongoose.Types.ObjectId(id));
          }
        });
        if (!sameCategories.length) {
          continue;
        } else {
          query = {
            ...query,
            'event.category': {
              $in: sameCategories,
            },
          };
        }
      } else {
        query = {
          ...query,
          'event.category': { $in: config.categories },
        };
      }
      if (!config.freeIncluded) {
        query = {
          ...query,
          'event.isFree': false,
        };
      }
      if (config.eventsIncluded && !config.offersIncluded) {
        query = {
          ...query,
          'event.type': { $in: [EventTypes.FORMAL, EventTypes.INFORMAL] },
        };
      } else if (config.offersIncluded && !config.eventsIncluded) {
        query = {
          ...query,
          'event.type': EventTypes.OFFER,
        };
      } else if (config.offersIncluded && config.eventsIncluded) {
        query = {
          ...query,
          'event.type': {
            $in: [EventTypes.OFFER, EventTypes.FORMAL, EventTypes.INFORMAL],
          },
        };
      }
      if (config.name == 'Food & Drinks') {
        console.log('query after type:----->', query);
      }
      const eventsResult = await this.fetchEventsV2(
        new mongoose.Types.ObjectId(user.id),
        longitude,
        latitude,
        age,
        query,
        1,
        config.limit,
        start,
        maxDistance,
        startDate,
        endDate,
      );
      // data.push({ [`${config.name}`]: eventsResult });
      data[`${config.name}`] = eventsResult;
    }

    return {
      success: true,
      message: 'Dashboard fetched successfully',
      data: {
        Free: freeEvents,
        ...data,
        'Private Invitations': privateEvents,
      },
    };
  }

  async getDashboardV2(
    user: DecodedUser,
    latitude: number,
    longitude: number,
    maxDistance: number,
    search: string,
    categoryIds?: Array<string>,
    startDate?: any,
    endDate?: any,
  ) {
    let match = {};
    if (categoryIds.length) {
      match['event.categories'] = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    const currentDate = currentDateTz();
    let start = getZeroDateTz(new Date());
    if (!startDate && !endDate) {
      // If no date is provided then the events should be fetched for the current date and future dates also the end time should be greater than the current time
      match['event.schedule.date'] = { $gte: start };
      match['event.schedule.durations.endTime'] = { $gte: currentDate };
    } else if (startDate && endDate) {
      start = getZeroBodyDateTz(startDate);
      const end = getZeroBodyDateTz(endDate);
      if (getStringBodyDateTz(start) === getStringBodyDateTz(end)) {
        if (
          getStringBodyDateTz(start) === getStringDateCurrentTz(currentDate) //2024-05-13T00:00:00.000Z == 2024-05-13T00:00:00.000Z
        ) {
          console.log('start is equals to current');
          // If the requested query is for today only then the end time should be greater than the current time
          match['event.schedule.date'] = getZeroDateTz(new Date());
          match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
        } else {
          console.log('start is not equals to current');
          // If the start and end date are the same e.g. 2024-06-01
          match['event.schedule.date'] = start;
        }
      } else if (end > start) {
        if (getStringBodyDateTz(start) === getStringDateTz(currentDate)) {
          // If the start date is today and the end date is greater than today e.g. [2024-05-13 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: currentDateTz() }, // 2024-05-13T00:00:00.000Z
            },
          };
        } else {
          // If the end date is greater than the start date e.g. [2024-06-01 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: start },
            },
          };
        }
      } else {
        // If the request date is in past
        match['event.schedule.date'] = { $gte: currentDate };
        match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
      }
    }

    if (search) {
      // Search matching business profile name
      const matchingBusinesses = await this.businessProfileModel.find({
        name: { $regex: search, $options: 'i' },
      });
      // keep the search queries as it is, just add the business profile ids to the match query if the event creatorType is BusinessProfile
      const businessProfileIds = matchingBusinesses.map(
        (business) => business._id,
      );
      match['$or'] = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.keywords': { $regex: search, $options: 'i' } },
        { 'event.businessProfile': { $in: businessProfileIds } },
      ];
    }

    let age = 0;
    if (!user.isGuest) {
      const foundUser = await this.userModel.findById(user.id);
      age = foundUser.age ? foundUser.age : 0;
    }

    const freeEventsMatch = {
      ...match,
      'event.type': { $ne: EventTypes.PRIVATE },
      'event.isFree': true,
    };
    const privateEventsMatch = {
      ...match,
      'event.participants': { $in: [new mongoose.Types.ObjectId(user.id)] },
      'event.type': EventTypes.PRIVATE,
    };
    const freeEvents = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      freeEventsMatch,
      1,
      15,
      start,
      maxDistance,
      startDate,
      endDate,
    );
    const privateEvents = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      privateEventsMatch,
      1,
      15,
      start,
      maxDistance,
      startDate,
      endDate,
    );

    let data = {};
    const dashboardConfigs = await this.dashboardConfigModel.find().sort({
      sortOrder: 1,
    });
    console.log('dashboardConfigs', dashboardConfigs.length);
    for (let i = 0; i < dashboardConfigs.length; i++) {
      const config = dashboardConfigs[i];
      if (match['event.categories']) {
        delete match['event.categories'];
      }
      // if (config.name == 'Food & Drinks') {
      //   // console.log('query after type:----->', match);
      // }
      let query = { ...match };
      if (categoryIds.length) {
        const sameCategories = [];
        categoryIds.forEach((id) => {
          if (config.categories.includes(new mongoose.Types.ObjectId(id))) {
            sameCategories.push(new mongoose.Types.ObjectId(id));
          }
        });
        if (!sameCategories.length) {
          continue;
        } else {
          query = {
            ...query,
            'event.categories': {
              $in: sameCategories,
            },
          };
        }
      } else {
        query = {
          ...query,
          'event.categories': { $in: config.categories },
        };
      }
      if (!config.freeIncluded) {
        query = {
          ...query,
          'event.isFree': false,
        };
      }
      if (config.eventsIncluded && !config.offersIncluded) {
        query = {
          ...query,
          'event.type': { $in: [EventTypes.FORMAL, EventTypes.INFORMAL] },
        };
      } else if (config.offersIncluded && !config.eventsIncluded) {
        query = {
          ...query,
          'event.type': EventTypes.OFFER,
        };
      } else if (config.offersIncluded && config.eventsIncluded) {
        query = {
          ...query,
          'event.type': {
            $in: [EventTypes.OFFER, EventTypes.FORMAL, EventTypes.INFORMAL],
          },
        };
      }
      // if (config.name == 'Food & Drinks') {
      //   console.log('query after type:----->', query);
      // }
      const eventsResult = await this.fetchEventsV2(
        new mongoose.Types.ObjectId(user.id),
        longitude,
        latitude,
        age,
        query,
        1,
        config.limit,
        start,
        maxDistance,
        startDate,
        endDate,
      );
      // data.push({ [`${config.name}`]: eventsResult });
      data[`${config.name}`] = eventsResult;
    }

    return {
      success: true,
      message: 'Dashboard fetched successfully',
      data: {
        Free: freeEvents,
        ...data,
        'Private Invitations': privateEvents,
      },
    };
  }

  async dashboardFixedCarouselEvents(
    user: DecodedUser,
    latitude: number,
    longitude: number,
    maxDistance: number,
    search: string,
    categoryIds?: Array<string>,
    startDate?: any,
    endDate?: any,
  ) {
    if(user.userType !== UserTypes.USER && user.userType !== UserTypes.GUEST) {
      return {
        success: false,
        message: 'Please provide a valid user',
      };
    }
    let match = {};
    if (categoryIds.length) {
      match['event.categories'] = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    const currentDate = currentDateTz();
    let start = getZeroDateTz(new Date());
    if (!startDate && !endDate) {
      // If no date is provided then the events should be fetched for the current date and future dates also the end time should be greater than the current time
      match['event.schedule.date'] = { $gte: start };
      match['event.schedule.durations.endTime'] = { $gte: currentDate };
    } else if (startDate && endDate) {
      start = getZeroBodyDateTz(startDate);
      const end = getZeroBodyDateTz(endDate);
      if (getStringBodyDateTz(start) === getStringBodyDateTz(end)) {
        if (
          getStringBodyDateTz(start) === getStringDateCurrentTz(currentDate) //2024-05-13T00:00:00.000Z == 2024-05-13T00:00:00.000Z
        ) {
          console.log('start is equals to current');
          // If the requested query is for today only then the end time should be greater than the current time
          match['event.schedule.date'] = getZeroDateTz(new Date());
          match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
        } else {
          console.log('start is not equals to current');
          // If the start and end date are the same e.g. 2024-06-01
          match['event.schedule.date'] = start;
        }
      } else if (end > start) {
        if (getStringBodyDateTz(start) === getStringDateTz(currentDate)) {
          // If the start date is today and the end date is greater than today e.g. [2024-05-13 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: currentDateTz() }, // 2024-05-13T00:00:00.000Z
            },
          };
        } else {
          // If the end date is greater than the start date e.g. [2024-06-01 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: start },
            },
          };
        }
      } else {
        // If the request date is in past
        match['event.schedule.date'] = { $gte: currentDate };
        match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
      }
    }

    if (search) {
      // Search matching business profile name
      const matchingBusinesses = await this.businessProfileModel.find({
        name: { $regex: search, $options: 'i' },
      });
      // keep the search queries as it is, just add the business profile ids to the match query if the event creatorType is BusinessProfile
      const businessProfileIds = matchingBusinesses.map(
        (business) => business._id,
      );
      match['$or'] = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.keywords': { $regex: search, $options: 'i' } },
        { 'event.businessProfile': { $in: businessProfileIds } },
      ];
    }

    let age = 0;
    if (!user.isGuest) {
      const foundUser = await this.userModel.findById(user.id);
      age = foundUser.age ? foundUser.age : 0;
    }

    const freeEventsMatch = {
      ...match,
      'event.type': { $ne: EventTypes.PRIVATE },
      'event.isFree': true,
    };
    const privateEventsMatch = {
      ...match,
      'event.participants': { $in: [new mongoose.Types.ObjectId(user.id)] },
      'event.type': EventTypes.PRIVATE,
    };
    const freeEvents = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      freeEventsMatch,
      1,
      15,
      start,
      maxDistance,
      startDate,
      endDate,
    );
    const privateEvents = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      privateEventsMatch,
      1,
      15,
      start,
      maxDistance,
      startDate,
      endDate,
    );
    return {
      success: true,
      message: 'Dashboard fetched successfully',
      data: {
        Free: freeEvents,
        'Private Invitations': privateEvents,
      },
    };
  }

  async getDashboardCarouselEvent(
    user: DecodedUser,
    carouselId: string,
    latitude: number,
    longitude: number,
    maxDistance: number,
    search: string,
    categoryIds?: Array<string>,
    startDate?: any,
    endDate?: any,
  ) {
    if (!mongoose.isValidObjectId(carouselId)) {
      return {
        success: false,
        message: 'Please provide a valid id',
      };
    }

    let match = {};
    if (categoryIds.length) {
      match['event.categories'] = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    const currentDate = currentDateTz();
    let start = getZeroDateTz(new Date());
    // if (!startDate && !endDate) {
    //   // If no date is provided then the events should be fetched for the current date and future dates also the end time should be greater than the current time
    //   match['event.schedule.date'] = { $gte: start };
    //   match['event.schedule.durations.endTime'] = { $gte: currentDate };
    // } else if (startDate && endDate) {
    //   start = getZeroBodyDateTz(startDate);
    //   const end = getZeroBodyDateTz(endDate);
    //   if (getStringBodyDateTz(start) === getStringBodyDateTz(end)) {
    //     if (
    //       getStringBodyDateTz(start) === getStringDateCurrentTz(currentDate) //2024-05-13T00:00:00.000Z == 2024-05-13T00:00:00.000Z
    //     ) {
    //       console.log('start is equals to current');
    //       // If the requested query is for today only then the end time should be greater than the current time
    //       match['event.schedule.date'] = getZeroDateTz(new Date());
    //       match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
    //     } else {
    //       console.log('start is not equals to current');
    //       // If the start and end date are the same e.g. 2024-06-01
    //       match['event.schedule.date'] = start;
    //     }
    //   } else if (end > start) {
    //     if (getStringBodyDateTz(start) === getStringDateTz(currentDate)) {
    //       // If the start date is today and the end date is greater than today e.g. [2024-05-13 to 2024-06-30]
    //       match['event.schedule.durations'] = {
    //         $elemMatch: {
    //           startTime: { $lte: end },
    //           endTime: { $gte: currentDateTz() }, // 2024-05-13T00:00:00.000Z
    //         },
    //       };
    //     } else {
    //       // If the end date is greater than the start date e.g. [2024-06-01 to 2024-06-30]
    //       match['event.schedule.durations'] = {
    //         $elemMatch: {
    //           startTime: { $lte: end },
    //           endTime: { $gte: start },
    //         },
    //       };
    //     }
    //   } else {
    //     // If the request date is in past
    //     match['event.schedule.date'] = { $gte: currentDate };
    //     match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
    //   }
    // }

    if (search) {
      // Search matching business profile name
      const matchingBusinesses = await this.businessModel.find({
        name: { $regex: search, $options: 'i' },
      });
      // keep the search queries as it is, just add the business profile ids to the match query if the event creatorType is BusinessProfile
      const businessProfileIds = matchingBusinesses.map(
        (business) => business._id,
      );
      match['$or'] = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.keywords': { $regex: search, $options: 'i' } },
        { 'event.businessProfile': { $in: businessProfileIds } },
      ];
    }

    let age = 0;
    if (!user.isGuest) {
      const foundUser = await this.userModel.findById(user.id);
      age = foundUser.age ? foundUser.age : 0;
    }
    let data = {};
    const config = await this.dashboardConfigModel.findById(carouselId).sort({
      sortOrder: 1,
    });

    if (match['event.categories']) {
      delete match['event.categories'];
    }
    let query = { ...match };
    if (categoryIds.length) {
      const sameCategories = [];
      categoryIds.forEach((id) => {
        if (config.categories.includes(new mongoose.Types.ObjectId(id))) {
          sameCategories.push(new mongoose.Types.ObjectId(id));
        }
      });
      if (sameCategories.length) {
        query = {
          ...query,
          'event.categories': {
            $in: sameCategories,
          },
        };
      }
    } else {
      query = {
        ...query,
        'event.categories': { $in: config.categories },
      };
    }
    if (!config.freeIncluded) {
      query = {
        ...query,
        'event.isFree': false,
      };
    }
    if (config.eventsIncluded && !config.offersIncluded) {
      query = {
        ...query,
        'event.type': { $in: [EventTypes.FORMAL, EventTypes.INFORMAL] },
      };
    } else if (config.offersIncluded && !config.eventsIncluded) {
      query = {
        ...query,
        'event.type': EventTypes.OFFER,
      };
    } else if (config.offersIncluded && config.eventsIncluded) {
      query = {
        ...query,
        'event.type': {
          $in: [EventTypes.OFFER, EventTypes.FORMAL, EventTypes.INFORMAL],
        },
      };
    }
    console.log("'query after type:----->', query);");
    const eventsResult = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      query,
      1,
      config.limit,
      start,
      maxDistance,
      startDate,
      endDate,
    );

    return {
      success: true,
      message: 'Dashboard fetched successfully',
      data: {
        eventsResult,
      },
    };
  }

  async getDashboardMapView(
    user: DecodedUser,
    latitude: number,
    longitude: number,
    maxDistance: number,
    search: string,
    limit: number,
    page: number,
    type: string,
    categoryIds?: Array<string>,
    startDate?: Date,
    endDate?: Date,
  ) {
    let match = {};
    if (categoryIds.length) {
      match['event.categories'] = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    const currentDate = currentDateTz();
    let start = getZeroDateTz(new Date());
    if (!startDate && !endDate) {
      // If no date is provided then the events should be fetched for the current date and future dates also the end time should be greater than the current time
      match['event.schedule.date'] = { $gte: start };
      match['event.schedule.durations.endTime'] = { $gte: currentDate };
    } else if (startDate && endDate) {
      start = getZeroBodyDateTz(startDate);
      const end = getZeroBodyDateTz(endDate);
      if (getStringBodyDateTz(start) === getStringBodyDateTz(end)) {
        if (
          getStringBodyDateTz(start) === getStringDateTz(currentDate) //2024-05-13T00:00:00.000Z == 2024-05-13T00:00:00.000Z
        ) {
          // If the requested query is for today only then the end time should be greater than the current time
          match['event.schedule.date'] = getZeroDateTz(new Date());
          match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
        } else {
          // If the start and end date are the same e.g. 2024-06-01
          match['event.schedule.date'] = start;
        }
      } else if (end > start) {
        if (getStringBodyDateTz(start) === getStringDateTz(currentDate)) {
          // If the start date is today and the end date is greater than today e.g. [2024-05-13 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: currentDateTz() }, // 2024-05-13T00:00:00.000Z
            },
          };
        } else {
          // If the end date is greater than the start date e.g. [2024-06-01 to 2024-06-30]
          match['event.schedule.durations'] = {
            $elemMatch: {
              startTime: { $lte: end },
              endTime: { $gte: start },
            },
          };
        }
      } else {
        // If the request date is in past
        match['event.schedule.date'] = { $gte: currentDate };
        match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
      }
    }
    if (search) {
      // Search matching business profile name
      const matchingBusinesses = await this.businessProfileModel.find({
        name: { $regex: search, $options: 'i' },
      });
      // keep the search queries as it is, just add the business profile ids to the match query if the event creatorType is BusinessProfile
      const businessProfileIds = matchingBusinesses.map(
        (business) => business._id,
      );
      match['$or'] = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.keywords': { $regex: search, $options: 'i' } },
        { 'event.businessProfile': { $in: businessProfileIds } },
      ];
    }

    let age = 0;
    if (!user.isGuest) {
      const foundUser = await this.userModel.findById(user.id);
      age = foundUser.age ? foundUser.age : 0;
    }
    if (!type) {
      match['event.type'] = {
        $in: [EventTypes.FORMAL, EventTypes.INFORMAL, EventTypes.OFFER],
      };
    } else {
      if (type == EventTypes.PRIVATE) {
        match['event.type'] = EventTypes.PRIVATE;
        match['event.participants'] = {
          $in: [new mongoose.Types.ObjectId(user.id)],
        };
      } else if (type == 'free') {
        match['event.isFree'] = true;
        match['event.type'] = {
          $in: [EventTypes.FORMAL, EventTypes.INFORMAL, EventTypes.OFFER],
        };
      } else {
        const dashConfig = await this.dashboardConfigModel.findOne({
          name: { $regex: type.toLowerCase(), $options: 'i' },
        });
        if (!dashConfig) {
          match['event.type'] = type;
        } else {
          if (match['event.type']) {
            delete match['event.type'];
          }
          if (match['event.categories']) {
            delete match['event.categories'];
          }
          match['event.categories'] = {
            $in: dashConfig.categories,
          };
          if (!dashConfig.freeIncluded) {
            match['event.isFree'] = false;
          }
          if (dashConfig.eventsIncluded && !dashConfig.offersIncluded) {
            match['event.type'] = {
              $in: [EventTypes.FORMAL, EventTypes.INFORMAL],
            };
          } else if (dashConfig.offersIncluded && !dashConfig.eventsIncluded) {
            match['event.type'] = EventTypes.OFFER;
          } else if (dashConfig.offersIncluded && dashConfig.eventsIncluded) {
            match['event.type'] = {
              $in: [EventTypes.FORMAL, EventTypes.INFORMAL, EventTypes.OFFER],
            };
          }
        }
      }
    }
    // const total = await this.eventModel.countDocuments(match);
    const nearestEvents = await this.fetchEvents(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      match,
      page,
      limit,
      start,
    );
    const total = nearestEvents.length;
    return {
      success: true,
      message: 'Dashboard data fetched successfully',
      events: nearestEvents,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // async processEventsAggregate(
  //   eventIds: Array<mongoose.Types.ObjectId>,
  //   age: number,
  //   longitude: number,
  //   latitude: number,
  //   match: any,
  //   user: DecodedUser,
  //   page: number,
  //   limit: number,
  //   start: Date,
  // ) {
  //   console.log('coordinates:::::::::::------>', longitude, latitude);
  //   const userId = new mongoose.Types.ObjectId(user.id);

  //   // Fetch events data with all necessary lookups and transformations
  //   const eventsData = await this.eventModel
  //     .aggregate([
  //       {
  //         $match: {
  //           _id: { $in: eventIds }, // Match events by provided IDs and additional criteria
  //           ...match,
  //         },
  //       },
  //       {
  //         $lookup: {
  //           // Join with categories collection
  //           from: 'categories',
  //           localField: 'category',
  //           foreignField: '_id',
  //           as: 'category',
  //         },
  //       },
  //       {
  //         $unwind: '$category', // Deconstruct the array to a single object
  //       },
  //       {
  //         $lookup: {
  //           // Join with images collection
  //           from: 'images',
  //           localField: 'images',
  //           foreignField: '_id',
  //           as: 'images',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           // Join with event locations collection
  //           from: 'eventlocations',
  //           localField: 'locations',
  //           foreignField: '_id',
  //           as: 'locations',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           // Join with age groups collection
  //           from: 'agegroups',
  //           localField: 'ageGroupsAllowed',
  //           foreignField: '_id',
  //           as: 'ageGroupsAllowed',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           // Join with users collection for user details
  //           from: 'users',
  //           localField: 'user',
  //           foreignField: '_id',
  //           as: 'userDetails',
  //         },
  //       },
  //       {
  //         $unwind: '$userDetails', // Deconstruct the array to a single object
  //       },
  //       {
  //         $lookup: {
  //           // Join with business profiles collection
  //           from: 'businessprofiles',
  //           localField: 'businessProfile',
  //           foreignField: '_id',
  //           as: 'businessProfileDetails',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           // Deconstruct the array to a single object, allowing empty arrays
  //           path: '$businessProfileDetails',
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       {
  //         $addFields: {
  //           // Add field to check if the event is followed by the user
  //           isFollowedByMe: {
  //             $cond: {
  //               if: { $eq: ['$creatorType', 'User'] },
  //               then: {
  //                 $cond: {
  //                   if: {
  //                     $ne: [
  //                       null,
  //                       {
  //                         $first: {
  //                           $filter: {
  //                             input: '$follows',
  //                             as: 'follow',
  //                             cond: {
  //                               $and: [
  //                                 { $eq: ['$$follow.follower', userId] },
  //                                 { $eq: ['$$follow.followerType', 'User'] },
  //                                 {
  //                                   $eq: [
  //                                     '$$follow.following',
  //                                     '$userDetails._id',
  //                                   ],
  //                                 },
  //                                 { $eq: ['$$follow.followingType', 'User'] },
  //                                 { $eq: ['$$follow.isBlocked', false] },
  //                               ],
  //                             },
  //                           },
  //                         },
  //                       },
  //                     ],
  //                   },
  //                   then: true,
  //                   else: false,
  //                 },
  //               },
  //               else: {
  //                 $cond: {
  //                   if: {
  //                     $ne: [
  //                       null,
  //                       {
  //                         $first: {
  //                           $filter: {
  //                             input: '$follows',
  //                             as: 'follow',
  //                             cond: {
  //                               $and: [
  //                                 { $eq: ['$$follow.follower', userId] },
  //                                 { $eq: ['$$follow.followerType', 'User'] },
  //                                 {
  //                                   $eq: [
  //                                     '$$follow.following',
  //                                     '$businessProfileDetails._id',
  //                                   ],
  //                                 },
  //                                 {
  //                                   $eq: [
  //                                     '$$follow.followingType',
  //                                     'BusinessProfile',
  //                                   ],
  //                                 },
  //                                 { $eq: ['$$follow.isBlocked', false] },
  //                               ],
  //                             },
  //                           },
  //                         },
  //                       },
  //                     ],
  //                   },
  //                   then: true,
  //                   else: false,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           // Project only the necessary fields
  //           'category._id': 1,
  //           'category.name': 1,
  //           'category.image': 1,
  //           images: { _id: 1, url: 1 },
  //           title: 1,
  //           creatorType: 1,
  //           keywords: 1,
  //           description: 1,
  //           schedule: 1,
  //           locations: 1,
  //           type: 1,
  //           status: 1,
  //           ageGroupsAllowed: { _id: 1, name: 1 },
  //           targetGenders: 1,
  //           promotionCode: 1,
  //           isFree: 1,
  //           participationCost: 1,
  //           bookingUrl: 1,
  //           notifyFollowers: 1,
  //           RSVP: 1,
  //           termsApplied: 1,
  //           termsAndConditions: 1,
  //           facebookPostId: 1,
  //           specifyForEachDay: 1,
  //           participants: 1,
  //           creatorDetails: {
  //             $cond: {
  //               if: { $eq: ['$creatorType', 'User'] },
  //               then: {
  //                 _id: '$userDetails._id',
  //                 name: '$userDetails.name',
  //                 profilePhoto: '$userDetails.profilePhoto',
  //                 email: '$userDetails.email',
  //                 bio: '$userDetails.bio',
  //                 followersCount: '$userDetails.followersCount',
  //                 profileType: 'User',
  //                 phone: '$userDetails.phone',
  //                 website: '',
  //                 isFollowedByMe: '$isFollowedByMe',
  //               },
  //               else: {
  //                 _id: '$businessProfileDetails._id',
  //                 name: '$businessProfileDetails.name',
  //                 profilePhoto: '$businessProfileDetails.profilePhoto',
  //                 email: '$businessProfileDetails.email',
  //                 bio: '$businessProfileDetails.bio',
  //                 followersCount: '$businessProfileDetails.followersCount',
  //                 profileType: 'BusinessProfile',
  //                 phone: '$businessProfileDetails.phone',
  //                 website: '$businessProfileDetails.website',
  //                 isFollowedByMe: '$isFollowedByMe',
  //               },
  //             },
  //           },
  //         },
  //       },
  //     ])
  //     .skip(!page ? 0 : (page - 1) * limit) // Pagination: skip the previous pages
  //     .limit(limit); // Limit the number of events per page

  //   // Fetch all saved and liked statuses in parallel
  //   const eventIdsList = eventsData.map((event) => event._id);
  //   const [savedStatuses, likedStatuses] = await Promise.all([
  //     this.userService.areEventsSaved(eventIdsList, user.id), // Fetch saved statuses for all events
  //     this.userService.areEventsLiked(eventIdsList, user.id), // Fetch liked statuses for all events
  //   ]);

  //   // Create maps for quick lookup of saved and liked statuses
  //   const savedStatusesMap = new Map();
  //   savedStatuses.forEach(({ eventId, isSaved }) => {
  //     savedStatusesMap.set(eventId.toString(), isSaved);
  //   });

  //   const likedStatusesMap = new Map();
  //   likedStatuses.forEach(({ eventId, isLiked }) => {
  //     likedStatusesMap.set(eventId.toString(), isLiked);
  //   });

  //   // Process each event, calculate distance, and add saved and liked statuses
  //   const result = eventsData
  //     .map((event) => {
  //       const eventCopy = JSON.parse(JSON.stringify(event)); // Deep copy to avoid modifying the original data
  //       eventCopy.isSaved = savedStatusesMap.get(event._id.toString()) || false; // Add saved status
  //       eventCopy.isLiked = likedStatusesMap.get(event._id.toString()) || false; // Add liked status

  //       // Filter out old schedules
  //       eventCopy.schedule = event.schedule.filter((schedule) => {
  //         if (new Date(schedule.date) < start) {
  //           return schedule.durations.some(
  //             (duration) => new Date(duration.endTime) >= currentDateTz(),
  //           );
  //         } else {
  //           return true;
  //         }
  //       });

  //       // Calculate the minimum distance from the event locations to the user's location
  //       let eventDistance = Infinity;
  //       event.locations.forEach((location) => {
  //         const distance = haversineDistance(
  //           latitude,
  //           longitude,
  //           location.location.coordinates[1],
  //           location.location.coordinates[0],
  //         );
  //         if (distance < eventDistance) {
  //           eventDistance = distance;
  //         }
  //       });
  //       eventCopy.distance = eventDistance; // Add distance to the event copy
  //       return eventCopy;
  //     })
  //     .filter((event) => event.schedule.length > 0); // Filter out events with no schedule

  //   // Sort events by distance in ascending order
  //   result.sort((a, b) => a.distance - b.distance);

  //   // Determine the distance of the nearest and farthest events
  //   const nearestEventDistance = result.length ? result[0].distance : 0;
  //   const farthestEventDistance = result.length
  //     ? result[result.length - 1].distance
  //     : 0;

  //   const resultArranged = [];
  //   for (
  //     let distance = nearestEventDistance;
  //     distance <= farthestEventDistance;
  //     distance += 32.1869
  //   ) {
  //     // Group events within the current distance range
  //     const events = result.filter(
  //       (event) =>
  //         event.distance >= distance && event.distance < distance + 32.1869,
  //     );
  //     if (events.length) {
  //       // Sort events by start time within the current distance range
  //       events.sort((a, b) => {
  //         if (a.schedule[0] && b.schedule[0]) {
  //           if (a.schedule[0].durations[0] && b.schedule[0].durations[0]) {
  //             const aTime = new Date(
  //               a.schedule[0].durations[0].startTime,
  //             ).getTime();
  //             const bTime = new Date(
  //               b.schedule[0].durations[0].startTime,
  //             ).getTime();
  //             return aTime - bTime;
  //           }
  //         }
  //         return 0;
  //       });
  //       resultArranged.push(...events); // Add sorted events to the final result
  //     }
  //   }
  //   return resultArranged; // Return the arranged result
  // }

  async getEventDetails(id: string, user: DecodedUser, data: GetDashboardDto) {
    const event = await this.eventModel
      .findById(id)
      .populate({ path: 'categories', select: CategoryPopulates.FOREIGN })
      .populate('images', '_id url')
      .populate('locations', LocationPopulates.FOREIGN)
      // .populate('ageGroupsAllowed', '_id name')
      .populate('user', UserPopulates.FOREIGN)
      .populate('businessProfile', BusinessPopulates.FOREIGN)
      .exec();
    if (!event) {
      return {
        success: false,
        message: 'Event not found with the id provided.',
      };
    }
    if (event.creatorType !== 'User') {
      if (event.businessProfile['isDeleted']) {
        return {
          success: false,
          message: 'Event not found with the id provided.',
        };
      }
    }
    const isSaved = await this.userService.isEventSaved(event.id, user.id);
    const isLiked = await this.userService.isEventLiked(event.id, user.id);
    const eventObj = JSON.parse(JSON.stringify(event));
    delete eventObj.locations;

    //Increase the view count of the event
    await this.eventModel.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $inc: { viewsCount: 1 } },
    );

    const eventLocs = event.locations as any;
    eventObj['isSaved'] = isSaved;
    eventObj['isLiked'] = isLiked;
    let eventDistance = 0;
    for (let l = 0; l < eventLocs.length; l++) {
      //Convert to JSON and then back to object to avoid reference issues
      const location = JSON.parse(JSON.stringify(eventLocs[l]));
      const distance = haversineDistance(
        parseInt(data.latitude),
        parseInt(data.longitude),
        location.location.coordinates[1],
        location.location.coordinates[0],
      );
      if (!eventObj.hasOwnProperty('locations')) {
        eventObj['locations'] = [];
      }
      eventObj['locations'].push({
        ...location,
        distance,
      });
      if (distance < eventDistance || eventDistance == 0) {
        eventDistance = distance;
      }
    }
    eventObj['distance'] = eventDistance;
    // set creator details
    if (event.creatorType === 'User') {
      const creator = await this.userModel.findById(event.user);
      const isFollowedByMe = await this.followModel.findOne({
        followerType: User.name,
        follower: new mongoose.Types.ObjectId(user.id),
        followingType: User.name,
        following: creator._id,
        isBlocked: false,
      });
      eventObj['creatorDetails'] = {
        _id: creator._id,
        name: creator.name,
        profilePhoto: creator.profilePhoto,
        email: creator.email,
        phone: creator.phone,
        website: '',
        bio: '',
        followersCount: creator.followersCount,
        profileType: 'User',
        isFollowedByMe: isFollowedByMe ? true : false,
        isMe: creator.id == user.id,
      };
    } else {
      const businessProfile = await this.businessModel.findById(
        event.businessProfile,
      );
      const isFollowedByMe = await this.followModel.findOne({
        followerType: User.name,
        follower: new mongoose.Types.ObjectId(user.id),
        followingType: BusinessProfile.name,
        following: businessProfile._id,
        isBlocked: false,
      });
      eventObj['creatorDetails'] = {
        _id: businessProfile._id,
        name: businessProfile.name,
        profilePhoto: businessProfile.logo,
        email: businessProfile.email,
        bio: businessProfile.bio,
        phone: businessProfile.phone,
        website: businessProfile.website,
        followersCount: businessProfile.followersCount,
        profileType: 'BusinessProfile',
        isFollowedByMe: isFollowedByMe ? true : false,
        isMe: businessProfile.id == user.id,
      };
    }
    let eventResponse = '';
    const responseDoc = await this.eventResponseModel.findOne({
      event: event._id,
      user: new mongoose.Types.ObjectId(user.id),
    });
    if (responseDoc) {
      eventResponse = responseDoc.response;
    }
    eventObj['response'] = eventResponse;
    return {
      success: true,
      message: 'Event details fetched successfully',
      event: eventObj,
    };
  }

  async deleteAccount(user: DecodedUser) {
    const foundUser = await this.userModel.findById(user.id).exec();
    if (!foundUser) {
      return {
        success: false,
        message: 'User not found with the id provided.',
      };
    }
    // Delete all the tokens associated with the user
    // await this.tokenModel.deleteMany({ userId: foundUser._id });
    // // Delete all the refferals associated with the user
    // await this.refferalModel.deleteMany({ user: foundUser._id });
    // // Delete all the business profiles associated with the user
    // await this.businessProfileModel.deleteMany({ createdBy: foundUser._id });
    // Delete all the otps associated with the user
    // await this.otpModel.deleteMany({ user: foundUser._id });
    await this.userModel.updateOne(
      { _id: foundUser._id },
      { $set: { isDeleted: true } },
    );
    await this.tokenModel.deleteMany({ userId: foundUser._id });
    // Schedule a job after 30 days to delete the user
    const date = currentDateTz();
    date.setDate(date.getDate() + 30);
    nodeSchedule.scheduleJob(date, async () => {
      if (foundUser.isDeleted) {
        await this.userService.deleteAccount(user.id);
      }
    });
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  public async generateUniqueRefferalCode() {
    const code = Math.random().toString(36).substring(2, 8);
    const foundRefferal = await this.refferalModel.findOne({
      refferalCode: code,
    });
    if (!foundRefferal) {
      return code;
    }
    return await this.generateUniqueRefferalCode();
  }

  async getPreSignedUrl(privateURL: string) {
    try {
      if (!privateURL) {
        return { success: false, message: 'Please Provie URL' };
      }
      console.log('Private URL:', privateURL);
      const fileKey = privateURL.replace(
        `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`,
        '',
      );
      console.log('File Key:', fileKey);
      const presignedUrl = await this.s3Service.getPresignedUrl(fileKey);
      console.log('Presigned URL:', presignedUrl);
      return { success: true, url: presignedUrl };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async verifyEmailviaLink(user: any, tokenId: string) {
    try {
      console.log('user:', user);

      let loginToken = null;
      if (user.userType === UserTypes.ADMIN) {
      } else if (user.userType === UserTypes.USER) {
      } else if (user.userType === UserTypes.BUSINESS) {
        console.log('inside business');
        await this.businessUserModel.findOneAndUpdate(
          {
            _id: user.id,
          },
          { $set: { isEmailVerified: true } },
        );

        const payload: JwtPayload = {
          id: user.id,
          userType: UserTypes.BUSINESS,
          // role: String(user.role),
        };

        // loginToken = await this.generateJWT(
        //   payload,
        //   TokenTypes.VERIFY_EMAIL,
        //   user.userType,
        // );
      }
      //delete token
      await this.tokenModel.deleteOne({ _id: tokenId });

      return {
        success: true,
        message: 'User Verified Successfully',
        // token: loginToken,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async passwordResetLink(email: string, userType: string) {
    try {
      let resetLink = null;
      if (userType === UserTypes.ADMIN) {
        const user = await this.adminModel.findOne({ email: email });
        if (!user) {
          return {
            success: false,
            message: 'Admin User not found!',
          };
        }
        const token = await this.generateJWT(
          {
            id: user.id,
            userType: UserTypes.ADMIN,
            // role: admin.role.toString(),
            // business:
          },
          TokenTypes.RESET_PASSWORD,
          userType,
        );
        resetLink = process.env.FORGOT_PASSWORD_REDIRECT_URL + token;
        await this.mailService.sendEmailVerificationMail(
          user.name,
          user.email,
          resetLink,
        );
      } else if (userType === UserTypes.BUSINESS) {
        const user = await this.businessUserModel.findOne({ email: email });
        if (!user) {
          return {
            success: false,
            message: 'Business User not found!',
          };
        }
        const token = await this.generateJWT(
          {
            id: user.id,
            userType: UserTypes.BUSINESS,
            // role: admin.role.toString(),
            // business:
          },
          TokenTypes.RESET_PASSWORD,
          userType,
        );
        resetLink = process.env.FORGOT_PASSWORD_REDIRECT_URL + token;
        await this.mailService.sendForgotPasswordMail2(
          user.name,
          user.email,
          resetLink,
          '15 Minuter',
        );
      } else if (userType === UserTypes.USER) {
        const user = await this.userModel.findOne({ email: email });
        if (!user) {
          return {
            success: false,
            message: 'User not found!',
          };
        }
        const token = await this.generateJWT(
          {
            id: user.id,
            userType: UserTypes.USER,
            // role: admin.role.toString(),
            // business:
          },
          TokenTypes.RESET_PASSWORD,
          userType,
        );

        resetLink = process.env.FORGOT_PASSWORD_REDIRECT_URL + token;
        await this.mailService.sendEmailVerificationMail(
          user.name,
          user.email,
          resetLink,
        );
      }
      return {
        success: true,
        message: 'Reset Password Link Sent Successfully!',
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async verifyPassReset(user: any, password: string, tokenId: string) {
    try {
      console.log('check 1:', user.userType);
      if (user.userType === UserTypes.ADMIN) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.adminModel.updateOne(
          { _id: user.id },
          { password: hashedPassword },
        );
        //delete token
        await this.tokenModel.deleteOne({ _id: tokenId });

        return {
          success: true,
          message: 'User Verified Successfully',
          // token: loginToken,
        };
      } else if (user.userType === UserTypes.USER) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.userModel.updateOne(
          { _id: user.id },
          { password: hashedPassword },
        );

        //delete token
        await this.tokenModel.deleteOne({ _id: tokenId });

        return {
          success: true,
          message: 'User Verified Successfully',
          // token: loginToken,
        };
      } else if (user.userType === UserTypes.BUSINESS) {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('hashed Pass: in Business:', hashedPassword);
        await this.businessUserModel.updateOne(
          { _id: user.id },
          { password: hashedPassword },
        );
      }
      //delete token
      await this.tokenModel.deleteOne({ _id: tokenId });

      return {
        success: true,
        message: 'User Password Resetted Successfully!',
        // token: loginToken,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async resendVerificationLink(id: string, userType: string) {
    try {
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'No Business User found!',
        };
      }
      const token = await this.generateJWT(
        {
          id: id,
          userType: userType,
          // role: admin.role.toString(),
          // business:
        },
        TokenTypes.VERIFY_EMAIL,
        userType,
      );

      const resetLink = process.env.FORGOT_PASSWORD_REDIRECT_URL + token;
      await this.mailService.sendEmailVerificationMail(
        user.name,
        user.email,
        resetLink,
      );
      return {
        success: true,
        message: 'Link resent Successfully!',
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getProfile(userId: string, userType: string) {
    try {
      let userDoc = null;
      if (userType === UserTypes.ADMIN) {
        userDoc = await this.adminModel
          .findById(userId)
          .populate('role', '_id name description');
        if (!userDoc) {
          return {
            success: false,
            message: 'Admin not found!',
          };
        }
      } else if (userType === UserTypes.USER) {
        userDoc = await this.userModel
          .findById(userId)
          .populate('role', '_id name description');
        if (!userDoc) {
          return {
            success: false,
            message: 'User not found!',
          };
        }
      } else if (userType === UserTypes.BUSINESS) {
        userDoc = await this.businessUserModel
          .findById(userId)
          // .populate('business')
          .populate({
            path: 'business',
            populate: {
              path: 'outlets',
              model: Outlet.name,
              select: LocationPopulates.FOREIGN,
            },
          })
          .populate({
            path: 'business',
            populate: {
              path: 'initialOfferId',
              model: Event.name,
              select: '_id title description categories',
            },
          })
          .populate({
            path: 'business',
            populate: {
              path: 'businessIndustry',
              model: BusinessIndustry.name,
              select: ' _id title darkIcon lightIcon',
            },
          })
          .populate('role', '_id name description');
        if (!userDoc) {
          return {
            success: false,
            message: 'Business User not found!',
          };
        }
      }
      return {
        success: true,
        message: 'User Profile Fetched Successfully',
        user: userDoc,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getDashboardCarouselEvent2(
    user: DecodedUser,
    carouselId: string,
    latitude: number,
    longitude: number,
    maxDistance: number,
    search: string,
    timeZone: string,
    categoryIds?: Array<string>,
    startDate?: any,
    endDate?: any,
  ) {
    if (!mongoose.isValidObjectId(carouselId)) {
      return {
        success: false,
        message: 'Please provide a valid id',
      };
    }

    let match = {};
    if (categoryIds.length) {
      match['event.categories'] = {
        $in: categoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    const currentDate = currentDateTz(timeZone);

    let start = getZeroDateTz(new Date(), timeZone);
    console.log('START DATE:', start);
    // if (!startDate && !endDate) {
    //   // If no date is provided then the events should be fetched for the current date and future dates also the end time should be greater than the current time
    //   match['event.schedule.date'] = { $gte: start };
    //   match['event.schedule.durations.endTime'] = { $gte: currentDate };
    // } else if (startDate && endDate) {
    //   start = getZeroBodyDateTz(startDate);
    //   const end = getZeroBodyDateTz(endDate);
    //   if (getStringBodyDateTz(start) === getStringBodyDateTz(end)) {
    //     if (
    //       getStringBodyDateTz(start) === getStringDateCurrentTz(currentDate) //2024-05-13T00:00:00.000Z == 2024-05-13T00:00:00.000Z
    //     ) {
    //       console.log('start is equals to current');
    //       // If the requested query is for today only then the end time should be greater than the current time
    //       match['event.schedule.date'] = getZeroDateTz(new Date());
    //       match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
    //     } else {
    //       console.log('start is not equals to current');
    //       // If the start and end date are the same e.g. 2024-06-01
    //       match['event.schedule.date'] = start;
    //     }
    //   } else if (end > start) {
    //     if (getStringBodyDateTz(start) === getStringDateTz(currentDate)) {
    //       // If the start date is today and the end date is greater than today e.g. [2024-05-13 to 2024-06-30]
    //       match['event.schedule.durations'] = {
    //         $elemMatch: {
    //           startTime: { $lte: end },
    //           endTime: { $gte: currentDateTz() }, // 2024-05-13T00:00:00.000Z
    //         },
    //       };
    //     } else {
    //       // If the end date is greater than the start date e.g. [2024-06-01 to 2024-06-30]
    //       match['event.schedule.durations'] = {
    //         $elemMatch: {
    //           startTime: { $lte: end },
    //           endTime: { $gte: start },
    //         },
    //       };
    //     }
    //   } else {
    //     // If the request date is in past
    //     match['event.schedule.date'] = { $gte: currentDate };
    //     match['event.schedule.durations.endTime'] = { $gte: currentDateTz() };
    //   }
    // }

    if (search) {
      // Search matching business profile name
      const matchingBusinesses = await this.businessProfileModel.find({
        name: { $regex: search, $options: 'i' },
      });
      // keep the search queries as it is, just add the business profile ids to the match query if the event creatorType is BusinessProfile
      const businessProfileIds = matchingBusinesses.map(
        (business) => business._id,
      );
      match['$or'] = [
        { 'event.title': { $regex: search, $options: 'i' } },
        { 'event.description': { $regex: search, $options: 'i' } },
        { 'event.keywords': { $regex: search, $options: 'i' } },
        { 'event.businessProfile': { $in: businessProfileIds } },
      ];
    }

    let age = 0;
    if (!user.isGuest) {
      const foundUser = await this.userModel.findById(user.id);
      age = foundUser.age ? foundUser.age : 0;
    }
    let data = {};
    const config = await this.dashboardConfigModel.findById(carouselId).sort({
      sortOrder: 1,
    });
    if (match['event.categories']) {
      delete match['event.categories'];
    }
    let query = { ...match };
    if (categoryIds.length) {
      const sameCategories = [];
      categoryIds.forEach((id) => {
        if (config.categories.includes(new mongoose.Types.ObjectId(id))) {
          sameCategories.push(new mongoose.Types.ObjectId(id));
        }
      });
      if (sameCategories.length) {
        query = {
          ...query,
          'event.categories': {
            $in: sameCategories,
          },
        };
      }
    } else {
      query = {
        ...query,
        'event.categories': { $in: config.categories },
      };
    }
    if (!config.freeIncluded) {
      query = {
        ...query,
        'event.isFree': false,
      };
    }
    if (config.eventsIncluded && !config.offersIncluded) {
      query = {
        ...query,
        'event.type': { $in: [EventTypes.FORMAL, EventTypes.INFORMAL] },
      };
    } else if (config.offersIncluded && !config.eventsIncluded) {
      query = {
        ...query,
        'event.type': EventTypes.OFFER,
      };
    } else if (config.offersIncluded && config.eventsIncluded) {
      query = {
        ...query,
        'event.type': {
          $in: [EventTypes.OFFER, EventTypes.FORMAL, EventTypes.INFORMAL],
        },
      };
    }
    const eventsResult = await this.fetchEventsV2(
      new mongoose.Types.ObjectId(user.id),
      longitude,
      latitude,
      age,
      query,
      1,
      config.limit,
      start,
      maxDistance,
      startDate,
      endDate,
    );

    return {
      success: true,
      message: 'Dashboard fetched successfully',
      data: {
        eventsResult,
      },
    };
  }
  async authGeneratePassword(length: number = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + digits + special;
  
    if (length < 4) {
      throw new Error('Password length must be at least 4 characters to include required character types.');
    }
  
    const getRandomChar = (chars: string) =>
      chars[Math.floor(Math.random() * chars.length)];
  
    // Ensure inclusion of required types
    let password = [
      getRandomChar(uppercase),
      getRandomChar(digits),
      getRandomChar(special),
      getRandomChar(lowercase),
    ];
  
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password.push(getRandomChar(allChars));
    }
  
    // Shuffle the result to avoid predictable order
    password = password.sort(() => Math.random() - 0.5);
  
    return password.join('');
  }
  

}

// Relevant-logs:--- {
//   longitude: 76.9905,
//   latitude: 29.6857,
//   match: {
//     status: 'published',
//     'schedule.date': { '$gte': 2024-06-22T00:00:00.000Z },
//     'schedule.durations.endTime': { '$gte': 2024-06-22T12:44:52.314Z }
//   }
// }

// Relevant-logs:--- {
//   longitude: 76.9905,
//   latitude: 29.6857,
//   match: {
//     status: 'published',
//     'schedule.date': { '$gte': 2024-06-22T00:00:00.000Z },
//     'schedule.durations.endTime': { '$gte': 2024-06-22T12:45:01.936Z }
//   }
// }
