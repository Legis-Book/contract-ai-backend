import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { StatusEntity } from '../../../../statuses/infrastructure/persistence/relational/entities/status.entity';
// import { StatusEnum } from 'src/common/enums/status.enum';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class StatusSeedService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Migrate to Prisma
  // constructor(
  //   @InjectRepository(StatusEntity)
  //   private repository: Repository<StatusEntity>,
  // ) {}

  async run() {
    const statuses = [
      { id: 1, name: 'Active' },
      { id: 2, name: 'Inactive' },
      { id: 3, name: 'Pending' },
    ];
    for (const status of statuses) {
      await this.prisma.status.upsert({
        where: { id: status.id },
        update: { name: status.name },
        create: status,
      });
    }
  }
}
