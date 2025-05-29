import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RiskFlagStatus } from '@orm/prisma';

export class UpdateRiskFlagDto {
  @ApiProperty({ enum: RiskFlagStatus })
  @IsEnum(RiskFlagStatus)
  status: RiskFlagStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
