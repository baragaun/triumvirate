import { json } from '@sveltejs/kit';
import operations from '$lib/server/operations';

// This endpoint makes a user an admin
// It should only be accessible in development mode
export async function GET({ url }) {
  // Get the username from the query string
  const username = url.searchParams.get('username');
  
  if (!username) {
    return json({ error: 'Username is required' }, { status: 400 });
  }
  
  try {
    // Find the user
    const user = await operations.user.findByUsername(username);
    
    if (!user) {
      return json({ error: `User '${username}' not found` }, { status: 404 });
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
      message: `User '${username}' is now an admin`,
      user: result.object
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
