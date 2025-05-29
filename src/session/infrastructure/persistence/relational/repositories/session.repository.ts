import { Injectable } from '@nestjs/common';
import { NullableType } from '../../../../../utils/types/nullable.type';

import { SessionRepository } from '../../session.repository';
import { Session } from '../../../../domain/session';

import { SessionMapper } from '../mappers/session.mapper';
import { User } from '../../../../../users/domain/user';
import { PrismaService } from '@src/prisma/prisma.service';
@Injectable()
export class SessionRelationalRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: Session['id']): Promise<NullableType<Session>> {
    const entity = await this.prisma.session.findUnique({
      where: {
        id: Number(id),
      },
    });

    return entity ? SessionMapper.toDomain(entity) : null;
  }

  async create(data: Session) {
    const persistenceModel = SessionMapper.toPersistence(data);
    const created = await this.prisma.session.create({
      data: persistenceModel,
    });
    return SessionMapper.toDomain(created);
  }

  async update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    const entity = await this.prisma.session.findUnique({
      where: { id: Number(id) },
    });

    if (!entity) {
      throw new Error('Session not found');
    }

    const updatedEntity = await this.prisma.session.update({
      where: { id: Number(id) },
      data: SessionMapper.toPersistence({
        ...SessionMapper.toDomain(entity),
        ...payload,
      }),
    });

    return SessionMapper.toDomain(updatedEntity);
  }

  async deleteById(id: Session['id']): Promise<void> {
    await this.prisma.session.delete({
      where: { id: Number(id) },
    });
  }

  async deleteByUserId(conditions: { userId: User['id'] }): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        user: {
          id: Number(conditions.userId),
        },
      },
    });
  }

  async deleteByUserIdWithExclude(conditions: {
    userId: User['id'];
    excludeSessionId: Session['id'];
  }): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        user: {
          id: Number(conditions.userId),
        },
        id: {
          not: Number(conditions.excludeSessionId),
        },
      },
    });
  }
}
