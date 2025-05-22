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
import { Category, CategoryDocument } from 'src/models/contentCategory.model';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { S3Service } from 'src/s3.service';
import { User, UserDocument } from 'src/user/models/user.model';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { Admin, AdminDocument } from './models/admin.model';
// import { AdminRole, AdminRoleDocument } from './models/adminRole.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { TokenTypes, UserTypes } from 'src/enums/auth.enums';
import { MailService } from 'src/mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Actions, ResourceTypes, RoleBelonging, RoleCreatorType } from 'src/roles/enums/roles.enum';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Token } from 'aws-sdk';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { AuthService } from 'src/auth/auth.service';
import {
  BusinessIndustry,
  BusinessIndustryDocument,
} from 'src/business/model/businessIndustry.model';
import { CreateIndustryDto } from './dto/business-industry.dto';
import { BusinessCategoryDto } from './dto/business-category.dto';
import {
  BusinessCategory,
  BusinessCategoryDocument,
} from 'src/business/model/businessCategory.model';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ConnectableObservable } from 'rxjs';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { Template, TemplateDocument } from 'src/event/models/template.model';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AddBusinessDto } from './dto/add-business.dto';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import {
  BusinessCreatorType,
  BusinessUserCreatorType,
} from 'src/business/enums/business.enum';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import { SeederService } from 'src/seeder/seeder.service';
import { Drive } from 'src/drive/models/drive.model';
import { DriveService } from 'src/drive/drive.service';
import { DefaultBusinessDepartmentRoles } from 'src/business/resourceInits/template-roles';
import { Action, ActionDocument } from 'src/roles/models/actions.model';
import { Privilege, PrivilegeDocument } from 'src/roles/models/privilage.model';
import { Department, DepartmentDocument } from 'src/business/model/department.model';
import { Resource, ResourceDocument } from 'src/roles/models/resource.model';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(BusinessIndustry.name)
    private readonly industryModel: Model<BusinessIndustryDocument>,
    @InjectModel(CrawledEvent.name)
    private readonly crawledEventModel: Model<CrawledEventDocument>,
    @InjectModel(Category.name)
    private readonly contentCategoryModel: Model<CategoryDocument>,
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
    @InjectModel(BusinessCategory.name)
    private readonly businessCategoryModel: Model<BusinessCategoryDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    @InjectModel(BusinessUser.name) private readonly businessUserModel: Model<BusinessUserDocument>,

    @InjectModel(Department.name) private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Resource.name) private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Action.name) private readonly actionModel: Model<ActionDocument>,
    @InjectModel(Privilege.name) private readonly privilegeModel: Model<PrivilegeDocument>,
    private readonly httpService: HttpService,
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly seederService: SeederService,
    private readonly driveService: DriveService,
  ) {}

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

  async getUsers(page: number, limit: number) {
    try {
      const users = await this.userModel
        .find()
        .populate(
          'businessProfiles',
          'id _id profilePhoto name bio brandColor countryCode phone email website',
        )
        .skip((page - 1) * limit)
        .limit(limit);
      const totalUsers = await this.userModel.countDocuments();
      return {
        sucess: true,
        message: 'Users fetched successfully',
        data: users,
        total: totalUsers,
      };
    } catch (error) {
      console.log('Error:', error);
      return {
        success: false,
        message: 'Something went wrong',
      };
    }
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
        const category = await this.contentCategoryModel.findOne(findQuery);
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
        const foundCategory = await this.contentCategoryModel
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
      if (data.categories && data.categories.length > 0) {
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
        await this.adminModel.findByIdAndUpdate(foundAdmin.id, {
          $set: { forcePasswordReset: false },
        });

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

  async forceResetPassword(adminId: string, password: string, tokenId: string) {
    try {
      const admin = await this.adminModel.findById(adminId);
      if (!admin) {
        return {
          success: false,
          message: 'Admin not found with the id provided.',
        };
      }
      await this.adminModel.findByIdAndUpdate(adminId, {
        $set: { password: await bcrypt.hash(password, 10) },
      });
      await this.userService.deleteToken(tokenId);
      const payload: JwtPayload = {
        id: admin.id,
        userType: UserTypes.ADMIN,
        role: admin.role.toString(),
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
  async getAllChildAdminIds2(adminId) {
    const objectId = new mongoose.Types.ObjectId(adminId);
    console.log('objectIdque', objectId);
    const result = await this.adminModel
      .aggregate([
        {
          $match: { _id: objectId },
        },
        {
          $graphLookup: {
            from: this.adminModel.collection.name,
            startWith: '$_id',
            connectFromField: '_id',
            connectToField: 'creator',
            as: 'descendants',
            restrictSearchWithMatch: { creatorType: 'Admin' },
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

  // async createBusinessRole(
  //   roleData: Partial<BusinessRole>,
  // ): Promise<BusinessRole> {
  //   try {
  //     const newRole = new this.businessRoleModel({
  //       ...roleData,
  //       isParent: true,
  //     });
  //     return await newRole.save();
  //   } catch (error) {
  //     if (error.code === 11000) {
  //       throw new ConflictException('Role name must be unique');
  //     }
  //     throw error;
  //   }
  // }
  // async fetchRoles(adminId: string) {
  //   const allAdminIds = await this.getAllChildAdminIds(adminId);
  //   const roles = await this.roleModel.find({ creator: { $in: allAdminIds } });
  //   if (!roles.length) {
  //     return {
  //       success: false,
  //       message: 'No roles found',
  //     };
  //   }
  //   return {
  //     success: true,
  //     message: 'Roles fetched successfully',
  //     roles,
  //   };
  // }

  // async generateJWT(payload: JwtPayload, type?: string) {
  //   const token = await this.jwtService.signAsync(payload, {
  //     secret: process.env.JWT_SECRET,
  //     expiresIn: '365d',
  //   });
  //   // if (update) {
  //   //   await this.userService.updateToken(token, payload.id);
  //   // } else {
  //   await this.userService.saveToken2(token, payload.id, type);
  //   // }
  //   return token;
  // }

  // async create(permissionData: Partial<Permission>): Promise<Permission> {
  //   const newPermission = new this.permissionModel(permissionData);
  //   return newPermission.save();
  // }

  // async createRole(roleData: Partial<AdminRole>): Promise<AdminRole> {
  //   try {
  //     const newRole = new this.roleModel(roleData);
  //     return await newRole.save();
  //   } catch (error) {
  //     if (error.code === 11000) {
  //       throw new ConflictException('Role name must be unique');
  //     }
  //     throw error;
  //   }
  // }

  // async createBusinessRole(
  //   roleData: Partial<BusinessRole>,
  // ): Promise<BusinessRole> {
  //   try {
  //     const newRole = new this.businessRoleModel({
  //       ...roleData,
  //       isParent: true,
  //     });
  //     return await newRole.save();
  //   } catch (error) {
  //     if (error.code === 11000) {
  //       throw new ConflictException('Role name must be unique');
  //     }
  //     throw error;
  //   }
  // }
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
  async createCategory(userId: string, data: CreateCategoryDto) {
    try {
      let category = await this.contentCategoryModel.findOne({
        title: data.title,
      });
      if (category) {
        return {
          success: false,
          message: 'Category with this name already exists.',
        };
      }
      const createdCategory = await this.contentCategoryModel.create({
        ...data,
        createdBy: new mongoose.Types.ObjectId(userId),
      });
      console.log('CreatedCategory:', createdCategory);
      category = await this.contentCategoryModel
        .findById(createdCategory._id)
        .populate('createdBy', '_id name');
      return {
        success: true,
        message: 'New Category Created Successfully!',
        data: category,
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }
  async getCategories(page: number, limit: number) {
    return await this.contentCategoryModel
      .find()
      .sort({ sortOrder: 1 })
      .select({ createdAt: 0, updatedAt: 0, __v: 0 })
      .populate('createdBy', '_id name')
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async updateCategory(catId: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      if (!mongoose.isValidObjectId(catId)) {
        return {
          success: false,
          message: 'Please provide a valid id',
        };
      }
      const updatedCategory = await this.contentCategoryModel.findOneAndUpdate(
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
  async deleteContentCategory(catId: string) {
    try {
      if (!mongoose.isValidObjectId(catId)) {
        return {
          success: false,
          message: 'Please provide a valid id',
        };
      }
      const findCategory = await this.contentCategoryModel.findById(catId);
      if (!findCategory) {
        return {
          success: false,
          message: 'Category not found with the id provided.',
        };
      }
      await this.contentCategoryModel.findByIdAndDelete(catId);

      return {
        success: true,
        message: 'Category with given ID is Deleted Successfully.',
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
    let password = data.password;
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
    let fullPhoneNumber = data.countryCode + data.phone;
    const existingAdmin = await this.adminModel.findOne({
      $or: [{ email: data.email }, { fullPhoneNumber: fullPhoneNumber }],
    });
    if (existingAdmin) {
      return {
        success: false,
        message: 'Admin with this email or phone number already exists.',
      };
    }
    if (data.profilePhoto === '') {
      console.log('Is this coming here:');
      delete data.profilePhoto;
    }

    const createdAdmin = await this.adminModel.create({
      creatorType: RoleCreatorType.ADMIN,
      creator: new mongoose.Types.ObjectId(adminId),
      // isEmailVerified: true,
      ...data,
    });

    console.log('created Admin:', createdAdmin.id);
    const loginLink = process.env.PORTAL_URL + 'v1/admin/login';
    await this.mailService.sendDownlineUserCredentials(
      createdAdmin.name,
      createdAdmin.email,
      password,
      loginLink,
    );

    const adminDoc = await this.adminModel
      .findById(createdAdmin._id)
      .populate('creator', '_id name')
      .populate('role', '_id name');
    return {
      success: true,
      message: 'Admin created successfully',
      data: adminDoc,
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
    const updatedAdmin = await this.adminModel
      .findByIdAndUpdate(
        adminId,
        { $addToSet: { role: role._id } },
        { new: true },
      )
      .populate('role', '_id name');
    return {
      success: true,
      message: 'Role assigned to admin successfully',
      data: updatedAdmin,
    };
  }

  async isAdminAboveInHierarchy(admin: string, target: string) {
    const allAdminIds = await this.getAllChildAdminIds2(admin);
    console.log('AllAdminIds:', allAdminIds);
    if (allAdminIds.includes(target)) {
      return true;
    }
    return false;
  }

  async updateAdmin(admin: string, id: string, data: UpdateAdminDto) {
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
        const role = await this.roleModel.findById(data.role);
        if (!role) {
          return {
            success: false,
            message: 'Role not found with the name provided.',
          };
        }
        data.role = role._id;
      }
      const updatedAdmin = await this.adminModel
        .findByIdAndUpdate(id, { $set: { ...data } }, { new: true })
        .populate('role', '_id name')
        .populate('creator', '_id name');
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
      const allAdminIds = await this.getAllChildAdminIds2(adminId);
      const allMongooseIds = allAdminIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );
      const admins = await this.adminModel
        .find({ _id: { $in: allMongooseIds } })
        .populate('role', '_id name')
        .populate('creator', '_id name')
        .sort({ createdAt: -1 })
        .select({ password: 0 })
        .skip((page - 1) * limit)
        .limit(limit);
      const totalAdmins = await this.adminModel.countDocuments({
        _id: { $in: allMongooseIds },
      });
      console.log('totalAdmins:', totalAdmins);
      return {
        success: true,
        message: 'Admins fetched successfully',
        data: admins,
        page,
        limit,
        total: totalAdmins,
        pages: Math.ceil(totalAdmins / limit),
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
          updatedAt: 0,
          __v: 0,
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('creator', '_id name');
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
        .populate('brand', '_id name')
        .populate('businessIndustry')
        .populate('businessCategories')
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
      console.error(error);
      return {
        success: false,
        message: 'Error fetching business',
      };
    }
  }

  async createBusinessIndustry(id: string, data: CreateIndustryDto) {
    try {
      const industry = await this.industryModel.findOne({ title: data.title });
      if (industry) {
        return {
          success: false,
          message: 'Industry already exist with given Title.',
        };
      }
      const createdIndustry = await this.industryModel.create({
        ...data,
        createdBy: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Industry Created Successfully.',
        data: createdIndustry,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async createBusinessCategory(id: string, data: BusinessCategoryDto) {
    try {
      const industry = await this.industryModel.findById(data.industry);
      if (!industry) {
        return {
          success: false,
          message: 'Industry Not Found.',
        };
      }
      const category = await this.businessCategoryModel.findOne({
        title: data.title,
        industry: new mongoose.Types.ObjectId(data.industry),
      });
      if (category) {
        return {
          success: false,
          message: 'Category already exist with given Title.',
        };
      }
      data.industry = industry._id;
      const createdCategory = await this.businessCategoryModel.create({
        ...data,
        createdBy: new mongoose.Types.ObjectId(id),
      });
      return {
        success: true,
        message: 'Industry Created Successfully.',
        data: createdCategory,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async getBusinessIndustry(page: number, limit: number) {
    try {
      const industries = await this.industryModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', '_id name');
      console.log('Industries:', industries);
      const totalDocs = await this.industryModel.countDocuments();
      return {
        success: true,
        message: 'Business Industries fetched Successfully.',
        data: industries,
        total: totalDocs,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async deleteBusinessCategory(catId: string) {
    try {
      if (!mongoose.isValidObjectId(catId)) {
        return {
          success: false,
          message: 'Please provide a valid id',
        };
      }
      const findCategory = await this.businessCategoryModel.findById(catId);
      if (!findCategory) {
        return {
          success: false,
          message: 'Category not found with the id provided.',
        };
      }
      await this.businessCategoryModel.findByIdAndDelete(catId);

      return {
        success: true,
        message: 'Category with given ID is Updated Successfully!',
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }

  async createTemplate(adminId: string, data: CreateTemplateDto) {
    try {
      const template = await this.templateModel.findOne({ title: data.title });
      if (template) {
        return {
          success: false,
          message: 'Template with this title already exists.',
        };
      }

      let categoryObjectIds = [];
      if (data.contentCategories) {
        console.log('date.contentCategories:', data.contentCategories);
        for (let i = 0; i < data.contentCategories.length; i++) {
          console.log('data.categories[i]:', data.contentCategories[i]);
          const foundCategory = await this.contentCategoryModel.findById(
            data.contentCategories[i],
          );
          if (!foundCategory) {
            return {
              success: false,
              message: `Category not found with the id provided: ${data.contentCategories[i]}`,
            };
          } else {
            categoryObjectIds.push(foundCategory._id);
          }
        }
        data.contentCategories = categoryObjectIds;
      }
      let busCategoryObjectIds = [];
      if (data.businessCategories) {
        for (let i = 0; i < data.businessCategories.length; i++) {
          const foundCategory = await this.businessCategoryModel
            .findById(data.businessCategories[i])
            .exec();
          if (!foundCategory) {
            return {
              success: false,
              message: `Category not found with the id provided: ${data.businessCategories[i]}`,
            };
          } else {
            busCategoryObjectIds.push(foundCategory._id);
          }
        }
        data.businessCategories = categoryObjectIds;
      }
      data.businessIndustry = new mongoose.Types.ObjectId(
        data.businessIndustry,
      );

      const createdTemplate = await this.templateModel.create({
        ...data,
        creatorType: Admin.name,
        categories: data.contentCategories,
        user: new mongoose.Types.ObjectId(adminId),
      });
      console.log('CreatedTemplate:', createdTemplate);
      return {
        success: true,
        message: 'New Template Created Successfully!',
        data: createdTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async updateTemplate(adminId: string, id: string, data: UpdateTemplateDto) {
    try {
      const template = await this.templateModel.findById(id);
      if (!template) {
        return {
          success: false,
          message: 'Template not found.',
        };
      }

      let categoryObjectIds = [];
      if (data.contentCategories) {
        console.log('date.contentCategories:', data.contentCategories);
        for (let i = 0; i < data.contentCategories.length; i++) {
          console.log('data.categories[i]:', data.contentCategories[i]);
          const foundCategory = await this.contentCategoryModel.findById(
            data.contentCategories[i],
          );
          if (!foundCategory) {
            return {
              success: false,
              message: `Category not found with the id provided: ${data.contentCategories[i]}`,
            };
          } else {
            categoryObjectIds.push(foundCategory._id);
          }
        }
        data.contentCategories = categoryObjectIds;
      }
      let busCategoryObjectIds = [];
      if (data.businessCategories) {
        for (let i = 0; i < data.businessCategories.length; i++) {
          const foundCategory = await this.businessCategoryModel
            .findById(data.businessCategories[i])
            .exec();
          if (!foundCategory) {
            return {
              success: false,
              message: `Category not found with the id provided: ${data.businessCategories[i]}`,
            };
          } else {
            busCategoryObjectIds.push(foundCategory._id);
          }
        }
        data.businessCategories = categoryObjectIds;
      }
      if (data.businessIndustry) {
        data.businessIndustry = new mongoose.Types.ObjectId(
          data.businessIndustry,
        );
      }
      let updateObj: any = {};

      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });

      if (data.contentCategories) {
        updateObj.categories = data.contentCategories;
      }

      const updatedTemplate = await this.templateModel.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: {
            ...updateObj,
          },
        },
        { new: true },
      );
      console.log('UpdatedTemplate:', updatedTemplate);
      return {
        success: true,
        message: 'Template Updated Successfully.',
        data: updatedTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getTemplates(
    page: number,
    limit: number,
    businessIndustry: string,
    type: string,
  ) {
    try {
      let searchQuery = {};
      if (businessIndustry) {
        searchQuery['businessIndustry'] = new mongoose.Types.ObjectId(
          businessIndustry,
        );
      }
      if (type) {
        searchQuery['type'] = type;
      }
      searchQuery['creatorType'] = Admin.name;

      const templates = await this.templateModel
        .find(searchQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('categories', '_id title')
        .populate('businessCategories', '_id title')
        .populate('businessIndustry', '_id title');
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

  async getTemplate(id: string) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        return {
          success: false,
          message: 'Please provide a valid template id',
        };
      }
      const foundTemplate = await this.templateModel
        .findById(id)
        .populate('categories', '_id title')
        .populate('businessCategories', '_id title')
        .populate('businessIndustry', '_id title');
      if (!foundTemplate) {
        return {
          success: false,
          message: 'Template not found with the id provided.',
        };
      }
      return {
        success: true,
        message: 'Template fetched successfully',
        data: foundTemplate,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async deleteTemplate(id: string) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        return {
          success: false,
          message: 'Please provide a valid template id',
        };
      }
      await this.templateModel.findByIdAndDelete(id);
      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
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
      } catch (error) {}
    }
  async addBusiness(
    user: DecodedUser,
    data: AddBusinessDto,
    logo: Express.Multer.File,
    cover: Express.Multer.File,
  ) {
    try {
      let password = await this.authService.authGeneratePassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('password', password);
      const foundUser = await this.businessUserModel.findOne({
        email: data.email,
      });
      if (foundUser) {
        return {
          success: false,
          message: 'Business User already found with this email',
        };
      }
      const ownerRole = await this.roleModel.create({
        name: 'Owner',
        creator: new mongoose.Types.ObjectId(user.id),
        creatorType: RoleCreatorType.ADMIN,
        belongsTo: RoleBelonging.BUSINESS,
        isBusinessOwner: true,
      });
      let createObj = {
        role: [new mongoose.Types.ObjectId(ownerRole.id)],
        creatorType: BusinessUserCreatorType.ADMIN,
        email: data.email,
        password: hashedPassword,
        isEmailVerified: true,
        name: data.businessUserName,
      };
      let createdUser = await this.businessUserModel.create(createObj);
      let driveDetails = await this.seederService.createDrive(
        createdUser._id,
        BusinessUser.name,
      );
      createdUser = await this.businessUserModel.findOneAndUpdate(
        { _id: createdUser.id },
        { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
        { new: true },
      );

      const loginLink = process.env.PORTAL_URL + 'v1/business/user/login';
      await this.mailService.sendDownlineUserCredentials(
        createdUser.name,
        createdUser.email,
        password,
        loginLink,
      );
      // Business Creation

      const findBusiness = await this.businessModel.findOne({
        $or: [
          { email: data.email },
          // { registrationNumber: data.registrationNumber },
        ],
      });
      if (findBusiness) {
        return {
          success: false,
          message: `Business already exist with given email:${data.businessEmail} `,
        };
      }

      const businessFolder = await this.driveService.createFolder(
        String(createdUser._id),
        {
          parentDirectory: createdUser.drive,
          parentType: Drive.name,
          folderName: data.businessName,
        },
      );
      let businessCategoriesIds = [];
      if (data.businessCategories) {
        data.businessCategories = data.businessCategories.split(',');
        for (let category of data.businessCategories) {
          if (!mongoose.isValidObjectId(category)) {
            return {
              success: false,
              message: 'Please provide a valid category id',
            };
          }
          const foundCategory =
            await this.businessCategoryModel.findById(category);
          if (!foundCategory) {
            return {
              success: false,
              message: 'Category not found',
            };
          }
          businessCategoriesIds.push(new mongoose.Types.ObjectId(category));
        }
      }
      console.log("Business Folder ID:", businessFolder.data._id);
      console.log("UserID:",user.id);
      console.log("Created User ID:",createdUser.id);

      let businessObj = {
        name: data.businessName,
        email: data.businessEmail,
        businessCategory: businessCategoriesIds,
        businessIndustry: new mongoose.Types.ObjectId(data.businessIndustry),
        phone: data.phone,
        countryCode: data.countryCode,
        roleOfCreator: data.roleOfCreator,
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        country: data.country,
        zipCode: data.zipCode,
        drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
        creatorType: BusinessCreatorType.ADMIN,
        creator: new mongoose.Types.ObjectId(user.id),
        authorisedUser: new mongoose.Types.ObjectId(createdUser._id),
        continueJourney: false,
      };
      if (data.website) businessObj['website'] = data.website;
      if (data.addressLine2) businessObj['addressLine2'] = data.addressLine2;

      const createdBusiness = await this.businessModel.create(businessObj);
      await this.businessUserModel.updateOne(
        { _id: createdBusiness.authorisedUser },
        {
          $addToSet: {
            business: createdBusiness._id,
          }
        });

      //seed Roles:
      this.seedBusinessDepartmentRoles(createdUser.id, createdBusiness._id)
      .then(() => console.log('Business roles seeded successfully'))
      .catch((err) => console.error('Error seeding business roles:', err));

        createdUser = await this.businessUserModel
          .findById(createdUser.id)
          .populate('role', '_id name')
          .populate('business')
      return {
        success: true,
        message: 'Business User Created Successfully',
        data: createdUser,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
