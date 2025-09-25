import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsUrl,
} from 'class-validator';

export class CreatePlantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsInt()
  @Min(1)
  waterAmountMl: number;

  @IsInt()
  @Min(1)
  waterFrequencyDays: number;
}
