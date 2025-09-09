import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  // Put,
  // Query,
  Req,
  Res,
  // UnauthorizedException,
  // UploadedFile,
  // UploadedFiles,
  UseGuards,
  // UseInterceptors,
  Patch,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EtlService } from './etl.service';
// import { CreateEtlDto } from './dto/create-etl.dto';
// import { UpdateEtlDto } from './dto/update-etl.dto';
import { UpdateEtlSourceDto, CreateEtlSourceDto } from './dto/ETL-sources.dto';
import { CreateEtlSourceGroupDto, UpdateEtlSourceGroupDto } from './dto/ETL-source-group.dto';
import { RateLimitGuard } from 'src/auth/guards/rateLimiter.guard';
import { AdminGuard2 } from 'src/auth/guards2/admin2.guard';
import { PrivilegeGuard } from 'src/roles/guards/privilege.guards';
import { Privilege } from 'src/roles/privilege.decorator';
import { Actions, ResourceTypes } from 'src/roles/enums/roles.enum';


@Controller('etl')
export class EtlController {
  constructor(private readonly etlService: EtlService) {

  }

  // @Post()
  // create(@Body() createEtlDto: CreateEtlDto) {
  //   return this.etlService.create(createEtlDto);
  // }

  // @Get()
  // findAll() {
  //   return this.etlService.findAll();
  // }

  // // @Get(':id')
  // // findOne(@Param('id') id: string) {
  // //   return this.etlService.findOne(+id);
  // // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateEtlDto: UpdateEtlDto) {
  //   return this.etlService.update(+id, updateEtlDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.etlService.remove(+id);
  // }

  // CRUD for ETL_URL model
  @Post('etl-source')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source, Actions.CREATE)
  async createUrl(@Body() createEtlUrlDto: CreateEtlSourceDto) {
    const response = await this.etlService.createUrl(createEtlUrlDto);
    if (!response) {
      throw new BadRequestException('ETL source not created');
    } else {
      return {
        status: HttpStatus.CREATED,
        data: response,
        message: 'ETL source created successfully'
      };
    }
  }

  @Get('etl-sources')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source, Actions.READ)
  async findAllUrls(@Req() req: Request, @Res() res: Response) {
    const response = await this.etlService.findAllUrls();
    if (!response) {
      throw new BadRequestException('No ETL sources found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL sources retrieved successfully'
      });
    }
  }

  @Get('etl-source/:id')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source, Actions.READ)
  async findOneUrl(@Param('id') id: string, @Res() res: Response) {
    const response = await this.etlService.findOneUrl(id);
    if (!response) {
      throw new BadRequestException('ETL source not found');
    } else {
    return res.send({
      status: HttpStatus.OK,
      data: response,
      message: 'ETL source retrieved successfully'
    });
    }
  }

  @Patch('etl-source/:id')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source, Actions.UPDATE)
  async updateUrl(@Param('id') id: string, @Body() updateEtlUrlDto: UpdateEtlSourceDto, @Res() res) {
    const response = await this.etlService.updateUrl(id, updateEtlUrlDto);
    if (!response) {
      throw new BadRequestException('ETL source not found');
    }else{
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL source updated successfully'
      });
    }
  }

  @Delete('etl-source/:id')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source, Actions.DELETE)
  async removeUrl(@Param('id') id: string, @Res() res) {
    const response = await this.etlService.removeUrl(id);
    if (!response) {
      throw new BadRequestException('ETL source not found');
    }else{
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL source removed successfully'
      });
    }
  }

  // CRUD for ETL_URL_Group model
  @Post('etl-source-group')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.CREATE)
  async createUrlGroup(@Body() createEtlUrlGroupDto: CreateEtlSourceGroupDto, @Res() res: Response) {
    const response = await this.etlService.createUrlGroup(createEtlUrlGroupDto);
    if (!response) {
      throw new BadRequestException('ETL source group not found');
    } else {
      return res.send({
        status: HttpStatus.CREATED,
        data: response,
        message: 'ETL source group created successfully'
      });
    }
  }

  @Get('etl-source-group')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.READ)
  async findAllUrlGroups(@Res() res: Response) {
    const response = await this.etlService.findAllUrlGroups();
    if (!response) {
      throw new BadRequestException('No ETL source groups found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL source groups retrieved successfully'
      });
    }
  }

  @Get('etl-source-group/:id')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.READ)
  async findOneUrlGroup(@Param('id') id: string, @Res() res: Response) {
    const response = await this.etlService.findOneUrlGroup(id);
    if (!response) {
      throw new BadRequestException('ETL source group not found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL source group retrieved successfully'
      });
    }
  }

  @Patch('etl-source-group/:id')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.UPDATE)
  async updateUrlGroup(@Param('id') id: string, @Body() updateEtlUrlGroupDto: UpdateEtlSourceGroupDto, @Res() res: Response) {
    const response = await this.etlService.updateUrlGroup(id, updateEtlUrlGroupDto);
    if (!response) {
      throw new BadRequestException('ETL source group not found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL source group updated successfully'
      });
    }
  }

  @Delete('etl-source-group/:id')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.DELETE)
  async removeUrlGroup(@Param('id') id: string, @Res() res: Response) {
    const response = await this.etlService.removeUrlGroup(id);
    if (!response) {
      throw new BadRequestException('ETL source group not found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL source group removed successfully'
      });
    }
  }

  /*
  Start/Pause ETL process for a group and bunch of selected URLs.
  Monitor status of ETL runs (success, failure, in-progress).
  View logs of past ETL runs.
  */
  @Post('etl-source-group/:id/start')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.UPDATE)
  async startEtlProcess(@Param('id') id: string, @Res() res: Response) {
    const response = await this.etlService.startEtlProcess(id);
    if (!response) {
      throw new BadRequestException('ETL process not found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL process started successfully'
      });
    }
  }

  @Post('etl-source-group/:id/pause')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.UPDATE)
  async pauseEtlProcess(@Param('id') id: string, @Res() res: Response) {
    const response = await this.etlService.pauseEtlProcess(id);
    if (!response) {
      throw new BadRequestException('ETL process not found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL process paused successfully'
      });
    }
  }

  @Get('etl-source-group/:id/status')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.READ)
  async getEtlStatus(@Param('id') id: string, @Res() res: Response) {
    const response = await this.etlService.getEtlStatus(id);
    if (!response) {
      throw new BadRequestException('ETL process not found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL process status retrieved successfully'
      });
    } 
  }

  @Get('etl-source-group/:id/logs')
  @UseGuards(RateLimitGuard)
  @UseGuards(AdminGuard2)
  @UseGuards(PrivilegeGuard)
  @Privilege(ResourceTypes.ETL_Source_Group, Actions.READ)
  async getEtlLogs(@Param('id') id: string, @Res() res: Response) {
    const response = await this.etlService.getEtlLogs(id);
    if (!response) {
      throw new BadRequestException('ETL process not found');
    } else {
      return res.send({
        status: HttpStatus.OK,
        data: response,
        message: 'ETL process logs retrieved successfully'
      });
    }
  }

  /*
  Configure ETL schedules (hourly, daily, weekly, monthly, or custom cron).
  Modify or cancel schedules.
  Override schedule to trigger ETL on-demand.
  */
}