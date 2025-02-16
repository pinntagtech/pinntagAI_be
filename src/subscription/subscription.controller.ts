import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Response } from 'express';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserGuard } from 'src/auth/guards/user.guard';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';

@Controller('v1/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('products')
  @UseGuards(UserGuard)
  async getProducts(@Res() res: Response) {
    const result = await this.subscriptionService.getProducts();
    return res.status(HttpStatus.OK).json({
      message: 'Subscription products',
      data: result,
    });
  }

  // @Post()
  // @UseGuards(UserGuard)
  // async create(
  //   @Res() res: Response,
  //   @Body() createSubscriptionDto: CreateSubscriptionDto,
  //   @TokenDecoder() user: DecodedUser,
  // ) {
  //   const result = await this.subscriptionService.create(
  //     createSubscriptionDto,
  //     user,
  //   );
  //   if (result.success) {
  //     return res.status(HttpStatus.OK).json({
  //       message: 'Subscription created successfully',
  //       data: result.subscription,
  //     });
  //   } else {
  //     return res.status(HttpStatus.BAD_REQUEST).json({
  //       message: result.message,
  //     });
  //   }
  // }

  @Get()
  @UseGuards(UserGuard)
  async findAll(@Res() res: Response, @TokenDecoder() user: DecodedUser) {
    const result = await this.subscriptionService.findAll(user);
    return res.status(HttpStatus.OK).json({
      message: 'User subscriptions',
      data: result,
    });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Res() res: Response,
    @TokenDecoder() user: DecodedUser,
  ) {
    const result = await this.subscriptionService.findOne(id, user);
    if (result) {
      return res.status(HttpStatus.OK).json({
        message: 'Subscription details',
        data: result,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: result.message,
      });
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
