import type { PageServerLoad } from './$types';
import { services, db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const data = await services.platform.select(db);

  return { platforms: data }
}
