import { Inject, Injectable } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import * as bcrypt from 'bcrypt';
import { CreateBusinessUserDto } from './dto/create-businessUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserDocument } from './model/businessUser.model';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { DefaultBusinessRoles } from './resourceInits/template-roles';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import {
  BusinessCreatorType,
  BusinessUserCreatorType,
  ProfileStatus,
} from './enums/business.enum';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { Business, BusinessDocument } from './model/business.model';
import { LoginBusinessDto } from './dto/login-business.dto';
import { MailService } from 'src/mail/mail.service';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import { OtpTypes, TokenTypes, UserTypes } from 'src/enums/auth.enums';
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
import { privateDecrypt } from 'crypto';
import {
  BusinessCategory,
  BusinessCategoryDocument,
} from './model/businessCategory.model';
import { count } from 'console';
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
  ResourceTypes,
  RoleBelonging,
  RoleCreatorType,
} from 'src/roles/enums/roles.enum';
import { Privilege, PrivilegeDocument } from 'src/roles/models/privilage.model';
import { Resource, ResourceDocument } from 'src/roles/models/resource.model';
import { Action, ActionDocument } from 'src/roles/models/actions.model';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Otp, OtpDocument } from 'src/auth/models/otp.model';
import { CreateDownlineBusinessUserDto } from './dto/create-downline-businessUser.dto';
import { UserService } from 'src/user/user.service';
import { isEmail } from 'class-validator';

