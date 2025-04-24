<script lang="ts">
  import { browser } from '$app/environment';

  let { children } = $props<{ children: any }>();

  const adminRoutes = [
    { path: '/admin/chat-configs', label: 'Chat Configurations' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/llms', label: 'LLM Models' },
    // Add more admin routes here as needed
  ];

  function isActive(path: string): boolean {
    if (!browser) return false; // Skip during SSR
    return window.location.pathname === path;
  }
</script>

<div class="admin-layout">
  <div class="admin-sidebar">
    <div class="admin-sidebar-header">
      <h2>Admin Panel</h2>
    </div>
    <nav class="admin-nav">
      <ul>
        {#each adminRoutes as route}
          <li class:active={isActive(route.path)}>
            <a href={route.path}>{route.label}</a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
  <div class="admin-content">
    {@render children()}
  </div>
</div>

<style>
  .admin-layout {
    display: flex;
    min-height: calc(100vh - 7rem); /* Account for header and footer */
  }

  .admin-sidebar {
    width: 250px;
    background-color: #f5f5f5;
    border-right: 1px solid #e0e0e0;
    padding: 1rem 0;
  }

  .admin-sidebar-header {
    padding: 0 1.5rem 1rem;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 1rem;
  }

  .admin-sidebar-header h2 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
  }

  .admin-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .admin-nav li {
    margin: 0;
  }

  .admin-nav a {
    display: block;
    padding: 0.75rem 1.5rem;
    color: #333;
    text-decoration: none;
    transition: background-color 0.2s;
  }

  .admin-nav a:hover {
    background-color: #e0e0e0;
  }

  .admin-nav li.active a {
    background-color: #e3f2fd;
    color: #1976d2;
    font-weight: 500;
    border-left: 3px solid #1976d2;
  }

  .admin-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    height: calc(100vh - 7rem); /* Account for header and footer */
    background-color: #f5f5f5; /* Match the sidebar color */
  }
</style>
