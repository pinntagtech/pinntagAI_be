import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
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
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';

@Controller('role')
export class RolesController {
  constructor(private readonly roleService: RolesService) {}

  @Post('create')
  @Privilege(ResourceTypes.ROLES, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async createRole(
    @TokenDecoder() user: any,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    const result = await this.roleService.createRole(user, createRoleDto);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException({
        message: result.message,
      });
    }
  }

  @Post('createPrivilege/:roleId')
  @Privilege(ResourceTypes.ROLES, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async mapPrivilege(
    @Param('roleId') roleId: string,
    @Body() mapPrivilegeDto: MapPrivilegeDto,
  ) {
    if (!mongoose.isValidObjectId(roleId)) {
      throw new BadRequestException('Please provide a valid role id');
    }
    for (let i = 0; i < mapPrivilegeDto.data.length; i++) {
      if (!mongoose.isValidObjectId(mapPrivilegeDto.data[i].resource)) {
        throw new BadRequestException('Please provide a valid resource');
      }
      for (let j = 0; j < mapPrivilegeDto.data[i].actions.length; j++) {
        if (!mongoose.isValidObjectId(mapPrivilegeDto.data[i].actions[j])) {
          throw new BadRequestException('Please provide a valid action');
        }
      }
    }
    const result = await this.roleService.createPrivilege(
      roleId,
      mapPrivilegeDto,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Delete('deletePrivilege/:id')
  @Privilege(ResourceTypes.ROLES, Actions.DELETE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async deletePrivilege(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.roleService.deletePrivilege(id);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('fetch')
  @Privilege(ResourceTypes.ROLES, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async fetchRoles(
    @TokenDecoder() user: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const result = await this.roleService.fetchRoles(
      user.id,
      user.userType,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        pages: result.pages,
        page: result.page,
        limit: result.limit,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('fetchRole/:id')
  @Privilege(ResourceTypes.ROLES, Actions.READ)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async fetchRole(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    const result = await this.roleService.fetchRole(id);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('resourcesList')
  @UseGuards(JwtGuard2)
  async resourcesList( @TokenDecoder() user: DecodedUser) {
    const result = await this.roleService.resourcesList(user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('actionsList')
  async actionsList() {
    const result = await this.roleService.actionsList();
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('updateRole')
  @Privilege(ResourceTypes.ROLES, Actions.UPDATE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async updateRole(
    // @TokenDecoder() user: any,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const result = await this.roleService.updateRole(updateRoleDto);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  //need to be discussed
  @Post('assign/:roleId')
  @UseGuards(JwtGuard2)
  async assignRole(
    @TokenDecoder() user: JwtPayload,
    @Param('roleId') roleId: string,
  ) {
    if (!isValidObjectId(roleId)) {
      throw new BadRequestException('Invalid Token');
    }

    const result = await this.roleService.assignRole(
      user.id,
      user.userType,
      roleId,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
  @Post('delete/:roleId')
  @Privilege(ResourceTypes.ROLES, Actions.DELETE)
  @UseGuards(PrivilegeGuard)
  @UseGuards(JwtGuard2)
  async deleteRole(
    @TokenDecoder() user: DecodedUser,
    @Param('roleId') roleId: string,
    @Body('backupRoleId') backupRoleId: string,
  ) {
    if (!isValidObjectId(roleId)) {
      throw new BadRequestException('Invalid Token');
    }

    const result = await this.roleService.deleteRole(
      roleId,
      backupRoleId,
      user.userType,
    );
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
}
