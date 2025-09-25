import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsUrl,
} from 'class-validator';

export class UpdatePlantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  waterAmountMl?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  waterFrequencyDays?: number;
}
