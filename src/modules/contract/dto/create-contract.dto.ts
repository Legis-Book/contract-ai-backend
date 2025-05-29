import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ContractStatus } from '@orm/prisma';

export class CreateContractDto {
  @IsString()
  title: string;

  @IsString()
  filename: string;

  @IsString()
  contractType: string;

  @IsString()
  @IsOptional()
  fullText?: string;

  @IsString()
  @IsOptional()
  governingLaw?: string;

  @IsString()
  @IsOptional()
  parties?: string;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsString()
  @IsOptional()
  language?: string;
}
