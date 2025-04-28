<script lang="ts">
  import { onMount } from 'svelte';
  import type { User } from '$lib/server/db/schema';

  // State
  let users = $state<User[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let editingUser = $state<User | null>(null);
  let showEditForm = $state(false);

  // Form state
  let formData = $state<Partial<User>>({
    username: '',
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
      username: '',
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
      username: user.username,
      isAdmin: user.isAdmin || false
    };
    showEditForm = true;
  }

  async function handleSubmit() {
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

  async function toggleAdminStatus(user: User) {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isAdmin: !user.isAdmin
        })
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchUsers();

    } catch (err) {
      console.error('Error toggling admin status:', err);
      error = err instanceof Error ? err.message : 'Failed to update user';
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

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            bind:value={formData.username}
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
    <div class="users-list">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Admin</th>
            <th>Last Updated</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user}
            <tr>
              <td>{user.username}</td>
              <td>{user.isAdmin ? '✓' : ''}</td>
              <td>{user.updatedAt ? formatDate(user.updatedAt) : '-'}</td>
              <td class="actions">
                <button
                  class="edit-button"
                  onclick={() => editUser(user)}
                  title="Edit user"
                >
                  Edit
                </button>
                <button
                  class={user.isAdmin ? 'admin-button active' : 'admin-button'}
                  onclick={() => toggleAdminStatus(user)}
                  title={user.isAdmin ? 'Remove admin privileges' : 'Grant admin privileges'}
                >
                  {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
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

  .users-list {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    background-color: white;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 500;
    color: #333;
  }

  tr:hover {
    background-color: #f9f9f9;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-button {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .admin-button {
    background-color: #9e9e9e;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .admin-button.active {
    background-color: #f44336;
  }

  .edit-button:hover {
    background-color: #1976d2;
  }

  .admin-button:hover {
    background-color: #757575;
  }

  .admin-button.active:hover {
    background-color: #d32f2f;
  }

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
