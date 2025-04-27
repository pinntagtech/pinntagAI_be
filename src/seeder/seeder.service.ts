import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { AgeGroup, AgeGroupDocument } from 'src/models/ageGroup.model';
import { Category, CategoryDocument } from 'src/models/category.model';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { User, UserDocument } from 'src/user/models/user.model';
import { Seeder } from './data';
import {
  SubscriptionProduct,
  SubscriptionProductDocument,
} from 'src/subscription/models/subscriptionProduct.model';
import { AppVersion, AppVersionDocument } from 'src/models/appVersion.model';
import * as bcrypt from 'bcrypt';
import { Event, EventDocument } from 'src/event/models/event.model';
import { EventTypes } from 'src/enums/event.enums';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';
import { Drive, DriveDocument } from 'src/drive/models/drive.model';
import {
  BusinessProfile,
  BusinessProfileDocument,
} from 'src/business-profile/models/businessProfile.model';
import {
  Actions,
  ResourceTypes,
  RoleBelonging,
  Roles,
} from 'src/roles/enums/roles.enum';
import { Privilege, PrivilegeDocument } from 'src/roles/models/privilage.model';
import { Resource, ResourceDocument } from 'src/roles/models/resource.model';
import { Action, ActionDocument } from 'src/roles/models/actions.model';
import {
  OutletCategory,
  OutletCategoryDocument,
} from 'src/outlet/model/outletCategory.model';
import {
  OutletType,
  OutletTypeDocument,
} from 'src/outlet/model/outletType.model';
import {
  BusinessCountries,
  BusinessDocumentTypes,
  BusinessIndustries,
  // OutletCategoryList,
  OutletCategories,
} from 'src/business/enums/business.enum';
import e from 'express';
import {
  BusinessUser,
  BusinessUserDocument,
} from 'src/business/model/businessUser.model';
import {
  BusinessIndustry,
  BusinessIndustryDocument,
} from 'src/business/model/businessIndustry.model';
import {
  BusinessCategory,
  BusinessCategoryDocument,
} from 'src/business/model/businessCategory.model';
import { In } from 'typeorm';
import {
  BusinessCountry,
  BusinessCountryDocument,
} from 'src/business/model/businessCountry.model';
import {
  BusinessConstitution,
  BusinessConstitutionDocument,
} from 'src/business/model/businessConstitution.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeDocument,
} from 'src/business/model/BussinessDocumentType.model';

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AgeGroup.name)
    private readonly ageGroupModel: Model<AgeGroupDocument>,
    @InjectModel(SubscriptionProduct.name)
    private readonly subscriptionProductModel: Model<SubscriptionProductDocument>,
    @InjectModel(AppVersion.name)
    private readonly appVersionModel: Model<AppVersionDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(FileCategory.name)
    private readonly fileCategoryModel: Model<FileCategoryDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(Drive.name) private readonly driveModel: Model<DriveDocument>,
    @InjectModel(BusinessProfile.name)
    private readonly businessProfileModel: Model<BusinessProfileDocument>,
    @InjectModel(Privilege.name)
    private readonly privilegeModel: Model<PrivilegeDocument>,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Action.name)
    private readonly actionModel: Model<ActionDocument>,
    @InjectModel(OutletCategory.name)
    private readonly outletCategoryModel: Model<OutletCategoryDocument>,
    @InjectModel(OutletType.name)
    private readonly outletTypeModel: Model<OutletTypeDocument>,
    @InjectModel(BusinessUser.name)
    private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(BusinessIndustry.name)
    private readonly businessIndustryModel: Model<BusinessIndustryDocument>,
    @InjectModel(BusinessCategory.name)
    private readonly businessCategoryModel: Model<BusinessCategoryDocument>,
    @InjectModel(BusinessCountry.name)
    private readonly businessCountryModel: Model<BusinessCountryDocument>,
    @InjectModel(BusinessConstitution.name)
    private readonly businessConstitutionModel: Model<BusinessConstitutionDocument>,
    @InjectModel(BusinessDocumentType.name)
    private readonly businessDocumentTypeModel: Model<BusinessDocumentTypeDocument>,
  ) {}

  async seed() {
    await this.seedRoles();
    await this.seedCategories();
    await this.seedAgeGroups();
    await this.seedSubscriptionProducts();
    await this.seedAppVersion();
    await this.setPrivateEvents();
    await this.seedFileCategories();
    await this.seedSuperAdminRole();
    await this.seedSuperAdmin();
    await this.seedResources();
    await this.seedActions();
    await this.seedOutletCategories();
    // await this.seedPrivileges(); super admin privileges are not needed
    await this.seedBusinessIndustries();
    await this.seedBusinessCategories();
    // await this.seedCountries();
    await this.seedConstitutions();
  }

  public async seedRoles() {
    // const roles = await this.roleModel.find().exec();
    // if (!roles.length) {
    //   await this.roleModel
    //     .insertMany(Seeder.roles)
    //     .then(() => console.log('Roles created.'));
    // }
    for (let role of Seeder.roles) {
      const foundRole = await this.roleModel.findOne({ name: role.name });
      if (!foundRole) {
        const newRole = new this.roleModel(role);
        newRole.$locals.isSeeding = true;
        await newRole.save();
      }
    }
  }

  async createDrive(
    ownerId: string | mongoose.Types.ObjectId,
    ownerType: string,
  ): Promise<any> {
    const admin = await this.adminModel.findOne();
    const defaultSpace = admin?.driveDefaultSpace || 100;
    if (!isValidObjectId(ownerId)) {
      throw new BadRequestException(
        'Invalid ownerId format. Must be a valid MongoDB ObjectId.',
      );
    }
    const foundDrive = await this.driveModel.findOne({ owner: ownerId });
    if (foundDrive) {
      return foundDrive;
    }
    let foundOwner = null;
    if (ownerType === Admin.name) {
      foundOwner = await this.adminModel.findById(ownerId);
    } else if (ownerType === User.name) {
      foundOwner = await this.userModel.findById(ownerId);
    } else if (ownerType === BusinessUser.name) {
      foundOwner = await this.businessUserModel.findById(ownerId);
    }

    if (!foundOwner) {
      throw new NotFoundException(
        `No ${ownerType} found with the given ownerId.`,
      );
    }

    const newDrive = new this.driveModel({
      owner: new mongoose.Types.ObjectId(ownerId),
      ownerType,
      TotalSpace: defaultSpace,
      AvailableSpace: defaultSpace,
    });
    await newDrive.save();
    return await this.driveModel
      .findById(newDrive._id)
      .select('_id owner ownerType TotalSpace AvailableSpace');
  }
  async seedSuperAdminRole() {
    const role = await this.roleModel.findOne({ isSuperAdmin: true });
    if (!role) {
      const superAdmin = await this.adminModel.findOne({ isSuperAdmin: true });
      const superAdminRole = new this.roleModel({
        name: Roles.SUPER_ADMIN,
        creatorType: 'System',
        belongsTo: RoleBelonging.SYSTEM,
        isSuperAdmin: true,
        isBusinessOwner: true,
        belongsToSystem: true,
      });
      superAdminRole.$locals.isSeeding = true;
      await superAdminRole.save();
    }
  }
  public async seedSuperAdmin() {
    const role = await this.roleModel.findOne({ isSuperAdmin: true });
    const admin = await this.adminModel.findOne({
      role: role._id,
      isSuperAdmin: true,
    });
    if (role && !admin) {
      const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const superAdmin = new this.adminModel({
        email: process.env.ADMIN_EMAIL,
        password,
        isEmailVerified: true,
        name: process.env.ADMIN_FIRST_NAME,
        role: role._id,
        isSuperAdmin: true,
        firstName: 'Robin',
        lastName: 'Seth',
        // fullPhoneNumber: '+447917303330',
        phone: '7917303330',
        countryCode: '+44',
      });
      superAdmin.$locals.isSeeding = true;
      await superAdmin.save();
      const adminDetails = await this.adminModel.findOne({
        role: role._id,
        isSuperAdmin: true,
      });
      await this.roleModel.updateOne(
        { _id: role.id },
        { $set: { creator: new mongoose.Types.ObjectId(adminDetails.id) } },
      );
      let driveDetails = await this.createDrive(adminDetails._id, Admin.name);
      await this.adminModel.updateOne(
        { _id: adminDetails._id },
        { $set: { drive: driveDetails._id } },
      );
    }
  }

  public async seedCategories() {
    const categories = await this.categoryModel.find().exec();
    if (!categories.length) {
      await this.categoryModel
        .insertMany(Seeder.categories)
        .then(() => console.log('Categories created.'));
    }
  }

  public async seedAgeGroups() {
    const ageGroups = await this.ageGroupModel.find().exec();
    if (!ageGroups.length) {
      await this.ageGroupModel
        .insertMany(Seeder.ageGroups)
        .then(() => console.log('Age groups created.'));
    }
  }

  public async seedSubscriptionProducts() {
    const subscriptionProducts = await this.subscriptionProductModel
      .find()
      .exec();
    if (!subscriptionProducts.length) {
      await this.subscriptionProductModel
        .insertMany(Seeder.subscriptionProducts)
        .then(() => console.log('Subscription products created.'));
    }
  }

  public async seedAppVersion() {
    const appVersion = await this.appVersionModel.find().exec();
    if (!appVersion.length) {
      await this.appVersionModel
        .insertMany(Seeder.appVersions)
        .then(() => console.log('App versions created.'));
    }
  }
  async setPrivateEvents() {
    const privateEvents = await this.eventModel.find({
      type: EventTypes.PRIVATE,
    });
    for (const event of privateEvents) {
      const creator = event.user;
      if (event.participants.includes(creator)) {
        await this.eventModel.updateOne(
          { _id: event._id },
          { $pull: { participants: creator } },
        );
      }
    }
  }
  async seedFileCategories() {
    const fileCategories = await this.fileCategoryModel.find();
    if (!fileCategories.length) {
      await this.fileCategoryModel.insertMany(Seeder.fileCategories);
    }
  }
  async seedPrivileges() {
    const privileges = await this.privilegeModel.find();
    if (!privileges.length) {
      const superAdmin = await this.adminModel.findOne({ isSuperAdmin: true });
      for (let [key, action] of Object.entries(Actions)) {
        for (let [resKey, resource] of Object.entries(ResourceTypes)) {
          await this.privilegeModel.create({
            role: new mongoose.Types.ObjectId(superAdmin.role[0]),
            resource: resource,
            action: action,
          });
        }
      }
    }
  }
  async seedResources() {
    const resources = await this.resourceModel.find();

    if (resources.length < Object.values(ResourceTypes).length) {
      for (let value of Object.values(ResourceTypes)) {
        let findResource = await this.resourceModel.findOne({ title: value });
        if (!findResource) {
          await this.resourceModel.create({ title: value });
        }
      }
    }
  }
  async seedActions() {
    const actions = await this.actionModel.find();
    if (!actions.length) {
      for (let action of Object.values(Actions)) {
        await this.actionModel.create({ title: action });
      }
    }
  }
  async seedOutletCategories() {
    const findOutletCategories = await this.outletCategoryModel.find();
    if (findOutletCategories.length < Object.values(OutletCategories).length) {
      for (const outletCategory of Object.keys(OutletCategories)) {
        const foundOutletCategory = await this.outletCategoryModel.findOne({
          title: outletCategory,
        });

        if (!foundOutletCategory) {
          const createdOutletCategory = await this.outletCategoryModel.create({
            title: outletCategory,
          });
          for (const outletCategoryType of Object.values(
            OutletCategories[outletCategory],
          )) {
            const foundType = await this.outletTypeModel.findOne({
              type: outletCategoryType,
              category: new mongoose.Types.ObjectId(createdOutletCategory.id),
            });
            if (!foundType) {
              await this.outletTypeModel.create({
                type: outletCategoryType,
                category: new mongoose.Types.ObjectId(
                  createdOutletCategory._id,
                ),
              });
            }
          }
        } else {
          for (const outletCategoryType of Object.values(
            OutletCategories[outletCategory],
          )) {
            const foundType = await this.outletTypeModel.findOne({
              type: outletCategoryType,
              category: new mongoose.Types.ObjectId(foundOutletCategory.id),
            });
            if (!foundType) {
              await this.outletTypeModel.create({
                type: outletCategoryType,
                category: new mongoose.Types.ObjectId(foundOutletCategory._id),
              });
            }
          }
        }
      }
    }
  }

  // async seedBusinessIndustries() {
  //   const superAdmin = await this.adminModel.findOne({ isSuperAdmin: true });
  //   const findBusinessIndustry = await this.businessIndustryModel.find();
  //   if (findBusinessIndustry.length < Seeder.BusinessIndustries.length) {
  //     for (let industry of Seeder.BusinessIndustries) {
  //       const foundIndustry = await this.businessIndustryModel.findOne({
  //         title: industry.title,
  //       });
  //       if (!foundIndustry) {
  //         const createdBusinessIndustry =
  //           await this.businessIndustryModel.create({
  //             title: industry.title,
  //             lightIcon: industry.lightIcon,
  //             darkIcon: industry.darkIcon,
  //             activeColor: industry.activeColor,
  //             createdBy: new mongoose.Types.ObjectId(superAdmin.id),
  //           });
  //       }
  //     }
  //   }
  // }
  async seedBusinessIndustries() {
    // 1. Fetch super-admin once
    const superAdmin = await this.adminModel.findOne({ isSuperAdmin: true }).lean();
  
    if (!superAdmin) {
      throw new Error("Super-admin user not found");
    }
  
    // 2. Prepare upsert operations for all industries
    const ops = Seeder.BusinessIndustries.map((industry) => ({
      updateOne: {
        filter: { title: industry.title },
        update: {
          $setOnInsert: {
            title: industry.title,
            lightIcon: industry.lightIcon,
            darkIcon: industry.darkIcon,
            activeColor: industry.activeColor,
            createdBy: new mongoose.Types.ObjectId(superAdmin._id),
          },
        },
        upsert: true,
      },
    }));
  
    // 3. Execute all in one bulkWrite
    const result = await this.businessIndustryModel.bulkWrite(ops);
  
    // 4. (Optional) Log how many were inserted vs. already existed
    const inserted = result.upsertedCount;
    const matched = result.matchedCount - inserted;
    console.log(
      `Business‐Industries: ${inserted} created, ${matched} already existed`
    );
  }
  // async seedBusinessCategories() {
  //   const superAdmin = await this.adminModel.findOne({ isSuperAdmin: true });
  //   const findBusinessCategory = await this.businessCategoryModel.find();
  //   if (findBusinessCategory.length < Seeder.BusinessCategories.length) {
  //     for (let category of Seeder.BusinessCategories) {
  //       const industry = await this.businessIndustryModel.findOne({
  //         title: category.industry,
  //       });
  //       if (industry) {
  //         const foundCategory = await this.businessCategoryModel.findOne({
  //           title: category.title,
  //           industry: industry._id,
  //         });
  //         if (!foundCategory) {
  //           const createdCategory = await this.businessCategoryModel.create({
  //             title: category.title,
  //             industry: industry._id,
  //             lightIcon: category.lightIcon,
  //             darkIcon: category.darkIcon,
  //             activeColor: category.activeColor,
  //             createdBy: superAdmin._id,
  //           });
  //         }
  //       }
  //     }
  //   }
  // }

