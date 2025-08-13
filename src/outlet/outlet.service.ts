import { BadRequestException, Injectable } from '@nestjs/common';
import mongoose, { get, Model } from 'mongoose';
import { BusinessUserCreatorType } from 'src/business/enums/business.enum';
import { DefaultBusinessRoles } from 'src/business/resourceInits/template-roles';
import { Category } from 'src/models/contentCategory.model';
import { CreateOutletDto } from './dto/create-outlet.dto';
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
    private readonly googleService: GoogleService,
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

  async createOutlet(data: CreateOutletDto, user: any) {
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
        // type,
        // refId,
        name,
        // manager,
        city,
        state,
        country,
        postalCode,
        countryCode,
        phone,
        email,
        // whatsappNumber,
        website,
        // facebook,
        // instagram,
        // twitter,
        // googleMyBusinessId,
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
      if(data.openingTime) {
        createObj['openingTime'] = new Date(data.openingTime);
      }

      if(data.closingTime) {
        createObj['closingTime'] = new Date(data.closingTime);
      }

      const outlet = await this.outletModel.create(createObj);

      let updateObj: any = {};
      if (outlet.category === OutletCategoryList.PHYSICAL) {
        updateObj['physicalUnitsCreated'] = business.physicalUnitsCreated + 1;
      }
      if (outlet.category === OutletCategoryList.MOBILE) {
        updateObj['mobileUnitsCreated'] = business.mobileUnitsCreated + 1;
      }
      console.log('Business User Id:', businessUser.id);

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
  async getOutlets(user: any,type: string, page: number, limit: number) {
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
      console.log('UserDetails:', userDetails);

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
      const outlets = await this.outletModel
        .find({
          ...match,
          creator: new mongoose.Types.ObjectId(userDetails._id),
          business: new mongoose.Types.ObjectId(user.businessProfile),
        })
        .populate({
          path: 'manager',
          select: 'name email phone countryCode profilePhoto',
          match: { manager: { $ne: '' } },
        })
        .populate('creator', 'name email phone countryCode profilePhoto')
        // .populate({
        //   path: 'creator',
        //   select: 'name email phone countryCode profilePhoto',
        //   match: { _id: { $ne: '' } },
        // })
        .populate('business', 'name email phone countryCode logo')
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await this.outletModel.countDocuments({
        creator: new mongoose.Types.ObjectId(userDetails._id),
        business: new mongoose.Types.ObjectId(user.businessProfile),
      });

      const numerics = await this.outletModel.aggregate([
        {
          $match: {
            creator: new mongoose.Types.ObjectId(userDetails._id),
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
        latitude: placeDetails.data['latitude']
          ? parseFloat(placeDetails.data['latitude'])
          : 0,
        longitude: placeDetails.data['longitude']
          ? parseFloat(placeDetails.data['longitude'])
          : 0,
        location: {
          type: 'Point',
          coordinates: [
            placeDetails.data['longitude']
              ? parseFloat(placeDetails.data['longitude'])
              : 0,
            placeDetails.data['latitude']
              ? parseFloat(placeDetails.data['latitude'])
              : 0,
          ],
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
      console.log('Parsed rows:', rows);
      // for (const row of rows) {
      //   await this.createOutletFromRow(row, user); // Your own outlet creation logic
      // }

      await Promise.all(rows.map((row) => this.createOutletFromRow(row, user)));

      return {
        success: true,
        message: 'Outlets created successfully in bulk.',
        // data: [], // You can return the created outlets data if needed
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
