// Schema for ETL URLs group for crawling
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';


export type ETL_Source_GroupDocument = ETL_Source_Group & Document;

@Schema({timestamps: true})
export class ETL_Source_Group   {
    @Prop({ required: true, type: [mongoose.Schema.Types.ObjectId], ref: 'ETL_Source' })
    urls: Array<mongoose.Types.ObjectId>;
    
    @Prop({ required: true })
    name: string;
    
    @Prop()
    description: string;
}

export const ETL_Source_GroupSchema = SchemaFactory.createForClass(ETL_Source_Group);
