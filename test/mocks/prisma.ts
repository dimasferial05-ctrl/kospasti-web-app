import { vi } from "vitest";

export function createModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

export function createMockPrisma() {
  const mock = {
    owner: createModelMock(),
    property: createModelMock(),
    roomType: createModelMock(),
    propertyMedia: createModelMock(),
    magicLink: createModelMock(),
    booking: createModelMock(),
    user: createModelMock(),
    savedProperty: createModelMock(),
    review: createModelMock(),
    payoutMethod: createModelMock(),
    payout: createModelMock(),
    location: createModelMock(),
    notification: createModelMock(),
    visitSchedule: createModelMock(),
    chatRoom: createModelMock(),
    chatMessage: createModelMock(),
    $transaction: vi.fn().mockImplementation(async (arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      if (typeof arg === "function") {
        return arg(mock);
      }
      return arg;
    }),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(0),
    $executeRawUnsafe: vi.fn().mockResolvedValue(0),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };

  return mock;
}

export const mockPrisma = createMockPrisma();
