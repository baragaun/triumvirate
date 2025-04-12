// import { drizzle } from 'drizzle-orm/libsql';
// import { createClient } from '@libsql/client';
// import * as schema from './schema';
// import { env } from '$env/dynamic/private';
// import { existsSync } from 'fs'
// import { createDb } from '$lib/server/db/createDb';
//
// if (!env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not set')
// }
//
// const createDb = !existsSync(env.DATABASE_URL);
//
// const client = createClient({ url: env.DATABASE_URL });
//
// export const db = drizzle(client, { schema });
//
// if (createDb) {
//   console.log(`Creating the database at ${env.DATABASE_URL}`);
//
//   createDb()
//     .catch((error) => {
//       console.error('Error initializing database:', error);
//     });
// }
