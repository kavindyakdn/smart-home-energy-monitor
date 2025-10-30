import { IsString, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateTelemetryDto {
  @IsString()
  deviceId: string;

  @IsString()
  category: string;

  @IsNumber()
  value: number;

  @IsBoolean()
  status: boolean;

  @IsDateString()
  timestamp: string;
}
