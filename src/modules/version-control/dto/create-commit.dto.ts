import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCommitDto {
  @ApiProperty()
  @IsString()
  branch: string;

  @ApiProperty()
  @IsString()
  treeSha: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  author: string;
}
