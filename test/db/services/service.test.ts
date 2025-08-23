import dotenv from 'dotenv';
dotenv.config();

import { describe, it, expect, afterAll } from 'vitest';
import { createService } from '../../../src/lib/server/db/shared/serviceFactory';
import { withErrorOrigin } from '../../../src/lib/server/db/shared/util';
import { idConfig } from '../../../src/lib/server/db/idConfig';
import * as schema from '../../../src/lib/server/db/shared/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as z from 'zod/v4';
import { eq, sql, SQL } from 'drizzle-orm';
import { ServiceError, ERROR_CODES } from '../../../src/lib/errors';
import type { DBLike } from '../../../src/lib/server/db/shared/types';
import _ from 'lodash';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

const { DATABASE_URL_TEST } = process.env;
if (!DATABASE_URL_TEST) throw new Error('DATABASE_URL_TEST is not set');

// Removed db url for safety
const client = postgres('');
export const db = drizzle(client);

let anime = [
  {
    titleNative: 'Naruto',
    titleRomaji: 'Naruto',
    titleEnglish: 'Naruto',
  },
  {
    titleNative: 'One Piece',
    titleRomaji: 'One Piece',
    titleEnglish: 'One Piece',
  },
  {
    titleNative: 'Attack on Titan',
    titleRomaji: 'Shingeki no Kyojin',
    titleEnglish: 'Attack on Titan',
  },
  {
    titleNative: 'My Hero Academia',
    titleRomaji: 'Boku no Hero Academia',
    titleEnglish: 'My Hero Academia',
  },
];

const animeFail = [
  {
    titleNative: 'Demon Slayer',
    titleRomaji: 'Kimetsu no Yaiba',
    titleEnglish: 'Demon Slayer',
  },
  {
    titleNative: 'Death Note',
    titleRomaji: 'Death Note',
    titleEnglish: 'Death Note',
  }
]

let animeIds: { animeId: number }[] = [{ animeId: -1 }, { animeId: -1 }, { animeId: -1 }, { animeId: -1 }];

type SelectWithLimit<TSelect> = (
  conn: DBLike,
  limit?: number,
  where?: SQL<unknown>
) => Promise<TSelect[]>;

function makeSelectWithLimit<TTable extends PgTableWithColumns<any>>(table: TTable) {
  type TSelect = TTable['$inferSelect'];
  return async function selectWithLimit(
    conn: DBLike,
    limit: number = 1,
    where?: SQL<unknown>
  ): Promise<TSelect[]> {
    let query = conn.select().from(table);
    if (where) query.where(where);
    if (limit) query.limit(limit);
    return await query as TSelect[];
  }
}

const customMethods = {
  selectWithLimit: makeSelectWithLimit(schema.anime),
}

const idSchema = z.object({ animeId: z.number().int().positive() });

const animeService = withErrorOrigin(
  createService(
    schema.anime,
    'anime',
    idConfig(idSchema, { animeId: schema.anime.animeId }),
    customMethods
  ),
  'animeService'
);

