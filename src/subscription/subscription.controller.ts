import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserGuard } from 'src/auth/guards/user.guard';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';
import { AdminGuard2 } from 'src/auth/guards2/admin2.guard';
import { CreateSubscriptionProductDto } from './dto/create-subscription-product.dto';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { CreateSubscriptionPriceDto } from './dto/create-subscription-price.dto';
import mongoose from 'mongoose';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('product')
  @UseGuards(AdminGuard2)
  async createSubscriptionProduct(
    @TokenDecoder() user: DecodedUser,
    @Body() body: CreateSubscriptionProductDto,
  ) {
    const result = await this.subscriptionService.createProduct(user, body);
    if (result.success) {
      return {
        message: 'Subscription product created successfully',
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('product/price/:id')
  @UseGuards(AdminGuard2)
  async createSubscriptionProductPrices(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
    @Body() body: CreateSubscriptionPriceDto,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid product id');
    }
    const result = await this.subscriptionService.createProductPrice(
      user,
      id,
      body,
    );
    if (result.success) {
      return {
        message: 'Subscription product price created successfully',
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('product/toggle/:id')
  @UseGuards(AdminGuard2)
  async toggleSubscriptionProduct(
    @TokenDecoder() user: DecodedUser,
    @Param('id') id: string,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid product id');
    }
    const result = await this.subscriptionService.toggleProduct(user, id);
    if (result.success) {
      return {
        message: 'Subscription product price toggled successfully',
        data: result.data,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('products')
  @UseGuards(JwtGuard2)
  async getProducts() {
    const result = await this.subscriptionService.getProducts();
    return {
      message: 'Subscription products',
      data: result,
    };
  }

  // @Get()
  // @UseGuards(JwtGuard2)
  // async findAll(@TokenDecoder() user: DecodedUser) {
  //   const result = await this.subscriptionService.findAll(user);
  //   return {
  //     message: 'User subscriptions',
  //     data: result,
  //   };
  // }

  // @Get(':id')
  // @UseGuards(JwtGuard2)
  // async findOne(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
  //   const result = await this.subscriptionService.findOne(id, user);
  //   if (result) {
  //     return {
  //       message: 'Subscription details',
  //       data: result,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }

  // @Get('checkout-session/:priceId')
  // @UseGuards(UserGuard)
  // async createCheckoutSession(
  //   @Param('priceId') priceId: string,
  //   @TokenDecoder() user: DecodedUser,
  //   @Body() body: CreateSubscriptionDto,
  // ) {
  //   const result = await this.subscriptionService.createCheckoutSession(
  //     priceId,
  //     user,
  //     body,
  //   );
  //   if (result.success) {
  //     return {
  //       message: 'Checkout session created',
  //       data: result.data,
  //     };
  //   } else {
  //     throw new BadRequestException(result.message);
  //   }
  // }
}
