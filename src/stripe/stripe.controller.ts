import { Controller, Post, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  async webhook(@Req() request: Request) {
    const event = request.body;
    await this.stripeService.webhook(event);
    return {
      received: true,
    };
  }
}
