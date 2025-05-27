import request from 'supertest';
import { APP_URL } from '../utils/constants';

describe('VersionControl', () => {
  const app = APP_URL;
  let repoId: string;

  it('should create repo', async () => {
    return request(app)
      .post('/api/v1/repos')
      .send({ entityType: 'contract', entityId: 'demo-contract' })
      .expect(201)
      .expect(({ body }) => {
        repoId = body.id;
        expect(repoId).toBeDefined();
      });
  });

  it('should create branch', async () => {
    return request(app)
      .post(`/api/v1/repos/${repoId}/branches`)
      .send({ name: 'feature', fromCommit: '0' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe('feature');
      });
  });
});
