import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { Session as SessionDto } from '../../../../domain/session';
import { Session, User } from '../../../../../../generated/prisma';
import { User as UserDomain } from '../../../../../users/domain/user';

export class SessionMapper {
  static toDomain(raw: Session & { user?: User }): SessionDto {
    const domainEntity = new SessionDto();
    domainEntity.id = raw.id;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    } else {
      domainEntity.user = new UserDomain();
    }
    domainEntity.hash = raw.hash;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: SessionDto): Session {
    const persistenceEntity: any = {};
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.hash = domainEntity.hash;
    persistenceEntity.userId = domainEntity.user
      ? Number(domainEntity.user.id)
      : undefined;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.deletedAt = domainEntity.deletedAt;
    return persistenceEntity as Session;
  }
}
