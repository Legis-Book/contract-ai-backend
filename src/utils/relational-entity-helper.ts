import { instanceToPlain } from 'class-transformer';

// Helper function to add __entity and toJSON to a Prisma model instance
export function addEntityHelpers<T extends object>(
  model: T,
): T & { __entity: string; toJSON: () => object } {
  return Object.assign(model, {
    __entity: model.constructor.name,
    toJSON() {
      return instanceToPlain(this);
    },
  });
}
