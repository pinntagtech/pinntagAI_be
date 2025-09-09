import { Injectable } from '@nestjs/common';
import { CreateEtlDto } from './dto/create-etl.dto';
import { UpdateEtlDto } from './dto/update-etl.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ETL_Source, ETL_SourceDocument  } from './models/etl-source.model';
import { Model } from 'mongoose';
import { CreateEtlSourceDto, UpdateEtlSourceDto } from './dto/ETL-sources.dto';
import { ETL_Source_Group, ETL_Source_GroupDocument } from './models/etl-source-groups.model';
import { CreateEtlSourceGroupDto, UpdateEtlSourceGroupDto } from './dto/ETL-source-group.dto';
import { Admin } from 'mongodb';
import { AdminDocument } from 'src/admin/models/admin.model';
import { BusinessUser, BusinessUserDocument } from 'src/business/model/businessUser.model';
import { Role, RoleDocument } from 'src/roles/models/roles.model';
import { PrivilegeService } from 'src/roles/privilege.service';

@Injectable()
export class EtlService {
  constructor(
    @InjectModel(ETL_Source.name) private readonly etlURLModel: Model<ETL_SourceDocument>,
    @InjectModel(ETL_Source_Group.name) private readonly etlUrlGroupModel: Model<ETL_Source_GroupDocument>,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(BusinessUser.name) private readonly businessUserModel: Model<BusinessUserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    private readonly privilegeService: PrivilegeService,
  ) {}
  // create(createEtlDto: CreateEtlDto) {
  //   return 'This action adds a new etl';
  // }

  // findAll() {
  //   return `This action returns all etl`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} etl`;
  // }

  // update(id: number, updateEtlDto: UpdateEtlDto) {
  //   return `This action updates a #${id} etl`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} etl`;
  // }

  // CRUD for ETL_Source model
  async createUrl(createEtlUrlDto: CreateEtlSourceDto): Promise<ETL_Source> {
    const createdUrl = new this.etlURLModel(createEtlUrlDto);
    return createdUrl.save();
  }

  async findAllUrls() : Promise<ETL_Source[]> {
    const Sources = await this.etlURLModel.find().exec();
    console.log(Sources);
    return Sources;
  }

  async findOneUrl(id: string): Promise<ETL_Source | null> {
    return await this.etlURLModel.findById(id).exec();
  }

  async updateUrl(id: string, updateEtlUrlDto: UpdateEtlSourceDto): Promise<ETL_Source | null> {
    return await this.etlURLModel.findByIdAndUpdate(id, updateEtlUrlDto, { new: true }).exec();
  }

  async removeUrl(id: string): Promise<ETL_Source | null> {
    return await this.etlURLModel.findByIdAndDelete(id).exec();
  }

  // CRUD for ETL_Source_Group model
  async createUrlGroup(createEtlUrlGroupDto: CreateEtlSourceGroupDto): Promise<ETL_Source_Group> {
    const createdGroup = new this.etlUrlGroupModel(createEtlUrlGroupDto);
    return createdGroup.save();
  }

  async findAllUrlGroups(): Promise<ETL_Source_Group[]> {
    return await this.etlUrlGroupModel.find().populate('urls', 'label url status').exec();
  }

  async findOneUrlGroup(id: string): Promise<ETL_Source_Group | null> {
    return await this.etlUrlGroupModel.findById(id).populate('urls', 'label url status').exec();
  }

  async updateUrlGroup(id: string, updateEtlUrlGroupDto: UpdateEtlSourceGroupDto): Promise<ETL_Source_Group | null> {
    return await this.etlUrlGroupModel.findByIdAndUpdate(id, updateEtlUrlGroupDto, { new: true }).exec();
  }

  async removeUrlGroup(id: string): Promise<ETL_Source_Group | null> {
    return await this.etlUrlGroupModel.findByIdAndDelete(id).exec();
  }

  /*
  Start/Pause ETL process for a group.
  Monitor status of ETL runs (success, failure, in-progress).
  View logs of past ETL runs.
  */

  async startEtlProcess(id: string): Promise<string> {
    // Logic to start ETL process for the group
    return `ETL process started for group ${id}`;
  }

  async pauseEtlProcess(id: string): Promise<string> {
    // Logic to pause ETL process for the group
    return `ETL process paused for group ${id}`;
  }

  async getEtlStatus(id: string): Promise<string> {
    // Logic to get ETL status for the group
    return `ETL status for group ${id}`;
  }

  async getEtlLogs(id: string): Promise<string> {
    // Logic to get ETL logs for the group
    return `ETL logs for group ${id}`;
  }

  /*
  Configure ETL schedules (hourly, daily, weekly, monthly, or custom cron).
  Modify or cancel schedules.
  Override schedule to trigger ETL on-demand.
  */

  // Placeholder methods for scheduling functionalities
  async configureSchedule(id: string, schedule: string): Promise<string> {
    // Logic to configure ETL schedule for the group
    return `ETL schedule configured for group ${id} with schedule ${schedule}`;
  }

  async modifySchedule(id: string, newSchedule: string): Promise<string> {
    // Logic to modify ETL schedule for the group
    return `ETL schedule modified for group ${id} to new schedule ${newSchedule}`;
  }

  async cancelSchedule(id: string): Promise<string> {
    // Logic to cancel ETL schedule for the group
    return `ETL schedule canceled for group ${id}`;
  }

  async triggerEtlOnDemand(id: string): Promise<string> {
    // Logic to trigger ETL on-demand for the group
    return `ETL process triggered on-demand for group ${id}`;
  }
}
