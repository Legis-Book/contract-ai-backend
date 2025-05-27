import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VcOutboxStatus } from '../../../generated/prisma';

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async publish(payload: any) {
    await this.prisma.vcOutbox.create({
      data: {
        payload,
        status: VcOutboxStatus.NEW,
      },
    });
  }
}
