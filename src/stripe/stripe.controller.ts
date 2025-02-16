import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  async webhook(@Req() request: Request, @Res() response: Response) {
    const event = request.body;
    await this.stripeService.webhook(event);
    return response.json({ received: true });
  }
}
