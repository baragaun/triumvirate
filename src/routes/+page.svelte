<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { ChatInfo } from '$lib/types'
  import type { Chat, ChatConfig } from '$lib/server/db/schema'

  // State
  let userName = $state('');
  let selectedChatConfig = $state<ChatConfig | null>(null);
  let selectedChatConfigId = $state<string>('default');
  let chatConfigs = $state<ChatConfig[]>([]);
  let isLoading = $state(true);
  let showConfigSection = $state(false);
  let error = $state<string | null>(null);

  async function fetchChatConfigs() {
    try {
      const response = await fetch('/api/chat-configs');
      const responseData = await response.json();

      if (!responseData.error && responseData.chatConfigs && responseData.chatConfigs.length > 0) {
        chatConfigs = responseData.chatConfigs;
        selectedChatConfigId = responseData.selectedChatConfigId;
        if (responseData.selectedChatConfigId) {
          selectedChatConfig = chatConfigs.find(config => config.id === responseData.selectedChatConfigId) || null;
        }
        showConfigSection = chatConfigs.length > 1;
      }
    } catch (error) {
      console.error('Error fetching chatConfigs:', error);
    }
  }

  async function createChat(): Promise<void> {
    // Clear any previous error
    error = null;
    if (!selectedChatConfig) {
      console.error('No chat config selected');
      error = 'No chat config selected';
      return;
    }

    isLoading = true;
    try {
      const chatProps: Partial<Chat> = {
        userName: userName,
        llmId: selectedChatConfig.llmId || undefined,
        configId: selectedChatConfig.id || undefined,
        llmTemperature: selectedChatConfig.llmTemperature || 0.7,
        llmMaxTokens: selectedChatConfig.llmMaxTokens || 1000,
      };

      // Send the request to the API
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatProps)
      });

      const data: ChatInfo = await response.json();

      // Save the chat ID if it's returned
      if (!data.chat) {
        error = data.error || 'Failed to create chat';
        return;
      }

      // Navigate to the chat page
      console.log('Navigating to chat page:', `/chats/${data.chat.id}`);
      await goto(`/chats/${data.chat.id}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error sending message:', err);
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    await fetchChatConfigs();
    isLoading = false;
  });
</script>

<div class="container">
  <header>
    <h1>Micromentor Assistant</h1>
    <p>Thank you for helping Micromentor to test our new Assistant</p>
  </header>

  <main>
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading models and chat configs...</p>
      </div>
    {:else}
      <div class="config-container">
        <div class="instructions">
          In this session, we are trying to understand your situation and
          get prepared to get connected to a mentor
        </div>

        <div class="form-group">
          <label for="userName">What is your name?</label>
          <input
            type="text"
            id="userName"
            bind:value={userName}
            placeholder="Enter your name"
            required
          />
        </div>

        {#if showConfigSection}
          <div class="form-group">
            <label for="llmselect">Select Config</label>
            <select id="llmselect" bind:value={selectedChatConfigId}>
              {#if chatConfigs.length === 0}
                <option value="">No configurations available</option>
              {:else}
                {#each chatConfigs as config (config.id)}
                  <option value={config.id}>{config.id})</option>
                {/each}
              {/if}
            </select>
          </div>
        {/if}

        {#if error}
          <div class="error-message">
            <p>{error}</p>
          </div>
        {/if}

        <button
          class="start-button"
          onclick={createChat}
          disabled={!userName.trim() || !selectedChatConfig}
        >
          Start Chat
        </button>
      </div>
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

  .instructions {
    margin-bottom: 2rem;
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

  .config-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }

  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }

  input:focus, select:focus {
    border-color: #2196f3;
    outline: none;
  }

  .start-button {
    width: 100%;
    padding: 0.75rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .start-button:hover:not(:disabled) {
    background-color: #1976d2;
  }

  .start-button:disabled {
    background-color: #bdbdbd;
    cursor: not-allowed;
  }

  .error-message {
    background-color: #ffebee;
    border-radius: 4px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border-left: 4px solid #f44336;
  }

  .error-message p {
    color: #d32f2f;
    margin: 0;
    font-size: 0.9rem;
  }
</style>
