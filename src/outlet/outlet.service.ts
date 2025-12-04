import { BadRequestException, Injectable } from '@nestjs/common';
import mongoose, { get, Model } from 'mongoose';
import { BusinessUserCreatorType } from 'src/business/enums/business.enum';
import { DefaultBusinessRoles } from 'src/business/resourceInits/template-roles';
import { Category } from 'src/models/contentCategory.model';
import {
  CreateOutletDto,
  CreateOutletDtoV2,
  UpdateMobileOutletDto,
} from './dto/create-outlet.dto';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import {
  OutletCategory,
  OutletCategoryDocument,
} from './model/outletCategory.model';
import { OutletType, OutletTypeDocument } from './model/outletType.model';
import { Outlet, OutletDocument } from './model/outlet.model';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { SubscriptionContextImpl } from 'twilio/lib/rest/events/v1/subscription';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { OutletCategoryList, VehicleType } from './outlet.enum';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import csv from 'csv-parser';
import * as streamifier from 'streamifier';
import { ExpectedOutletHeaders } from './enums/outlet.enum';
import { GoogleService } from 'src/google/google.service';
import { createObjectCsvStringifier } from 'csv-writer';
import { FileCategoryTypes } from 'src/enums/auth.enums';
import { Readable } from 'stream';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';
import { DriveService } from 'src/drive/drive.service';
import { CreateSpotDto, UpdateSpotDto } from './dto/create-spot.dto';
import { MobileSpots } from 'src/business/model/mobileSpots.model';
import { EventStatus, EventTypes } from 'src/enums/event.enums';
import { Event, EventDocument } from 'src/event/models/event.model';
import {
  EventSchedule,
  EventScheduleDocument,
  ScheduleTypes,
} from 'src/event/models/event-schedule.model';
import { Subscription } from 'src/subscription/models/subscription.model';
import { SubscriptionPrice } from 'src/subscription/models/subscription-price.model';
import { PricingModel } from 'src/subscription/models/subscription-product.model';

