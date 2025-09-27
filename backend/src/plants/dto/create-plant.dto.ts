import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsUrl,
  Matches,
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
  @Matches(/^(https?:\/\/.*|data:image\/(jpeg|jpg|png|gif|webp);base64,.*)$/, {
    message: 'imageUrl must be a valid URL or a base64 data URL',
  })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsInt()
  @Min(1)
  waterAmountMl: number;

  @IsInt()
  @Min(1)
  waterFrequencyDays: number;
}
