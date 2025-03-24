import { HttpService } from '@nestjs/axios';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ConfigureDashboardDto } from 'src/auth/dto/configureDashboard.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { PlatformConfigDto } from 'src/auth/dto/platformConfig.dto';
import { UpdateConfigureDashboardDto } from 'src/auth/dto/updateDashConfig.dto';
import {
  DashboardConfig,
  DashboardConfigDocument,
} from 'src/auth/models/dashboardConfig.model';
import {
  PlatformConfig,
  PlatformConfigDocument,
} from 'src/auth/models/platformConfig.model';
import {
  BusinessLocation,
  BusinessLocationDocument,
} from 'src/business-profile/models/businessLocation.model';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { CrawledEventStatus, EventStatus } from 'src/enums/event.enums';
import { PublishCrawledEventDto } from 'src/event/dto/publish-crawled-event.dto';
import { UpdateCrawledEventDto } from 'src/event/dto/update-crawled-event.dto';
import {
  CrawledEvent,
  CrawledEventDocument,
} from 'src/event/models/crawled-event.model';
import { EventDocument } from 'src/event/models/event.model';
import {
  EventLocation,
  EventLocationDocument,
} from 'src/event/models/eventLocation.model';
import { Image, ImageDocument } from 'src/event/models/image.model';
import { manipulateImageName } from 'src/helpers/upload.helpers';
import { AgeGroup, AgeGroupDocument } from 'src/models/ageGroup.model';
import { Category, CategoryDocument } from 'src/models/category.model';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { S3Service } from 'src/s3.service';
import { User, UserDocument } from 'src/user/models/user.model';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { Admin, AdminDocument } from './models/admin.model';
// import { AdminRole, AdminRoleDocument } from './models/adminRole.model';
import {
  BusinessRole,
  BusinessRoleDocument,
} from 'src/business-profile/models/businessRole.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { TokenTypes, UserTypes } from 'src/enums/auth.enums';
import { MailService } from 'src/mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { RoleCreatorType } from 'src/roles/enums/roles.enum';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Token } from 'aws-sdk';
import { Business, BusinessDocument } from 'src/business/model/business.model';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(BusinessRole.name)
    private readonly businessRoleModel: Model<BusinessRoleDocument>,
    @InjectModel(CrawledEvent.name)
    private readonly crawledEventModel: Model<CrawledEventDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Image.name)
    private readonly imageModel: Model<ImageDocument>,
    @InjectModel(BusinessLocation.name)
    private readonly businessLocationModel: Model<BusinessLocationDocument>,
    @InjectModel(AgeGroup.name)
    private readonly ageGroupModel: Model<AgeGroupDocument>,
    @InjectModel(EventLocation.name)
    private readonly eventLocationModel: Model<EventLocationDocument>,
    @InjectModel(DashboardConfig.name)
    private readonly dashboardConfigModel: Model<DashboardConfigDocument>,
    @InjectModel(PlatformConfig.name)
    private readonly platformConfigModel: Model<PlatformConfigDocument>,
    private readonly httpService: HttpService,
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async getUsers() {
    const users = await this.userModel
      .find()
      .populate(
        'businessProfiles',
        'id _id profilePhoto name bio brandColor countryCode phone email website',
      )
      .exec();
    return users;
  }

  async getCrawledEvents(page: number, limit: number, status: string) {
    let searchQuery = {};
    if (status && status != 'all') {
      searchQuery = { status };
    } else {
      searchQuery = {
        status: CrawledEventStatus.CRAWLED,
      };
    }
    const crawledEvents = await this.crawledEventModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    const totalCrawledEvents = await this.crawledEventModel.find(searchQuery);
    const pages = Math.ceil(totalCrawledEvents.length / limit);
    return {
      success: true,
      message: 'Crawled events fetched successfully',
      count: crawledEvents.length,
      crawledEvents,
      page,
      pages,
    };
  }

  async deleteCrawledEvent(id: string) {
    const crawledEvent = await this.crawledEventModel.findById(id);
    if (!crawledEvent) {
      return {
        success: false,
        message: 'Crawled event not found',
      };
    }
    await this.crawledEventModel.findByIdAndDelete(id);
    return {
      success: true,
      message: 'Crawled event deleted successfully',
    };
  }

  async updateCrawledEvent(id: string, data: UpdateCrawledEventDto) {
    const updatedEvent = await this.crawledEventModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { ...data } },
      { new: true },
    );
    if (!updatedEvent) {
      return {
        success: false,
        message: 'No event data found with the id',
      };
    } else {
      return {
        success: true,
        message: 'Event updated successfully.',
        event: updatedEvent,
      };
    }
  }

  async publishCrawledEvent(data: PublishCrawledEventDto) {
    const { ids, user, businessProfile } = data;
    let resData = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const foundDoc = await this.crawledEventModel.findById(id);
      if (!foundDoc) {
        return {
          success: false,
          message: 'No event data found with the id',
        };
      } else {
        let images = [];
        //Download image and upload to s3 bucket
        if (foundDoc.image) {
          const file = await this.downloadImage(foundDoc.image);
          const result = await this.s3Service.s3_upload(
            file,
            process.env.AWS_S3_BUCKET_NAME,
            manipulateImageName(foundDoc.title),
            'image/jpeg',
          );
          const createdImage = await this.imageModel.create({
            url: result.Location,
          });
          images.push(createdImage._id);
        }
        //Save event location
        let findQuery = {};
        if (mongoose.isValidObjectId(foundDoc.category)) {
          findQuery = { _id: new mongoose.Types.ObjectId(foundDoc.category) };
        } else {
          findQuery = { name: foundDoc.category };
        }
        const category = await this.categoryModel.findOne(findQuery);
        if (!category) {
          return {
            success: false,
            message: 'Category not found',
          };
        }
        const allAgeGroup = await this.ageGroupModel.findOne({
          name: 'all',
        });
        const event = await this.eventModel.create({
          isFromCrawler: true,
          businessProfile: new mongoose.Types.ObjectId(businessProfile),
          user: new mongoose.Types.ObjectId(user),
          type: foundDoc.type,
          creatorType: BusinessProfile.name,
          status: EventStatus.PUBLISHED,
          category,
          images,
          title: foundDoc.title,
          description: foundDoc.description,
          schedule: foundDoc.schedule,
          // locations: [createdLocation._id],
          ageGroupsAllowed: [allAgeGroup._id],
          targetGenders: ['male', 'female', 'other'],
          promotionCode: '',
          // isFree: foundDoc.participationCost == 'Free' ? true : false,
          isFree: true,
          // participationCost: foundDoc.participationCost.split('')[1],
          participationCost: foundDoc.participationCost
            ? foundDoc.participationCost
            : '',
          bookingUrl: foundDoc.website ? foundDoc.website : '',
          offset: foundDoc.offset,
        });
        if (foundDoc.coordinates) {
          const locationObj = {
            type: 'Point',
            coordinates: [
              foundDoc.coordinates['lng'],
              foundDoc.coordinates['lat'],
            ],
          };
          // Add the location to business location as well
          const businessLocationId = await this.businessLocationModel.create({
            latitude: foundDoc.coordinates['lat'],
            longitude: foundDoc.coordinates['lng'],
            accuracy: 0,
            address1: foundDoc.address,
            address2: '',
            city: '',
            state: '',
            zip: '',
            website: foundDoc.website ? foundDoc.website : '',
            email: foundDoc.email ? foundDoc.email : '',
            phone: foundDoc.phone ? foundDoc.phone : '',
            businessProfile: new mongoose.Types.ObjectId(businessProfile),
          });
          const createdLocation = await this.eventLocationModel.create({
            location: locationObj,
            accuracy: 0,
            event: event._id,
            address1: foundDoc.address,
            address2: '',
            city: '',
            state: '',
            zip: '',
            website: foundDoc.website ? foundDoc.website : '',
            email: foundDoc.email ? foundDoc.email : '',
            phone: foundDoc.phone ? foundDoc.phone : '',
            businessLocationId: businessLocationId._id,
          });
          const updatedEvent = await this.eventModel.findByIdAndUpdate(
            event.id,
            {
              $addToSet: {
                locations: createdLocation._id,
              },
            },
            { new: true },
          );
          resData.push(updatedEvent);

          //Update the crawled event status
          await this.crawledEventModel.findByIdAndUpdate(id, {
            status: CrawledEventStatus.PUBLISHED,
          });
        } else {
          resData.push(event);
        }
      }
    }
    return {
      success: true,
      message: 'Event has been published successfully.',
      data: resData,
    };
  }

  async downloadImage(url: string) {
    return new Promise((resolve, reject) => {
      this.httpService
        .get(url, {
          responseType: 'stream',
        })
        .subscribe((response) => {
          const file = response.data;
          resolve(file);
        });
    });
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
      if (data.categories.length) {
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

  async adminLogin(loginDto: LoginDto) {
    // const role = await this.roleModel.findOne({ name: Roles.ADMIN }).exec();
    const foundAdmin = await this.adminModel.findOne({
      email: loginDto.email,
      // role: role._id,
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
        role: foundAdmin.role.toString(),
      };
      const adminDoc = JSON.parse(JSON.stringify(foundAdmin));
      delete adminDoc.password;
      delete adminDoc.__v;
      delete adminDoc.createdAt;
      delete adminDoc.updatedAt;
      delete adminDoc.isDeleted;
      delete adminDoc.creatorType;
      delete adminDoc.driveDefaultSpace;
      delete adminDoc.creator;
      delete adminDoc.creatorType;
      if (foundAdmin.forcePasswordReset) {
        const token = await this.generateJWT(
          payload,
          TokenTypes.RESET_PASSWORD,
          '5m',
        );
        return {
          success: true,
          status: false,
          message: 'Please reset your password',
          user: adminDoc,
          token,
        };
      }
      const token = await this.generateJWT(payload, TokenTypes.ACCESS);
      return {
        success: true,
        status: true,
        message: 'Admin logged in successfully',
        user: adminDoc,
        token,
      };
    }
  }

  async forceResetPassword(password: string, token: string) {
    try {
      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getProfile(id: string) {
    const admin = await this.adminModel.findById(id).select('-password');
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found with the id provided.',
      };
    }
    return {
      success: true,
      message: 'Admin found successfully',
      data: admin,
    };
  }

  async forgotPassword(origin: string, email: string) {
    const admin = await this.adminModel.findOne({ email });
    if (!admin) {
      return {
        success: false,
        message: 'No admin found with the provided email.',
      };
    } else {
      const token = await this.generateJWT(
        {
          id: admin.id,
          userType: UserTypes.ADMIN,
          role: admin.role.toString(),
        },
        TokenTypes.RESET_PASSWORD,
      );
      const resetLink = `${origin}/reset-password?token=${token}`;
      await this.mailService.sendForgotPasswordMail2(
        admin.name,
        admin.email,
        resetLink,
        '15 minutes',
      );
      return {
        success: true,
        message: 'Password reset link sent to your email.',
      };
    }
  }

  private async getAllChildAdminIds(
    adminId: string,
    collectedIds: string[] = [],
    isFirstCall = true, // Track initial call
  ): Promise<string[]> {
    if (!isFirstCall) {
      collectedIds.push(adminId);
    }
    const childAdmins = await this.adminModel
      .find({
        creator: new mongoose.Types.ObjectId(adminId),
        creatorType: 'Admin',
      })
      .select('_id');
    const childAdminIds = childAdmins.map((admin) => admin._id.toString());
    if (!childAdminIds.length) {
      return collectedIds;
    }
    for (const childId of childAdminIds) {
      await this.getAllChildAdminIds(childId, collectedIds, false);
    }
    return collectedIds;
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
    await this.userService.saveToken2(token, payload.id, type);
    return token;
  }

  async createBusinessRole(
    roleData: Partial<BusinessRole>,
  ): Promise<BusinessRole> {
    try {
      const newRole = new this.businessRoleModel({
        ...roleData,
        isParent: true,
      });
      return await newRole.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Role name must be unique');
      }
      throw error;
    }
  }
  async dbQueries() {
    try {
      // const images = await this.imageModel.find({url:{$regex:"s3.amazonaws.com"}},{url:1})
      // for(let image of images){
      //   const oldURL = image.url;
      //   const newURL = oldURL.replace("s3.amazonaws.com","s3.us-east-1.amazonaws.com")
      //   console.log("New URL:",newURL);
      //   await this.imageModel.findByIdAndUpdate(image._id,{$set:{url:newURL}})
      // }
      // let admin = await this.adminModel.findOne({});
      // let details = await this.appService.createDrive("67b6d0c73ba308a7b5ee410f",User.name);

      return {
        success: true,
        message: 'Images fetched successfully',
        data: 'All Good',
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }
  async createCategory(createCategoryDto: CreateCategoryDto) {
    try {
      const createdCategory = await this.categoryModel.create({
        ...createCategoryDto,
      });
      console.log('CreatedCategory:', createdCategory);
      return {
        success: true,
        message: 'New Category Created Successfully!',
        data: createdCategory,
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }
  async getCategories() {
    return await this.categoryModel
      .find()
      .sort({ sortOrder: 1 })
      .select({ createdAt: 0, updatedAt: 0, __v: 0 })
      .exec();
  }

  async updateCategory(catId: string, updateCategoryDto: CreateCategoryDto) {
    try {
      if (!mongoose.isValidObjectId(catId)) {
        return {
          success: false,
          message: 'Please provide a valid id',
        };
      }
      const updatedCategory = await this.categoryModel.findOneAndUpdate(
        { _id: catId },
        { $set: { ...updateCategoryDto } },
      );
      console.log('UpdatedCategory:', updatedCategory);

      return {
        success: true,
        message: 'Category with given ID is Updated Successfully!',
        data: updatedCategory,
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }

  async createAdmin(adminId: string, data: CreateAdminDto) {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found with the id provided.',
      };
    }
    data.password = await bcrypt.hash(data.password, 10);
    if (data.role) {
      const role = await this.roleModel.findById(data.role);
      if (!role) {
        return {
          success: false,
          message: 'Role not found with the id provided.',
        };
      }
      data.role = role._id;
    }
    const createdAdmin = await this.adminModel.create({
      creatorType: RoleCreatorType.ADMIN,
      creator: new mongoose.Types.ObjectId(adminId),
      ...data,
    });
    return {
      success: true,
      message: 'Admin created successfully',
      data: createdAdmin,
    };
  }

  async assignRoleToAdmin(data: AssignRoleDto) {
    const adminId = data.userId;
    const roleId = data.roleId;
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      return {
        success: false,
        message: 'Admin not found with the id provided.',
      };
    }
    const role = await this.roleModel.findById(roleId);
    if (!role) {
      return {
        success: false,
        message: 'Role not found with the id provided.',
      };
    }
    const updatedAdmin = await this.adminModel.findByIdAndUpdate(
      adminId,
      { $set: { role: role._id } },
      { new: true },
    );
    return {
      success: true,
      message: 'Role assigned to admin successfully',
      data: updatedAdmin,
    };
  }

  async isAdminAboveInHierarchy(admin: string, target: string) {
    const allAdminIds = await this.getAllChildAdminIds(admin);
    if (allAdminIds.includes(target)) {
      return true;
    }
    return false;
  }

  async updateAdmin(admin: string, id: string, data: CreateAdminDto) {
    try {
      const foundUser = await this.adminModel.findById(id);
      if (!foundUser) {
        return {
          success: false,
          message: 'User not found with the id provided.',
        };
      }
      const isTargetChild = await this.isAdminAboveInHierarchy(admin, id);
      if (!isTargetChild) {
        return {
          success: false,
          message: 'You are not authorized to perform this action.',
        };
      }
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }
      if (data.role) {
        const role = await this.roleModel.findOne({ name: data.role });
        if (!role) {
          return {
            success: false,
            message: 'Role not found with the name provided.',
          };
        }
        data.role = role._id;
      }
      const updatedAdmin = await this.adminModel.findByIdAndUpdate(
        id,
        { $set: { ...data } },
        { new: true },
      );
      return {
        success: true,
        message: 'Admin updated successfully',
        data: updatedAdmin,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getAdminsList(adminId: string, page: number, limit: number) {
    try {
      const admin = await this.adminModel.findById(adminId);
      if (!admin) {
        return {
          success: false,
          message: 'Admin not found with the id provided.',
        };
      }
      const allAdminIds = await this.getAllChildAdminIds(adminId);
      const admins = await this.adminModel
        .find({ _id: { $in: allAdminIds } })
        .populate('role', '_id name')
        .sort({ createdAt: -1 })
        .select({ password: 0 })
        .skip((page - 1) * limit)
        .limit(limit);
      const totalAdmins = await this.adminModel.find({
        creator: { $in: allAdminIds },
      });
      return {
        success: true,
        message: 'Admins fetched successfully',
        data: admins,
        page,
        limit,
        total: totalAdmins.length,
        pages: Math.ceil(totalAdmins.length / limit),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getAdminById(adminId: string, id: string) {
    try {
      const admin = await this.adminModel.findById(adminId);
      if (!admin) {
        return {
          success: false,
          message: 'Admin not found with the id provided.',
        };
      }
      const isTargetChild = await this.isAdminAboveInHierarchy(adminId, id);
      if (!isTargetChild) {
        return {
          success: false,
          message: 'You are not authorized to perform this action.',
        };
      }
      const foundAdmin = await this.adminModel
        .findById(id)
        .populate('role', '_id name')
        .select({ password: 0 });
      return {
        success: true,
        message: 'Admin fetched successfully',
        data: foundAdmin,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getConsumersList(page: number, limit: number) {
    try {
      const users = await this.userModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const totalUsers = await this.userModel.find();
      return {
        success: true,
        message: 'Consumers fetched successfully',
        data: users,
        page,
        limit,
        total: totalUsers.length,
        pages: Math.ceil(totalUsers.length / limit),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getConsumerById(id: string) {
    try {
      const foundUser = await this.userModel.findById(id);
      if (!foundUser) {
        return {
          success: false,
          message: 'User not found with the id provided.',
        };
      }
      return {
        success: true,
        message: 'User fetched successfully',
        data: foundUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getBusinessesList(page: number, limit: number) {
    try {
      const businesses = await this.businessModel
        .find()
        .select({
          password: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        })
        .limit(limit)
        .skip((page - 1) * limit);
      const totalBusinesses = await this.businessModel.find();
      return {
        success: true,
        message: 'Businesses fetched successfully',
        data: businesses,
        page,
        limit,
        total: totalBusinesses.length,
        pages: Math.ceil(totalBusinesses.length / limit),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getBusinessById(id: string) {
    try {
      const foundBusiness = await this.businessModel
        .findById(id)
        .populate('role', '_id name')
        .populate('brand', '_id name')
        .populate('businessRoles', '_id name');
      if (!foundBusiness) {
        return {
          success: false,
          message: 'Business not found with the id provided.',
        };
      }
      return {
        success: true,
        message: 'Business fetched successfully',
        data: foundBusiness,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
