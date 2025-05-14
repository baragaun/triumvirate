<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { ChatCreationRequestData, ChatInfo } from '$lib/types'
  import type { Chat, ChatConfig } from '$lib/server/db/schema';
  import { ChatMode } from '$lib/enums';
  import { encryptString } from '$lib/helpers/encryptString'
  import NewChatForm from '$lib/components/chats/NewChatForm.svelte'

  let { data } = $props<{ data: PageData }>();

  // Get user data
  const user = data.user;
  const guestUserName = data.guestUserName;

  // Get the user's name (either a signed-in user or guest)
  const getUserName = (): string => {
    if (user?.username) {
      return user.username;
    } else if (guestUserName) {
      return guestUserName;
    } else {
      return 'Guest';
    }
  };

  let chats = $state<Chat[]>([]);
  let chatConfigs = $state<ChatConfig[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let showNewChatForm = $state(false);
  let isDeletingChat = $state<string | null>(null); // Tracks which chat is being deleted

  onMount(async () => {
    try {
      console.log('/chats mounted', { user });
      await fetchChatConfigs();
      if (user?.id) {
        await fetchChats();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  });

  async function fetchChatConfigs() {
    try {
      const response = await fetch('/api/chat-configs');
      const responseData = await response.json();

      if (!responseData.error && responseData.chatConfigs && responseData.chatConfigs.length > 0) {
        chatConfigs = responseData.chatConfigs;
      }
    } catch (error) {
      console.error('Error fetching chatConfigs:', error);
    }
  }

  async function fetchChats() {
    try {
      const response = await fetch('/api/chats');
      const responseData = await response.json();

      if (!responseData.error && responseData.chats && responseData.chats.length > 0) {
        chats = responseData.chats;
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }

  const toggleNewChatForm = () => {
    showNewChatForm = !showNewChatForm;
  };

  const deleteChat = async (chatId: string, event: Event): Promise<void> => {
    // Prevent the click from navigating to the chat page
    event.preventDefault();
    event.stopPropagation();

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      isDeletingChat = chatId;

      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = await response.json();

      if (responseData.error) {
        error = responseData.error;
        return;
      }

      // Remove the deleted chat from the list
      chats = chats.filter(chat => chat.id !== chatId);

    } catch (err) {
      console.error('Error deleting chat:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isDeletingChat = null;
    }
  };

  const onCreateChat = async (title: string, configId: string): Promise<void> => {
    // Clear any previous error
    error = null;

    const selectedChatConfig = chatConfigs.find(config => config.id === configId);

    if (!selectedChatConfig) {
      console.error('Selected chat config not found');
      error = 'Selected chat configuration not found';
      return;
    }

    const requestData: ChatCreationRequestData = {
      props: {
        username: user?.username || getUserName(),
        title: title || undefined,
        caption: selectedChatConfig.caption || undefined,
        mode: ChatMode.tuning,
        welcomeMessage: selectedChatConfig.welcomeMessage || undefined,
        configId: selectedChatConfig.id || undefined,
        llmId: selectedChatConfig.llmId || undefined,
        llmTemperature: selectedChatConfig.llmTemperature || 0.7,
        llmInstructions: selectedChatConfig.llmInstructions
          // Sending the raw instructions can trigger a security alarm. CloudFlare rejects
          // the request. This prevents security concerns
          ? await encryptString(selectedChatConfig.llmInstructions)
          : null,
        llmMaxTokens: selectedChatConfig.llmMaxTokens || 1000,
        // Note: The server will use the logged-in user's ID from the session if available
      },
      user,
    };

    isLoading = true;
    try {
      // Send the request to the API
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data: ChatInfo = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      if (!data.chat) {
        error = data.error || 'Failed to create chat';
        return;
      }

      console.log('Navigating to chat page:', `/chats/${data.chat.id}`);
      // Hide the form
      showNewChatForm = false;
      await goto(`/chats/${data.chat.id}`);
    } catch (err) {
      console.error('Error creating chat:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  };
</script>

<div class="chats-container">
    {#if isLoading}
      <div class="loading-state">
        <p>Loading your chats...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <p>Error: {error}</p>
      </div>
    {:else if chats.length === 0}
      <div class="empty-state">
        <p>You don't have any chats yet. Start a new chat to begin!</p>
      </div>
    {:else}
      <div class="chats-list">
        {#each chats as chat (chat.id)}
          <div class="chat-card-container">
            <a href="/chats/{chat.id}" class="chat-card">
              <div class="chat-info">
                <h2 class="chat-title">{chat.title || 'Untitled Chat'}</h2>
                <div class="chat-details">
                  <p class="chat-date">{new Date(chat.createdAt).toLocaleDateString()}</p>
                  {#if chat.configId}
                    <p class="chat-config">Config: {chat.configId}</p>
                  {/if}
                </div>
              </div>
              <div class="chat-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </div>
            </a>
            <button
              class="delete-button"
              onclick={(e) => deleteChat(chat.id, e)}
              disabled={isDeletingChat === chat.id}
              aria-label="Delete chat"
            >
              {#if isDeletingChat === chat.id}
                <div class="spinner"></div>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {/if}
</div>

<div class="new-chat-section">
  {#if !showNewChatForm}
    <button class="new-chat-button" onclick={toggleNewChatForm}>
      +
    </button>
  {:else}
    <NewChatForm
      chatConfigs={chatConfigs}
      onSubmit={onCreateChat}
      onCancel={toggleNewChatForm}
    />
  {/if}
</div>

<style>
  .chats-container {
    width: 100%;
    height: 100%;
    padding: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .new-chat-section {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    z-index: 10;
  }

  .new-chat-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 1.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    padding: 0;
  }

  .new-chat-button:hover {
    background-color: #1976d2;
  }

  .loading-state,
  .error-state,
  .empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    color: #666;
  }

  .error-state {
    color: #c62828;
  }

  .chats-list {
    display: flex;
    flex-direction: column;
    background-color: white;
    overflow-y: scroll;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: 100%;
  }

  .chat-card-container {
    position: relative;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    background-color: white;
  }

  .chat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: .5rem .5rem;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.5s;
    flex: 1;
    background-color: white;
  }

  .chat-card:hover {
    background-color: #f5f5f5;
  }

  .delete-button {
    background: none;
    border: none;
    color: #bdbdbd;
    padding: 0.5rem;
    margin-right: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.5s;
    width: 46px;
    height: 46px;
  }

  .delete-button:hover {
    background-color: #ffebee;
    color: #e53935;
  }

  .delete-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top: 2px solid #e53935;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .chat-info {
    flex: 1;
  }

  .chat-title {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }

  .chat-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    margin-top: 0.25rem;
  }

  .chat-date {
    margin: 0;
    font-size: 0.8rem;
    color: #888;
  }

  .chat-config {
    margin: 0;
    font-size: 0.8rem;
    color: #666;
    background-color: #f0f4f8;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
  }

  .chat-arrow {
    color: #bdbdbd;
  }

  .chat-card:hover .chat-arrow {
    color: #2196f3;
  }
</style>
