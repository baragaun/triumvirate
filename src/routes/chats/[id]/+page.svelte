<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import ChatInterface from '$lib/components/ChatInterface.svelte';
  import type { GetChatResponse } from '$lib/types'
  import { goto } from '$app/navigation'

  // Props from the server
  let { data } = $props<{ data: GetChatResponse }>();

  // State
  let isLoading = $state(true);

  onMount(async () => {
    console.log('Chat page mounted, chat ID:', page.params.id);

    if (!data.chat) {
      await goto('/');
      return;
    }

    console.log('Chat data:', data.chat);
    console.log(`Loaded ${data.chatMessages?.length || 0} messages`);

    // Set isLoading to false after a short delay to ensure the page has rendered
    setTimeout(() => {
      isLoading = false;
    }, 100);
  });
</script>

<div class="container">
  <header>
    <h1>Micromentor Entrepreneur Assistant</h1>
  </header>

  <main>
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    {:else}
      <ChatInterface
        chat={data.chat}
        llmContext={data.llmContext}
        initialMessages={data.chatMessages || []}
      />
    {/if}
  </main>

  <footer>
    <p>Built with Svelte 5</p>
  </footer>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  header {
    text-align: center;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #2196f3;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 70vh;
  }

  footer {
    text-align: center;
    margin-top: 2rem;
    padding: 1rem 0;
    color: #666;
    font-size: 0.875rem;
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
</style>
