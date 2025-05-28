// Helper function to add __entity and toJSON to a Prisma model instance
export function addEntityHelpers<T extends object>(
  model: T,
): T & { __entity: string; toJSON: () => object } {
  return Object.assign(model, {
    __entity: model.constructor.name,
    toJSON() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { toJSON, ...rest } = this as any;
      return { ...rest };
    },
  });
}
