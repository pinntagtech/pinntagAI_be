import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { InAppPurchaseService } from './iap.service';
import { JwtGuard2 } from 'src/auth/guards2/jwt2.guard';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { GoogleIAPService } from './google/iap-google.service';

@Controller('in-app-purchase')
export class InAppPurchaseController {
  constructor(
    private readonly inAppPurchaseService: InAppPurchaseService,
    private readonly googleService: GoogleIAPService,
  ) {}

  @Post('google/validate')
  @UseGuards(JwtGuard2)
  async validateGooglePurchase(
    @Body() body: any,
    @TokenDecoder() user: DecodedUser,
  ) {
    const { packageName, productId, purchaseToken } = body;
    if (!packageName || !productId || !purchaseToken) {
      return { error: 'Missing required fields' };
    }
    const result = await this.googleService.validatePurchase(
      user.businessProfile,
      packageName,
      productId,
      purchaseToken,
    );
    return result;
  }
}
