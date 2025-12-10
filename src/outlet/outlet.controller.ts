import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Put,
} from '@nestjs/common';
import { OutletService } from './outlet.service';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import {
  CreateOutletDto,
  CreateOutletDtoV2,
  UpdateMobileOutletDto,
} from './dto/create-outlet.dto';
import { RateLimit } from 'nestjs-rate-limiter';
import { JwtPayload } from 'jsonwebtoken';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSpotDto, UpdateSpotDto } from './dto/create-spot.dto';

@Controller('outlet')
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Get('/categories')
  @RateLimit({
    points: 10,
    duration: 60,
  })
  async getCategories(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getCategories(
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('/types/:id')
  @RateLimit({
    points: 10,
    duration: 60,
  })
  async getTypes(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getTypes(
      id,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('managers')
  @UseGuards(JwtGuard2)
  async fetchUsers(
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
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post()
  @UseGuards(JwtGuard2)
  async createOutlet(
    @Body() createOutletDto: CreateOutletDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.outletService.createOutlet(createOutletDto, user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
  @Post('mobile')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50000000 },
    }),
  )
  async createOutletV2(
    @Body() createOutletDto: CreateOutletDtoV2,
    @TokenDecoder() user: JwtPayload,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const result = await this.outletService.createMobileOutlet(
      createOutletDto,
      user,
      image,
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
  @Put('mobile/:id')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50000000 },
    }),
  )
  async updateMobileOutlet(
    @Param('id') id: string,
    @Body() updateOutletDto: UpdateMobileOutletDto,
    @TokenDecoder() user: JwtPayload,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const result = await this.outletService.updateMobileOutlet(
      id,
      updateOutletDto,
      user,
      image,
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

  @Post('/update/:id')
  @UseGuards(JwtGuard2)
  async updateOutlet(
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
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get()
  @UseGuards(JwtGuard2)
  async fetchOutlets(
    @TokenDecoder() user: JwtPayload,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('type') type: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getOutlets(
      user,
      type,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('created')
  @UseGuards(JwtGuard2)
  async fetchCreatedOutlets(
    @TokenDecoder() user: JwtPayload,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('type') type: string,
    @Query('vehicleType') vehicleType: string,
    @Query('creationDate') creationDate: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.fetchCreatedOutlets(
      user,
      search,
      type,
      creationDate,
      vehicleType,
      pageNumber,
      limitNumber,
    );
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
        total: result.total,
        categoryCount: result.categoryCount,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('delete/:id')
  @UseGuards(JwtGuard2)
  async deleteOutlet(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
    @Body('fosterOutletId') fosterOutletId: string,
    @Body('keepPublished') keepPublished: boolean,

  ) {
    const result = await this.outletService.deleteOutletV2(id,fosterOutletId,keepPublished, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('vehicleTypes')
  async fetchVehicleTypes(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const result = await this.outletService.getVehicleTypes(
      pageNumber,
      limitNumber,
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

  @Post('createOutletsInBulk')
  @UseGuards(JwtGuard2)
  @UseInterceptors(
    FileInterceptor('file', {
      //   dest: './uploads',
      //   fileFilter: imageFileFilter,
      //   storage: diskStorage({
      //     destination: './uploads',
      //     filename: editFileName,
      //   }),
      //   //Setting file size limit to 1 MB
      limits: { fileSize: 10000000 },
    }),
  )
  async createOutletsInBulk(
    @UploadedFile() file: Express.Multer.File,
    @TokenDecoder() user: DecodedUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.outletService.createOutletsInBulk(file, user);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('createSpot/:id')
  @UseGuards(JwtGuard2)
  async createSpot(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
    @Body() data: CreateSpotDto,
  ) {
    const result = await this.outletService.createSpot(id, user, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
  @Put('updateSpot/:id')
  @UseGuards(JwtGuard2)
  async updateSpot(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
    @Body() data: UpdateSpotDto,
  ) {
    const result = await this.outletService.updateSpot(id, user, data);
    if (result.success) {
      return {
        message: result.message,
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('activate/:id')
  @UseGuards(JwtGuard2)
  async activateOutlet(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.outletService.activateOutlet(id, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('deactivate/:id')
  @UseGuards(JwtGuard2)
  async deactivateOutlet(
    @Param('id') id: string,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.outletService.deactivateOutlet(id, user);
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }
}
