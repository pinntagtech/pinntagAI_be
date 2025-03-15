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
import { Roles } from 'src/enums/user.enum';
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
import { Role, RoleDocument } from 'src/models/role.model';
import { S3Service } from 'src/s3.service';
import { User, UserDocument } from 'src/user/models/user.model';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { Admin, AdminDocument } from './models/admin.model';
import { Permission, PermissionDocument } from './models/permission.model';
import { AdminRole, AdminRoleDocument } from './models/adminRole.model';
import {
  BusinessRole,
  BusinessRoleDocument,
} from 'src/business-profile/models/businessRole.model';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(AdminRole.name)
    private readonly adminRoleModel: Model<AdminRoleDocument>,
    @InjectModel(BusinessRole.name)
    private readonly businessRoleModel: Model<BusinessRoleDocument>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
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
    const role = await this.roleModel.findOne({ name: Roles.ADMIN }).exec();
    const foundAdmin = await this.adminModel.findOne({
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
        email: foundAdmin.email,
        role: Roles.ADMIN,
      };
      const token = await this.generateJWT(payload);
      return {
        success: true,
        message: 'Admin logged in successfully',
        user: foundAdmin,
        token,
      };
    }
  }

  async generateJWT(payload: JwtPayload) {
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '365d',
    });
    // if (update) {
    //   await this.userService.updateToken(token, payload.id);
    // } else {
    await this.userService.saveToken(token, payload.id);
    // }
    return token;
  }

  async create(permissionData: Partial<Permission>): Promise<Permission> {
    const newPermission = new this.permissionModel(permissionData);
    return newPermission.save();
  }

  async createRole(roleData: Partial<AdminRole>): Promise<AdminRole> {
    try {
      const newRole = new this.adminRoleModel(roleData);
      return await newRole.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Role name must be unique');
      }
      throw error;
    }
  }

  async createBusinessRole(
    roleData: Partial<BusinessRole>,
  ): Promise<BusinessRole> {
    try {
      const newRole = new this.businessRoleModel({...roleData, isParent: true});
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
}
