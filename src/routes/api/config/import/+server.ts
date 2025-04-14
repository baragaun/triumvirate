import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

export async function GET() {
  try {
    await operations.chatConfig.import();

    return json({
    });
  } catch (error) {
    console.error('Error importing configuration:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
