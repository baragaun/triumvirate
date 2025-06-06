import { json, type RequestEvent } from '@sveltejs/kit'
import operations from '$lib/server/operations';

// This endpoint makes a user an admin
// It should only be accessible in development mode
export async function GET({ url }: RequestEvent) {
  // Get the id from the query string
  const userId = url.searchParams.get('id');

  if (!userId) {
    return json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    // Find the user
    const user = await operations.user.findOne(userId);

    if (!user) {
      return json({ error: `User '${userId}' not found` }, { status: 404 });
    }

    // Update the user to be an admin
    const result = await operations.user.update({
      id: user.id,
      isAdmin: true
    });

    if (result.error) {
      return json({ error: result.error }, { status: 500 });
    }

    return json({
      message: `User '${userId}' is now an admin`,
      user: result.object
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
