<script lang="ts">
  import { onMount } from 'svelte';
  import type { User } from '$lib/server/db/schema';
  import '$lib/styles/actionButtons.css';

  // State
  let users = $state<User[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let editingUser = $state<User | null>(null);
  let showEditForm = $state(false);

  // Form state
  let formData = $state<Partial<User>>({
    name: '',
    email: '',
    isAdmin: false
  });

  onMount(async () => {
    try {
      await fetchUsers();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  });

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      users = data.users || [];
    } catch (err) {
      console.error('Error fetching users:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch users';
    }
  }

  function resetForm() {
    formData = {
      name: '',
      email: '',
      isAdmin: false
    };
    editingUser = null;
  }

  function hideForm() {
    showEditForm = false;
    editingUser = null;
  }

  function editUser(user: User) {
    editingUser = user;
    formData = {
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false
    };
    showEditForm = true;
  }

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    try {
      if (!editingUser) {
        error = 'No user selected for editing';
        return;
      }

      // Create a copy of the form data to send
      const dataToSend = { ...formData };
      console.log('Sending form data:', JSON.stringify(dataToSend, null, 2));

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchUsers();

      // Hide the form
      hideForm();

      // Show success message
      error = null;
    } catch (err) {
      console.error('Error updating user:', err);
      error = err instanceof Error ? err.message : 'Failed to update user';
    }
  }

  async function onDeleteUser(userId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchUsers();

    } catch (err) {
      console.error('Error deleting this user:', err);
      error = err instanceof Error ? err.message : 'Failed to delete this user';
    }
  }

  function formatDate(dateString: string | Date) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
</script>

<div class="admin-container">

  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button onclick={() => error = null}>Dismiss</button>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>
  {:else if showEditForm}
    <div class="form-container">
      <h2>Edit User</h2>

      <form onsubmit={onSubmit}>
        <div class="form-group">
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            bind:value={formData.name}
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="text"
            id="email"
            bind:value={formData.email}
            required
          />
        </div>

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" bind:checked={formData.isAdmin} />
            Admin privileges
          </label>
          <small>If checked, this user will have access to the admin interface</small>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-button" onclick={hideForm}>Cancel</button>
          <button type="submit" class="submit-button">Update User</button>
        </div>
      </form>
    </div>
  {:else if users.length === 0}
    <div class="empty-state">
      <p>No users found.</p>
    </div>
  {:else}
    <div class="scrollable-table">
      <table class="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Last Updated</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.isAdmin ? '✓' : ''}</td>
              <td>{user.updatedAt ? formatDate(user.updatedAt) : '-'}</td>
              <td class="action-buttons">
                <button
                  class="action-button edit-button"
                  onclick={() => editUser(user)}
                  title="Edit user"
                  aria-label="Edit user"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  class={`action-button delete-button}`}
                  onclick={() => onDeleteUser(user.id)}
                  title={user.isAdmin ? 'Remove admin privileges' : 'Grant admin privileges'}
                  aria-label={user.isAdmin ? 'Remove admin privileges' : 'Grant admin privileges'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .admin-container {
    width: 100%;
    padding: 0;
  }

  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .error-message button {
    background: none;
    border: none;
    color: #c62828;
    cursor: pointer;
    font-weight: 500;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  /* Simplified scrollable table */
  .scrollable-table {
    width: 100%;
    max-height: 85vh;
    overflow: auto;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  .users-table {
    width: 100%;
    min-width: 700px; /* Ensures table doesn't shrink too much */
    border-collapse: collapse;
    background-color: white;
  }

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    white-space: nowrap;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 500;
    color: #333;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  tr:hover {
    background-color: #f9f9f9;
  }

  /* Action button styles are imported from actionButtons.css */

  .form-container {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    max-height: calc(100vh - 12rem);
    overflow-y: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-container h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #333;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  .form-group.checkbox label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
  }

  .form-group input[type="text"] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }

  .form-group input[type="checkbox"] {
    margin: 0;
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.8rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    position: sticky;
    bottom: 0;
    background-color: white;
    padding: 1rem 0;
    border-top: 1px solid #e0e0e0;
    z-index: 10;
  }

  .cancel-button {
    background-color: #e0e0e0;
    color: #333;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .submit-button {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }

  .cancel-button:hover {
    background-color: #bdbdbd;
  }

  .submit-button:hover {
    background-color: #1976d2;
  }
</style>
