// TODO: Migrate to Prisma
// import { FileEntity } from '../entities/file.entity';
import { FileType } from '../../../../domain/file';
import { File } from '../../../../../../generated/prisma';
// import { raw } from 'objection';

export class FileMapper {
  static toDomain(raw: File): FileType {
    const domainEntity = new FileType();
    domainEntity.id = raw.id;
    domainEntity.path = raw.path;
    return domainEntity;
  }

  static toPersistence(domainEntity: Omit<FileType, 'id'>): { path: string } {
    return {
      path: domainEntity.path,
    };
  }
}
