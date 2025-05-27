import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VersionControlService } from './version-control.service';
import { VersionControlController } from './version-control.controller';
import { ObjectStoreService } from './object-store.service';
import { OutboxService } from './outbox.service';
import { GraphService } from './graph.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [VersionControlController],
  providers: [
    PrismaService,
    VersionControlService,
    ObjectStoreService,
    OutboxService,
    GraphService,
  ],
  exports: [VersionControlService],
})
export class VersionControlModule {}
