import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PrivilegeService } from './privilege.service';
import { Privilege } from './privilege.decorator';
import { Actions, ResourceTypes } from './enums/roles.enum';
import { PrivilegeGuard } from './guards/privilege.guards';
import { Response } from 'express';
import { RoleDocument } from './models/roles.model';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { RolesService } from './roles.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import mongoose from 'mongoose';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { CreateRoleDto } from './dto/createRole.dto';
import { MapPrivilegeDto } from './dto/mapPrivilege.dto';
@Controller('role')
export class RolesController {
  constructor(private readonly roleService: RolesService) {}

  @Post('create')
  @Privilege(ResourceTypes.ROLES, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  async createRole(
    @Res() res: Response,
    @TokenDecoder() user: any,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    const result = await this.roleService.createRole(user, createRoleDto);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('mapPrivilege')
  async mapPrivilege(
    @Res() res: Response,
    @Body() mapPrivilegeDto: MapPrivilegeDto,
  ) {
    if (!mongoose.isValidObjectId(mapPrivilegeDto.roleId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid role id',
      });
    }
    if (!mongoose.isValidObjectId(mapPrivilegeDto.resourceId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid resource id',
      });
    }
    if (!mongoose.isValidObjectId(mapPrivilegeDto.actionId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid action id',
      });
    }
    const result = await this.roleService.mapPrivilege(mapPrivilegeDto);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // data:result.data
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('fetchRoles')
  async fetchRoles(@Res() res: Response, @TokenDecoder() user: any) {
    const result = await this.roleService.fetchRoles(user.id, user.userType);

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('resourcesList')
  async reourcesList(@Res() res: Response) {
    const result = await this.roleService.resourcesList();
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post('updateRole')
  @Privilege(ResourceTypes.ROLES, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  async updateRole(
    @Res() res: Response,
    // @TokenDecoder() user: any,
    updateRoleDto: UpdateRoleDto,
  ) {
    const result = await this.roleService.updateRole(updateRoleDto);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
