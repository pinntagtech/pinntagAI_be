import { Injectable } from '@nestjs/common';
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
import { TokenTypes, UserTypes } from 'src/enums/auth.enums';
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
import { RoleBelonging, RoleCreatorType } from 'src/roles/enums/roles.enum';
import { Privilege, PrivilegeDocument } from 'src/roles/models/privilage.model';

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
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly seederService: SeederService,
    private readonly authService: AuthService,
    private readonly driveService: DriveService,
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

      //seed business default roles:
      let ownerDetails = null;
      let defaultBusinessRoles = [];

      const hashedPassword = await bcrypt.hash(data.password, 10);
      delete data.password;

      let createObj = {
        // role: [new mongoose.Types.ObjectId(ownerDetails.id)],
        creatorType: BusinessUserCreatorType.SELF,
        email: data.email,
        password: hashedPassword,
        name: data.name,
      };

      //append creator to roles
      const createdUser = await this.businessUserModel.create(createObj);

      // for (let defaultRole of defaultBusinessRoles) {
      //   await this.roleModel.updateOne(
      //     { _id: defaultRole },
      //     {
      //       $set: {
      //         creator: new mongoose.Types.ObjectId(createdUser.id),
      //       },
      //     },
      //   );
      // }
      //create drive
      let driveDetails = await this.seederService.createDrive(
        createdUser._id,
        BusinessUser.name,
      );
      console.log('driveD:', driveDetails.id);

      await this.businessUserModel.updateOne(
        { _id: createdUser.id },
        { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
      );
      //sendEmaillink verification

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
      const resetLink = process.env.FORGOT_PASSWORD_REDIRECT_URL + token;
      await this.mailService.sendEmailVerificationMail(
        createdUser.name,
        createdUser.email,
        resetLink,
      );

      const updatedUser = await this.businessUserModel.findById(createdUser.id);
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

  async createBusiness(data: CreateBusinessDto) {
    // try {
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
    if (data.businessUser && !isValidObjectId(data.businessUser)) {
      return {
        success: false,
        message: 'Please provide valid Business User Id',
      };
    }
    const businessUser = await this.businessUserModel.findById(
      data.businessUser,
    );
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

    const adminDetails = await this.adminModel.findOne({
      isSuperAdmin: true,
    });

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
    // const findBusinessCategory = await this.businessCategoryModel.findById(
    //   data.businessCategory,
    // );
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
    const userDetails = await this.businessUserModel.findById(
      data.businessUser,
    );

    const businessFolder = await this.driveService.createFolder({
      parent: userDetails.drive,
      parentType: Drive.name,
      folderName: data.name,
    });

    let createObj = {
      name: data.name,
      email: data.email,
      // isRegistered: data.isRegistered,
      businessCategory: businessCategoriesIds,
      businessIndustry: new mongoose.Types.ObjectId(data.businessIndustry),
      phone: data.phone,
      countryCode: data.countryCode,
      drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
      // registrationType: data.registrationType,
      // registrationNumber: data.registrationNumber,
      // bio: data.bio,
    };
    if (data.website) createObj['website'] = data.website;

    // if (data.brand && isValidObjectId(data.brand))
    // createObj['brand'] = new mongoose.Types.ObjectId(data.brand);
    if (data.businessUser) {
      createObj['creatorType'] = BusinessCreatorType.BUSINESS_USER;
      createObj['creator'] = new mongoose.Types.ObjectId(data.businessUser);
      createObj['authorisedUser'] = new mongoose.Types.ObjectId(
        data.businessUser,
      );
    } else {
      createObj['creatorType'] = BusinessCreatorType.ADMIN;
      createObj['creator'] = new mongoose.Types.ObjectId(adminDetails._id);
    }
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
    // for (let roleName of Object.keys(DefaultBusinessRoles)) {
    //   const createdRole = await this.roleModel.create({
    //     name: DefaultBusinessRoles[roleName].name,
    //     creator: new mongoose.Types.ObjectId(data.businessUser),
    //     creatorType: RoleCreatorType.BUSINESS,
    //     belongsTo: RoleBelonging.BUSINESS,
    //     business: createdBusiness._id,
    //   });
    //   await this.privilegeModel.create({
    //     role: createdRole._id,
    //     resource: DefaultBusinessRoles[roleName].resource,
    //     privileges: DefaultBusinessRoles[roleName].privileges,
    //   });
    // }
    return {
      success: true,
      message: 'Business Created Successfully!',
      data: createdBusiness,
    };
    // }
    //  catch (error) {
    //   console.error('Error:', error);
    //   return {
    //     success: false,
    //     message: 'Something went wrong.',
    //   };
    // }
  }

  async updateBusiness(id: string, data: UpdateBusinessDto) {
    try {
      const findBusiness = await this.businessModel.findById(id);
      if (!findBusiness) {
        return {
          success: false,
          message: 'Business not found with given ID',
        };
      }

      const businessUser = await this.businessUserModel.findById(
        findBusiness.creator,
      );
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found with given ID',
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
      if (
        businessUser.status === ProfileStatus.MAPPED &&
        updateObj.isRegistered &&
        updateObj.constitution?.trim() &&
        updateObj.documentNumber?.trim() &&
        updateObj.documentType?.trim()
      ) {
        const alreadyRegistered = await this.businessModel.findOne({
          documentNumber: updateObj.documentNumber,
          documentType: updateObj.documentType,
        });
        if (alreadyRegistered) {
          return {
            success: false,
            message:
              'Business is already Registered with the provided document number and type',
          };
        }
        // updateObj['status'] = ProfileStatus.REGISTERED;
        await this.businessUserModel.updateOne(
          { _id: businessUser.id },
          { $set: { status: ProfileStatus.REGISTERED } },
        );
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
        id,
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
      if (data.business) {
        data.business = new mongoose.Types.ObjectId(data.business);
      }
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
      const token = await this.generateJWT(payload, TokenTypes.ACCESS);

      const fcmExists = await this.tokenModel.exists({
        type: TokenTypes.FCM,
        userId: user._id,
        deviceType: loginDto.deviceType ? loginDto.deviceType : 'web',
      });
      console.log('user:', user);
      const userDetails = await this.businessUserModel
        .findById(user._id)
        .populate('business');
      console.log('userDetails:', userDetails);
      return {
        success: true,
        message: 'User logged in successfully',
        user: userDetails,
        token,
        fcmExists: fcmExists ? true : false,
      };
    } else {
      return {
        success: false,
        message: validatedBusinessUser.message,
      };
    }
  }
  async generateJWT(payload: JwtPayload, type: string) {
    let expireIn = '365d';
    if (type === TokenTypes.VERIFY_EMAIL) {
      expireIn = '1d';
    }
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: expireIn,
    });
    await this.saveToken(token, payload.id, type);
    return token;
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

  async getUsersList(id: string, page: number, limit: number) {
    try {
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      const allUserIds = await this.getAllChildUsersIds(user.id);
      const users = await this.businessUserModel
        .find({
          _id: { $in: allUserIds },
        })
        .populate('role', '_id name')
        .sort({ createdAt: -1 })
        .select({ password: 0 })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        success: true,
        message: 'Business User fetched Successfully!',
        data: users,
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
  async industryList() {
    try {
      const industries = await this.businessIndModel.find();
      return {
        success: true,
        message: 'Industries fetched Successfully!',
        data: industries,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async businessCategoryList(id: string) {
    try {
      const categories = await this.businessCategoryModel.find({
        industry: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Industries fetched Successfully!',
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getCountries() {
    try {
      const countries = await this.businessCountryModel.find();
      if (!countries.length) {
        return {
          success: false,
          message: 'No Countries Found!',
        };
      }
      return {
        success: true,
        message: 'Countries fetched Successfully!',
        data: countries,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getConstitutions(id: string) {
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
      return {
        success: true,
        message: 'Constitutions fetched Successfully!',
        data: constitutions,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getBusinessDocumentTypes(id) {
    try {
      const documentTypes = await this.businessDocumentTypeModel.find({
        constitution: new mongoose.Types.ObjectId(id),
      });
      if (!documentTypes.length) {
        return {
          success: false,
          message: 'No Document Types Found!',
        };
      }
      return {
        success: true,
        message: 'Document Types fetched Successfully!',
        data: documentTypes,
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
      const updatedUser = await this.businessUserModel.findByIdAndUpdate(id, {
        $set: { isActive },
      });
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
}
