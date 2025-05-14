<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  // State
  let isLoading = $state(false);

  onMount(() => {
    const trackId = page.url.searchParams.get('t')
    if (trackId) {
      goto(`/start/default?t=${trackId}`);
    } else {
      goto('/start/default');
    }
  });
</script>

<div class="landing-page">
<div class="container">
  <main>
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading assistant...</p>
      </div>
    {/if}
  </main>
</div>
</div>

<style>
  .landing-page {
    min-height: 100vh;
    width: 100%;
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    z-index: 1;
  }

  /* h2 styles removed */

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
