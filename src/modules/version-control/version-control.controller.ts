import { Body, Controller, Param, Post } from '@nestjs/common';
import { VersionControlService } from './version-control.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateCommitDto } from './dto/create-commit.dto';

@Controller('repos')
export class VersionControlController {
  constructor(private readonly service: VersionControlService) {}

  @Post()
  createRepo(@Body() dto: CreateRepoDto) {
    return this.service.createRepository(dto.entityType, dto.entityId);
  }

  @Post(':id/branches')
  createBranch(@Param('id') repoId: string, @Body() dto: CreateBranchDto) {
    return this.service.createBranch(repoId, dto.name, dto.fromCommit);
  }

  @Post(':id/commits')
  commit(@Param('id') repoId: string, @Body() dto: CreateCommitDto) {
    return this.service.commit(
      repoId,
      dto.branch,
      dto.treeSha,
      dto.message,
      dto.author,
    );
  }
}
