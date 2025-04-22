import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';
import type { Chat } from '$lib/server/db/schema';

export async function GET({ locals }) {
  try {
    // Get the user ID from the session if available
    const userId = locals.user?.id;

    console.log('Getting chats for user:', userId);
    const chats = await operations.chat.find(userId);
    console.log('Found chats for user:', chats);

    return json({ chats });
  } catch (error) {
    console.error('Error retrieving chats:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create a new chat
export async function POST({ request, locals }) {
  try {
    const props: Partial<Chat> = await request.json();

    console.log('api/chats POST request received', { locals, props });

    if (!props.username && locals.user?.username) {
      props.username = locals.user.username;
    }

    if (!props.userId && locals.user?.id) {
      props.userId = locals.user.id;
    }

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
