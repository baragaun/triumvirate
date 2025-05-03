<script lang="ts">
  import { page } from '$app/state';
  import { browser } from '$app/environment';

  let { isAdmin } = $props<{ isAdmin: boolean }>();

  const userRoutes = [
    { path: '/chats', label: 'My Chats' },
    { path: '/admin/chats', label: 'All Chats' },
    { path: '/admin/chat-configs', label: 'Chat Configurations' },
  ];

  const adminRoutes = [
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/llms', label: 'LLM Models' },
  ];

  function isActive(path: string): boolean {
    if (!browser) return false; // Skip during SSR

    const currentPath = page.url.pathname;

    // Exact match
    if (currentPath === path) return true;

    // For admin routes, check if we're in a specific admin section
    if (path.startsWith('/admin/') && currentPath.startsWith(path + '/')) return true;

    // For the chats route, match individual chat pages
    return path === '/chats' && currentPath.startsWith('/chats/');
  }
</script>

<div class="app-sidebar">
  <nav class="app-nav">
    <ul class="main-nav-list">
      {#each userRoutes as route}
        <li class:active={isActive(route.path)}>
          <a href={route.path}>
            <span class="menu-label">{route.label}</span>
          </a>
        </li>
      {/each}

      {#if isAdmin}
        <li class="section-header">Admin</li>
        {#each adminRoutes as route}
          <li class:active={isActive(route.path)}>
            <a href={route.path}>
              <span class="menu-label">{route.label}</span>
            </a>
          </li>
        {/each}
      {/if}
    </ul>
  </nav>

  <div class="logout-container">
    <form method="POST" action="/logout">
      <button type="submit" class="logout-button">Log Out</button>
    </form>
  </div>
</div>


<style>
  .app-sidebar {
    width: 260px;
    background-color: #f5f5f5;
    border-right: 1px solid #e0e0e0;
    padding: 1rem 0 0 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .app-nav {
    flex: 1;
    overflow-y: auto;
  }

  .main-nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .app-nav li {
    margin: 0;
  }

  .app-nav a, .logout-button {
    display: block;
    padding: 0.75rem 1.5rem;
    color: #333;
    text-decoration: none;
    transition: background-color 0.2s;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
  }

  .app-nav a:hover, .logout-button:hover {
    background-color: #e0e0e0;
  }

  /* Style for active menu items - more prominent styling */
  .app-nav li.active a {
    background-color: #cae0fe !important;
    /*color: white !important;*/
    font-weight: 500 !important;
    border-left: 10px solid #2a6fc9 !important;
    padding-left: calc(1.5rem - 5px) !important;
  }

  /* Make sure hover doesn't override active state */
  .app-nav li.active a:hover {
    background-color: #3a80d2 !important;
    color: white !important;
  }

  /* Menu label */
  .menu-label {
    display: inline-block;
    white-space: nowrap;
  }

  /* Ensure vertical alignment of menu items */
  .app-nav a {
    display: flex;
    align-items: center;
  }

  .section-header {
    padding: 0.75rem 1.5rem 0.25rem;
    margin-top: 0.5rem;
    border-top: 1px solid #e0e0e0;
    font-size: 0.8rem;
    color: #757575;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
  }

  .logout-container {
    border-top: 1px solid #e0e0e0;
    margin-top: auto;
    width: 100%;
  }

  .logout-button {
    color: #757575;
    font-weight: 500;
    width: 100%;
  }
</style>
