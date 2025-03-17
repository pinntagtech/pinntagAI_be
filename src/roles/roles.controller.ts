import {
  Body,
  Controller,
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
@Controller('role')
export class RolesController {
  constructor(private readonly roleService: RolesService) {}

  @Post()
  @Privilege(ResourceTypes.ROLES, Actions.CREATE)
  @UseGuards(PrivilegeGuard)
  async createRole(
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
    @Body() createRoleDto: Partial<RoleDocument>,
  ) {
    const result = await this.roleService.createRole(
      user.id,
      user.userType,
      createRoleDto,
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
