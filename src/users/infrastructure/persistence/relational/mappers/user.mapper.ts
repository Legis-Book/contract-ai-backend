import { FileMapper } from '../../../../../files/infrastructure/persistence/relational/mappers/file.mapper';
import { User as UserDto } from '../../../../domain/user';
import { User } from '../../../../../../generated/prisma';

export class UserMapper {
  static toDomain(raw: User): UserDto {
    const domainEntity = new UserDto();
    domainEntity.id = raw.id;
    domainEntity.email = raw.email ?? null;
    domainEntity.password = raw.password ?? undefined;
    domainEntity.provider = raw.provider;
    domainEntity.socialId = raw.socialId ?? null;
    domainEntity.firstName = raw.firstName ?? null;
    domainEntity.lastName = raw.lastName ?? null;
    if ((raw as any).photo) {
      domainEntity.photo = FileMapper.toDomain((raw as any).photo);
    } else {
      domainEntity.photo = undefined;
    }
    if ((raw as any).role) {
      domainEntity.role = (raw as any).role;
    } else {
      domainEntity.role = undefined;
    }
    if ((raw as any).status) {
      domainEntity.status = (raw as any).status;
    } else {
      domainEntity.status = undefined;
    }
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: UserDto): User {
    const persistenceEntity: any = {};
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.email = domainEntity.email ?? null;
    persistenceEntity.password = domainEntity.password ?? null;
    persistenceEntity.provider = domainEntity.provider;
    persistenceEntity.socialId = domainEntity.socialId ?? null;
    persistenceEntity.firstName = domainEntity.firstName ?? null;
    persistenceEntity.lastName = domainEntity.lastName ?? null;
    if (domainEntity.photo) {
      persistenceEntity.photoId = domainEntity.photo.id;
    } else if (domainEntity.photo === null) {
      persistenceEntity.photoId = null;
    }
    if (domainEntity.role) {
      persistenceEntity.roleId = Number(domainEntity.role.id);
    } else if (domainEntity.role === null) {
      persistenceEntity.roleId = null;
    }
    if (domainEntity.status) {
      persistenceEntity.statusId = Number(domainEntity.status.id);
    } else if (domainEntity.status === null) {
      persistenceEntity.statusId = null;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt ?? null;
    return persistenceEntity satisfies User;
  }
}
