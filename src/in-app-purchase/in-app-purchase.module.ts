import { Module } from '@nestjs/common';
import { InAppPurchaseService } from './in-app-purchase.service';
import { InAppPurchaseController } from './in-app-purchase.controller';

@Module({
  controllers: [InAppPurchaseController],
  providers: [InAppPurchaseService],
})
export class InAppPurchaseModule {}
