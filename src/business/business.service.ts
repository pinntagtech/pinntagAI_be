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
import { TokenTypes, UserTypes } from 'src/enums/auth.enums';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { SeederService } from 'src/seeder/seeder.service';
import { UpdateBusinessUserDto } from './dto/update-businessUser.dto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly seederService: SeederService,
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
      for (let defaultRole of DefaultBusinessRoles) {
        const createDefaultRole = await this.roleModel.create(defaultRole);
        if (defaultRole.name === 'Business Owner')
          ownerDetails = createDefaultRole;
        defaultBusinessRoles.push(createDefaultRole.id);
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      delete data.password;

      let createObj = {
        role: [new mongoose.Types.ObjectId(ownerDetails.id)],
        creatorType: BusinessUserCreatorType.SELF,
        email: data.email,
        password: hashedPassword,
      };

      //append creator to roles
      const createdUser = await this.businessUserModel.create(createObj);
      for (let defaultRole of defaultBusinessRoles) {
        await this.roleModel.updateOne(
          { _id: defaultRole },
          {
            $set: {
              creator: new mongoose.Types.ObjectId(createdUser.id),
            },
          },
        );
      }
      //create drive
      await this.seederService.createDrive(createdUser._id, BusinessUser.name);
      //sendEmaillink verification

      const token = await this.generateJWT(
        {
          id: createdUser.id,
          userType: UserTypes.BUSINESS,
          // role: admin.role.toString(),
          // business:
        },
        TokenTypes.VERIFY_EMAIL,
      );
      const resetLink = `${origin}/v1/auth/verify-email?token=${token}`;
      await this.mailService.sendEmailVerificationMail(
        createdUser.name,
        createdUser.email,
        resetLink,
      );

      return {
        success: true,
        message: 'Business User Created Successfully!',
        data: createdUser,
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
      const findBusiness = await this.businessModel.findOne({
        $or: [
          { email: data.email },
          { registrationNumber: data.registrationNumber },
        ],
      });
      if (findBusiness) {
        return {
          success: false,
          message: `Business already exist with given email:${data.email} or registration number:${data.registrationNumber}`,
        };
      }

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
        registrationType: data.registrationType,
        registrationNumber: data.registrationNumber,
        bio: data.bio,
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
      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });

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
          $set: { ...data, ...updateObj },
        },
        { new: true },
      );
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

  async updateBusinessUser(id: string, data: UpdateBusinessUserDto) {
    try {
      if(data.business){
        data.business = new mongoose.Types.ObjectId(data.business)
      }
      console.log("id:",id);
      console.log("data:",data);
      const updatedDetails = await this.businessUserModel.findOneAndUpdate(
        {_id:id},
        {
          $set: { ...data },
        },
        { new: true },
      );
      console.log("update details:",updatedDetails)
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

      return {
        success: true,
        message: 'User logged in successfully',
        user: user,
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
  update(id: number, updateBusinessDto: UpdateBusinessDto) {
    return `This action updates a #${id} business`;
  }

  remove(id: number) {
    return `This action removes a #${id} business`;
  }
}
