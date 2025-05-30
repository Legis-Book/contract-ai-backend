import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { ObjectStoreService } from './object-store.service';
import { OutboxService } from './outbox.service';
import { GraphService } from './graph.service';
import { VcEntityType, VcObjectType, VcRefType } from '@orm/prisma';
import crypto from 'crypto';

@Injectable()
export class VersionControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly objectStore: ObjectStoreService,
    private readonly outbox: OutboxService,
    private readonly graph: GraphService,
  ) {}

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
    if (fromCommit && fromCommit !== '0') {
      const commit = await this.prisma.vcObject.findUnique({
        where: { sha: fromCommit },
      });
      if (!commit) throw new NotFoundException('Commit not found');
    }
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
    authorId: number,
  ) {
    await this.ensureRepo(repoId);
    const ref = await this.prisma.vcRef.findUnique({
      where: { id_repoId: { id: branch, repoId } },
    });
    if (!ref) throw new NotFoundException('Branch not found');
    const treeExists = await this.prisma.vcObject.findUnique({
      where: { sha: treeSha },
    });
    if (!treeExists || treeExists.type !== VcObjectType.tree)
      throw new NotFoundException('Tree not found');
    const commit = {
      tree: treeSha,
      parent: ref.commitSha,
      authorId,
      message,
      timestamp: new Date().toISOString(),
    };
    const data = Buffer.from(JSON.stringify(commit));
    const sha = crypto.createHash('sha256').update(data).digest('hex');
    const existing = await this.prisma.vcObject.findUnique({ where: { sha } });
    if (!existing) {
      await this.objectStore.storeBlobIfAbsent(sha, data);
      await this.prisma.vcObject.create({
        data: { sha, data: Buffer.from(data), type: VcObjectType.commit },
      });
    } else if (!Buffer.from(existing.data).equals(data)) {
      throw new Error('SHA collision for commit');
    }
    await this.prisma.vcRef.update({
      where: { id_repoId: { id: branch, repoId } },
      data: { commitSha: sha },
    });
    await this.prisma.vcCommitMeta.create({
      data: {
        commitSha: sha,
        repoId,
        authorId,
        message,
        timestamp: new Date().toISOString(),
        sizeBytes: data.length,
        branchHint: branch,
      },
    });
    await this.outbox.publish({
      action: 'WRITE_COMMIT',
      repoId,
      branch,
      commit: { ...commit, sha },
    });
    await this.graph.writeCommit(
      repoId,
      {
        sha,
        authorId,
        message,
        timestamp: commit.timestamp,
        sizeBytes: data.length,
      },
      branch,
    );
    return sha;
  }

  private async ensureRepo(repoId: string) {
    const repo = await this.prisma.vcRepo.findUnique({ where: { id: repoId } });
    if (!repo) throw new NotFoundException('Repository not found');
    return repo;
  }
}
