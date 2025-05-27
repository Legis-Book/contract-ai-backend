import { ApiProperty } from '@nestjs/swagger';

export class StandardClauseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  contractType: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ required: false })
  jurisdiction?: string;

  @ApiProperty({ required: false })
  version?: string;

  @ApiProperty({ required: false, type: Number })
  allowedDeviations?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, type: Number })
  previousVersionId?: number;
}
