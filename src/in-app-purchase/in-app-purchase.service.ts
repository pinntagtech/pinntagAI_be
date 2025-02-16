import { Injectable } from '@nestjs/common';
import * as inAppPurchase from 'in-app-purchase';
@Injectable()
export class InAppPurchaseService {
  constructor() {
    inAppPurchase.config({
      applePassword: 'your-shared-secret',
    });
  }
}
