import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ConfigureDashboardDto } from 'src/admin/dto/configureDashboard.dto';
import { LoginDto } from 'src/admin/dto/login.dto';
import { PlatformConfigDto } from 'src/admin/dto/platformConfig.dto';
import { UpdateConfigureDashboardDto } from 'src/admin/dto/updateDashConfig.dto';
import * as fs from 'fs';
import * as streamifier from 'streamifier';
import csv from 'csv-parser';
import {
  DashboardConfig,
  DashboardConfigDocument,
} from 'src/auth/models/dashboardConfig.model';
import {
  PlatformConfig,
  PlatformConfigDocument,
} from 'src/auth/models/platformConfig.model';
// import {
//   BusinessLocation,
//   BusinessLocationDocument,
// } from 'src/business-profile/models/businessLocation.model';
import {
  CrawledEventStatus,
  EventStatus,
  ReportTypes,
} from 'src/enums/event.enums';
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
import {
  Category,
  CategoryDocument,
  CategorySchema,
} from 'src/models/contentCategory.model';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { S3Service } from 'src/s3.service';
import { User, UserDocument } from 'src/user/models/user.model';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { Admin, AdminDocument } from './models/admin.model';
// import { AdminRole, AdminRoleDocument } from './models/adminRole.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CarouselType,
  FileCategoryTypes,
  TokenTypes,
  UserTypes,
} from 'src/enums/auth.enums';
import { MailService } from 'src/mail/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import {
  Actions,
  ResourceTypes,
  RoleBelonging,
  RoleCreatorType,
} from 'src/roles/enums/roles.enum';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Token } from 'aws-sdk';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { AuthService } from 'src/auth/auth.service';
import {
  BusinessIndustry,
  BusinessIndustryDocument,
} from 'src/business/model/businessIndustry.model';
import {
  CreateIndustryDto,
  UpdateIndustryDto,
} from './dto/business-industry.dto';
import {
  BusinessCategoryDto,
  UpdateBusinessCategoryDto,
} from './dto/business-category.dto';
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
  ProfileStatus,
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
import { Privilege, PrivilegeDocument } from 'src/roles/models/privilege.model';
import {
  Department,
  DepartmentDocument,
} from 'src/business/model/department.model';
import { Resource, ResourceDocument } from 'src/roles/models/resource.model';
import { Follow, FollowDocument } from 'src/user/models/follow.model';
import { CreateOutletByAdminDto } from 'src/outlet/dto/create-outlet.dto';
import { OutletCategoryList } from 'src/outlet/outlet.enum';
import { Outlet, OutletDocument } from 'src/outlet/model/outlet.model';
import { GoogleService } from 'src/google/google.service';
import { AtlantaData } from 'src/event/crawledEvents.json';
import { CreateBusinessUserDto } from 'src/business/dto/create-businessUser.dto';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';
import { Report, ReportDocument } from 'src/event/models/reports.model';
import { BusinessPopulates } from 'src/enums/user.enum';
import { EventSchedule } from 'src/event/models/event-schedule.model';
import { create } from 'domain';
import { ExpectedDownlineAdminHeaders } from './enums/admin.enum';
import { createObjectCsvStringifier } from 'csv-writer';
import { Readable } from 'stream';
import { BusinessDocVerificationLeads } from './models/BusinessDocVerificationLeads.model';

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
    // @InjectModel(BusinessLocation.name) private readonly businessLocationModel: Model<BusinessLocationDocument>,
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
    @InjectModel(Follow.name)
    private readonly followModel: Model<FollowDocument>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,

    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,
    @InjectModel(Privilege.name)
    private readonly privilegeModel: Model<PrivilegeDocument>,
    @InjectModel(Outlet.name)
    private readonly outletModel: Model<OutletDocument>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,
    @InjectModel(BusinessDocVerificationLeads.name)
    private readonly docVerificationLeadModel: Model<BusinessDocVerificationLeads>,
    private readonly httpService: HttpService,
    private readonly s3Service: S3Service,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly seederService: SeederService,
    private readonly driveService: DriveService,
    private readonly googleService: GoogleService,
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

  // async publishCrawledEvent(data: PublishCrawledEventDto) {
  //   const { ids, user, businessProfile } = data;
  //   let resData = [];
  //   for (let i = 0; i < ids.length; i++) {
  //     const id = ids[i];
  //     const foundDoc = await this.crawledEventModel.findById(id);
  //     if (!foundDoc) {
  //       return {
  //         success: false,
  //         message: 'No event data found with the id',
  //       };
  //     } else {
  //       let images = [];
  //       //Download image and upload to s3 bucket
  //       if (foundDoc.image) {
  //         const file = await this.downloadImage(foundDoc.image);
  //         const result = await this.s3Service.s3_upload(
  //           file,
  //           process.env.AWS_S3_BUCKET_NAME,
  //           manipulateImageName(foundDoc.title),
  //           'image/jpeg',
  //         );
  //         const createdImage = await this.imageModel.create({
  //           url: result.Location,
  //         });
  //         images.push(createdImage._id);
  //       }
  //       //Save event location
  //       let findQuery = {};
  //       if (mongoose.isValidObjectId(foundDoc.category)) {
  //         findQuery = { _id: new mongoose.Types.ObjectId(foundDoc.category) };
  //       } else {
  //         findQuery = { name: foundDoc.category };
  //       }
  //       const category = await this.contentCategoryModel.findOne(findQuery);
  //       if (!category) {
  //         return {
  //           success: false,
  //           message: 'Category not found',
  //         };
  //       }
  //       const allAgeGroup = await this.ageGroupModel.findOne({
  //         name: 'all',
  //       });
  //       const event = await this.eventModel.create({
  //         isFromCrawler: true,
  //         businessProfile: new mongoose.Types.ObjectId(businessProfile),
  //         user: new mongoose.Types.ObjectId(user),
  //         type: foundDoc.type,
  //         creatorType: Business.name,
  //         status: EventStatus.PUBLISHED,
  //         category,
  //         images,
  //         title: foundDoc.title,
  //         description: foundDoc.description,
  //         schedule: foundDoc.schedule,
  //         // locations: [createdLocation._id],
  //         ageGroupsAllowed: [allAgeGroup._id],
  //         targetGenders: ['male', 'female', 'other'],
  //         promotionCode: '',
  //         // isFree: foundDoc.participationCost == 'Free' ? true : false,
  //         isFree: true,
  //         // participationCost: foundDoc.participationCost.split('')[1],
  //         participationCost: foundDoc.participationCost
  //           ? foundDoc.participationCost
  //           : '',
  //         bookingUrl: foundDoc.website ? foundDoc.website : '',
  //         offset: foundDoc.offset,
  //       });
  //       if (foundDoc.coordinates) {
  //         const locationObj = {
  //           type: 'Point',
  //           coordinates: [
  //             foundDoc.coordinates['lng'],
  //             foundDoc.coordinates['lat'],
  //           ],
  //         };
  //         // Add the location to business location as well
  //         const businessLocationId = await this.businessLocationModel.create({
  //           latitude: foundDoc.coordinates['lat'],
  //           longitude: foundDoc.coordinates['lng'],
  //           accuracy: 0,
  //           address1: foundDoc.address,
  //           address2: '',
  //           city: '',
  //           state: '',
  //           zip: '',
  //           website: foundDoc.website ? foundDoc.website : '',
  //           email: foundDoc.email ? foundDoc.email : '',
  //           phone: foundDoc.phone ? foundDoc.phone : '',
  //           businessProfile: new mongoose.Types.ObjectId(businessProfile),
  //         });
  //         const createdLocation = await this.eventLocationModel.create({
  //           location: locationObj,
  //           accuracy: 0,
  //           event: event._id,
  //           address1: foundDoc.address,
  //           address2: '',
  //           city: '',
  //           state: '',
  //           zip: '',
  //           website: foundDoc.website ? foundDoc.website : '',
  //           email: foundDoc.email ? foundDoc.email : '',
  //           phone: foundDoc.phone ? foundDoc.phone : '',
  //           businessLocationId: businessLocationId._id,
  //         });
  //         const updatedEvent = await this.eventModel.findByIdAndUpdate(
  //           event.id,
  //           {
  //             $addToSet: {
  //               locations: createdLocation._id,
  //             },
  //           },
  //           { new: true },
  //         );
  //         resData.push(updatedEvent);

  //         //Update the crawled event status
  //         await this.crawledEventModel.findByIdAndUpdate(id, {
  //           status: CrawledEventStatus.PUBLISHED,
  //         });
  //       } else {
  //         resData.push(event);
  //       }
  //     }
  //   }
  //   return {
  //     success: true,
  //     message: 'Event has been published successfully.',
  //     data: resData,
  //   };
  // }

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
    const foundCarousel = await this.dashboardConfigModel.findOne({
      name: data.name,
    });

    if (foundCarousel) {
      return {
        success: false,
        message: 'Dashboard configuration with this name already exists.',
      };
    }

    let createObj = { ...data };
    delete createObj.industries;
    delete createObj.categories;
    if (
      (data.carouselType === CarouselType.OnWheels ||
        data.carouselType === CarouselType.Event) &&
      data.categories &&
      data.categories.length >= 0
    ) {
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
        createObj['categories'] = data.categories;
      }
    }

    if (
      data.carouselType === CarouselType.Business &&
      data.industries &&
      data.industries.length >= 0
    ) {
      for (let i = 0; i < data.industries.length; i++) {
        const foundIndustry = await this.industryModel
          .findById(data.industries[i])
          .exec();
        if (!foundIndustry) {
          return {
            message: `Industry not found with the id provided: ${data.industries[i]}`,
          };
        } else {
          data.industries[i] = foundIndustry._id;
        }
        createObj['businessIndustries'] = data.industries;
      }
    }
    const createdConfiguration =
      await this.dashboardConfigModel.create(createObj);
    return {
      success: true,
      message: 'Dashboard configuration added successfully',
      data: createdConfiguration,
    };
  }

  async getDashboardConfig() {
    const foundConfig = await this.dashboardConfigModel
      .find()
      .populate('categories')
      .populate('businessIndustries')
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
      .sort({ title: 1 })
      .select({ updatedAt: 0, __v: 0 })
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
        { _id: new mongoose.Types.ObjectId(catId) },
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
    let password = await this.authService.autoGeneratePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
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
      delete data.profilePhoto;
    }

    const createdAdmin = await this.adminModel.create({
      creatorType: RoleCreatorType.ADMIN,
      creator: new mongoose.Types.ObjectId(adminId),
      password: hashedPassword,
      fullPhoneNumber: fullPhoneNumber,
      isEmailVerified: true,
      ...data,
    });

    console.log('created Admin:', createdAdmin.id);
    const loginLink = process.env.PORTAL_URL + 'v1/admin/login';
    this.mailService.sendDownlineUserCredentials(
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

  async parseCsv(file: Express.Multer.File): Promise<any[]> {
    const rows: any[] = [];
    const stream = streamifier.createReadStream(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          const missing = ExpectedDownlineAdminHeaders.filter(
            (h) => !headers.includes(h),
          );
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

  async createDownlineAdminFromRow(row: any, user: DecodedUser) {
    try {
      const superAdmin = await this.adminModel.findOne({ isSuperAdmin: true });
      const foundUser = await this.adminModel.findOne({
        email: row.email,
      });

      if (foundUser) {
        throw new BadRequestException('Admin already found with this email');
      }
      let password = await this.authService.autoGeneratePassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      let role = null;
      if (row.role) {
        role = await this.roleModel.findOne({
          name: row.role,
          creator: superAdmin._id,
        });
        if (!role) {
          throw new BadRequestException('Please provide valid Role.');
        }
      } else {
        throw new BadRequestException('Please provide valid Role.');
      }
      let fullPhoneNumber = row.countryCode + row.phone;
      const existingAdmin = await this.adminModel.findOne({
        $or: [{ email: row.email }, { fullPhoneNumber: fullPhoneNumber }],
      });
      if (existingAdmin) {
        throw new BadRequestException(
          'Admin with this email or phone number already exists.',
        );
      }

      let createObj = {
        role: [new mongoose.Types.ObjectId(role._id)],
        name: row.name,
        email: row.email,
        phone: row.phone,
        countryCode: row.countryCode,
        creatorType: RoleCreatorType.ADMIN,
        creator: new mongoose.Types.ObjectId(superAdmin._id),
        password: hashedPassword,
        fullPhoneNumber: fullPhoneNumber,
        isEmailVerified: true,
      };

      const createdAdmin = await this.adminModel.create(createObj);

      //create drive
      let driveDetails = await this.seederService.createDrive(
        createdAdmin._id,
        Admin.name,
      );
      await this.adminModel.updateOne(
        { _id: createdAdmin.id },
        { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
      );

      // sendEmaillink verification
      const loginLink = process.env.PORTAL_URL + 'v1/business/user/login';
      this.mailService.sendDownlineUserCredentials(
        createdAdmin.name,
        createdAdmin.email,
        password,
        loginLink,
      );
    } catch (error) {
      throw new BadRequestException(
        'Error creating outlet from row: ' + error.message,
      );
    }
  }

  async createDownlineAdminsInBulk(
    file: Express.Multer.File,
    user: DecodedUser,
  ) {
    try {
      const admin = await this.adminModel.findById(user.id);
      if (!admin) {
        throw new BadRequestException('admin not found');
      }
      if (!admin.isSuperAdmin) {
        throw new BadRequestException(
          'Only super admin can create use this functionality',
        );
      }
      const rows = await this.parseCsv(file);
      let failure = 0;
      let result = null;
      const results = await Promise.all(
        rows.map(async (row) => {
          try {
            await this.createDownlineAdminFromRow(row, user);
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
              { id: 'countryCode', title: 'CountryCode' },
              { id: 'phone', title: 'Phone' },
              { id: 'role', title: 'Role' },
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
            role: r.role,
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
            admin.id,
            String(admin.drive),
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
        .select({
          password: 0,
          updatedAt: 0,
          __v: 0,
        })
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

  async getBusinessesList(page: number, limit: number, search: string) {
    try {
      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { addressLine1: { $regex: search, $options: 'i' } },
          { addressLine2: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { state: { $regex: search, $options: 'i' } },
        ];
      }
      const businesses = await this.businessModel
        .find(query)
        .select({
          password: 0,
          updatedAt: 0,
          __v: 0,
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('creator', '_id name');
      const totalBusinesses = await this.businessModel.countDocuments(query);
      return {
        success: true,
        message: 'Businesses fetched successfully',
        data: businesses,
        page,
        limit,
        total: totalBusinesses,
        pages: Math.ceil(totalBusinesses / limit),
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
        .populate('outlets');
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

  async updateBusinessIndustry(
    industryId: string,
    adminId: string,
    data: UpdateIndustryDto,
  ) {
    try {
      const industry = await this.industryModel.findById(industryId);
      if (!industry) {
        return {
          success: false,
          message: 'Industry not found.',
        };
      }

      if (data.title) {
        const existing = await this.industryModel.findOne({
          title: data.title,
          _id: { $ne: industryId },
        });
        if (existing) {
          return {
            success: false,
            message: 'Another industry with the same title already exists.',
          };
        }
      }

      const updated = await this.industryModel.findByIdAndUpdate(
        industryId,
        {
          ...data,
          updatedBy: new mongoose.Types.ObjectId(adminId),
          updatedAt: new Date(),
        },
        { new: true },
      );

      return {
        success: true,
        message: 'Industry updated successfully.',
        data: updated,
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

  async updateBusinessCategory(
    categoryId: string,
    adminId: string,
    data: UpdateBusinessCategoryDto,
  ) {
    try {
      const category = await this.businessCategoryModel.findById(categoryId);
      if (!category) {
        return {
          success: false,
          message: 'Business Category not found.',
        };
      }

      if (data.title) {
        const existing = await this.businessCategoryModel.findOne({
          title: data.title,
          // industry: data.industry ?? category.industry,
          _id: { $ne: categoryId },
        });
        if (existing) {
          return {
            success: false,
            message:
              'Another category with the same title already exists in this industry.',
          };
        }
      }

      const updated = await this.businessCategoryModel.findByIdAndUpdate(
        categoryId,
        {
          ...data,
          updatedBy: new mongoose.Types.ObjectId(adminId),
          updatedAt: new Date(),
        },
        { new: true },
      );

      return {
        success: true,
        message: 'Business category updated successfully.',
        data: updated,
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
      console.log('is inside service::?');
      const industries = await this.industryModel
        .find({ isDeleted: false })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', '_id name');
      console.log('Industries:', industries);
      const totalDocs = await this.industryModel.countDocuments({
        isDeleted: false,
      });
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
      // await this.businessCategoryModel.findByIdAndDelete(catId);

      await this.businessCategoryModel.updateOne(
        { _id: new mongoose.Types.ObjectId(catId) },
        { $set: { isDeleted: true } },
      );

      return {
        success: true,
        message: 'Category with given ID is Deleted Successfully!',
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }

  async deleteBusinessIndustry(industryId: string) {
    try {
      if (!mongoose.isValidObjectId(industryId)) {
        return {
          success: false,
          message: 'Please provide a valid id',
        };
      }
      const findIndustry = await this.industryModel.findById(industryId);
      if (!findIndustry) {
        return {
          success: false,
          message: 'Industry not found with the id provided.',
        };
      }

      await this.industryModel.updateOne(
        { _id: new mongoose.Types.ObjectId(industryId) },
        { $set: { isDeleted: true } },
      );
      return {
        success: true,
        message: 'Industry with given ID is Deleted Successfully.',
      };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  }

  async createTemplate(
    adminId: string,
    data: CreateTemplateDto,
    image: Express.Multer.File,
  ) {
    try {
      const template = await this.templateModel.findOne({ title: data.title });
      if (template) {
        return {
          success: false,
          message: 'Template with this title already exists.',
        };
      }
      const admin = await this.adminModel.findById(adminId);

      let categoryObjectIds = [];
      if (data.contentCategories) {
        for (let i = 0; i < data.contentCategories.length; i++) {
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
        console.log('busCategoryObjectIds:', busCategoryObjectIds);
        data.businessCategories = busCategoryObjectIds;
      }
      data.businessIndustry = new mongoose.Types.ObjectId(
        data.businessIndustry,
      );
      const fileCategory = await this.fileCategoryModel.findOne({
        name: FileCategoryTypes.GALLERY_IMAGE,
      });
      let imageUpload = await this.driveService.uploadAndCreateFile(
        image,
        String(admin.drive),
        Drive.name,
        admin._id,
        fileCategory._id,
      );

      const createdTemplate = await this.templateModel.create({
        ...data,
        isFree: data.isFree === 'true' ? true : false,
        termsApplied: data.termsApplied === 'true' ? true : false,
        minTargetAge: Number(data.minTargetAge),
        maxTargetAge: Number(data.maxTargetAge),
        creatorType: Admin.name,
        categories: data.contentCategories,
        user: new mongoose.Types.ObjectId(adminId),
        thumbnail: imageUpload.metaData.url,
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
  async updateTemplate(
    adminId: string,
    id: string,
    data: UpdateTemplateDto,
    image: Express.Multer.File,
  ) {
    try {
      const admin = await this.adminModel.findById(adminId);
      const template = await this.templateModel.findById(id);
      if (!template) {
        return {
          success: false,
          message: 'Template not found.',
        };
      }

      let categoryObjectIds = [];
      // if (data.contentCategories) {
      //   for (let i = 0; i < data.contentCategories.length; i++) {
      //     const foundCategory = await this.contentCategoryModel.findById(
      //       data.contentCategories[i],
      //     );
      //     if (!foundCategory) {
      //       return {
      //         success: false,
      //         message: `Category not found with the id provided: ${data.contentCategories[i]}`,
      //       };
      //     } else {
      //       categoryObjectIds.push(foundCategory._id);
      //     }
      //   }
      //   data.contentCategories = categoryObjectIds;
      // }
      if (data.contentCategories) {
        const categories = Array.isArray(data.contentCategories)
          ? data.contentCategories
          : [data.contentCategories];

        for (let i = 0; i < categories.length; i++) {
          const categoryId = categories[i];

          // Optionally validate ObjectId format early
          if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return {
              success: false,
              message: `Invalid category ID format: ${categoryId}`,
            };
          }

          const foundCategory =
            await this.contentCategoryModel.findById(categoryId);
          if (!foundCategory) {
            return {
              success: false,
              message: `Category not found with the id provided: ${categoryId}`,
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
        console.log('busCategoryObjectIds:', busCategoryObjectIds);
        data.businessCategories = busCategoryObjectIds;
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
      if (image) {
        const fileCategory = await this.fileCategoryModel.findOne({
          name: FileCategoryTypes.GALLERY_IMAGE,
        });
        let imageUpload = await this.driveService.uploadAndCreateFile(
          image,
          String(admin.drive),
          Drive.name,
          admin._id,
          fileCategory._id,
        );
        updateObj.thumbnail = imageUpload.metaData.url;
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
      let password = await this.authService.autoGeneratePassword();
      const hashedPassword = await bcrypt.hash(password, 10);
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
      this.mailService.sendDownlineUserCredentials(
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
        // data.businessCategories = data.businessCategories.split(',');
        if (!Array.isArray(data.businessCategories)) {
          data.businessCategories = [data.businessCategories];
        }
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
      console.log('businessCategories:', businessCategoriesIds);
      if (!data.businessIndustry) {
        return {
          success: false,
          message: 'Please provide a valid industry id',
        };
      } else {
        if (!mongoose.isValidObjectId(data.businessIndustry)) {
          return {
            success: false,
            message: 'Please provide a valid industry id',
          };
        }
        const foundIndustry = await this.industryModel.findById(
          data.businessIndustry,
        );
        if (!foundIndustry) {
          return {
            success: false,
            message: 'Industry not found',
          };
        }
      }

      let businessObj = {
        name: data.businessName,
        email: data.businessEmail,
        businessCategories: businessCategoriesIds,
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

      if (logo) {
        let logoUrl = await this.driveService.noDriveUpload(logo[0]);
        businessObj['logo'] = logoUrl;
      }
      if (cover) {
        let coverUrl = await this.driveService.noDriveUpload(cover[0]);
        businessObj['cover'] = coverUrl;
      }

      const createdBusiness = await this.businessModel.create(businessObj);
      await this.businessUserModel.updateOne(
        { _id: createdBusiness.authorisedUser },
        {
          $addToSet: {
            business: createdBusiness._id,
          },
        },
      );

      //seed Roles:
      this.seedBusinessDepartmentRoles(createdUser.id, createdBusiness._id)
        .then(() => console.log('Business roles seeded successfully'))
        .catch((err) => console.error('Error seeding business roles:', err));

      createdUser = await this.businessUserModel
        .findById(createdUser.id)
        .populate('role', '_id name')
        .populate('business');
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

  async getBusinessFollowers(businessId: string, page: number, limit: number) {
    try {
      console.log('user:', businessId);
      console.log('User name:', User.name);
      const followers = await this.followModel
        .find({
          following: new mongoose.Types.ObjectId(businessId),
          followerType: User.name,
        })
        .populate(
          'follower',
          '_id firstName lastName profilePhoto name profileType image',
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await this.followModel.countDocuments({
        following: new mongoose.Types.ObjectId(businessId),
        followerType: User.name,
      });

      return {
        success: true,
        message: 'Followers fetched Successfully!',
        data: followers,
        total,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async fetchBusinessUsers(businessId: string) {
    try {
      const users = await this.businessUserModel
        .find({ business: new mongoose.Types.ObjectId(businessId) })
        .populate('role', '_id name')
        .populate('business', '_id name')
        .select({ password: 0, updatedAt: 0, __v: 0 });
      return {
        success: true,
        message: 'Business Users fetched successfully',
        data: users,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async createOutletForBusiness(
    businessId: string,
    data: CreateOutletByAdminDto,
  ) {
    try {
      const business = await this.businessModel.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }

      if (
        !Object.values(OutletCategoryList).includes(
          data.category as OutletCategoryList,
        )
      ) {
        return {
          success: false,
          message: 'Invalid category',
        };
      }

      if (data.category === OutletCategoryList.MOBILE && !data.vehicleType) {
        return {
          success: false,
          message: 'Vehicle Type is required',
        };
      }

      const foundOutlet = await this.outletModel.findOne({
        address1: data.address1,
        business: business._id,
      });

      if (foundOutlet) {
        return {
          success: false,
          message: 'Outlet already exists with the given address.',
        };
      }

      const createObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          createObj[key] = data[key];
        }
      });

      let address = `${createObj.address1}, ${createObj.city}, ${createObj.state}, ${createObj.country}, ${createObj.zipCode}`;
      let placeList = await this.googleService.googleRecommendation({
        address: address,
      });
      let placeDetails = await this.googleService.getPlaceDetails(
        placeList.data[0].placePrediction.placeId,
        placeList.sessionToken,
        address,
      );

      // createObj['creator'] = new mongoose.Types.ObjectId(user.id);
      createObj['business'] = new mongoose.Types.ObjectId(businessId);
      createObj['latitude'] = placeDetails.data['latitude'];
      createObj['longitude'] = placeDetails.data['longitude'];
      createObj['placeId'] = placeDetails.data['placeId'];
      createObj['location'] = {
        type: 'Point',
        coordinates: [
          placeDetails.data['latitude'],
          placeDetails.data['longitude'],
        ],
      };

      const outlet = await this.outletModel.create(createObj);

      const updateObj: any = {};
      if (outlet.category === OutletCategoryList.PHYSICAL) {
        updateObj['physicalUnitsCreated'] = business.physicalUnitsCreated + 1;
      }
      if (outlet.category === OutletCategoryList.MOBILE) {
        updateObj['mobileUnitsCreated'] = business.mobileUnitsCreated + 1;
      }

      await this.businessModel.updateOne(
        { _id: business._id },
        {
          $push: { outlets: new mongoose.Types.ObjectId(outlet.id) },
          $set: { ...updateObj },
        },
      );

      if (createObj.manager) {
        await this.businessUserModel.updateOne(
          { _id: createObj.manager },
          { $addToSet: { assignedOutlets: outlet.id } },
        );
      }

      return {
        success: true,
        message: 'Outlet created successfully.',
        data: outlet,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Something went wrong',
      };
    }
  }

  async updatePlaceIdinAtlantaData() {
    try {
      const jsonData = JSON.parse(
        fs.readFileSync('src/admin/Init-resources/atlantadata.json', 'utf-8'),
      );
      for (let data of jsonData) {
        if (!data.address.placeId || data.address.placeId === '') {
          console.log('Processing address:', data.address.address);
          let placeList = await this.googleService.googleRecommendation({
            address: data.address.address,
          });
          if (
            placeList &&
            placeList.data &&
            Array.isArray(placeList.data) &&
            placeList.data.length > 0 &&
            placeList.data[0].placePrediction &&
            placeList.data[0].placePrediction.placeId
          ) {
            data.address.placeId = placeList.data[0].placePrediction.placeId;
          } else {
            data.address.placeId = 'ChIJjQmTaV0E9YgRC2MLmS_e_mY';
            console.error('No place id found');
          }
        }
      }
      fs.writeFileSync(
        'src/admin/Init-resources/atlantadata.json',
        JSON.stringify(jsonData, null, 2), // Pretty-print with 2-space indentation
      );
      return {
        success: true,
        message: 'Place IDs updated successfully',
      };
    } catch (error) {
      console.error('Error in updatePlaceIdinAtlantaData:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async createBusinessUser(user: DecodedUser, data: CreateBusinessUserDto) {
    try {
      const businessUser = await this.businessUserModel.findOne({
        email: data.email,
      });
      if (businessUser) {
        return {
          success: false,
          message: 'Business User already exists with this email.',
        };
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const createdBusinessUser = await this.businessUserModel.create({
        ...data,
        password: hashedPassword,
        isEmailVerified: true,
        creatorType: BusinessUserCreatorType.ADMIN,
        creator: new mongoose.Types.ObjectId(user.id),
      });
      return {
        success: true,
        message: 'Business User created successfully',
        data: createdBusinessUser,
      };
    } catch (error) {
      console.error('Error in createBusinessUser:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getReportedEvents(page: number, limit: number, status?: string) {
    try {
      const query: any = {};
      if (
        status &&
        status !== 'all' &&
        Object.values(ReportTypes).includes(status as ReportTypes)
      ) {
        query.status = status;
      }
      const reportedEvents = await this.reportModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', '_id name')
        // .populate('event', '_id title')
        .populate({
          path: 'event',
          populate: [
            {
              path: 'businessProfile',
              model: Business.name,
              select: BusinessPopulates.FOREIGN,
            },
            {
              path: 'eventSchedule',
              model: EventSchedule.name,
            },
            {
              path: 'locations',
              model: EventLocation.name,
            },
            {
              path: 'categories',
              model: Category.name,
            },
          ],
        });

      const totalReportedEvents = await this.reportModel.countDocuments(query);

      return {
        success: true,
        message: 'Reported events fetched successfully',
        data: reportedEvents,
        page,
        limit,
        total: totalReportedEvents,
        pages: Math.ceil(totalReportedEvents / limit),
      };
    } catch (error) {
      console.error('Error in getReportedEvents:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async disableContent(contentId: string) {
    try {
      if (!mongoose.isValidObjectId(contentId)) {
        return {
          success: false,
          message: 'Please provide a valid content id',
        };
      }
      const content = await this.eventModel.findById(contentId);
      if (!content) {
        return {
          success: false,
          message: 'Content not found with the id provided.',
        };
      }
      await this.eventModel.updateOne(
        { _id: new mongoose.Types.ObjectId(contentId) },
        { $set: { isDisabled: true } },
      );
      //send notification to the business that his event have been disabled
      // const business = await this.businessModel.findById(content.businessProfile);
      // if (business) {
      //   await this.notificationService.createNotification({
      //     user: business.authorisedUser,
      //     title: 'Content Disabled',
      //     message: `Your content "${content.title}" has been disabled by the admin.`,
      //     type: NotificationType.CONTENT_DISABLED,
      //     contentId: content._id,
      //     businessProfile: content.businessProfile,
      //   });
      // }
      return {
        success: true,
        message: 'Content disabled successfully.',
      };
    } catch (error) {
      console.error('Error in disableContent:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getDocVerificationLeads(page: number, limit: number) {
    try {
      const leads = await this.docVerificationLeadModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await this.docVerificationLeadModel.countDocuments();
      return {
        success: true,
        message: 'Doc verification leads fetched successfully',
        data: leads,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in getDocVerificationLeads:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async getDocVerificationLead(id: string){
    try{
      const lead = await this.docVerificationLeadModel.findById(id);
      if(!lead){
        return {
          success: false,
          message: 'Lead not found',
        };
      }
      return {
        success: true,
        message: 'Lead fetched successfully',
        data: lead,
      };
    }catch(error){
      console.error('Error in getDocVerificationLead:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

  async verifyDocument(id: string,adminId:string,status: boolean) {
    try {
      const lead = await this.docVerificationLeadModel.findById(id);
      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
        };
      }
      // Perform verification logic here
      await this.docVerificationLeadModel.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: { isVerified: status, verifiedBy: new mongoose.Types.ObjectId(adminId) } },
      );
      
      return {
        success: true,
        message: 'Document verified successfully',
      };
    } catch (error) {
      console.error('Error in verifyDocument:', error);
      return {
        success: false,
        message: 'Something went wrong.',
      };
    }
  }

}
