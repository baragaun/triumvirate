import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg';

import { env } from '$env/dynamic/private';
import * as schema from '$lib/server/db/schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined = undefined;
let _serverStarted = false;

const dataStore = {
  isStarted: () => _serverStarted,
  setStarted: () => _serverStarted = true,

  db: {
    get: (): ReturnType<typeof drizzle<typeof schema>> => {
      if (!_db) {
        const pool = new pg.Pool({
          connectionString: env.DATABASE_URL,
        });
        _db = drizzle(pool, { schema });
      }
      return _db;
    },
  }
}

export default dataStore

