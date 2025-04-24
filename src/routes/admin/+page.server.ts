export const load = async ({ locals }: { locals: { user?: { id: string, username: string, isAdmin: boolean } } }) => {
  // Return the user data for debugging
  return {
    user: locals.user
  };
};
