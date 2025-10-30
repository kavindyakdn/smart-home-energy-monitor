import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Telemetry extends Document {
  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  value: number;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true })
  timestamp: Date;
}

export const TelemetrySchema = SchemaFactory.createForClass(Telemetry);
