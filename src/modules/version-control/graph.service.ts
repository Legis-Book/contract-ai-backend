import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class GraphService implements OnModuleInit, OnModuleDestroy {
  private driver!: Driver;
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  onModuleInit() {
    this.driver = neo4j.driver(
      this.configService.get('neo4j.uri', { infer: true }) as string,
      neo4j.auth.basic(
        this.configService.get('neo4j.user', { infer: true }) as string,
        this.configService.get('neo4j.password', { infer: true }) as string,
      ),
    );
  }

  onModuleDestroy() {
    return this.driver?.close();
  }

  async writeCommit(
    repoId: string,
    commit: {
      sha: string;
      authorId: number;
      message: string;
      timestamp: string;
      sizeBytes: number;
    },
    branch: string,
  ) {
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          'MERGE (r:Repo {repoId:$repoId})\nMERGE (c:Commit {sha:$sha}) SET c += $props\nMERGE (b:Branch {name:$branch, repoId:$repoId})\nMERGE (b)-[:HEAD]->(c)',
          {
            repoId,
            sha: commit.sha,
            branch,
            props: {
              authorId: commit.authorId,
              message: commit.message,
              ts: commit.timestamp,
              sizeBytes: commit.sizeBytes,
            },
          },
        ),
      );
    } finally {
      await session.close();
    }
  }
}
