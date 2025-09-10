// Schema for ETL Jobs management
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type ETL_JobDocument = ETL_Job & Document;

@Schema({timestamps: true})
export class ETL_Job {
    @Prop({ required: true })
    jobName: string;
    
    @Prop({ required: true })
    status: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ETL_URL_Group' })
    urlGroup: mongoose.Types.ObjectId;

    @Prop({type: [mongoose.Schema.Types.ObjectId], ref: 'ETL_URL' })
    urls: Array<mongoose.Types.ObjectId>;
    
    @Prop()
    startedAt: Date;

    @Prop()
    finishedAt: Date;

    @Prop()
    error: string;
}

export const ETL_JobSchema = SchemaFactory.createForClass(ETL_Job);