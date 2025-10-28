import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Device extends Document {
  @Prop({ required: true, unique: true })
  deviceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string; // e.g., "plug" | "light" | "thermostat"

  @Prop({ required: true })
  category: string; // "power" | "lighting" | "heating"

  @Prop()
  room?: string;

  @Prop()
  ratedWattage?: number; // optional: used for power estimation
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
