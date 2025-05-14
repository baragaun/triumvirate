import { json, type RequestEvent } from '@sveltejs/kit'
import { findUser } from '$lib/server/user/findUser';
import { updateUser } from '$lib/server/user/updateUser';
import operations from '$lib/server/operations';

// Delete a user
export async function DELETE({ params }: RequestEvent) {
  try {
    const id = params.id;

    if (!id) {
      return json({
        error: 'User ID is required'
      }, { status: 400 });
    }

    await operations.user.delete(id);

    return json({});
  } catch (error) {
    console.error('Error deleting user:', error);

    return json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update a user
export async function PUT({ request, params, locals }: RequestEvent) {
  // Check if the user is logged in and is an admin
  if (!locals.user?.isAdmin) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = params.id;
    const changes = await request.json();

    if (!userId) {
      return json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate the user exists
    const existingUser = await findUser(userId);

    if (!existingUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user
    const result = await updateUser({
      id: userId,
      ...changes,
      updatedAt: new Date()
    });

    if (result.error) {
      return json({ error: result.error }, { status: 500 });
    }

    return json({ user: result.object });
  } catch (error) {
    console.error('Error updating user:', error);
    return json({
      error: error instanceof Error ? error.message : 'Failed to update user'
    }, { status: 500 });
  }
}
