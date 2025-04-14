import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { Chat } from '$lib/server/db/schema';

// Create a new chat
export async function POST({ request }) {
  try {
    // console.log('Creating new chat');
    const props: Partial<Chat> = await request.json();
    // console.log('Chat props:', props);

    const response = await operations.chat.create(props);

    if (response.error) {
      console.error('Failed to create chat:', response.error);
      return json({
        error: response.error
      }, { status: 500 });
    }

    if (!response.chat) {
      console.error('Failed to create chat');
      return json({ error: 'Failed to create chat' }, { status: 500 });
    }

    return json(response);
  } catch (error) {
    console.error('Error processing chat request:', error);

    // Return an error response
    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET({ locals }) {
  try {
    // Get the user ID from the session if available
    const userId = locals.user?.id;

    // Get chats for the user (or anonymous chats if no user)
    const chats = await operations.chat.find(userId);

    return json({
      chats
    });
  } catch (error) {
    console.error('Error retrieving chats:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
