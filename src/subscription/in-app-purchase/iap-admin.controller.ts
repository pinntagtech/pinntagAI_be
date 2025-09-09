import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppleReceipt } from 'src/subscription/in-app-purchase/apple/apple-receipt.model';
import { GooglePurchase } from 'src/subscription/in-app-purchase/google/google-purchase.model';
import { IapReceipt } from 'src/subscription/models/iap-receipt.model';
import { SubscriptionServiceType } from './iap.config';
// import { AuthGuard } from '../guards/auth.guard'; // hypothetical guard to allow only admins

@Controller('iap/admin')
@UseGuards() // Apply admin authentication guard here (e.g., AuthGuard('admin'))
export class IAPAdminController {
  constructor(
    @InjectModel(AppleReceipt.name)
    private appleReceiptModel: Model<AppleReceipt>,
    @InjectModel(GooglePurchase.name)
    private googlePurchaseModel: Model<GooglePurchase>,
    @InjectModel(IapReceipt.name) private iapReceiptModel: Model<IapReceipt>,
  ) {}

  // List all Apple receipts (with optional filtering by status or subscription)
  @Get('apple-receipts')
  async listAppleReceipts(@Query('status') status?: string): Promise<any[]> {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    return await this.appleReceiptModel.find(filter).lean();
  }

  // List all Google purchases
  @Get('google-purchases')
  async listGooglePurchases(): Promise<any> {
    return await this.googlePurchaseModel.find().lean();
  }

  // List IAP logs (from IapReceipt), with optional platform filter
  @Get('logs')
  async listIapLogs(
    @Query('platform') platform?: SubscriptionServiceType,
  ): Promise<any> {
    const filter: any = {};
    if (platform) {
      filter.platform = platform;
    }
    // WARNING: This may return a lot of data (including raw receipts and responses). Consider pagination in real implementation.
    return await this.iapReceiptModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean();
  }
}
