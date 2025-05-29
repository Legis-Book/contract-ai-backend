import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ClauseType } from '../entities/clause.entity';

export class CreateClauseDto {
  @ApiProperty({ description: 'Clause number or identifier' })
  @IsNumber()
  number: number;

  @ApiProperty({ description: 'Text content of the clause' })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Type of the clause',
    enum: ClauseType,
    required: false,
  })
  @IsEnum(ClauseType)
  @IsOptional()
  type?: ClauseType;

  @ApiProperty({
    description: 'Suggested text for the clause',
    required: false,
  })
  @IsString()
  @IsOptional()
  suggestedText?: string;
}
