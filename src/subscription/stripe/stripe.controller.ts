import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  CreateCheckoutDto,
} from './dtos/create-checkout.dto';
import Stripe from 'stripe';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { BusinessProfileGuard } from 'src/auth/guards/business.guard';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { UpgradePlanDto } from './dtos/upgrage-plan.dto';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtGuard2)
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @TokenDecoder() user: DecodedUser,
  ) {
    // TODO: replace with your real URLs
    const successUrl =
      this.config.get<string>('CHECKOUT_SUCCESS_URL') ||
      'https://dev.business.pinntag.com/dashboard/subscription/success';
    const cancelUrl =
      this.config.get<string>('CHECKOUT_CANCEL_URL') ||
      'https://dev.business.pinntag.com/dashboard/subscription/cancel';

    const { url } = await this.stripeService.createCheckoutSession({
      businessId: user.businessProfile,
      productId: dto.productId,
      priceId: dto.priceId,
      couponCode: dto.couponCode,
      // promotionCode: dto.promotionCode,
      quantity: dto.quantity,
      successUrl,
      cancelUrl,
    });

    return { url };
  }

  @Post('cancel')
  @UseGuards(JwtGuard2)
  async cancelSubscription(@TokenDecoder() user: DecodedUser) {
    const result = await this.stripeService.cancelSubscription(
      user.businessProfile,
    );
    if (result.success) {
      return {
        message: result.message,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Get('checkout/session/:id')
  @UseGuards(JwtGuard2)
  async getCheckoutSession(@Param('id') id: string) {
    const session = await this.stripeService.fetchCheckoutSession(id);
    return { session };
  }

  // Stripe webhook endpoint — must receive RAW body
  // Endpoint to handle Stripe webhooks
  @Post('webhooks')
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
    // console.log('request:-', req);
    // const payload = req.body;
    const payload = req.rawBody ?? (req.body as any);
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

  @Post('checkout/upgradation-plan')
  @UseGuards(JwtGuard2)
  async checkoutUpgradationPlan(
    @TokenDecoder() user: DecodedUser,
    @Body() dto: UpgradePlanDto,
  ) {
    const result =
      await this.stripeService.createCheckoutSessionForUpgradationPlan(
        user.businessProfile,
        dto,
      );
    return result;
  }
}
