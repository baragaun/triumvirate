import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

export async function POST({ request, params }) {
  try {
    // Get the chat ID from the URL parameters
    const chatId = params.id;

    console.log('Generating response for chat:', chatId);
    const response = await operations.bedrock.generateResponse(chatId);

    return json(response);
  } catch (error) {
    console.error('Error processing chat request:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
