import type { PgTableWithColumns, PgTransaction } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { SQL } from "drizzle-orm";
import { ERROR_CODES, ServiceError } from "$lib/errors";
import * as z from "zod/v4";
import _ from "lodash";
import type { ServiceMethods, DBLike, IdConfig } from "./types";

export function createService<
  TTable extends PgTableWithColumns<any>,
  TId,
  TCustom extends Record<string, (...args: any[]) => Promise<Record<string, unknown>[]>> = {}
>(
  table: TTable,
  tableName: string,
  idConfig: IdConfig<TId>,
  customMethods?: TCustom
) {
  type TInsert = TTable['$inferInsert'];
  type TSelect = TTable['$inferSelect'];

  const insertValidator = createInsertSchema(table);
  const updateValidator = createUpdateSchema(table);

  type TUpdate = z.infer<typeof updateValidator>;

  const service = {
    async insert(
      tx: PgTransaction<any, any, any>,
      data: TInsert | TInsert[]
    ): Promise<TSelect[]> {
      if (Array.isArray(data) && data.length === 0) {
        throw new ServiceError(ERROR_CODES.validation.INSERT_GOT_EMPTY_ARRAY);
      }

      const validated: TInsert | TInsert[] = Array.isArray(data) ? insertValidator.array().safeParse(data) : insertValidator.safeParse(data);
      if (!validated.success) {
        const key = `INVALID_${_.snakeCase(tableName).toUpperCase()}` as keyof typeof ERROR_CODES.validation;
        const error = ERROR_CODES.validation[key] || ERROR_CODES.validation.UNDEFINED;
        throw new ServiceError(error);
      }
      return await tx.insert(table).values(validated.data).returning() as TSelect[];
    },

    async select(
      conn: DBLike,
      where?: SQL<unknown>
    ): Promise<TSelect[]> {
      let query = conn.select().from(table);
      if (where) query.where(where);
      return (await query) as TSelect[];
    },

    async update(
      tx: PgTransaction<any, any, any>,
      data: TUpdate | TUpdate[],
      id: TId | TId[]
    ): Promise<TSelect[]> {
      if (Array.isArray(data) && data.length === 0) {
        throw new ServiceError(ERROR_CODES.validation.UPDATE_GOT_EMPTY_ARRAY);
      }

      // Validate the data (single or array)
      const validated = Array.isArray(data)
        ? updateValidator.array().safeParse(data)
        : updateValidator.safeParse(data);

      // If validation failed, throw an error
      if (!validated.success) {
        const key = `INVALID_${_.snakeCase(tableName).toUpperCase()}` as keyof typeof ERROR_CODES.validation;
        const error = ERROR_CODES.validation[key] || ERROR_CODES.validation.UNDEFINED;
        throw new ServiceError(error);
      }

      // Validate the ID(s)
      const validId = idConfig.validator(id);

      // Normalize data and ids to arrays for batch logic
      const dataArray = Array.isArray(validated.data) ? validated.data : [validated.data];
      const idArray = Array.isArray(validId) ? validId : [validId];

      // Check for length mismatch
      if (dataArray.length !== idArray.length) {
        throw new ServiceError(ERROR_CODES.validation.UPDATE_ARRAY_LENGTH_MISMATCH);
      }

      // Perform updates in a loop
      const affected: TSelect[] = [];
      for (let i = 0; i < dataArray.length; i++) {
        const where = idConfig.where(idArray[i]);
        if (!where) {
          throw new ServiceError(ERROR_CODES.validation.WHERE_UNDEFINED);
        }

        const rows = await tx.update(table)
          .set(dataArray[i])
          .where(where)
          .returning() as TSelect[];

        if (rows.length === 0) {
          throw new ServiceError(ERROR_CODES.validation.UPDATE_AFFECTED_NO_ROWS);
        } else if (rows.length > 1) {
          throw new ServiceError(ERROR_CODES.validation.SINGLE_UPDATE_AFFECTED_MULTIPLE);
        }

        affected.push(...rows);
      }

      return affected;
    },

    async delete(
      tx: PgTransaction<any, any, any>,
      id: TId | TId[]
    ): Promise<TSelect[]> {
      const validId = idConfig.validator(id);
      const where = idConfig.where(validId);
      if (!where) {
        throw new ServiceError(ERROR_CODES.validation.WHERE_UNDEFINED);
      }

      const affected = await tx.delete(table).where(where).returning() as TSelect[];

      if (affected.length === 0) {
        throw new ServiceError(ERROR_CODES.validation.DELETE_AFFECTED_NO_ROWS);
      }

      return affected;
    },
  } as ServiceMethods<TTable['$inferInsert'], TTable['$inferSelect'], TId> & TCustom;

  if (customMethods) {
    Object.assign(service, customMethods);
  }

  return service;
}