describe('CRUD', () => {
  it('Create', async () => {
    const inserted = await db.transaction(async (tx) => {
      return await animeService.insert(tx, anime[0]);
    });

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      animeId: expect.any(Number),
      ...anime[0]
    });

    animeIds[0].animeId = inserted[0].animeId;
  });

  it('Create many', async () => {
    const inserted = await db.transaction(async (tx) => {
      return await animeService.insert(tx, anime.slice(1));
    });

    expect(inserted).toHaveLength(3);
    inserted.forEach((item, index) => {
      animeIds[index + 1].animeId = item.animeId;
    });
    expect(inserted[0]).toMatchObject(anime[1]);
    expect(inserted[1]).toMatchObject(anime[2]);
    expect(inserted[2]).toMatchObject(anime[3]);
  });

  it('Create fail', async () => {
    try {
      await db.transaction(async (tx) => {
        await animeService.insert(tx, anime[0]);
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.postgres.UNIQUE_VIOLATION.code);
    }
  });

  it('Create many fail', async () => {
    try {
      await db.transaction(async (tx) => {
        await animeService.insert(tx, []);
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.INSERT_GOT_EMPTY_ARRAY.code);
    }

    try {
      await db.transaction(async (tx) => {
        await animeService.insert(tx, [anime[0], animeFail[0], animeFail[1]]);

        throw new Error('Passed');
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.postgres.UNIQUE_VIOLATION.code);
    }
  });

  it('Read', async () => {
    const selectedAll = await animeService.select(db);

    expect(animeIds[0].animeId).toBeGreaterThan(0);
    expect(selectedAll).toHaveLength(4);
    expect(selectedAll[0]).toMatchObject({
      animeId: animeIds[0].animeId,
      ...anime[0]
    });

    const selectedWhere = await animeService.select(db, eq(schema.anime.titleNative, anime[1].titleNative));

    expect(selectedWhere).toHaveLength(1);
    expect(selectedWhere[0]).toMatchObject({
      animeId: animeIds[1].animeId,
      ...anime[1]
    });
  });

  it('Read Custom', async () => {
    const selected = await animeService.selectWithLimit(db, 2);
    expect(selected).toHaveLength(2);

    const selectedOne = await animeService.selectWithLimit(db);
    expect(selectedOne).toHaveLength(1);
  })

  it('Update', async () => {
    expect(animeIds[0].animeId).toBeGreaterThan(0);

    anime[0].titleNative = 'Updated Title Native';

    const updated = await db.transaction(async (tx) => {
      return await animeService.update(tx, anime[0], animeIds[0]);
    });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({
      animeId: animeIds[0].animeId,
      ...anime[0]
    });
  });

  it('Update many', async () => {
    anime[1].titleNative = 'Updated Title Native 2';
    anime[2].titleNative = 'Updated Title Native 3';
    anime[3].titleNative = 'Updated Title Native 4';
    const updated = await db.transaction(async (tx) => {
      return await animeService.update(tx, anime.slice(1), animeIds.slice(1));
    })

    expect(updated).toHaveLength(3);
    updated.forEach((item, index) => {
      expect(item).toMatchObject({
        animeId: animeIds[index + 1].animeId,
        ...anime[index + 1]
      });
    });
  });

  it('Update fail', async () => {
    try {
      await db.transaction(async (tx) => {
        await animeService.update(tx, anime[0], { animeId: 9999 }); // Non-existent ID
      });

      throw new Error('Passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.UPDATE_AFFECTED_NO_ROWS.code);
    }

    expect(animeIds[0].animeId).toBeGreaterThan(0);

    try {
      await db.transaction(async (tx) => {
        return await animeService.update(tx, [], animeIds[0]);
      });

      throw new Error('Passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.UPDATE_GOT_EMPTY_ARRAY.code);
    }
  });

  it('Update many fail', async () => {
    try {
      await db.transaction(async (tx) => {
        await animeService.update(tx, anime.slice(2), animeIds.slice(1));
      });

      throw new Error('Passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.UPDATE_ARRAY_LENGTH_MISMATCH.code);
    }

    try {
      await db.transaction(async (tx) => {
        await animeService.update(tx, anime.slice(1), animeIds.slice(2));
      })

      throw new Error('Passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.UPDATE_ARRAY_LENGTH_MISMATCH.code);
    }

    try {
      await db.transaction(async (tx) => {
        await animeService.update(tx, anime.slice(1), [animeIds[1], { animeId: 9998 }, { animeId: 9997 }]);
      })

      throw new Error('Passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.UPDATE_AFFECTED_NO_ROWS.code);
    }
  });

  it('Delete', async () => {
    expect(animeIds[0].animeId).toBeGreaterThan(0);

    const deleted = await db.transaction(async (tx) => {
      return await animeService.delete(tx, animeIds[0]);
    });

    expect(deleted).toHaveLength(1);
    expect(deleted[0]).toMatchObject({
      animeId: animeIds[0].animeId,
      ...anime[0]
    });
  });

  it('Delete many', async () => {
    expect(_.every(animeIds, (v) => _.gt(v.animeId, 0)));

    const deleted = await db.transaction(async (tx) => {
      return await animeService.delete(tx, [animeIds[1], animeIds[2]]);
    });

    expect(deleted).toHaveLength(2);
    deleted.forEach((item, index) => {
      expect(item).toMatchObject({
        animeId: animeIds[index + 1].animeId,
        ...anime[index + 1]
      });
    });
  });

  it('Delete fail', async () => {
    try {
      await db.transaction(async (tx) => {
        await animeService.delete(tx, { animeId: 9999 });
      });

      throw new Error('Passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.DELETE_AFFECTED_NO_ROWS.code);
    }
  });

  it('Delete many fail', async () => {
    try {
      await db.transaction(async (tx) => {
        await animeService.delete(tx, [{ animeId: 9999 }, { animeId: 9998 }]);
      });

      throw new Error('Passed');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(ERROR_CODES.validation.DELETE_AFFECTED_NO_ROWS.code);
    }
  });
});

afterAll(async () => {
  await db.execute(sql`TRUNCATE TABLE ${schema.anime} RESTART IDENTITY CASCADE`);
})

