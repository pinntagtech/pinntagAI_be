import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  BadRequestException,
  HttpCode,
  RawBodyRequest,
  Req,
  HttpException,
  Headers,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserGuard } from 'src/auth/guards/user.guard';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';
import { AdminGuard2 } from 'src/auth/guards2/admin2.guard';
import { CreateSubscriptionProductDto } from './dto/create-subscription-product.dto';
import Stripe from 'stripe';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

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

  @Get('products')
  @UseGuards(UserGuard)
  async getProducts() {
    const result = await this.subscriptionService.getProducts();
    return {
      message: 'Subscription products',
      data: result,
    };
  }

  @Get()
  @UseGuards(UserGuard)
  async findAll(@TokenDecoder() user: DecodedUser) {
    const result = await this.subscriptionService.findAll(user);
    return {
      message: 'User subscriptions',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    const result = await this.subscriptionService.findOne(id, user);
    if (result) {
      return {
        message: 'Subscription details',
        data: result,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Post('stripe/webhooks')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret)
      throw new HttpException(
        'Webhook secret not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const payload = req.rawBody;
    let event: Stripe.Event;
    const endpointSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    try {
      // Verify webhook signature using Stripe SDK
      event = this.stripeService.constructEventFromPayload(
        payload,
        signature,
        endpointSecret,
      );
    } catch (err) {
      console.error(
        `⚠️  Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }
    try {
      // req.body is Buffer because of raw body middleware in main.ts
      await this.stripeService.handleStripeWebhook(event);
      return { received: true };
    } catch (e: any) {
      throw new HttpException(
        `Webhook Error: ${e.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
