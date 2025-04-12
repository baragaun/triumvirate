import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

export async function GET() {
  try {
    const llms = await operations.llm.find(true)

    return json({ llms });
  } catch (error) {
    console.error('Error listing Bedrock llms:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
