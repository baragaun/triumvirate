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
  console.log('Session info:', locals.session ? `Session ID: ${locals.session.id}` : 'No session');
  console.log('User info:', locals.user ? `User ID: ${locals.user.id}, Name: ${locals.user.username}` : 'No user');
  try {
    console.log('Creating new chat');
    const props: Partial<Chat> = await request.json();

    // If user is logged in, use their ID
    if (locals.user) {
      console.log('Using logged-in user ID:', locals.user.id, 'User name:', locals.user.username);

      // Set both userId and userName for the chat
      props.userId = locals.user.id;

      // Make sure userName is set for logged-in users too
      if (!props.userName) {
        props.userName = locals.user.username;
      }

      console.log('Set props.userId to:', props.userId);
    } else {
      console.log('No logged-in user, using provided userName:', props.userName);
    }

    console.log('Chat props:', JSON.stringify(props, null, 2));

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
