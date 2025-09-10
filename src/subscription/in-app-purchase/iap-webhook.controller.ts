import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AppleIAPService } from './apple/iap-apple.service';
import { GoogleIAPService } from './google/iap-google.service';
import { AppleNotificationGuard } from './guards/apple-notification.guard';
import { GoogleNotificationGuard } from './guards/google-notification.guard';
import { Request, Response } from 'express';
import { GooglePubSubMessageDto } from './google/google-pub-sub.dto';

// iap-webhook.controller.ts
@Controller('iap/webhooks')
export class IapWebhookController {
  constructor(
    private readonly appleService: AppleIAPService,
    private readonly googleService: GoogleIAPService,
  ) {}

  // Apple App Store server notifications (V2)
  @Post('apple')
  @HttpCode(200) // Apple expects a 200 OK response
  @UseGuards(AppleNotificationGuard) // Verify Apple signature
  async handleAppleNotification(@Req() req: Request, @Res() res: Response) {
    const notification = req.body;
    // The Apple guard ensures the JWS signature is valid and attaches decoded payload
    const decodedPayload = (notification as any).decodedPayload;
    // Process the notification using the service
    await this.appleService.processNotification(decodedPayload);
    return res.send(); // Acknowledge receipt
  }

  // Google Play real-time developer notifications
  @Post('google')
  @HttpCode(200) // Google expects a 200 OK response
  @UseGuards(GoogleNotificationGuard) // (Optional) Verify Google authenticity
  async handleGoogleNotification(
    @Body() body: GooglePubSubMessageDto,
    @Res() res: Response,
  ) {
    // The incoming body is a Pub/Sub message wrapper; extract the actual notification data
    console.log('Received Google Pub/Sub message:', body);
    const developerNotification = this.googleService.parsePubSubMessage(body);
    await this.googleService.processNotification(developerNotification);
    return res.send(); // Acknowledge receipt
  }
}
