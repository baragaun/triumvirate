import { json } from '@sveltejs/kit';
import * as table from '$lib/server/db/schema';
import { findUsers } from '$lib/server/user/findUsers';

// Get all users
export async function GET({ locals }) {
  // Check if the user is logged in and is an admin
  if (!locals.user?.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await findUsers();

    return json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return json({
      error: error instanceof Error ? error.message : 'Failed to fetch users'
    }, { status: 500 });
  }
}
