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
} from './enums/business.enum';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import { Business, BusinessDocument } from './model/business.model';
import { LoginBusinessDto } from './dto/login-business.dto';
import { MailService } from 'src/mail/mail.service';
import { Token, TokenDocument } from 'src/auth/models/token.model';
import { TokenTypes } from 'src/enums/auth.enums';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Business.name) private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Token.name) private readonly tokenModel:Model<TokenDocument>,
    private readonly mailService:MailService,
  ) {}

  async createBusinessUser(data: CreateBusinessUserDto) {
    try {
      const foundUser = await this.businessUserModel.findOne({
        email: data.email,
      });

      if (!foundUser) {
        return {
          success: false,
          message: 'Business User already found with this email',
        };
      }

      //seed business default roles:
      let ownerDetails = null;
      for (let defaultRole of DefaultBusinessRoles) {
        const createDefaultRole = await this.roleModel.create(defaultRole);
        if (defaultRole.name === 'Business Owner')
          ownerDetails = createDefaultRole;
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      delete data.password;

      let createObj = {
        role: new mongoose.Types.ObjectId(ownerDetails.id),
        creatorType: BusinessUserCreatorType.SELF,
        email: data.email,
        password: hashedPassword,
      };

      const createBusinessUser = await this.businessUserModel.create(createObj);

      //sendEmaillink verification

      return {
        success: true,
        message: 'Business User Created Successfully!',
        data: createBusinessUser,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Internal Server Error!',
      };
    }
  }

  async createBusiness(data: CreateBusinessDto) {
    try {
      //unique business check

      //
      const adminDetails = await this.adminModel.findOne({
        isSuperAdmin: true,
      });
      let createObj = {
        name: data.name,
        email: data.email,
        isRegistered: data.isRegistered,
        businessCategory: data.businessCategory,
        businessIndustry: data.businessIndustry,
        phone: data.phone,
        countryCode: data.countryCode,
      };
      if (data.website) createObj['website'] = data.website;
      if (data.brand && isValidObjectId(data.brand))
        createObj['brand'] = new mongoose.Types.ObjectId(data.brand);
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

      if (createdBusiness.authorisedUser) {
        await this.businessUserModel.updateOne(
          { _id: createdBusiness.authorisedUser },
          { $set: { business: createdBusiness._id } },
        );
      }
      return {
        success: true,
        message: 'Business Created Successfully!',
        data: createdBusiness,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Internal Server Error!',
      };
    }
  }

  async updateBusiness(id: string, data: UpdateBusinessDto) {
    try {
      const updatedDetails = await this.businessModel.findByIdAndUpdate(id, {
        $set: { data },
      });
      return {
        success: true,
        message: 'Business Updated Successfully!',
        data: updatedDetails,
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        success: false,
        message: 'Internal Server Error!',
      };
    }
  }

  async search(
    page: number,
    limit: number,
    name?: string,
    businessCategory?: string,
    businessIndustry?: string,
  ) {
    try {
      const query: any = {};
      if (name) {
        query.name = { $regex: name, $options: 'i' };
      }
      if (businessCategory) {
        query.businessCategory = businessCategory;
      }
      if (businessIndustry) {
        query.businessIndustry = businessIndustry;
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
        message: 'Internal Server Error!',
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
        message: 'Internal Server Error!',
      };
    }
  }

  async validateBusiness(email: string, password: string) {
    const foundBusiness = await this.businessUserModel.findOne({ email });
    if (foundBusiness) {
      const validPassword = await bcrypt.compare(
        password,
        foundBusiness.password,
      );
      if (!validPassword) {
        return { success: false, message: 'Incorrect password' };
      }
      const business = await this.businessUserModel
        .findById(foundBusiness.id)
        .select({
          password: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        });
      return { success: true, user: business };
    } else {
      return { success: false, message: 'User not found' };
    }
  }

  async login(loginDto: LoginBusinessDto) {

    const validatedUser = await this.validateBusiness(
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
      const token = await this.generateJWT(payload);
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

  update(id: number, updateBusinessDto: UpdateBusinessDto) {
    return `This action updates a #${id} business`;
  }

  remove(id: number) {
    return `This action removes a #${id} business`;
  }
}