@Injectable()
export class BusinessService {
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
    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly seederService: SeederService,
    private readonly authService: AuthService,
    private readonly driveService: DriveService,
    private readonly userService: UserService,
  ) {}

  async createBusinessUser(data: CreateBusinessUserDto, origin: string) {
    try {
      const foundUser = await this.businessUserModel.findOne({
        email: data.email,
      });

      if (foundUser) {
        return {
          success: false,
          message: 'Business User already found with this email',
        };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      delete data.password;

      //seed business owner default role:
      const ownerRole = await this.roleModel.create({
        name: 'Owner',
        creator: new mongoose.Types.ObjectId(),
        creatorType: RoleCreatorType.BUSINESS,
        belongsTo: RoleBelonging.BUSINESS,
        isPrimaryAdmin: true,
      });

      let createObj = {
        role: [new mongoose.Types.ObjectId(ownerRole.id)],
        creatorType: BusinessUserCreatorType.SELF,
        email: data.email,
        password: hashedPassword,
        name: data.name,
      };

      //append creator to roles
      const createdUser = await this.businessUserModel.create(createObj);
      await this.roleModel.updateOne(
        { _id: ownerRole.id },
        { $set: { creator: createdUser._id } },
      );

      //create drive
      let driveDetails = await this.seederService.createDrive(
        createdUser._id,
        BusinessUser.name,
      );
      await this.businessUserModel.updateOne(
        { _id: createdUser.id },
        { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
      );
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
      await this.mailService.sendBusinessUserVerificationMail(createdUser.id);

      const updatedUser = await this.businessUserModel
        .findById(createdUser.id)
        .populate('role', '_id name');
      return {
        success: true,
        message: 'Business User Created Successfully!',
        data: updatedUser,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async verifyUser(data: VerifyEmailDto) {
    try {
      const user = await this.businessUserModel.findOne({ email: data.email });
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email already verified!',
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
      } else if (foundOtpDoc.otp !== Number(data.otp)) {
        return {
          success: false,
          message: 'Invalid Otp',
        };
      }
      await this.otpModel.deleteOne({ _id: foundOtpDoc.id });
      await this.businessUserModel.updateOne(
        { _id: user.id },
        {
          $set: { isEmailVerified: true, status: ProfileStatus.EMAIL_VERIFIED },
        },
      );
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
        message: 'Email Verified Successfully!',
        token: token,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async resendOtp(email: string) {
    try {
      const user = await this.businessUserModel.findOne({ email: email });
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email already verified!',
        };
      }
      await this.mailService.sendBusinessUserVerificationMail(user.id);
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

  async createBusiness(userId: string, data: CreateBusinessDto) {
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
      const businessUser = await this.businessUserModel.findById(userId);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found with given ID',
        };
      }
      if (businessUser.status > ProfileStatus.INITIATED) {
        return {
          success: false,
          message: 'Business User already mapped with another Business',
        };
      }

      const findBusinessIndustry = await this.businessIndModel.findById(
        data.businessIndustry,
      );
      const businessCategories = data.businessCategory.split(',');
      for (let category of businessCategories) {
        if (!isValidObjectId(category)) {
          return {
            success: false,
            message: `Please provide valid Business Category Id:${category}`,
          };
        }
      }
      const businessCategoriesIds = [];
      for (let category of businessCategories) {
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
      delete data.businessCategory;
      if (!findBusinessIndustry) {
        return {
          success: false,
          message: 'Please provide valid Business Industry',
        };
      }
      //create business folder in drive
      const userDetails = await this.businessUserModel.findById(userId);

      const businessFolder = await this.driveService.createFolder({
        parent: userDetails.drive,
        parentType: Drive.name,
        folderName: data.name,
      });

      let createObj = {
        name: data.name,
        email: data.email,
        businessCategory: businessCategoriesIds,
        businessIndustry: new mongoose.Types.ObjectId(data.businessIndustry),
        phone: data.phone,
        countryCode: data.countryCode,
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        creatorType: BusinessCreatorType.BUSINESS_USER,
        creator: new mongoose.Types.ObjectId(userId),
        authorisedUser: new mongoose.Types.ObjectId(userId),
      };
      if (data.website) createObj['website'] = data.website;

      // if (data.brand && isValidObjectId(data.brand))
      // createObj['brand'] = new mongoose.Types.ObjectId(data.brand);

      const createdBusiness = await this.businessModel.create(createObj);

      //create folder

      if (createdBusiness.authorisedUser) {
        await this.businessUserModel.updateOne(
          { _id: createdBusiness.authorisedUser },
          {
            $set: {
              business: createdBusiness._id,
              status: ProfileStatus.MAPPED,
            },
          },
        );
      }

      //create default business roles
      // for (let roleName of Object.keys(DefaultBusinessRoles)) {
      //   const createdRole = await this.roleModel.create({
      //     name: DefaultBusinessRoles[roleName].name,
      //     creator: new mongoose.Types.ObjectId(userId),
      //     creatorType: RoleCreatorType.BUSINESS,
      //     belongsTo: RoleBelonging.BUSINESS,
      //     business: createdBusiness._id,
      //   });
      //   for (let privilege of Object.keys(
      //     DefaultBusinessRoles[roleName].privileges,
      //   )) {
      //     let resourceDetails = await this.resourceModel.findOne({
      //       title: ResourceTypes[privilege],
      //     });
      //     if (!resourceDetails) {
      //       resourceDetails = await this.resourceModel.create({
      //         title: ResourceTypes[privilege],
      //       });
      //     }
      //     for (let action of DefaultBusinessRoles[roleName].privileges[
      //       privilege
      //     ]) {
      //       let actionDetails = await this.actionModel.findOne({
      //         title: Actions[action],
      //       });
      //       if (!actionDetails) {
      //         actionDetails = await this.actionModel.create({
      //           title: Actions[action],
      //         });
      //       }
      //       await this.privilegeModel.create({
      //         role: createdRole._id,
      //         resource: resourceDetails.title,
      //         action: actionDetails.title,
      //       });
      //     }
      //   }
      // }
      // Create default business roles with parallel execution for nested operations
      const rolePromises = Object.keys(DefaultBusinessRoles).map(
        async (roleName) => {
          const roleData = DefaultBusinessRoles[roleName];

          // Create the role
          const createdRole = await this.roleModel.create({
            name: roleData.name,
            creator: new mongoose.Types.ObjectId(userId),
            creatorType: RoleCreatorType.BUSINESS,
            belongsTo: RoleBelonging.BUSINESS,
            business: createdBusiness._id,
          });

          // Create privileges for this role concurrently
          const privilegePromises = Object.keys(roleData.privileges).map(
            async (privilegeKey) => {
              // Get or create the resource document
              let resourceDetails = await this.resourceModel.findOne({
                title: ResourceTypes[privilegeKey],
              });
              if (!resourceDetails) {
                resourceDetails = await this.resourceModel.create({
                  title: ResourceTypes[privilegeKey],
                });
              }

              // For each action in the privilege, get or create the action document and create a privilege record
              const actionPromises = roleData.privileges[privilegeKey].map(
                async (actionKey) => {
                  let actionDetails = await this.actionModel.findOne({
                    title: Actions[actionKey],
                  });
                  if (!actionDetails) {
                    actionDetails = await this.actionModel.create({
                      title: Actions[actionKey],
                    });
                  }
                  return this.privilegeModel.create({
                    role: createdRole._id,
                    resource: resourceDetails.title,
                    action: actionDetails.title,
                  });
                },
              );

              return Promise.all(actionPromises);
            },
          );

          await Promise.all(privilegePromises);
        },
      );

      await Promise.all(rolePromises);

      return {
        success: true,
        message: 'Business Created Successfully!',
        data: createdBusiness,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async updateBusiness(userId: string, data: UpdateBusinessDto) {
    try {
      const businessUser = await this.businessUserModel.findById(userId);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found with given ID',
        };
      }
      const businessId = businessUser.business;
      const findBusiness = await this.businessModel.findById(businessId);
      if (!findBusiness) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }

      if (businessUser.status < ProfileStatus.MAPPED) {
        return {
          success: false,
          message: 'Business User not mapped with any Business',
        };
      }

      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });
      console.log(
        businessUser.status,
        updateObj.isRegistered,
        updateObj.country,
        updateObj.constitution,
        updateObj.documentNumber,
        updateObj.documentType,
      );
      if (
        businessUser.status === ProfileStatus.MAPPED &&
        updateObj.isRegistered &&
        updateObj.country &&
        updateObj.constitution &&
        updateObj.documentNumber &&
        updateObj.documentType
      ) {
        console.log('inside registration:::::::');
        const findCountry = await this.businessCountryModel.findById(
          updateObj.country,
        );
        const findConstitution = await this.businessConstitutionModel.findById(
          updateObj.constitution,
        );
        const findDocumentType = await this.businessDocumentTypeModel.findById(
          updateObj.documentType,
        );
        if (!findCountry && !findConstitution && !findDocumentType) {
          return {
            success: false,
            message:
              'Please provide valid Country, Constitution and Document Type',
          };
        }
        updateObj['country'] = new mongoose.Types.ObjectId(updateObj.country);
        updateObj['constitution'] = new mongoose.Types.ObjectId(
          updateObj.constitution,
        );
        updateObj['documentType'] = new mongoose.Types.ObjectId(
          updateObj.documentType,
        );

        const alreadyRegistered = await this.businessModel.findOne({
          documentNumber: updateObj.documentNumber,
          documentType: new mongoose.Types.ObjectId(updateObj.documentType),
        });
        if (alreadyRegistered) {
          return {
            success: false,
            message:
              'Business is already Registered with the provided document number and type',
          };
        }
        console.log('just updating Profile status:');
        const isUpdated = await this.businessUserModel.updateOne(
          { _id: businessUser.id },
          { $set: { status: ProfileStatus.REGISTERED } },
        );
        console.log('isUpdated:', isUpdated);
      }
      if (
        businessUser.status === ProfileStatus.MAPPED &&
        updateObj.isRegistered == false
      ) {
        await this.businessUserModel.updateOne(
          { _id: businessUser.id },
          { $set: { status: ProfileStatus.REGISTERED } },
        );
      }
      if (businessUser.status === ProfileStatus.REGISTERED && updateObj.bio) {
        await this.businessUserModel.updateOne(
          { _id: businessUser.id },
          { $set: { status: ProfileStatus.COMPLETED } },
        );
      }
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
      console.log('udpateObj:', updateObj);
      const updatedDetails = await this.businessModel.findByIdAndUpdate(
        businessId,
        {
          $set: { ...updateObj },
        },
        { new: true },
      );
      console.log('udpatedDetails:', updatedDetails);
      return {
        success: true,
        message: 'Business Updated Successfully!',
        data: updatedDetails,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async updateBusinessUser(id: string, data: UpdateBusinessUserDto) {
    try {
      console.log('id:', id);
      console.log('data:', data);
      const updatedDetails = await this.businessUserModel.findOneAndUpdate(
        { _id: id },
        {
          $set: { ...data },
        },
        { new: true },
      );
      console.log('update details:', updatedDetails);
      return {
        success: true,
        message: 'Business Updated Successfully!',
        data: updatedDetails,
      };
    } catch (error) {
      console.error('Error:', error);
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
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async findOne(id: string) {
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
      console.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  //helper
  async validateBusinessUser(email: string, password: string) {
    const user = await this.businessUserModel.findOne({ email });
    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return { success: false, message: 'Incorrect password' };
      }
      if (!user.isEmailVerified) {
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
    const validatedBusinessUser = await this.validateBusinessUser(
      loginDto.email,
      loginDto.password,
    );
    console.log('Validated Business User:', validatedBusinessUser);
    if (validatedBusinessUser.success) {
      const user = validatedBusinessUser.user;

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
            userType: UserTypes.BUSINESS,
            user: user._id,
            deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
          });
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
        userId: user._id,
        deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
      });
      console.log('user:', user);
      const userDetails = await this.businessUserModel
        .findById(user._id)
        .populate('role', '_id name')
        .populate('business');
      console.log('userDetails:', userDetails);
      return {
        success: true,
        status: true,
        message: 'User logged in successfully',
        user: userDetails,
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
    await this.userService.saveToken2(token, payload.id, type, expirationTime);
    return token;
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

  async saveToken(token: string, id: string, type?: string) {
    return await this.tokenModel.create({
      token,
      userType: UserTypes.USER,
      user: new mongoose.Types.ObjectId(id),
      type,
      expiresAt: new Date(Date.now() + 86400000),
    });
  }

  async getUsersList(
    id: string,
    page: number,
    limit: number,
  ): Promise<{
    success: boolean;
    message: string;
    data?: any[];
    total?: number;
    pages?: number;
  }> {
    try {
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      const allUserIds = await this.getAllChildUsersIds(user.id);
      // const users = await this.businessUserModel
      //   .find({
      //     $match: {
      //       _id: {
      //         $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)),
      //       },
      //     },
      //   })
      //   .populate('role', '_id name')
      //   .sort({ createdAt: -1 })
      //   .select({ password: 0 })
      //   .skip((page - 1) * limit)
      //   .limit(limit)
      //   .lean();

      const users = await this.businessUserModel.aggregate([
        {
          $match: {
            _id: {
              $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
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
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);

      // const modifiedUsers = users.map((user) => ({
      //   ...user,
      //   businessId: user.business, // Rename business field
      //   business: undefined, // Remove original business field
      // }));
      const countDocs = await this.businessUserModel.countDocuments({
        _id: {
          $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      });
      return {
        success: true,
        message: 'Business User fetched Successfully!',
        data: users,
        total: countDocs,
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
  async industryList(page: number, limit: number) {
    try {
      const industries = await this.businessIndModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit);
      const totalDocs = await this.businessIndModel.countDocuments();
      return {
        success: true,
        message: 'Categories fetched Successfully.',
        data: industries,
        total: totalDocs,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async businessCategoryList(id: string, page: number, limit: number) {
    try {
      const categories = await this.businessCategoryModel
        .find({
          industry: new mongoose.Types.ObjectId(id),
        })
        .skip((page - 1) * limit)
        .limit(limit);
      const totalDocs = await this.businessCategoryModel.countDocuments({
        industry: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Industries fetched Successfully!',
        data: categories,
        total: totalDocs,
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
        .skip((page - 1) * limit);
      if (!countries.length) {
        return {
          success: false,
          message: 'No Countries Found!',
        };
      }
      const countDocs = this.businessCountryModel.countDocuments();
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
      const constitutions = await this.businessConstitutionModel.find({
        country: new mongoose.Types.ObjectId(id),
      });
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
      console.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }
  private async getAllChildUsersIds(
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
  async createDownlineUser(id: string, data: CreateDownlineBusinessUserDto) {
    try {
      const userDetails = await this.businessUserModel.findById(id);
      const foundUser = await this.businessUserModel.findOne({
        email: data.email,
      });

      if (foundUser) {
        return {
          success: false,
          message: 'Business User already found with this email',
        };
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      let createObj = {
        role: [new mongoose.Types.ObjectId(data.role)],
        creatorType: BusinessUserCreatorType.BUSINESS,
        creator: new mongoose.Types.ObjectId(id),
        name: data.name,
        email: data.email,
        password: hashedPassword,
        business: new mongoose.Types.ObjectId(userDetails.business),
        isEmailVerified: true,
        forcePasswordReset: data.forcePasswordReset,
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

      const token = await this.authService.generateJWT(
        {
          id: createdUser.id,
          userType: UserTypes.BUSINESS,
          // role: admin.role.toString(),
          // business:
        },
        TokenTypes.VERIFY_EMAIL,
        UserTypes.BUSINESS,
      );
      const loginLink = process.env.PORTAL_URL + 'v1/business/user/login';
      await this.mailService.sendDownlineUserCredentials(
        createdUser.name,
        createdUser.email,
        data.password,
        loginLink,
      );

      // const updatedUser = await this.businessUserModel.findOne({_id:createdUser.id}).select({ _id:1,isBlocked:1,role });
      const updatedUser = await this.businessUserModel.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
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
      const getAllChildUsersIds = await this.getAllChildUsersIds(id);
      if (!getAllChildUsersIds.includes(deleteId)) {
        return {
          success: false,
          message: 'You are not authorized to delete this user.',
        };
      }
      const updatedDetails = await this.businessUserModel.findOneAndUpdate(
        { _id: deleteId },
        { $set: { isDeleted: true } },
      );
      // logout from all places
      await this.tokenModel.deleteMany({
        user: new mongoose.Types.ObjectId(deleteId),
      });

      return {
        success: true,
        message: 'User Deleted Successfully.',
        data: updatedDetails,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
}
