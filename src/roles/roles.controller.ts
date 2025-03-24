import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Privilege } from './privilege.decorator';
import { Actions, ResourceTypes } from './enums/roles.enum';
import { PrivilegeGuard } from './guards/privilege.guards';
import { Response } from 'express';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { RolesService } from './roles.service';
import mongoose from 'mongoose';
import { UpdateRoleDto } from './dto/updateRole.dto';
import { CreateRoleDto } from './dto/createRole.dto';
import { MapPrivilegeDto } from './dto/mapPrivilege.dto';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { isValidObjectId } from 'mongoose';
import { JwtPayload } from 'src/auth/interfaces/tokenPayload.interface';

@Controller('role')
export class RolesController {
  constructor(private readonly roleService: RolesService) {}

  @Post('create')
  @Privilege(ResourceTypes.ROLES, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
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

  @Post('createPrivilege/:roleId')
  @Privilege(ResourceTypes.ROLES, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async mapPrivilege(
    @Res() res: Response,
    @Param('roleId') roleId: string,
    @Body() mapPrivilegeDto: MapPrivilegeDto,
  ) {
    if (!mongoose.isValidObjectId(roleId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Please provide a valid role id',
      });
    }
    for (let i = 0; i < mapPrivilegeDto.data.length; i++) {
      if (!mongoose.isValidObjectId(mapPrivilegeDto.data[i].resource)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Please provide a valid resource',
        });
      }
      for (let j = 0; j < mapPrivilegeDto.data[i].actions.length; j++) {
        if (!mongoose.isValidObjectId(mapPrivilegeDto.data[i].actions[j])) {
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Please provide a valid action',
          });
        }
      }
    }
    const result = await this.roleService.createPrivilege(
      roleId,
      mapPrivilegeDto,
    );
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

  @Delete('deletePrivilege/:id')
  @Privilege(ResourceTypes.ROLES, Actions.DELETE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async deletePrivilege(@Res() res: Response, @Param('id') id: string) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.roleService.deletePrivilege(id);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        // data: result.data,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Get('fetch')
  @Privilege(ResourceTypes.ROLES, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
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

  @Get('fetchRole/:id')
  @Privilege(ResourceTypes.ROLES, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async fetchRole(@Res() res: Response, @Param('id') id: string) {
    if (!isValidObjectId(id)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid ObjectId',
      });
    }
    const result = await this.roleService.fetchRole(id);
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

  @Get('actionsList')
  async actionsList(@Res() res: Response) {
    const result = await this.roleService.actionsList();
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
  @UseGuards(JwtGuard2)
  async updateRole(
    @Res() res: Response,
    // @TokenDecoder() user: any,
    @Body() updateRoleDto: UpdateRoleDto,
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

  //need to be discussed
  @Post('assign/:roleId')
  @UseGuards(JwtGuard2)
  async assignRole(
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Param('roleId') roleId: string,
  ) {
    if (!isValidObjectId(roleId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Invalid Token',
      });
    }

    const result = await this.roleService.assignRole(
      user.id,
      user.userType,
      roleId,
    );
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
