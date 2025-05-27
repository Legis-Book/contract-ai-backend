import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('VersionControl', () => {
  const app = APP_URL;
  let repoId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/v1/repos')
      .send({ entityType: 'contract', entityId: `demo-${Date.now()}` })
      .expect(201);
    repoId = res.body.id;
  });

  it('should create repo', async () => {
    const res = await request(app)
      .post('/api/v1/repos')
      .send({ entityType: 'contract', entityId: `test-${Date.now()}` })
      .expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        entityType: 'contract',
        entityId: expect.stringMatching(/^test-/),
        defaultBranch: 'main',
      }),
    );
  });

  it('should create branch', async () => {
    const res = await request(app)
      .post(`/api/v1/repos/${repoId}/branches`)
      .send({ name: 'feature', fromCommit: '0' })
      .expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: 'feature',
        repoId,
        commitSha: '0',
        refType: 'branch',
        isMutable: true,
      }),
    );
  });

  it('should fail to create branch for missing repo', async () => {
    await request(app)
      .post('/api/v1/repos/unknown/branches')
      .send({ name: 'x', fromCommit: '0' })
      .expect(404);
  });

  it('should fail to create branch from unknown commit', async () => {
    await request(app)
      .post(`/api/v1/repos/${repoId}/branches`)
      .send({ name: 'x', fromCommit: 'deadbeef' })
      .expect(404);
  });

  it('should fail to commit with invalid branch', async () => {
    await request(app)
      .post(`/api/v1/repos/${repoId}/commits`)
      .send({ branch: 'nope', treeSha: 'tree', message: 'msg', authorId: 1 })
      .expect(404);
  });

  it('should fail to commit with invalid tree', async () => {
    await request(app)
      .post(`/api/v1/repos/${repoId}/commits`)
      .send({ branch: 'main', treeSha: 'dead', message: 'msg', authorId: 1 })
      .expect(404);
  });
});
