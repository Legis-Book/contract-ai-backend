import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class IngestContractDto {
  @IsString()
  contractId!: string;

  @IsString()
  title!: string;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => String)
  sources!: string[];

  @IsString()
  contractType!: string;
}
