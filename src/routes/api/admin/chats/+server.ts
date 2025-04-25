import { json, type RequestEvent } from '@sveltejs/kit'
import { findChats } from '$lib/server/chat/findChats';

// Get all chats
export async function GET({ locals }: RequestEvent) {
  // Check if the user is logged in and is an admin
  if (!locals.user?.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all chats (no userId filter means get all)
    const chats = await findChats();

    return json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return json({
      error: error instanceof Error ? error.message : 'Failed to fetch chats'
    }, { status: 500 });
  }
}
