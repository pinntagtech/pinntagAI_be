import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InAppPurchaseService } from './iap.service';

@Controller('in-app-purchase')
export class InAppPurchaseController {
  constructor(private readonly inAppPurchaseService: InAppPurchaseService) {}
}