// Optimized seeding of BusinessCategories using bulkWrite
async seedBusinessCategories() {
  // 1. Fetch super-admin once
  const superAdmin = await this.adminModel
    .findOne({ isSuperAdmin: true })
    .lean();
  if (!superAdmin) throw new Error('Super-admin user not found');

  // 2. Lookup industries for mapping title to _id
  const industries = await this.businessIndustryModel
    .find({ title: { $in: Seeder.BusinessCategories.map(c => c.industry) } })
    .lean();
  const industryMap = industries.reduce((map, ind) => {
    map[ind.title] = ind._id;
    return map;
  }, {} as Record<string, mongoose.Types.ObjectId>);

  // 3. Prepare bulk operations for categories
  // Cast to mongoose.AnyBulkWriteOperation[] to satisfy TS typings
  const ops = Seeder.BusinessCategories.flatMap(category => {
    const indId = industryMap[category.industry];
    if (!indId) return [];
    return [{
      updateOne: {
        filter: { title: category.title, industry: indId },
        update: { $setOnInsert: {
            title: category.title,
            industry: indId,
            lightIcon: category.lightIcon,
            darkIcon: category.darkIcon,
            activeColor: category.activeColor,
            createdBy: new mongoose.Types.ObjectId(superAdmin._id)
        }},
        upsert: true
      }
    }];
  }) as mongoose.AnyBulkWriteOperation[];

  // 4. Execute bulkWrite if there are operations
  if (ops.length) {
    const result = await this.businessCategoryModel.bulkWrite(ops);
    console.log(
      `BusinessCategories: ${result.upsertedCount} created, ${result.matchedCount - result.upsertedCount} existed`
    );
  }
}

  

  async seedCountries() {
    const existingCount = await this.businessCountryModel.countDocuments();
    const totalCountries = Object.keys(BusinessCountries).length;

    if (existingCount < totalCountries) {
      for (const country of Object.values(BusinessCountries)) {
        if (typeof country === 'object' && country !== null) {
          const foundCountry = await this.businessCountryModel.findOne({
            name: country.name,
          });

          if (!foundCountry) {
            await this.businessCountryModel.create({
              name: country.name,
              currency: country.currency,
              phoneCode: country.phoneCode,
            });
          }
        }
      }
    } else {
      console.log('All countries are already seeded.');
    }
  }
  async seedConstitutions() {
    const existingCountries = await this.businessCountryModel.find();
    if (existingCountries.length < Object.keys(BusinessDocumentTypes).length) {
      for (let country of Object.values(BusinessCountries)) {
        const createdCountry = await this.businessCountryModel.create({
          name: country.name,
          currency: country.currency,
          phoneCode: country.phoneCode,
        });

        for (let constitution of Object.keys(
          BusinessDocumentTypes[country.name],
        )) {
          console.log('constitution:', constitution);

          const createConstitution =
            await this.businessConstitutionModel.create({
              title: constitution,
              country: new mongoose.Types.ObjectId(createdCountry.id),
            });
          console.log('createConstitution:', createConstitution);

          for (let document of Object.values(
            BusinessDocumentTypes[country.name][constitution],
          )) {
            console.log('document:', document);
            const createdDocument = await this.businessDocumentTypeModel.create(
              {
                title: document,
                constitution: new mongoose.Types.ObjectId(
                  createConstitution.id,
                ),
              },
            );
          }
        }
      }
    }
  }
}
