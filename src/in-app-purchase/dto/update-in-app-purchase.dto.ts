import { PartialType } from '@nestjs/swagger';
import { CreateInAppPurchaseDto } from './create-in-app-purchase.dto';

export class UpdateInAppPurchaseDto extends PartialType(CreateInAppPurchaseDto) {}
