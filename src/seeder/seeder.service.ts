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
import { Actions, ResourceTypes, Roles } from 'src/roles/enums/roles.enum';
import { Privilege, PrivilegeDocument } from 'src/roles/models/privilage.model';
import { Resource, ResourceDocument } from 'src/roles/models/resource.model';
import { Action, ActionDocument } from 'src/roles/models/actions.model';

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
    @InjectModel(Privilege.name) private readonly privilegeModel:Model<PrivilegeDocument>,
    @InjectModel(Resource.name) private readonly resourceModel:Model<ResourceDocument>,
    @InjectModel(Action.name) private readonly actionModel: Model<ActionDocument>,
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
    // await this.seedPrivileges();
  }

  public async seedRoles() {
    const roles = await this.roleModel.find().exec();
    if (!roles.length) {
      await this.roleModel
        .insertMany(Seeder.roles)
        .then(() => console.log('Roles created.'));
    }
  }

  async createDrive(
    ownerId: string | mongoose.Types.ObjectId,
    ownerType: string,
  ): Promise<Drive> {
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
    } else if (ownerType === BusinessProfile.name) {
      foundOwner = await this.businessProfileModel.findById(ownerId);
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
    return newDrive.save();
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
      });
      superAdmin.$locals.isSeeding = true;
      await superAdmin.save();
    }
  }
  async seedSuperAdminRole() {
    const role = await this.roleModel.findOne({ isSuperAdmin: true });
    if (!role) {
      const superAdminRole = new this.roleModel({
        name: Roles.SUPER_ADMIN,
        creatorType: 'System',
        isSuperAdmin: true,
        isPrimaryAdmin: true,
        belongsToSystem: true,
        privileges: ['*'],
      });
      superAdminRole.$locals.isSeeding = true;
      await superAdminRole.save();
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
    if(!privileges.length){
      const superAdmin = await this.adminModel.findOne({isSuperAdmin:true});
      for(let [key,action] of Object.entries(Actions)){
        for(let [resKey,resource] of Object.entries(ResourceTypes)){
          await this.privilegeModel.create({
            role:superAdmin._id,
            resource:resource,
            action: action
          })
        }
      }
    }
    
  }
  async seedResources() {
    const resources = await this.resourceModel.find();
   
    if(resources.length <  Object.values(ResourceTypes).length){
      for( let value of Object.values(ResourceTypes)){
        let findResource = await this.resourceModel.findOne({title:value});
        if(!findResource){
          await this.resourceModel.create({title:value})
        }
      }
    }
    
  }
  async seedActions() {
    const actions = await this.actionModel.find();
    if(!actions.length){
      for (let action of Object.values(Actions)){
        await this.actionModel.create({title:action});
      }
    }
  }
}
