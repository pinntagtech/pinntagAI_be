import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OutletService } from './outlet.service';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { Response } from 'express';
import { RateLimit } from 'nestjs-rate-limiter';
import { JwtPayload } from 'jsonwebtoken';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Controller('outlet')
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Get('/categories')
  @RateLimit({
    points: 10,
    duration: 60,
  })
  async getCategories(@Res() res: Response,@Query('page') page: string,@Query('limit') limit: string) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getCategories(pageNumber,limitNumber);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('/types/:id')
  @RateLimit({
    points: 10,
    duration: 60,
  })
  async getTypes(@Res() res: Response, @Param('id') id: string,@Query('page') page: string,@Query('limit') limit: string) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getTypes(id,pageNumber,limitNumber);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total:result.total
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
  @Get('managers')
  @UseGuards(JwtGuard2)
  async fetchUsers(
    @Req() req: Request,
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @TokenDecoder() user: JwtPayload,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.managerList(
      user.id,
      pageNumber,
      limitNumber,
    );

    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Post()
  @UseGuards(JwtGuard2)
  async createOutlet(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createOutletDto: CreateOutletDto,
    @TokenDecoder() user: JwtPayload,
  ) {
    const result = await this.outletService.createOutlet(createOutletDto, user);
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

  @Post('/update/:id')
  @UseGuards(JwtGuard2)
  async updateOutlet(
    @Req() req: Request,
    @Res() res: Response,
    @Body() updateOutletDto: UpdateOutletDto,
    @TokenDecoder() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.outletService.updateOutlet(
      updateOutletDto,
      user,
      id,
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

  @Get()
  @UseGuards(JwtGuard2)
  async fetchOutlets(
    @Req() req:Request,
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ){
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getOutlets(
        user,pageNumber,limitNumber
      );
      if (result.success) {
        return res.status(HttpStatus.OK).json({
          message: result.message,
          data: result.data,
          total: result.total,
        });
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: result.message,
        });
      }
  }
  @Get('created')
  @UseGuards(JwtGuard2)
  async fetchCreatedOutlets(
    @Req() req:Request,
    @Res() res: Response,
    @TokenDecoder() user: JwtPayload,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ){
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.fetchCreatedOutlets(
        user,pageNumber,limitNumber
      );
      if (result.success) {
        return res.status(HttpStatus.OK).json({
          message: result.message,
          data: result.data,
          total: result.total,
        });
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: result.message,
        });
      }
  }

  @Get('vehicleTypes')
  // @UseGuards(JwtGuard2)
  async fetchVehicleTypes(
    @Req() req:Request,
    @Res() res: Response,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ){
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getVehicleTypes(pageNumber,limitNumber);
    if (result.success) {
      return res.status(HttpStatus.OK).json({
        message: result.message,
        data: result.data,
        // total: result.total,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }
}
