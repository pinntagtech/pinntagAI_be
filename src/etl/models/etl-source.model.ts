import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ETL_Source_Status } from '../helpers/enums';

export type ETL_SourceDocument = ETL_Source & Document;

@Schema({timestamps: true})
export class ETL_Source {
    @Prop({ required: true })
    url: string;
    
    @Prop({ required: true })
    label: string;

    @Prop()
    description: string;

    @Prop({ required: true, type: String, enum: ETL_Source_Status, default: ETL_Source_Status.ACTIVE })
    status: ETL_Source_Status;
}

export const ETL_SourceSchema = SchemaFactory.createForClass(ETL_Source);
