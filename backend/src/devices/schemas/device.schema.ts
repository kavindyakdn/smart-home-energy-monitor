import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Device schema for smart home devices
 * Represents physical IoT devices that can send telemetry data
 */
@Schema({ timestamps: true })
export class Device extends Document {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  room?: string;

  @Prop()
  ratedWattage?: number;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
