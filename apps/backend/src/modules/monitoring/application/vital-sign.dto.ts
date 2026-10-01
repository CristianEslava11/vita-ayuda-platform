import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsUUID, ValidateNested } from 'class-validator';
export class VitalValueDto {
  @IsUUID('4') vitalSignTypeId!: string;
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 }) valor!: number;
}
export class SaveDailyMonitoringDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(6)
  @ValidateNested({ each: true }) @Type(() => VitalValueDto)
  values!: VitalValueDto[];
}
