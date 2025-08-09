import type { LayoutServerLoad } from './$types';
import { services, db } from '$lib/server/db';

export const load: LayoutServerLoad = async () => {
  const data = await services.changelog.select(db);

  return { changelogs: data };
}
