import {
  Body,
  Controller,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VersionControlService } from './version-control.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateCommitDto } from './dto/create-commit.dto';

@ApiTags('version-control')
@Controller('repos')
export class VersionControlController {
  constructor(private readonly service: VersionControlService) {}

  @Post()
  @ApiOperation({ summary: 'Create repository' })
  @ApiResponse({ status: 201 })
  async createRepo(@Body() dto: CreateRepoDto) {
    try {
      return await this.service.createRepository(dto.entityType, dto.entityId);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post(':id/branches')
  @ApiOperation({ summary: 'Create branch' })
  @ApiResponse({ status: 201 })
  async createBranch(
    @Param('id') repoId: string,
    @Body() dto: CreateBranchDto,
  ) {
    try {
      const fromCommit = dto.fromCommit ?? '0';
      return await this.service.createBranch(repoId, dto.name, fromCommit);
    } catch (e) {
      throw e instanceof Error ? new BadRequestException(e.message) : e;
    }
  }

  @Post(':id/commits')
  @ApiOperation({ summary: 'Create commit' })
  @ApiResponse({ status: 201 })
  async commit(@Param('id') repoId: string, @Body() dto: CreateCommitDto) {
    try {
      return await this.service.commit(
        repoId,
        dto.branch,
        dto.treeSha,
        dto.message,
        dto.authorId,
      );
    } catch (e) {
      throw e instanceof Error ? new BadRequestException(e.message) : e;
    }
  }
}
