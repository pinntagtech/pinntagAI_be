import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutDto } from './dtos/create-checkout.dto';
import Stripe from 'stripe';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly config: ConfigService,
  ) {}

  @Post('subscriptions/checkout')
  async createCheckout(@Body() dto: CreateCheckoutDto) {
    // TODO: replace with your real URLs
    const successUrl =
      this.config.get<string>('CHECKOUT_SUCCESS_URL') ||
      'https://app.example.com/billing/success';
    const cancelUrl =
      this.config.get<string>('CHECKOUT_CANCEL_URL') ||
      'https://app.example.com/billing/cancel';

    const { url } = await this.stripeService.createCheckoutSession({
      businessId: dto.businessId,
      priceId: dto.priceId,
      couponId: dto.couponId,
      promotionCode: dto.promotionCode,
      successUrl,
      cancelUrl,
    });

    return { url };
  }

  // Stripe webhook endpoint — must receive RAW body

  // @Post('webhooks/stripe')
  // async handleWebhook(
  //   @Req() req: RawBodyRequest<Request>,
  //   @Headers('stripe-signature') signature: string,
  // ) {
  //   const payload = req.rawBody;
  //   let event: Stripe.Event;
  //   try {
  //     // Verify webhook signature using Stripe SDK
  //     event = this.stripeWebhookService.constructEvent(payload, signature);
  //   } catch (err) {
  //     console.error(
  //       `⚠️  Webhook signature verification failed: ${err.message}`,
  //     );
  //     throw new BadRequestException('Invalid webhook signature');
  //   }

  //   // Process the event (idempotently) and return 200
  //   try {
  //     await this.stripeWebhookService.processEvent(event);
  //   } catch (err) {
  //     console.error('⚠️  Error processing Stripe event:', err);
  //     // Note: we still return 2xx to acknowledge receipt; handle or alert errors internally.
  //   }
  //   return { received: true };
  // }
}
