<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Chat, ChatConfig } from '$lib/server/db/schema';
  import { ChatMode } from '$lib/enums';
  import { encryptString } from '$lib/helpers/encryptString';
  import '$lib/styles/actionButtons.css';

  // State
  let chats = $state<Chat[]>([]);
  let chatConfigs = $state<ChatConfig[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let editingChat = $state<Chat | null>(null);
  let showEditForm = $state(false);
  let isDeletingChat = $state<string | null>(null);

  // Form state
  let formData = $state<Partial<Chat>>({
    title: '',
    caption: '',
    mode: ChatMode.experiment,
    configId: '',
    llmId: '',
    llmInstructions: '',
    llmTemperature: 0.7,
    llmMaxTokens: 1000
  });

  onMount(async () => {
    try {
      await fetchChats();
      await fetchChatConfigs();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  });

  async function fetchChats() {
    try {
      const response = await fetch('/api/admin/chats');
      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      chats = data.chats || [];
    } catch (err) {
      console.error('Error fetching chats:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch chats';
    }
  }

  async function fetchChatConfigs() {
    try {
      const response = await fetch('/api/chat-configs');
      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      chatConfigs = data.chatConfigs || [];
    } catch (err) {
      console.error('Error fetching chat configs:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch chat configurations';
    }
  }

  function hideForm() {
    showEditForm = false;
    editingChat = null;
  }

  function editChat(chat: Chat) {
    editingChat = chat;
    formData = {
      title: chat.title || '',
      caption: chat.caption || '',
      mode: chat.mode || ChatMode.experiment,
      configId: chat.configId || '',
      llmId: chat.llmId || '',
      llmInstructions: chat.llmInstructions || '',
      llmTemperature: chat.llmTemperature || 0.7,
      llmMaxTokens: chat.llmMaxTokens || 1000
    };
    showEditForm = true;
  }

  async function onSubmit() {
    try {
      if (!editingChat) {
        error = 'No chat selected for editing';
        return;
      }

      const changes: Partial<Chat> = {
        id: editingChat.id,
        caption: formData.caption,
        title: formData.title,
        mode: formData.mode,
        userId: formData.userId,
        username: formData.username,
        llmId: formData.llmId,
        configId: formData.configId,
        welcomeMessage: formData.welcomeMessage,
        llmInstructions: formData.llmInstructions
          // Sending the raw instructions can trigger a security alarm. CloudFlare rejects
          // the request. This prevents security concerns
          ? await encryptString(formData.llmInstructions)
          : null,
        llmTemperature: formData.llmTemperature,
        llmMaxTokens: formData.llmMaxTokens,
        inputTokens: formData.inputTokens,
        outputTokens: formData.outputTokens,
        cost: formData.cost,
        metadata: formData.metadata,
        feedback: formData.feedback,
        rating: formData.rating,
        endedAt: formData.endedAt,
      };

      const response = await fetch(`/api/chats/${editingChat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchChats();

      // Hide the form
      hideForm();

      // Show success message
      error = null;
    } catch (err) {
      console.error('Error updating chat:', err);
      error = err instanceof Error ? err.message : 'Failed to update chat';
    }
  }

  async function deleteChat(chatId: string, event: Event) {
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
  }

  function viewChat(chatId: string) {
    goto(`/chats/${chatId}`);
  }

  function formatDate(dateString: string | Date) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function formatCost(cost: number) {
    return `$${cost.toFixed(6)}`;
  }

  function getChatConfigName(configId: string | null) {
    if (!configId) return '-';
    const config = chatConfigs.find(c => c.id === configId);
    return config ? (config.caption || config.id) : configId;
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
      <p>Loading chats...</p>
    </div>
  {:else if showEditForm}
    <div class="form-container">
      <h2>Edit Chat</h2>

      <form onsubmit={onSubmit}>
        <div class="form-group">
          <label for="chat-id">Chat ID</label>
          <input
            type="text"
            id="chat-id"
            value={editingChat?.id || ''}
            disabled
          />
        </div>

        <div class="form-group">
          <label for="title">Title</label>
          <input
            type="text"
            id="title"
            bind:value={formData.title}
            placeholder="Chat title"
          />
        </div>

        <div class="form-group">
          <label for="caption">Caption</label>
          <input
            type="text"
            id="caption"
            bind:value={formData.caption}
            placeholder="Chat caption"
          />
        </div>

        <div class="form-group">
          <label for="mode">Mode</label>
          <select id="mode" bind:value={formData.mode}>
            <option value={ChatMode.experiment}>Experiment</option>
            <option value={ChatMode.tuning}>Tuning</option>
          </select>
          <small>The mode determines how this chat is used in the platform</small>
        </div>

        <div class="form-group">
          <label for="config-id">Chat Configuration</label>
          <select id="config-id" bind:value={formData.configId}>
            <option value="">None</option>
            {#each chatConfigs as config}
              <option value={config.id}>{config.caption || config.id}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="llm-temperature">Temperature</label>
          <input
            type="number"
            id="llm-temperature"
            bind:value={formData.llmTemperature}
            min="0"
            max="1"
            step="0.1"
          />
          <small>Controls randomness: 0 is deterministic, 1 is very creative</small>
        </div>

        <div class="form-group">
          <label for="llm-max-tokens">Max Tokens</label>
          <input
            type="number"
            id="llm-max-tokens"
            bind:value={formData.llmMaxTokens}
            min="100"
            step="100"
          />
          <small>Maximum number of tokens in the response</small>
        </div>

        <div class="form-group">
          <label for="llm-instructions">Instructions</label>
          <textarea
            id="llm-instructions"
            bind:value={formData.llmInstructions}
            rows="6"
            placeholder="Instructions for the LLM on how to respond"
            oninput={(e) => {
              // Ensure the value is properly updated in formData
              formData.llmInstructions = e.currentTarget.value;
            }}
          ></textarea>
          <small>Platform instructions that guide the LLM's behavior</small>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-button" onclick={hideForm}>Cancel</button>
          <button type="submit" class="submit-button">Update Chat</button>
        </div>
      </form>
    </div>
  {:else if chats.length === 0}
    <div class="empty-state">
      <p>No chats found.</p>
    </div>
  {:else}
    <div class="chats-list">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>User</th>
            <th>Config</th>
            <th>Mode</th>
            <th>Cost</th>
            <th>Updated</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {#each chats as chat}
            <tr>
              <td>{chat.title || 'Untitled'}</td>
              <td>{chat.username || '-'}</td>
              <td>{getChatConfigName(chat.configId)}</td>
              <td>{chat.mode}</td>
              <td>{formatCost(chat.cost || 0)}</td>
              <td>{formatDate(chat.updatedAt)}</td>
              <td class="action-buttons">
                <button
                  class="action-button view-button"
                  onclick={() => viewChat(chat.id)}
                  title="View chat"
                  aria-label="View chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button
                  class="action-button edit-button"
                  onclick={() => editChat(chat)}
                  title="Edit chat"
                  aria-label="Edit chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  class="action-button delete-button"
                  onclick={(e) => deleteChat(chat.id, e)}
                  disabled={isDeletingChat === chat.id}
                  title="Delete chat"
                  aria-label="Delete chat"
                >
                  {#if isDeletingChat === chat.id}
                    <div class="button-spinner"></div>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  {/if}
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

  .chats-list {
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

  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }

  .form-group input[disabled] {
    background-color: #f5f5f5;
    cursor: not-allowed;
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
