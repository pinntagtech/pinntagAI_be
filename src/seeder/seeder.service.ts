import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { AgeGroup, AgeGroupDocument } from 'src/models/ageGroup.model';
import { Category, CategoryDocument } from 'src/models/category.model';
import { Role, RoleDocument } from 'src/roles/models/role.model';
import { User, UserDocument } from 'src/user/models/user.model';
import { Seeder } from './data';
import { Roles } from 'src/enums/user.enum';
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
  ) {}

  async seed() {
    await this.seedRoles();
    await this.createDefaultAdmin();
    await this.seedCategories();
    await this.seedAgeGroups();
    await this.seedSubscriptionProducts();
    await this.seedAppVersion();
    await this.setPrivateEvents();
    await this.seedFileCategories();
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

  public async createDefaultAdmin() {
    const role = await this.roleModel.findOne({ name: Roles.ADMIN }).exec();
    const admin = await this.adminModel
      .findOne({ role: role._id, email: process.env.ADMIN_EMAIL })
      .exec();
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    if (!admin) {
      let admin = await this.adminModel.create({
        firstName: process.env.ADMIN_FIRST_NAME,
        email: process.env.ADMIN_EMAIL,
        password,
        isEmailVerified: true,
        isPhoneVerified: true,
        role: role._id,
      });
      // .then(() => console.log('Def Admin created.'));
      console.log('Def Admin created.');
      await this.createDrive(admin.id, Admin.name);
    }
  }
  async seedSuperAdminRole() {
    const role = await this.roleModel.findOne({ isSuperAdmin: true });
    if (!role) {
      await this.roleModel.create({
        name: SystmeRoles.SUPER_ADMIN,
        creatorType: 'System',
        isSuperAdmin: true,
        isPrimaryAdmin: true,
        belongsToSystem: true,
        privileges: ['*'],
      });
    }
  }
 
 
  async seedSuperAdmin() {
    const role = await this.roleModel.findOne({ isSuperAdmin: true });
    const admin = await this.adminModel.findOne({ isSuperAdmin: true });
    if (role && !admin) {
      const password = await this.authService.encryptPassword(
        process.env.SUPER_ADMIN_PASSWORD,
      );
      await this.adminModel.create({
        email: process.env.SUPER_ADMIN_EMAIL,
        password,
        name: process.env.SUPER_ADMIN_NAME,
        role: role._id,
        isSuperAdmin: true,
      });
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
}