@Injectable()
export class OutletService {
  constructor(
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(OutletCategory.name)
    private readonly outletCategoryModel: Model<OutletCategoryDocument>,
    @InjectModel(OutletType.name)
    private readonly outletTypeModel: Model<OutletTypeDocument>,
    @InjectModel(Outlet.name)
    private readonly outletModel: Model<OutletDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,
    @InjectModel(MobileSpots.name)
    private readonly mobileSpotsModel: Model<MobileSpots>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(EventSchedule.name)
    private readonly scheduleModel: Model<EventScheduleDocument>,
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
    @InjectModel(SubscriptionPrice.name)
    private readonly subscriptionPriceModel: Model<SubscriptionPrice>,
    private readonly googleService: GoogleService,
    private readonly driveService: DriveService,
  ) {}
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
  async getCategories(page: number, limit: number) {
    try {
      const categories = await this.outletCategoryModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await this.outletCategoryModel.countDocuments();
      return {
        success: true,
        message: 'Categories fetched successfully',
        data: categories,
        total: total,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async getTypes(id: string, page: number, limit: number) {
    try {
      const types = await this.outletTypeModel
        .find({
          category: new mongoose.Types.ObjectId(id),
        })
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await this.outletTypeModel.countDocuments();
      return {
        success: true,
        message: 'Types fetched successfully',
        data: types,
        total: total,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async managerList(id: string, page: number, limit: number) {
    try {
      const user = await this.businessUserModel.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      let allUserIds = await this.getAllChildUsersIds(user.id);
      let mongoUserIds = [];
      allUserIds.map((id) =>
        mongoUserIds.push(new mongoose.Types.ObjectId(id)),
      );
      console.log('allUserIds', mongoUserIds);
      const usersResult = await this.businessUserModel.aggregate([
        {
          $match: {
            _id: { $in: mongoUserIds },
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
          $unwind: '$role',
        },
        {
          $match: {
            'role.name': DefaultBusinessRoles.Store_Manager.name,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $facet: {
            data: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  isActive: 1,
                  email: 1,
                  phone: 1,
                  countryCode: 1,
                  profilePhoto: 1,
                  isEmailVerified: 1,
                  role: {
                    _id: '$role._id',
                    name: '$role.name',
                  },
                  business: '$businessId',
                  outlets: 1,
                },
              },
              { $skip: (page - 1) * limit },
              { $limit: limit },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]);
      const users = usersResult[0].data;
      const totalCount =
        usersResult[0].totalCount.length > 0
          ? usersResult[0].totalCount[0].count
          : 0;

      return {
        success: true,
        message: 'Business User fetched Successfully!',
        data: users,
        total: totalCount,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async createOutlet(data: CreateOutletDto, user: DecodedUser) {
    try {
      console.log('data:', data);
      const businessUser = await this.businessUserModel.findById(user.id);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      if (!user.businessProfile) {
        return {
          success: false,
          message: 'Business Profile not found!',
        };
      }

      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }
      let {
        category,
        name,
        address1,
        address2,
        // posSystemId,
        // vehicleRegistrationNumber,
        vehicleType,
        // gpsTrackerEnabled,
        openingTime,
        closingTime,
      } = data;

      if (
        !Object.values(OutletCategoryList).includes(
          category as OutletCategoryList,
        )
      ) {
        return {
          success: false,
          message: 'Invalid category',
        };
      }

      if (category === OutletCategoryList.MOBILE && !vehicleType) {
        return {
          success: false,
          message: 'Vehicle Type is required',
        };
      }
      const foundOutlet = await this.outletModel.findOne({
        address1: address1,
        business: business._id,
      });
      console.log('foundOutlet', foundOutlet);
      if (foundOutlet) {
        return {
          success: false,
          message: 'Outlet already exists with given address.',
        };
      }

      let createObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          createObj[key] = data[key];
        }
      });
      createObj['creator'] = new mongoose.Types.ObjectId(user.id);
      createObj['business'] = new mongoose.Types.ObjectId(business.id);
      createObj['location'] = {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      };
      if (data.openingTime && data.closingTime) {
        let [openingHour, openingMinute] = data.openingTime.split(':');
        let [closingHour, closingMinute] = data.closingTime.split(':');

        createObj['openingTime'] = {
          hour: openingHour,
          minute: openingMinute,
        };
        createObj['closingTime'] = {
          hour: closingHour,
          minute: closingMinute,
        };
      }
      if(data.isActive !== undefined){
        createObj['isActive'] = data.isActive;
        if(data.isActive == true){
          await this.outletSummationCompetence(user.businessProfile);
        }
      }
      console.log('CREATEOBJ:', createObj);
      const outlet = await this.outletModel.create(createObj);

      // const spot = await this.mobileSpotsModel.create({
      //   name: outlet.name,
      //   business: outlet.business,
      //   outlet: outlet._id,
      //   creator: outlet.creator,
      //   accuracy: outlet.accuracy,
      //   address1: outlet.address1,
      //   address2: outlet.address2,
      //   city: outlet.city,
      //   state: outlet.state,
      //   country: outlet.country,
      //   postalCode: outlet.postalCode,
      //   latitude: outlet.latitude,
      //   longitude: outlet.longitude,
      //   location: outlet.location,
      // });

      let updateObj: any = {};
      if (outlet.category === OutletCategoryList.PHYSICAL) {
        updateObj['physicalUnitsCreated'] = business.physicalUnitsCreated + 1;
      }
      if (outlet.category === OutletCategoryList.MOBILE) {
        updateObj['mobileUnitsCreated'] = business.mobileUnitsCreated + 1;
      }
      console.log('Business User Id:', businessUser.id);

      // await this.outletModel.updateOne(
      //   { _id: outlet.id },
      //   { $push: { spots: spot._id } },
      // );

      // if (createObj.manager) {
      //   const isUserUpdated = await this.businessUserModel.updateOne(
      //     { _id: createObj.manager },
      //     { $addToSet: { assignedOutlets: outlet.id } },
      //   );
      // }

      await this.businessModel.updateOne(
        { _id: business._id },
        {
          $push: { outlets: new mongoose.Types.ObjectId(outlet.id) },
          $set: { ...updateObj },
        },
      );
      await this.businessUserModel.updateOne(
        { _id: businessUser.id },
        { $addToSet: { assignedOutlets: outlet.id } },
      );

      return {
        success: true,
        message: 'Outlet created successfully.',
        data: outlet,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async outletSummationCompetence(businessId: string) {
    try {
      const business = await this.businessModel.findById(businessId);
      if (!business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }
      const totalLocations =
        business.physicalUnitsCreated + business.mobileUnitsCreated;
      const subscription = await this.subscriptionModel.findById(
        business.activeSubscription,
      );
      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found!',
        };
      }
      const subscriptionPrice = await this.subscriptionPriceModel.findById(
        subscription.price,
      );
      if (!subscriptionPrice) {
        return {
          success: false,
          message: 'Subscription Price not found!',
        };
      }

      if (subscriptionPrice.pricingModel === PricingModel.FLAT) {
        if (totalLocations < subscriptionPrice.maxLocations) {
          return {
            success: true,
            message: 'Within subscription limits',
          };
        } else {
          return {
            success: true,
            message: 'Please upgrade your subscription to add more outlets',
            data: {
              statusCode: 204, //to send new flat product and price
            },
          };
        }
      } else if (subscriptionPrice.pricingModel === PricingModel.PER_LOCATION) {
        if (totalLocations < subscriptionPrice.maxLocations) {
          return {
            success: true,
            message: 'Pay per location model - Within subscription limits',
            data: {
              statusCode: 205, //to send new quantity only
            },
          };
        } else {
          return {
            success: true,
            message:
              'Pay per location model - Please upgrade your subscription to add more outlets',
            data: {
              statusCode: 206, //to send new per_location product, price, and quantity
            },
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async createMobileOutlet(
    data: CreateOutletDtoV2,
    user: any,
    image: Express.Multer.File,
  ) {
    try {
      console.log('data:', data);
      const businessUser = await this.businessUserModel.findById(user.id);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      if (!user.businessProfile) {
        return {
          success: false,
          message: 'Business Profile not found!',
        };
      }

      const business = await this.businessModel.findById(user.businessProfile);
      if (!business) {
        return {
          success: false,
          message: 'Business not found!',
        };
      }

      // await this.outletSummationCompetence(business.id);
      let {
        name,
        address1,
        address2,
        // posSystemId,
        // vehicleRegistrationNumber,
        vehicleType,
        // gpsTrackerEnabled,
        openingTime,
        closingTime,
      } = data;
      const foundOutlet = await this.outletModel.findOne({
        address1: address1,
        business: business._id,
      });
      console.log('foundOutlet', foundOutlet);
      if (foundOutlet) {
        return {
          success: false,
          message: 'Outlet already exists with given address.',
        };
      }

      let createObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          createObj[key] = data[key];
        }
      });
      createObj['creator'] = new mongoose.Types.ObjectId(user.id);
      createObj['business'] = new mongoose.Types.ObjectId(business.id);
      createObj['latitude'] = Number(data.latitude);
      createObj['longitude'] = Number(data.longitude);
      createObj['location'] = {
        type: 'Point',
        coordinates: [Number(data.longitude), Number(data.latitude)],
      };
      if (data.openingTime && data.closingTime) {
        let [openingHour, openingMinute] = data.openingTime.split(':');
        let [closingHour, closingMinute] = data.closingTime.split(':');

        createObj['openingTime'] = {
          hour: openingHour,
          minute: openingMinute,
        };
        createObj['closingTime'] = {
          hour: closingHour,
          minute: closingMinute,
        };
      }

      const folder = await this.driveService.createFolder(
        user.businessProfile,
        {
          parentDirectory: business.drive,
          parentType: 'Drive',
          folderName: createObj.name,
        },
      );
      createObj['drivePath'] = folder.data._id;
      const fileCategory = await this.fileCategoryModel.findOne({
        name: FileCategoryTypes.GALLERY_IMAGE,
      });
      const coverUpload = await this.driveService.uploadAndCreateImage(
        image,
        String(folder.data._id),
        'Folder',
        user.id,
        fileCategory.id,
      );

      createObj['cover'] = coverUpload.metaData.url;
      createObj['category'] = OutletCategoryList.MOBILE;
      if(data.isActive !== undefined){
        createObj['isActive'] = data.isActive;
        if(data.isActive == true){
          await this.outletSummationCompetence(user.businessProfile);
        }
      }

      console.log('CREATEOBJ:', createObj);

      const outlet = await this.outletModel.create(createObj);
      console.log('OUTLET:', outlet);

      // const spot = await this.mobileSpotsModel.create({
      //   name: outlet.name,
      //   business: outlet.business,
      //   outlet: outlet._id,
      //   creator: outlet.creator,
      //   accuracy: outlet.accuracy,
      //   address1: outlet.address1,
      //   address2: outlet.address2,
      //   city: outlet.city,
      //   state: outlet.state,
      //   country: outlet.country,
      //   postalCode: outlet.postalCode,
      //   latitude: outlet.latitude,
      //   longitude: outlet.longitude,
      //   location: outlet.location,
      // });

      let updateObj: any = {};
      if (outlet.category === OutletCategoryList.PHYSICAL) {
        updateObj['physicalUnitsCreated'] = business.physicalUnitsCreated + 1;
      }
      if (outlet.category === OutletCategoryList.MOBILE) {
        updateObj['mobileUnitsCreated'] = business.mobileUnitsCreated + 1;
      }
      console.log('Business User Id:', businessUser.id);

      // await this.outletModel.updateOne(
      //   { _id: outlet.id },
      //   { $push: { spots: spot._id } },
      // );

      // if (createObj.manager) {
      //   const isUserUpdated = await this.businessUserModel.updateOne(
      //     { _id: createObj.manager },
      //     { $addToSet: { assignedOutlets: outlet.id } },
      //   );
      // }

      await this.businessModel.updateOne(
        { _id: business._id },
        {
          $push: { outlets: new mongoose.Types.ObjectId(outlet.id) },
          $set: { ...updateObj },
        },
      );
      await this.businessUserModel.updateOne(
        { _id: businessUser.id },
        { $addToSet: { assignedOutlets: outlet.id } },
      );

      return {
        success: true,
        message: 'Outlet created successfully.',
        data: outlet,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async updateMobileOutlet(
    id: string,
    data: UpdateMobileOutletDto,
    user: any,
    image: Express.Multer.File,
  ) {
    try {
      const foundOutlet = await this.outletModel.findById(id);

      let createObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          createObj[key] = data[key];
        }
      });
      if (data.openingTime && data.closingTime) {
        let [openingHour, openingMinute] = data.openingTime.split(':');
        let [closingHour, closingMinute] = data.closingTime.split(':');

        createObj['openingTime'] = {
          hour: openingHour,
          minute: openingMinute,
        };
        createObj['closingTime'] = {
          hour: closingHour,
          minute: closingMinute,
        };
      }
      if (image) {
        let coverUrl = await this.driveService.noDriveUpload(image);
        createObj['cover'] = coverUrl;
      }

      console.log('CREATEOBJ:', createObj);

      const outlet = await this.outletModel.findOneAndUpdate(
        { _id: foundOutlet._id },
        { $set: createObj },
        { new: true },
      );
      console.log('OUTLET:', outlet);

      return {
        success: true,
        message: 'Outlet updated successfully.',
        data: outlet,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async updateOutlet(data: UpdateOutletDto, user: any, id: string) {
    try {
      const businessUser = await this.businessUserModel.findById(user.id);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      const outlet = await this.outletModel.findById(id);
      if (!outlet) {
        return {
          success: false,
          message: 'Outlet not found!',
        };
      }
      let updateObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          updateObj[key] = data[key];
        }
      });
      if (data.manager) {
        const foundManager = await this.businessUserModel.findOne({
          _id: new mongoose.Types.ObjectId(data.manager),
        });
        if (!foundManager) {
          return {
            success: false,
            message: 'Manager not found in the database!',
          };
        }
        updateObj['manager'] = new mongoose.Types.ObjectId(data.manager);
        await this.businessUserModel.updateOne(
          { _id: updateObj.manager },
          { $addToSet: { outlets: new mongoose.Types.ObjectId(id) } },
        );
      }
      if (data.category) {
        updateObj['category'] = data.category;
      }
      if (data.openingTime) {
        updateObj['openingTime'] = new Date(data.openingTime);
      }
      if (data.closingTime) {
        updateObj['closingTime'] = new Date(data.closingTime);
      }
      const updatedOutlet = await this.outletModel.findByIdAndUpdate(
        id,
        updateObj,
        { new: true },
      );
      return {
        success: true,
        message: 'Outlet updated successfully.',
        data: updatedOutlet,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async getOutlets(user: any, type: string, page: number, limit: number) {
    try {
      const userDetails = await this.businessUserModel.findById(user.id);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found!',
        };
      }
      console.log('UserDetails:', userDetails);
      let outletIds = [];
      outletIds = outletIds.concat(userDetails.assignedOutlets);

      let mongoUserIds = [];
      outletIds.map((id) => mongoUserIds.push(new mongoose.Types.ObjectId(id)));
      console.log('allUserIds', mongoUserIds);

      const userRole = await this.roleModel.findById(userDetails.role);
      console.log('outlet IDS 1:', outletIds);
      let getOutletObj = {};
      if (userRole.isBusinessOwner) {
        // const getAllManagers = await this.managerList(userDetails.id, 1, 1000);
        // console.log('getAllManagers', getAllManagers);
        // if (getAllManagers.success) {
        //   getAllManagers.data.forEach((manager) => {
        //     outletIds = outletIds.concat(manager.outlets);
        //   });
        // }
        getOutletObj['business'] = user.businessProfile;
      } else {
        getOutletObj['_id'] = { $in: mongoUserIds };
      }
      if (type && type !== 'All') {
        getOutletObj['category'] = type;
      }

      console.log('getOutletObj', getOutletObj);

      const outlets = await this.outletModel
        .find(getOutletObj)
        .populate({
          path: 'manager',
          select: 'name email phone countryCode profilePhoto',
          match: { manager: { $ne: '' } },
        })
        .populate('business', 'name email phone countryCode logo')
        .skip((page - 1) * limit)
        .limit(limit);

      console.log('outlets:', outlets);

      const total = await this.outletModel.countDocuments({
        ...getOutletObj,
      });
      console.log('outlets:', outlets);
      return {
        success: true,
        message: 'Outlets fetched successfully.',
        data: outlets,
        total: total,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async fetchCreatedOutlets(
    user: any,
    search: string,
    type: string,
    creationDate: string,
    vehicleType: string,
    page: number,
    limit: number,
  ) {
    try {
      const userDetails = await this.businessUserModel.findById(user.id);
      if (!userDetails) {
        return {
          success: false,
          message: 'User not found!',
        };
      }

      if (!userDetails) {
        return {
          success: false,
          message: 'User not found!',
        };
      }

      // const userRole = await this.roleModel.findById(userDetails.role);
      // let getOutletObj = {};
      // if (userRole.isBusinessOwner) {
      //   // const getAllManagers = await this.managerList(userDetails.id, 1, 1000);
      //   // console.log('getAllManagers', getAllManagers);
      //   // if (getAllManagers.success) {
      //   //   getAllManagers.data.forEach((manager) => {
      //   //     outletIds = outletIds.concat(manager.outlets);
      //   //   });
      //   // }
      //   getOutletObj['business'] = user.businessProfile;
      // } else {
      //   getOutletObj['_id'] = { $in: mongoUserIds };
      // }
      // console.log('getOutletObj', getOutletObj);
      let match = {};
      if (search) {
        match = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { address1: { $regex: search, $options: 'i' } },
            { address2: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            { state: { $regex: search, $options: 'i' } },
            { postalCode: { $regex: search, $options: 'i' } },
            // { category: { $regex: search, $options: 'i' } },
          ],
        };
      }
      if (type && type !== 'All') {
        match['category'] = type;
      }
      if (creationDate) {
        const date = new Date(creationDate);
        match['createdAt'] = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999)),
        };
      }
      if (vehicleType) {
        match['vehicleType'] = vehicleType;
      }
      console.log('Match:::', match);
      console.log('business:::', user.businessProfile);
      // let outletsO = await this.outletModel
      //   .find({
      //     ...match,
      //     // creator: new mongoose.Types.ObjectId(userDetails._id),
      //     business: new mongoose.Types.ObjectId(user.businessProfile),
      //     // isDeleted: false,
      //   })
      //   .populate({
      //     path: 'manager',
      //     select: 'name email phone countryCode profilePhoto',
      //     match: { manager: { $ne: '' } },
      //   })
      //   .populate('creator', 'name email phone countryCode profilePhoto')
      //   .populate('business', 'name email phone countryCode logo')
      //   .populate('spots')
      //   .sort({ createdAt: -1 })
      //   .skip((page - 1) * limit)
      //   .limit(limit)
      //   .lean();

      let outlets = await this.outletModel.aggregate([
        {
          $match: {
            ...match,
            business: new mongoose.Types.ObjectId(user.businessProfile),
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'businessusers', // Replace with your actual manager collection name
            localField: 'manager',
            foreignField: '_id',
            as: 'manager',
            pipeline: [
              {
                $match: {
                  manager: { $ne: '' },
                },
              },
              {
                $project: {
                  name: 1,
                  email: 1,
                  phone: 1,
                  countryCode: 1,
                  profilePhoto: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$manager',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'businessusers', // Replace with your actual creator collection name
            localField: 'creator',
            foreignField: '_id',
            as: 'creator',
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  phone: 1,
                  countryCode: 1,
                  profilePhoto: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$creator',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'businesses', // Replace with your actual business collection name
            localField: 'business',
            foreignField: '_id',
            as: 'business',
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  phone: 1,
                  countryCode: 1,
                  logo: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: '$business',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'mobilespots', // Replace with your actual spots collection name
            localField: 'spots',
            foreignField: '_id',
            as: 'spots',
          },
        },
        {
          $lookup: {
            from: 'eventschedules', // Replace with your actual schedules collection name
            localField: '_id',
            foreignField: 'outletId',
            as: 'schedules',
          },
        },
        // Lookup events for the schedules
        {
          $lookup: {
            from: 'events', // Replace with your actual events collection name
            let: { scheduleEvents: '$schedules.event' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$_id', '$$scheduleEvents'],
                  },
                  status: EventStatus.PUBLISHED,
                  type: EventTypes.DROPPED_PIN,
                },
              },
            ],
            as: 'validEvents',
          },
        },
        // Add isDroppedPin field
        {
          $addFields: {
            isDroppedPin: {
              $cond: {
                if: {
                  $and: [
                    { $gt: [{ $size: '$schedules' }, 0] },
                    { $gt: [{ $size: '$validEvents' }, 0] },
                    {
                      $anyElementTrue: {
                        $map: {
                          input: '$schedules',
                          as: 'schedule',
                          in: {
                            $or: [
                              // Check for FIXED schedule
                              {
                                $and: [
                                  {
                                    $eq: [
                                      '$$schedule.type',
                                      ScheduleTypes.FIXED,
                                    ],
                                  },
                                  {
                                    $gte: [
                                      '$$schedule.fixedSchedule.date',
                                      new Date(),
                                    ],
                                  },
                                ],
                              },
                              // Check for RECURRING schedule
                              {
                                $and: [
                                  {
                                    $eq: [
                                      '$$schedule.type',
                                      ScheduleTypes.RECURRING,
                                    ],
                                  },
                                  {
                                    $lte: [
                                      '$$schedule.recurringSchedule.startDate',
                                      new Date(),
                                    ],
                                  },
                                  {
                                    $gte: [
                                      '$$schedule.recurringSchedule.endDate',
                                      new Date(),
                                    ],
                                  },
                                ],
                              },
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
        // Remove temporary fields
        {
          $project: {
            schedules: 0,
            validEvents: 0,
          },
        },
      ]);

      const total = await this.outletModel.countDocuments({
        // creator: new mongoose.Types.ObjectId(userDetails._id),
        business: new mongoose.Types.ObjectId(user.businessProfile),
      });

      const numerics = await this.outletModel.aggregate([
        {
          $match: {
            // creator: new mongoose.Types.ObjectId(userDetails._id),
            business: new mongoose.Types.ObjectId(user.businessProfile),
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]);
      console.log('numerics:', numerics);
      return {
        success: true,
        message: 'Outlets fetched successfully.',
        data: outlets,
        total: total,
        categoryCount: numerics,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async getVehicleTypes(page: number, limit: number) {
    try {
      const vehicleTypes = VehicleType;
      // const total = Object.keys(VehicleType).length;
      return {
        success: true,
        message: 'Vehicle Types fetched successfully',
        data: vehicleTypes,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async parseCsv(file: Express.Multer.File): Promise<any[]> {
    const rows: any[] = [];
    const stream = streamifier.createReadStream(file.buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          const missing = ExpectedOutletHeaders.filter(
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

  async getDistanceInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371000; // Earth radius in meters
    const toRad = (val: number) => (val * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  }

  async createOutletFromRow(row: any, user: DecodedUser) {
    try {
      let address = `${row.address1}, ${row.city}, ${row.state}, ${row.country}, ${row.postalCode}`;
      let placeList = await this.googleService.googleRecommendation({
        address: address,
      });
      let placeDetails = await this.googleService.getPlaceDetails(
        placeList.data[0].placePrediction.placeId,
        placeList.sessionToken,
        address,
      );
      const foundOutlet = await this.outletModel.findOne({
        refId: row.referenceId,
      });
      if (foundOutlet) {
        throw new BadRequestException(
          `Outlet with referenceId ${row.referenceId} already exists.`,
        );
      }
      console.log('Place Details:', placeDetails);

      if (!placeDetails || !placeDetails.data) {
        throw new BadRequestException(
          `No place details found for address: ${address}`,
        );
      }
      let googleLat = placeDetails.data['latitude']
        ? parseFloat(placeDetails.data['latitude'])
        : 0;
      let googleLng = placeDetails.data['longitude']
        ? parseFloat(placeDetails.data['longitude'])
        : 0;
      let lat = googleLat;
      let long = googleLng;
      if (row.latitude && row.longitude) {
        lat = row.latitude ? parseFloat(row.latitude) : googleLat;
        long = row.longitude ? parseFloat(row.longitude) : googleLng;
        let givenLat = row.latitude ? parseFloat(row.latitude) : googleLat;
        let givenLng = row.longitude ? parseFloat(row.longitude) : googleLng;

        console.log('Given Coordinates:', { givenLat, givenLng });
        console.log('Google Coordinates:', { googleLat, googleLng });

        if (row.latitude && row.longitude) {
          const distance = await this.getDistanceInMeters(
            googleLat,
            googleLng,
            givenLat,
            givenLng,
          );

          if (distance > 1000) {
            throw new Error(
              `Provided latitude/longitude is not within 1000 meters of calculated location (distance: ${distance.toFixed(
                2,
              )}m).`,
            );
          }
        }
      }

      let outletObj = {
        category: row.category,
        name: row.name,
        address1: row.address1,
        address2: row.address2 ? row.address2 : '',
        city: row.city,
        postalCode: row.postalCode,
        country: row.country,
        state: row.state,
        countryCode: row.countryCode,
        phone: row.phone,
        email: row.email,
        isActive: true,
        refId: row.referenceId,
        creator: new mongoose.Types.ObjectId(user.id),
        business: new mongoose.Types.ObjectId(user.businessProfile),
        latitude: lat,
        longitude: long,
        location: {
          type: 'Point',
          coordinates: [long, lat],
        },
      };
      const outlet = await this.outletModel.create(outletObj);
      console.log('Created Outlet:', outlet);
      await this.businessUserModel.updateOne(
        { _id: user.id },
        {
          $addToSet: {
            outlets: outlet._id,
          },
        },
      );
    } catch (error) {
      throw new BadRequestException(
        'Error creating outlet from row: ' + error.message,
      );
    }
  }

  async createOutletsInBulk(file: Express.Multer.File, user: DecodedUser) {
    try {
      const businessUser = await this.businessUserModel.findById(user.id);
      const business = await this.businessModel.findById(user.businessProfile);
      if (!businessUser || !business) {
        return {
          success: false,
          message: 'Business User or Business not found!',
        };
      }
      const rows = await this.parseCsv(file);
      let failure = 0;
      let result = null;

      const results = await Promise.all(
        rows.map(async (row) => {
          try {
            await this.createOutletFromRow(row, user);
            return { ...row, status: 'Created', message: '' };
          } catch (err) {
            failure++;
            return { ...row, status: 'Failed', message: err.message };
          }
        }),
      );
      console.log('failure:', failure);

      if (failure > 0) {
        const failedRecords = results.filter((r) => r.status === 'Failed');
        try {
          const csvStringifier = createObjectCsvStringifier({
            header: [
              { id: 'category', title: 'Category' },
              { id: 'name', title: 'Name' },
              { id: 'address1', title: 'Address1' },
              { id: 'address2', title: 'Address2' },
              { id: 'city', title: 'City' },
              { id: 'postalCode', title: 'PostalCode' },
              { id: 'country', title: 'Country' },
              { id: 'state', title: 'State' },
              { id: 'countryCode', title: 'CountryCode' },
              { id: 'phone', title: 'Phone' },
              { id: 'email', title: 'Email' },
              { id: 'latitude', title: 'Latitude' },
              { id: 'longitude', title: 'Longitude' },
              { id: 'referenceId', title: 'ReferenceId' },
              { id: 'status', title: 'Status' },
              { id: 'message', title: 'Message' },
            ],
          });

          const header = csvStringifier.getHeaderString();
          const records = failedRecords.map((r) => ({
            category: r.category,
            name: r.name,
            address1: r.address1,
            address2: r.address2,
            city: r.city,
            postalCode: r.postalCode,
            country: r.country,
            state: r.state,
            countryCode: r.countryCode,
            phone: r.phone,
            email: r.email,
            latitude: r.latitude,
            longitude: r.longitude,
            referenceId: r.referenceId,
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
            businessUser.id,
            String(business.drive),
            fileCategory.id,
            fakeFile,
          );
          result = uploadResult.data.metaData.url;
        } catch (error) {
          console.error('Error while creating CSV for failed records:', error);
        }
      }
      return {
        success: true,
        message: 'Outlets created successfully in bulk.',
        data: result, // You can return the created outlets data if needed
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async deleteOutlet(id: string, user: any) {
    try {
      const businessUser = await this.businessUserModel.findById(user.id);
      if (!businessUser) {
        return {
          success: false,
          message: 'Business User not found!',
        };
      }
      const outlet = await this.outletModel.findById(id);
      if (!outlet) {
        return {
          success: false,
          message: 'Outlet not found!',
        };
      }
      await this.outletModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true },
      );
      await this.businessUserModel.updateMany(
        { assignedOutlets: outlet._id },
        { $pull: { assignedOutlets: outlet._id } },
      );
      await this.businessModel.updateOne(
        { _id: outlet.business },
        { $pull: { outlets: outlet._id } },
      );
      return {
        success: true,
        message: 'Outlet deleted successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async createSpot(id: string, user: DecodedUser, data: CreateSpotDto) {
    try {
      const outlet = await this.outletModel.findById(id);
      if (!outlet) {
        return {
          success: false,
          message: 'Outlet not found!',
        };
      }

      let spotObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          spotObj[key] = data[key];
        }
      });
      spotObj['creator'] = new mongoose.Types.ObjectId(user.id);
      spotObj['outlet'] = new mongoose.Types.ObjectId(outlet.id);
      spotObj['business'] = new mongoose.Types.ObjectId(outlet.business);

      const spot = await this.mobileSpotsModel.create(spotObj);

      // const spotExists = outlet.spots.some(
      //   (spot) => spot.name === spotObj.name,
      // );
      // if (spotExists) {
      //   return {
      //     success: false,
      //     message: 'Spot with the same name already exists in this outlet.',
      //   };
      // }
      await this.outletModel.updateOne(
        { _id: outlet.id },
        { $addToSet: { spots: spot._id } },
      );

      return {
        success: true,
        message: 'Spot created successfully.',
        data: spot,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async updateSpot(id: string, user: DecodedUser, data: UpdateSpotDto) {
    try {
      const foundSpot = await this.mobileSpotsModel.findById(id);
      if (!foundSpot) {
        return {
          success: false,
          message: 'Spot not found.',
        };
      }
      if (user.businessProfile.toString() !== foundSpot.business.toString()) {
        return {
          success: false,
          message: 'Only authorised to update your own spot.',
        };
      }

      let spotObj: any = {};
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          spotObj[key] = data[key];
        }
      });

      const spot = await this.mobileSpotsModel.findByIdAndUpdate(
        { _id: foundSpot._id },
        {
          $set: spotObj,
        },
        {
          new: true,
        },
      );

      // const spotExists = outlet.spots.some(
      //   (spot) => spot.name === spotObj.name,
      // );
      // if (spotExists) {
      //   return {
      //     success: false,
      //     message: 'Spot with the same name already exists in this outlet.',
      //   };
      // }

      return {
        success: true,
        message: 'Spot updated successfully.',
        data: spot,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  async activateOutlet(id: string, user: DecodedUser) {
    try {
      await this.outletSummationCompetence(user.businessProfile);
      await this.outletModel.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true },
      );
      await this.businessModel.updateOne(
        { _id: new mongoose.Types.ObjectId(user.businessProfile) },
        {
          $addToSet: {
            activatedOutlets: new mongoose.Types.ObjectId(id),
          },
        },
      );
      return {
        success: true,
        message: 'Outlet activated successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
  async deactivateOutlet(id: string, user: DecodedUser) {
    try {
      return {
        sucess: true,
        message: 'Outlet deactivated successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
}
