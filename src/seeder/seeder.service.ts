import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { AgeGroup, AgeGroupDocument } from 'src/models/ageGroup.model';
import { Category, CategoryDocument } from 'src/models/contentCategory.model';
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
import { DiscountType, EventTypes } from 'src/enums/event.enums';
import { Admin, AdminDocument } from 'src/admin/models/admin.model';
import {
  FileCategory,
  FileCategoryDocument,
} from 'src/drive/models/fileCategory.model';
import { Drive, DriveDocument } from 'src/drive/models/drive.model';
// import {
//   BusinessProfile,
//   BusinessProfileDocument,
// } from 'src/business-profile/models/businessProfile.model';
import {
  Actions,
  ResourceTypes,
  RoleBelonging,
  RoleCreatorType,
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
  BusinessCreatorType,
  BusinessDocumentTypes,
  BusinessStatus,
  BusinessUserCreatorType,
  // BusinessIndustries,
  // OutletCategoryList,
  OutletCategories,
  ProfileStatus,
  RegionCreatorType,
} from 'src/business/enums/business.enum';
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
import {
  DefaultAdminRoles,
  DefaultBusinessDepartmentRoles,
} from 'src/business/resourceInits/template-roles';
import { Template, TemplateDocument } from 'src/event/models/template.model';
import {
  DashboardConfig,
  DashboardConfigDocument,
} from 'src/auth/models/dashboardConfig.model';
import {
  Department,
  DepartmentDocument,
} from 'src/business/model/department.model';
import { Business, BusinessDocument } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Region, RegionDocument } from 'src/business/model/region.model';

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
    // @InjectModel(BusinessProfile.name) private readonly businessProfileModel: Model<BusinessProfileDocument>,
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
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
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
    @InjectModel(DashboardConfig.name)
    private readonly dashboardConfigModel: Model<DashboardConfigDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Business.name)
    private readonly businessModel: Model<BusinessDocument>,
    @InjectModel(Region.name)
    private readonly regionModel: Model<RegionDocument>,
    private readonly driveService: DriveService,
    // private readonly businessService: BusinessService,
  ) {}

  async seed() {
    await this.seedRoles();
    await this.seedAgeGroups();
    await this.seedSubscriptionProducts();
    await this.seedAppVersion();
    await this.setPrivateEvents();
    await this.seedFileCategories();
    await this.seedResources();
    await this.seedActions();
    await this.seedSuperAdminRole();
    await this.seedSuperAdmin();
    // await this.seedOutletCategories();
    await this.seedPrivileges(); //super admin privileges are not needed
    await this.seedCategories();
    await this.seedBusinessIndustries();
    await this.seedBusinessCategories();
    await this.seedCountries();
    await this.seedEventTemplates();
    // await this.seedConstitutions();
    await this.seedDashboardConfigs();
    await this.seedPinntagBusinessProfile();
  }

  public async seedRoles() {
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
        { $set: { creator: new mongoose.Types.ObjectId(adminDetails._id) } },
      );
      let driveDetails = await this.createDrive(adminDetails._id, Admin.name);
      await this.adminModel.updateOne(
        { _id: adminDetails._id },
        { $set: { drive: driveDetails._id } },
      );

      // const rolePromises = Object.keys(DefaultAdminRoles).map(
      //   async (roleName) => {
      //     const roleData = DefaultAdminRoles[roleName];
      //     // Create the role
      //     const createdRole = await this.roleModel.create({
      //       name: roleData.name,
      //       creator: new mongoose.Types.ObjectId(adminDetails._id),
      //       creatorType: RoleCreatorType.ADMIN,
      //       belongsTo: RoleBelonging.SYSTEM,
      //     });
      //     // Create privileges for this role concurrently
      //     const privilegePromises = Object.keys(roleData.privileges).map(
      //       async (privilegeKey) => {
      //         // Get or create the resource document
      //         let resourceDetails = await this.resourceModel.findOne({
      //           title: ResourceTypes[privilegeKey],
      //         });
      //         if (!resourceDetails) {
      //           resourceDetails = await this.resourceModel.create({
      //             title: ResourceTypes[privilegeKey],
      //           });
      //         }
      //         // For each action in the privilege, get or create the action document and create a privilege record
      //         const actionPromises = roleData.privileges[privilegeKey].map(
      //           async (actionKey) => {
      //             let actionDetails = await this.actionModel.findOne({
      //               title: Actions[actionKey],
      //             });
      //             if (!actionDetails) {
      //               actionDetails = await this.actionModel.create({
      //                 title: Actions[actionKey],
      //               });
      //             }
      //             return this.privilegeModel.create({
      //               role: createdRole._id,
      //               resource: resourceDetails.title,
      //               action: actionDetails.title,
      //             });
      //           },
      //         );
      //         return Promise.all(actionPromises);
      //       },
      //     );
      //     await Promise.all(privilegePromises);
      //   },
      // );
      // await Promise.all(rolePromises);

      for (const roleName of Object.keys(DefaultAdminRoles)) {
        const roleData = DefaultAdminRoles[roleName];

        // 1) Create the role
        const createdRole = await this.roleModel.create({
          name: roleData.name,
          creator: adminDetails._id,
          creatorType: RoleCreatorType.ADMIN,
          belongsTo: RoleBelonging.SYSTEM,
        });

        // 2) For each privilegeKey under this role:
        for (const privilegeKey of Object.keys(roleData.privileges)) {
          const resourceTitle = ResourceTypes[privilegeKey];
          // console.log('Resource Title:', resourceTitle);
          if (!resourceTitle) {
            console.warn(`Skipping missing ResourceTypes['${privilegeKey}']`);
            continue;
          }

          // 2a) Find or create the resource
          let resourceDoc = await this.resourceModel.findOne({
            title: resourceTitle,
          });
          if (!resourceDoc) {
            resourceDoc = await this.resourceModel.create({
              title: resourceTitle,
            });
          }

          // 3) For each action under this privilege:
          for (const actionKey of roleData.privileges[privilegeKey]) {
            const actionTitle = Actions[actionKey];
            if (!actionTitle) {
              console.warn(`Skipping missing Actions['${actionKey}']`);
              continue;
            }

            // 3a) Find or create the action
            let actionDoc = await this.actionModel.findOne({
              title: actionTitle,
            });
            if (!actionDoc) {
              actionDoc = await this.actionModel.create({ title: actionTitle });
            }

            // 4) Create the privilege link
            await this.privilegeModel.create({
              role: createdRole._id,
              resource: resourceDoc.title,
              action: actionDoc.title,
            });
          }
        }
      }
    }
  }
  public async seedCategories() {
    const categories = await this.categoryModel.find();
    if (!categories.length) {
      await this.categoryModel
        .insertMany(Seeder.ContentCategories)
        .then(() => console.log('Categories created.'));
    }

    // 1. Fetch super-admin once
    const superAdmin = await this.adminModel
      .findOne({ isSuperAdmin: true })
      .lean();

    if (!superAdmin) {
      throw new Error('Super-admin user not found');
    }

    // 2. Prepare upsert operations for all industries
    const ops = Seeder.ContentCategories.map((category) => ({
      updateOne: {
        filter: { title: category.title },
        update: {
          $setOnInsert: {
            title: category.title,
            lightIcon: category.lightIcon,
            darkIcon: category.darkIcon,
            activeColor: category.activeColor,
            description: category.description,
            createdBy: new mongoose.Types.ObjectId(superAdmin._id),
          },
        },
        upsert: true,
      },
    }));

    // 3. Execute all in one bulkWrite
    const result = await this.categoryModel.bulkWrite(ops);

    // 4. (Optional) Log how many were inserted vs. already existed
    const inserted = result.upsertedCount;
    const matched = result.matchedCount - inserted;
    console.log(
      `Content-Category: ${inserted} created, ${matched} already existed`,
    );
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

  async seedBusinessIndustries() {
    // 1. Fetch super-admin once
    const superAdmin = await this.adminModel
      .findOne({ isSuperAdmin: true })
      .lean();

    if (!superAdmin) {
      throw new Error('Super-admin user not found');
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
      `Business‐Industries: ${inserted} created, ${matched} already existed`,
    );
  }
 
  async seedBusinessCategories() {
    // 1. Fetch super-admin once
    const superAdmin = await this.adminModel
      .findOne({ isSuperAdmin: true })
      .lean();
    if (!superAdmin) throw new Error('Super-admin user not found');

    // 2. Lookup industries for mapping title to _id
    const industries = await this.businessIndustryModel
      .find({
        title: { $in: Seeder.BusinessCategories.map((c) => c.industry) },
      })
      .lean();
    const industryMap = industries.reduce(
      (map, ind) => {
        map[ind.title] = ind._id;
        return map;
      },
      {} as Record<string, mongoose.Types.ObjectId>,
    );

    // 3. Prepare bulk operations for categories
    const ops = Seeder.BusinessCategories.flatMap((category) => {
      const indId = industryMap[category.industry];
      if (!indId) return [];
      return [
        {
          updateOne: {
            filter: { title: category.title, industry: indId },
            update: {
              $setOnInsert: {
                title: category.title,
                industry: indId,
                lightIcon: category.lightIcon,
                darkIcon: category.darkIcon,
                activeColor: category.activeColor,
                createdBy: new mongoose.Types.ObjectId(superAdmin._id),
              },
            },
            upsert: true,
          },
        },
      ];
    }) as mongoose.AnyBulkWriteOperation[];

    // 4. Execute bulkWrite if there are operations
    if (ops.length) {
      const result = await this.businessCategoryModel.bulkWrite(ops);
      console.log(
        `BusinessCategories: ${result.upsertedCount} created, ${result.matchedCount - result.upsertedCount} existed`,
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

  async seedEventTemplates() {
    const eventTemplates = await this.templateModel.find();
    if (eventTemplates.length) {
      return;
    }

    for (let template of Seeder.EventTemplates) {
      let eventCategoriesId = [];
      for (let category of template.categories) {
        let foundCategory = await this.categoryModel.findOne({
          title: category,
        });
        if (foundCategory) {
          eventCategoriesId.push(foundCategory._id);
        }
      }
      let businessCategoriesId = [];
      for (let bCat of template.businessCategories) {
        let foundCategory = await this.businessCategoryModel.findOne({
          title: bCat,
        });
        if (foundCategory) {
          businessCategoriesId.push(foundCategory._id);
        }
      }
      let businessIndustry = await this.businessIndustryModel.findOne({
        title: template.businessIndustry,
      });
      let createObj = {
        creatorType: Admin.name,
        type: template.type,
        discountType: template.discountType,
        discountValue: template.discountValue,
        title: template.title,
        keywords: template.keywords,
        description: template.description,
        minTargetAge: template.minTargetAge,
        maxTargetAge: template.maxTargetAge,
        targetGenders: template.targetGenders,
        promotionCode: template.promotionCode,
        isFree: template.isFree,
        participationCost: template.participationCost,
        termsApplied: template.termsApplied,
        termsAndConditions: template.termsAndConditions,
        thumbnail: template.thumbnail,
        categories: eventCategoriesId,
        businessIndustry: businessIndustry._id,
        businessCategories: businessCategoriesId,
      };
      await this.templateModel.create(createObj);
    }
  }
  
  async seedDashboardConfigs() {
    const dashboardConfigs = await this.dashboardConfigModel.find();
    if (dashboardConfigs.length !== 0) return;

    const superAdmin = await this.adminModel.findOne({ isSuperAdmin: true });
    if (!superAdmin) return;

    for (const cfg of Seeder.DashboardConfigs) {
      const cats = await this.categoryModel
        .find({ title: { $in: cfg.categories } })
        .select('_id')
        .lean();

      const catIds = cats.map((c) => c._id);
      if (catIds.length !== cfg.categories.length) {
        console.warn(
          `Some categories for "${cfg.name}" not found; found ${catIds.length} of ${cfg.categories.length}`,
        );
      }

      await this.dashboardConfigModel.create({
        name: cfg.name,
        offersIncluded: cfg.offersIncluded,
        eventsIncluded: cfg.eventsIncluded,
        flashOffersIncluded: cfg.flashOffersIncluded,
        freeIncluded: cfg.freeIncluded,
        limit: cfg.limit,
        categories: catIds,
        sortOrder: cfg.sortOrder,
      });
    }
  }

  async seedDepartments() {
    const departments = await this.departmentModel.find();
    if (departments.length !== 0) return;

    for (const dept of Seeder.Departmens) {
      const roles = await this.roleModel
        .find({ name: { $in: dept.roles } })
        .select('_id')
        .lean();

      const catIds = roles.map((r) => r._id);
      if (catIds.length !== dept.roles.length) {
        console.warn(
          `Some roles for "${dept.name}" not found; found ${catIds.length} of ${dept.roles.length}`,
        );
      }

      await this.departmentModel.create({
        name: dept.name,
        roles: catIds,
        description: dept.description,
        creatorType: RegionCreatorType.SYSTEM,
      });
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
      for (const region of Seeder.Regions) {
        const createdRegion = await this.regionModel.create({
          name: region.name,
          description: region.description,
          business: businessId,
          createdBy: new mongoose.Types.ObjectId(userId),
        });
        await this.departmentModel.updateOne(
          { _id: createdRegion._id },
          { $set: { roles: [] } },
        );
      }
    } catch (error) {
      console.error('Error seeding business department roles:', error);
      throw new Error('Failed to seed business department roles');
    }
  }
  async seedPinntagBusinessProfile() {
    let email = process.env.PINNTAG_BUSINESS_USER_EMAIL;
    let password = process.env.PINNTAG_BUSINESS_USER_PASSWORD;
    const hashedPassword = await bcrypt.hash(password, 10);
    const foundUser = await this.businessUserModel.findOne({
      email: email,
    });
    if (foundUser) {
      return;
    }
    const user = await this.adminModel.findOne({ isSuperAdmin: true });
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
      email: email,
      password: hashedPassword,
      isEmailVerified: true,
      name: 'Pinntag',
      status: ProfileStatus.EMAIL_VERIFIED,
    };
    let createdUser = await this.businessUserModel.create(createObj);
    let driveDetails = await this.createDrive(
      createdUser._id,
      BusinessUser.name,
    );
    createdUser = await this.businessUserModel.findOneAndUpdate(
      { _id: createdUser.id },
      { $set: { drive: new mongoose.Types.ObjectId(driveDetails.id) } },
      { new: true },
    );
    const businessFolder = await this.driveService.createFolder(
      String(createdUser._id),
      {
        parentDirectory: createdUser.drive,
        parentType: Drive.name,
        folderName: 'Pinntag Limited',
      },
    );
    let businessIndustry = await this.businessIndustryModel.findOne({
      title: 'Professional Services',
    });
    let businessCategory = await this.businessCategoryModel.findOne({
      title: 'Business Consultant',
      industry: businessIndustry._id,
    });
    let categoryIds = [];
    categoryIds.push(businessCategory._id);

    let businessObj = {
      name: 'PinnTag Limited',
      email: email,
      website: 'www.pinntag.com',
      isActive: true,
      addressLine1: '13 Sounds Lodge',
      addressLine2: 'Crockenhill',
      city: 'Swanley',
      postalCode: 'BR8 8TD',
      country: 'United Kingdom',
      businessIndustry: new mongoose.Types.ObjectId(businessIndustry._id),
      businessCategories: categoryIds,
      state: 'Kent',
      cover:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Brand+Kit/PinnTag+Cover.png',
      logo: 'https://pinntag-assets.s3.us-east-1.amazonaws.com/Brand+Kit/PinnTag+Logo.png',
      countryCode: '+44',
      phone: '7917303330',
      roleOfCreator: 'Owner',
      drivePath: new mongoose.Types.ObjectId(businessFolder.data._id),
      creatorType: BusinessCreatorType.ADMIN,
      creator: new mongoose.Types.ObjectId(user.id),
      authorisedUser: new mongoose.Types.ObjectId(createdUser._id),
      continueJourney: false,
      status: BusinessStatus.COVER_ADDED,
      description:
        'PinnTag is a business consultancy firm that provides expert advice and solutions to help businesses grow and succeed. Our team of experienced consultants works closely with clients to understand their unique challenges and develop tailored strategies that drive results. From operational efficiency to market expansion, we are committed to delivering value and helping businesses achieve their goals.',
    };

    const createdBusiness = await this.businessModel.create(businessObj);

    this.seedBusinessDepartmentRoles(createdUser.id, createdBusiness._id)
      .then(() => console.log('Business roles seeded successfully'))
      .catch((err) => console.error('Error seeding business roles:', err));
    await this.businessUserModel.updateOne(
      { _id: createdBusiness.authorisedUser },
      {
        $addToSet: {
          business: createdBusiness._id,
        },
      },
    );
  }
}
