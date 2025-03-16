import { Controller, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { PrivilegeService } from './privilege.service';
import { Privilege } from './privilege.decorator';
import { Actions, ResourceTypes } from './enums/roles.enum';
import { PrivilegeGuard } from './guards/privilege.guards';
import { Request, Response } from 'express';
@Controller('role')
export class RolesController {
  constructor(private readonly privilegeService: PrivilegeService) {}


    // @Post()
    // @Privilege(ResourceTypes.ROLES,Actions.CREATE)
    // @UseGuards(PrivilegeGuard)
    // async createRole(@Res() res:Response) {
    //     const result = await this.privilegeService.createRole();
        
    //         if (result.success) {
    //           return res.status(HttpStatus.OK).json({
    //             message: result.message,
    //             data: result.data,
    //           });
    //         } else {
    //           return res.status(HttpStatus.BAD_REQUEST).json({
    //             message: result.message,
    //           });
    //         }
    // }

}
