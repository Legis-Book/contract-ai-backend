import { addEntityHelpers } from '../relational-entity-helper';

describe('addEntityHelpers', () => {
  it('should add __entity and toJSON methods', () => {
    class TestEntity {
      id = 1;
    }
    const entity = addEntityHelpers(new TestEntity());
    expect(entity.__entity).toBe('TestEntity');
    expect(entity.toJSON()).toEqual({ id: 1, __entity: 'TestEntity' });
  });
});
