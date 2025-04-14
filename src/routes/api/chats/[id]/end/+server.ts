import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { EndChatRequest } from '$lib/types'

export async function POST({ request, params }) {
  try {
    // Get the chat ID from the URL parameters
    const chatId = params.id;

    // Parse the request body
    const body: EndChatRequest = await request.json();

    // Update the chat with feedback and rating
    await operations.chat.update({
      id: chatId,
      feedback: body.feedback,
      rating: body.rating,
    });

    return json({});
  } catch (error) {
    console.error('Error processing chat request:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
