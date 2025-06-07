import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { TokenDecoder } from 'src/decorators/tokenDecoder.decorator';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserGuard } from 'src/auth/guards/user.guard';
import { CreateSubscriptionDto } from 'src/user/dto/create-subscription.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('products')
  @UseGuards(UserGuard)
  async getProducts() {
    const result = await this.subscriptionService.getProducts();
    return {
      message: 'Subscription products',
      data: result,
    };
  }

  @Get()
  @UseGuards(UserGuard)
  async findAll(@TokenDecoder() user: DecodedUser) {
    const result = await this.subscriptionService.findAll(user);
    return {
      message: 'User subscriptions',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @TokenDecoder() user: DecodedUser) {
    const result = await this.subscriptionService.findOne(id, user);
    if (result) {
      return {
        message: 'Subscription details',
        data: result,
      };
    } else {
      throw new BadRequestException(result.message);
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.remove(+id);
  }
}
