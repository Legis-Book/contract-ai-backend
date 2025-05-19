import { expect } from 'chai';
import sinon from 'sinon';
import { TemplatesService } from '../../src/templates/templates.service';
import { Repository } from 'typeorm';
import { StandardClause } from '../../src/templates/entities/standard-clause.entity';
import { NotFoundException } from '@nestjs/common';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let repo: sinon.SinonStubbedInstance<Repository<StandardClause>>;

  beforeEach(() => {
    repo = {
      create: sinon.stub(),
      save: sinon.stub(),
      find: sinon.stub(),
      findOne: sinon.stub(),
    } as unknown as sinon.SinonStubbedInstance<Repository<StandardClause>>;
    service = new TemplatesService(repo as unknown as Repository<StandardClause>);
  });

  it('should create a clause', async () => {
    const dto = { name: 'Test', type: 't', content: 'c' } as any;
    const created = { id: '1', ...dto, isActive: true } as any;
    (repo.create as any).returns(created);
    (repo.save as any).resolves(created);

    const result = await service.create(dto);

    expect((repo.create as any).calledWith({ isActive: true, ...dto })).to.be.true;
    expect((repo.save as any).calledWith(created)).to.be.true;
    expect(result).to.equal(created);
  });

  it('should return one clause by id', async () => {
    const clause = { id: '1' } as any;
    (repo.findOne as any).resolves(clause);

    const result = await service.findOne('1');

    expect((repo.findOne as any).calledWith({ where: { id: '1', isActive: true } })).to.be.true;
    expect(result).to.equal(clause);
  });

  it('should throw NotFoundException if clause not found', async () => {
    (repo.findOne as any).resolves(null);

    try {
      await service.findOne('1');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).to.be.instanceOf(NotFoundException);
    }
  });
});
