import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { FileEntity } from '../entities/file.entity';
// import { In, Repository } from 'typeorm';
import { FileRepository } from '../../file.repository';

import { FileType } from '../../../../domain/file';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { FileMapper } from '../mappers/file.mapper';

// import { FileMapper } from '../mappers/file.mapper';

@Injectable()
export class FileRelationalRepository implements FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Migrate to Prisma
  // constructor(
  //   @InjectRepository(FileEntity)
  //   private readonly fileRepository: Repository<FileEntity>,
  // ) {}

  async create(data: Omit<FileType, 'id'>): Promise<FileType> {
    const created = await this.prisma.file.create({
      data: FileMapper.toPersistence(data),
    });
    return FileMapper.toDomain(created);
  }

  async findById(id: FileType['id']): Promise<NullableType<FileType>> {
    const found = await this.prisma.file.findUnique({ where: { id } });
    return found ? FileMapper.toDomain(found) : null;
  }

  async findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    const found = await this.prisma.file.findMany({
      where: { id: { in: ids } },
    });
    return found.map(FileMapper.toDomain);
  }
}
