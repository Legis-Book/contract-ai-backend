import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VcEntityType,
  VcObjectType,
  VcRefType,
} from '../../../generated/prisma';
import crypto from 'crypto';

@Injectable()
export class VersionControlService {
  constructor(private readonly prisma: PrismaService) {}

  async createRepository(entityType: VcEntityType, entityId: string) {
    return await this.prisma.vcRepo.create({
      data: {
        entityType,
        entityId,
        defaultBranch: 'main',
        refs: {
          create: {
            id: 'main',
            commitSha: '0',
            refType: VcRefType.branch,
            isMutable: true,
          },
        },
      },
    });
  }

  async createBranch(repoId: string, name: string, fromCommit: string) {
    await this.ensureRepo(repoId);
    return await this.prisma.vcRef.create({
      data: {
        id: name,
        repoId,
        commitSha: fromCommit,
        refType: VcRefType.branch,
        isMutable: true,
      },
    });
  }

  async commit(
    repoId: string,
    branch: string,
    treeSha: string,
    message: string,
    author: string,
  ) {
    await this.ensureRepo(repoId);
    const ref = await this.prisma.vcRef.findUnique({
      where: { id_repoId: { id: branch, repoId } },
    });
    if (!ref) throw new NotFoundException('Branch not found');
    const commit = {
      tree: treeSha,
      parent: ref.commitSha,
      author,
      message,
      timestamp: new Date().toISOString(),
    };
    const data = Buffer.from(JSON.stringify(commit));
    const sha = crypto.createHash('sha256').update(data).digest('hex');
    await this.prisma.vcObject.upsert({
      where: { sha },
      update: {},
      create: { sha, data, type: VcObjectType.commit },
    });
    await this.prisma.vcRef.update({
      where: { id_repoId: { id: branch, repoId } },
      data: { commitSha: sha },
    });
    return sha;
  }

  private async ensureRepo(repoId: string) {
    const repo = await this.prisma.vcRepo.findUnique({ where: { id: repoId } });
    if (!repo) throw new NotFoundException('Repository not found');
    return repo;
  }
}
