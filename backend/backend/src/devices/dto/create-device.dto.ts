import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  deviceId: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Rated wattage must be a positive number' })
  ratedWattage?: number;
}
