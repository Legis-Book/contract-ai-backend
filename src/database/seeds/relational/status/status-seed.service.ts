import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { StatusEntity } from '../../../../statuses/infrastructure/persistence/relational/entities/status.entity';
// import { StatusEnum } from 'src/common/enums/status.enum';

@Injectable()
export class StatusSeedService {
  // TODO: Migrate to Prisma
  // constructor(
  //   @InjectRepository(StatusEntity)
  //   private repository: Repository<StatusEntity>,
  // ) {}

  async run() {
    // TODO: Implement with Prisma
  }
}
