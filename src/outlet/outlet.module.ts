import { Module } from '@nestjs/common';
import { OutletController } from './outlet.controller';
import { OutletService } from './outlet.service';

@Module({
  controllers: [OutletController],
  providers: [OutletService]
})
export class OutletModule {}
