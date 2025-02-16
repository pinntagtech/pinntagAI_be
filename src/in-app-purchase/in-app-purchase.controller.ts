import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InAppPurchaseService } from './in-app-purchase.service';
import { CreateInAppPurchaseDto } from './dto/create-in-app-purchase.dto';
import { UpdateInAppPurchaseDto } from './dto/update-in-app-purchase.dto';

@Controller('in-app-purchase')
export class InAppPurchaseController {
  constructor(private readonly inAppPurchaseService: InAppPurchaseService) {}
}
