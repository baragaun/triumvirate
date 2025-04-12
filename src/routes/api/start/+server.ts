import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

// const dbPath = process.env.DATABASE_URL;

export async function GET() {
  try {
    await operations.startServer();

    // if (!error) {
      return json({ message: 'Server started successfully' });
    // } else {
    //   return json({ error: 'Failed to start the server' }, { status: 500 });
    // }
  } catch (error) {
    console.error('Error starting the server:', error);
    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
