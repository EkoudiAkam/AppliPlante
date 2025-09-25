import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateWateringDto {
  @IsString()
  plantId: string;

  @IsInt()
  @Min(1)
  amountMl: number;

  @IsOptional()
  @IsString()
  note?: string;
}
