import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VersionControlService } from './version-control.service';
import { VersionControlController } from './version-control.controller';

@Module({
  controllers: [VersionControlController],
  providers: [PrismaService, VersionControlService],
  exports: [VersionControlService],
})
export class VersionControlModule {}
