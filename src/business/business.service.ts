import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import * as bcrypt from 'bcrypt';
import { CreateBusinessUserDto } from './dto/create-businessUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserDocument } from './model/businessUser.model';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import {
  DefaultBusinessDepartmentRoles,
  DefaultBusinessRoles,
} from './resourceInits/template-roles';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import {
  BusinessCreatorType,
  BusinessStatus,
  BusinessUserCreatorType,
  ProfileStatus,
  ROLES_IN_ORGANISATION,
  ScalabilityFactor,
  TEAM_SIZE_OPTIONS,
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
import { TypeDataDto } from './dto/business-type.dto';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { Department, DepartmentDocument } from './model/department.model';
import { Types } from 'aws-sdk/clients/acm';
import { Follow, FollowDocument } from 'src/user/models/follow.model';
import { User } from 'src/user/models/user.model';
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
import { EventStatus, EventTypes } from 'src/enums/event.enums';
import { ClaimStatus } from 'src/rewards/enums/rewards.enum';
import {
  UserReward,
  UserRewardDocument,
} from 'src/rewards/model/userReward.model';
import { EventLocation, EventLocationDocument } from 'src/event/models/eventLocation.model';

import { instance as logger } from 'src/logger/winston.logger';

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
    @InjectModel(UserReward.name) private readonly userRewardModel: Model<UserRewardDocument>,
    @InjectModel(EventLocation.name) private readonly eventLocationModel: Model<EventLocationDocument>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly seederService: SeederService,
    private readonly authService: AuthService,
    private readonly driveService: DriveService,
    private readonly userService: UserService,
  ) {}

  async createBusinessUser(data: CreateBusinessUserDto) {
    try {
      const foundUser = await this.businessUserModel.findOne({
        email: data.email,
      });

      if (foundUser) {
        if (
          foundUser.status === ProfileStatus.INITIATED &&
          foundUser.isEmailVerified === false
        ) {
          await this.mailService.sendBusinessUserVerificationMail(foundUser.id);
          return {
            success: true,
            message: 'Business User already found with this email, OTP resent',
          };
        }
        return {
          success: false,
          message: 'Business User already found with this email',
        };
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
      logger.error('Error:', error);
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

      //create business folder in drive
        logger.info(`userDetails: ${JSON.stringify(userDetails)}`);
      const businessFolder = await this.driveService.createFolder(userId, {
        parentDirectory: userDetails.drive,
        parentType: Drive.name,
        folderName: data.name,
      });
        logger.info(`Business Folder: ${JSON.stringify(businessFolder)}`);
      let createObj = {
        name: data.name,
        email: data.email,
        // businessCategory: businessCategoriesIds,
        // businessIndustry: new mongoose.Types.ObjectId(data.businessIndustry),
        phone: data.phone,
        countryCode: data.countryCode,
        scalabilityFactor: data.scalabilityFactor,
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        creatorType: BusinessCreatorType.BUSINESS_USER,
        creator: new mongoose.Types.ObjectId(userId),
        authorisedUser: new mongoose.Types.ObjectId(userId),
      };
      if (data.website) createObj['website'] = data.website;
      // if (data.brand && isValidObjectId(data.brand))
      // createObj['brand'] = new mongoose.Types.ObjectId(data.brand);
      const createdBusiness = await this.businessModel.create(createObj);

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

      this.seedBusinessDepartmentRoles(userId, createdBusiness._id)
        .then(() => logger.info('Business roles seeded successfully'))
        .catch((err) => logger.error('Error seeding business roles:', err));

      logger.info(`businessId: ${createdBusiness.id}`);

      const updatedToken = await this.jwtService.signAsync(
        {
          id: userId,
          userType: UserTypes.BUSINESS,
          role: userDetails.role[0].toString(),
          businessProfile: createdBusiness.id,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        },
      );
      logger.info(`udpatedToken: ${updatedToken}`);

      await this.tokenModel.findOneAndUpdate(
        { token },
        {
          $set: {
            token: updatedToken,
          },
        },
      );

      return {
        success: true,
        message: 'Business Created Successfully!',
        data: createdBusiness,
        token: updatedToken,
      };
    } catch (error) {
      logger.error('Error:', error);
      return {
        success: false,
        message: 'Something went wrong.',
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
            creator: new mongoose.Types.ObjectId(userId),
            creatorType: RoleCreatorType.BUSINESS,
            belongsTo: RoleBelonging.BUSINESS,
            business: businessId,
          });
          deptRoles.push(createdRole._id);

          // Privileges
          const privilegeKeys = Object.keys(roleData.privileges);
          for (const privilegeKey of privilegeKeys) {
            // Get/create resource
            let resourceDetails = await this.resourceModel.findOne({
              title: ResourceTypes[privilegeKey],
            });
            if (!resourceDetails) {
              resourceDetails = await this.resourceModel.create({
                title: ResourceTypes[privilegeKey],
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
      logger.info(`udpateObj: ${JSON.stringify(updateObj)}`);
      let updatedDetails = await this.businessModel.findByIdAndUpdate(
        businessId,
        {
          $set: { ...updateObj },
        },
        { new: true },
      );
      if (updateObj.addressLine1) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.ADDRESS_ADDED } },
        );
      }

      if (updateObj.businessIndustry && updateObj.businessCategories) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.TYPE_ADDED } },
        );
      }
      if (updateObj.description && updateObj.description.length > 0) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.DESCRIPTION_ADDED } },
        );
      }

      if (updateObj.cover) {
        await this.businessModel.updateOne(
          { _id: new mongoose.Types.ObjectId(businessId) },
          { $set: { status: BusinessStatus.COVER_ADDED } },
        );
      }

      updatedDetails = await this.businessModel.findById(businessId);
      logger.info(`udpatedDetails: ${JSON.stringify(updatedDetails)}`);
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

  async updateBusinessUser(id: string, data: UpdateBusinessUserDto) {
    try {
      logger.info(`updateBusinessUser id: ${id}`);
      logger.info(`updateBusinessUser data: ${JSON.stringify(data)}`);
      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });
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
  async validateBusinessUser(email: string, password: string) {
    logger.info(`email password: ${email} ${password}`);
    const user = await this.businessUserModel.findOne({ email });
    // console.log('User::', user);
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
    logger.info(`Winston Log: Validated Business User: ${validatedBusinessUser}`);
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
      // console.log('user:', user);
      const userDetails = await this.businessUserModel
        .findById(user._id)
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
        .populate('role', '_id name description')
        .select({ password: 0, createdAt: 0, updatedAt: 0, __v: 0 });
      // console.log('userDetails:', userDetails);
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
    logger.info(`Expiration Time: ${expirationTime}`);
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
    page?: number;
    limit?: number;
  }> {
    try {
      logger.info(`check 1: ${id}`);
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      const allUserIds = await this.getAllChildUserIds2(user.id);
      logger.info(`ALL USERE IDS: ${JSON.stringify(allUserIds)}`);

      const users = await this.businessUserModel.aggregate([
        {
          $match: {
            _id: {
              $in: allUserIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            isDeleted: false,
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
  async industryList(page: number, limit: number) {
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
  async businessCategoryList(id: string, page: number, limit: number) {
    try {
      logger.info(`ID: ${id}`);
      const categories = await this.businessCategoryModel
        .find({
          industry: new mongoose.Types.ObjectId(id),
          isDeleted: false,
        })
        .sort({ title: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', '_id name');
      logger.info(`categories: ${JSON.stringify(categories)}`);
      const totalDocs = await this.businessCategoryModel.countDocuments({
        industry: new mongoose.Types.ObjectId(id),
      });
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
        forcePasswordReset: data.forcePasswordReset,
        status: ProfileStatus.EMAIL_VERIFIED,
      };
      if (data.profilePhoto) {
        createObj['profilePhoto'] = data.profilePhoto;
      }
      if (data.phone && data.countryCode) {
        createObj['phone'] = data.phone;
        createObj['countryCode'] = data.countryCode;
      }

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
      await this.mailService.sendDownlineUserCredentials(
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
      logger.info(`updatedUser: ${JSON.stringify(updatedUser)}`);
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
      logger.info(`getAllChildUsersIds: ${JSON.stringify(getAllChildUsersIds)}`);
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
    return { success: true, message: 'Department updated', data: dept };
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
  ) {
    try {
      let searchQuery = {
        businessProfile: new mongoose.Types.ObjectId(user.businessProfile),
        creatorType: BusinessUser.name,
      };
      if (type) {
        searchQuery['type'] = type;
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

  async getDashboardData(user: DecodedUser, limit: number = 10) {
    try {
      const businessProfileId = new mongoose.Types.ObjectId(user.businessProfile);
      const business = await this.businessModel.findById(businessProfileId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }
  
      const [
        eventLogistics,
        rewardRedeemptions,
        typeWiseStats,
        topEvents,
      ] = await Promise.all([
        this.fetchEventLogistics(businessProfileId),
        this.fetchRewardRedemptions(businessProfileId),
        this.fetchTypeWiseStats(businessProfileId),
        this.fetchTopEvents(businessProfileId, limit),
      ]);
  
      return {
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          eventLogistics,
          rewardRedeemptions,
          typeWiseStats,
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
  
  private async fetchEventLogistics(businessProfileId: mongoose.Types.ObjectId) {
    const [result] = await this.eventModel.aggregate([
      {
        $match: {
          businessProfile: businessProfileId,
          status: EventStatus.PUBLISHED,
        },
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalViewsCount: { $sum: '$viewsCount' },
          totalEngagementCount: { $sum: '$engagementCount' },
        },
      },
    ]);
    return result ?? { totalEvents: 0, totalViewsCount: 0, totalEngagementCount: 0 };
  }
  
  private async fetchRewardRedemptions(businessProfileId: mongoose.Types.ObjectId) {
    return this.userRewardModel.countDocuments({
      businessProfile: businessProfileId,
      claimStatus: ClaimStatus.CLAIMED,
    });
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
  
    return defaultTypes.map(type => ({
      _id: type,
      count: typeMap.get(type) || 0,
    }));
  }
  
  private async fetchTopEvents(businessProfileId: mongoose.Types.ObjectId, limit: number) {
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
      { $sort: { totalEngagement: -1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          totalEngagement: 1,
          viewsCount: 1,
          engagementCount: 1,
          totalLikes: 1,
          totalShares: 1,
          totalSaved: 1,
          schedules: 1,
        },
      },
      { $limit: limit },
    ]);
  }
  

  
}
