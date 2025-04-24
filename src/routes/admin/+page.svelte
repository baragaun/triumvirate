<script lang="ts">

  // Get the user data from the page store
  let { data } = $props<{ data: { user: any } }>();
  const user = data.user;
</script>

<div class="admin-debug">
  <h1>Admin Dashboard</h1>

  <div class="debug-info">
    <h2>User Information</h2>
    <pre>{JSON.stringify(user, null, 2)}</pre>

    <h2>Page Data</h2>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>

  <div class="admin-links">
    <h2>Admin Pages</h2>
    <ul>
      <li><a href="/admin/chat-configs">Manage Chat Configurations</a></li>
    </ul>
  </div>
</div>

<style>
  .admin-debug {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .debug-info {
    background-color: white;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  pre {
    white-space: pre-wrap;
    word-break: break-all;
    background-color: #f8f8f8;
    padding: 1rem;
    border-radius: 4px;
    overflow: auto;
  }

  .admin-links ul {
    list-style: none;
    padding: 0;
  }

  .admin-links li {
    margin-bottom: 0.5rem;
  }

  .admin-links a {
    display: block;
    padding: 0.75rem 1rem;
    background-color: white;
    color: #1976d2;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    transition: background-color 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .admin-links a:hover {
    background-color: #bbdefb;
  }
</style>
