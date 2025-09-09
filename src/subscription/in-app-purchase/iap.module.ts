import { Module } from '@nestjs/common';
import { InAppPurchaseService } from './iap.service';
import { InAppPurchaseController } from './iap.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AppleReceipt,
  AppleReceiptSchema,
} from 'src/subscription/in-app-purchase/apple/apple-receipt.model';
import {
  GooglePurchase,
  GooglePurchaseSchema,
} from 'src/subscription/in-app-purchase/google/google-purchase.model';
import {
  IapReceipt,
  IapReceiptSchema,
} from 'src/subscription/models/iap-receipt.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppleReceipt.name, schema: AppleReceiptSchema },
      { name: GooglePurchase.name, schema: GooglePurchaseSchema },
      { name: IapReceipt.name, schema: IapReceiptSchema },
    ]),
  ],
  controllers: [InAppPurchaseController],
  providers: [InAppPurchaseService],
})
export class InAppPurchaseModule {}
