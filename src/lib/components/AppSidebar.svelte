<script lang="ts">
  import { browser } from '$app/environment'

  let { isAdmin } = $props<{ isAdmin: boolean }>();

  // Get the current path from the page store
  let currentPath = $derived(browser ? window.location.pathname : '');

  // Update currentPath when the component is mounted and when navigation occurs
  $effect(() => {
    if (browser) {
      currentPath = window.location.pathname;
      console.log('Current path updated:', currentPath);
    }
  });

  const userRoutes = [
    { path: '/chats', label: 'My Chats', active: false },
  ];

  const adminRoutes = [
    { path: '/admin/chats', label: 'Chats', active: false },
    { path: '/admin/chat-configs', label: 'Chat Configurations', active: false },
    { path: '/admin/users', label: 'Users', active: false },
    { path: '/admin/llms', label: 'LLM Models', active: false },
  ];

  // Update the active state of routes when currentPath changes
  $effect(() => {
    if (!browser) return;

    // Update user routes
    userRoutes.forEach(route => {
      route.active = isActive(route.path);
    });

    // Update admin routes
    adminRoutes.forEach(route => {
      route.active = isActive(route.path);
    });
  });

  function isActive(path: string): boolean {
    if (!browser) return false // Skip during SSR

    const currentPath = window.location.pathname
    console.log(`Checking if ${path} is active. Current path: ${currentPath}`)

    // Exact match
    if (currentPath === path) {
      console.log(`Exact match for ${path}`)
      return true
    }

    // For admin routes, check if we're in a specific admin section
    if (path.startsWith('/admin/') && currentPath.startsWith(path)) {
      // This handles cases like /admin/chats/123 matching /admin/chats
      console.log(`Admin section match for ${path}`)
      return true
    }

    // For the chats route, only match exactly or individual chat pages
    if (path === '/chats' && currentPath.startsWith('/chats/')) {
      console.log(`Chats section match for ${path}`)
      return true
    }

    return false
  }
</script>

<div class="app-sidebar">
  <nav class="app-nav">
    <ul class="main-nav-list">
      {#each userRoutes as route}
        <li class:active={route.active}>
          <a href={route.path}>
            {route.label}
            {#if route.active}<span class="active-indicator">•</span>{/if}
          </a>
        </li>
      {/each}

      {#if isAdmin}
        <li class="section-header">Admin</li>
        {#each adminRoutes as route}
          <li class:active={route.active}>
            <a href={route.path}>
              {route.label}
              {#if route.active}<span class="active-indicator">•</span>{/if}
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
    width: 250px;
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
    background-color: #1976d2 !important;
    color: white !important;
    font-weight: 500 !important;
    border-left: 5px solid #0d47a1 !important;
    padding-left: calc(1.5rem - 5px) !important;
  }

  /* Make sure hover doesn't override active state */
  .app-nav li.active a:hover {
    background-color: #1565c0 !important;
    color: white !important;
  }

  /* Active indicator dot */
  .active-indicator {
    margin-left: 5px;
    font-size: 2rem;
    display: inline-block;
    vertical-align: middle;
  }

  .section-header {
    padding: 0.75rem 1.5rem 0.25rem;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #757575;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
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
