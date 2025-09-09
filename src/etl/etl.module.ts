import { Module } from '@nestjs/common';
import { EtlService } from './etl.service';
import { EtlController } from './etl.controller';
import { ETL_SourceSchema } from './models/etl-source.model';
import { MongooseModule } from '@nestjs/mongoose';
import { ETL_Source_GroupSchema } from './models/etl-source-groups.model';``

@Module({
  controllers: [EtlController],
  providers: [EtlService],
  imports: [
    MongooseModule.forFeature(
      [
        { name: 'ETL_Source', schema: ETL_SourceSchema },
        { name: 'ETL_Source_Group', schema: ETL_Source_GroupSchema }
      ]
    )
  ]
})
export class EtlModule {}
