import { PartialType } from '@nestjs/swagger';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}
