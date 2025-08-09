import { describe, it, expect } from 'vitest';
import { idConfig } from '../../src/lib/server/db/idConfig';
import * as z from 'zod/v4';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '../../src/lib/server/db/shared/schema';

// Mock column representation for drizzle-orm
const mockColumns = { animeId: schema.animeSeason.animeId, sequence: schema.animeSeason.sequence };

describe('compositeIdConfig', () => {
  const schema = z.object({ animeId: z.number(), sequence: z.number() });
  const config = idConfig(schema, mockColumns);

  it('validates and builds where for a single composite id', () => {
    const input = { animeId: 1, sequence: 2 };
    const validId = config.validator(input);
    expect(validId).toEqual(input);

    const where = config.where(validId);
    expect(where).toEqual(
      and(
        eq(mockColumns.animeId, 1),
        eq(mockColumns.sequence, 2)
      )
    );
  });

  it('validates and builds where for multiple composite ids', () => {
    const arr = [
      { animeId: 1, sequence: 2 },
      { animeId: 3, sequence: 4 }
    ];
    const validIds = config.validator(arr);
    expect(validIds).toEqual(arr);

    const where = config.where(validIds);
    expect(where).toEqual(
      or(
        and(eq(mockColumns.animeId, 1), eq(mockColumns.sequence, 2)),
        and(eq(mockColumns.animeId, 3), eq(mockColumns.sequence, 4))
      )
    );
  });
});
