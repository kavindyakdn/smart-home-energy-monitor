import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { CreateTelemetryDto } from './create-telemetry.dto';

export class BatchTelemetryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTelemetryDto)
  data: CreateTelemetryDto[];
}
