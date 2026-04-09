import type { Garu } from "@garuhq/node";

export function createMockGaru(): Garu {
  const charges = {
    create: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    refund: vi.fn(),
  };

  const customers = {
    create: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const meta = {
    get: vi.fn(),
  };

  return { charges, customers, meta, webhooks: {} } as unknown as Garu;
}

import { vi } from "vitest";
