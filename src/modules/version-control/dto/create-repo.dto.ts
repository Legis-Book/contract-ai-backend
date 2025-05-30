import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { VcEntityType } from './vc-entity-type.enum';

export class CreateRepoDto {
  @ApiProperty({ enum: VcEntityType })
  @IsEnum(VcEntityType)
  entityType: VcEntityType;

  @ApiProperty()
  @IsString()
  entityId: string;
}
