<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Chat, ChatConfig } from '$lib/server/db/schema';
  import { ChatMode } from '$lib/enums';

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

  async function handleSubmit() {
    try {
      if (!editingChat) {
        error = 'No chat selected for editing';
        return;
      }

      // Create a copy of the form data to send
      const { createdAt, updatedAt, ...dataToSend } = formData;
      console.log('Sending form data:', JSON.stringify(dataToSend, null, 2));

      const response = await fetch(`/api/chats/${editingChat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingChat.id,
          ...dataToSend
        })
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

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
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
          <small>The mode determines how this chat is used in the system</small>
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
          <small>System instructions that guide the LLM's behavior</small>
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
            <th>Actions</th>
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
              <td class="actions">
                <button
                  class="view-button"
                  onclick={() => viewChat(chat.id)}
                  title="View chat"
                >
                  View
                </button>
                <button
                  class="edit-button"
                  onclick={() => editChat(chat)}
                  title="Edit chat"
                >
                  Edit
                </button>
                <button
                  class="delete-button"
                  onclick={(e) => deleteChat(chat.id, e)}
                  disabled={isDeletingChat === chat.id}
                  title="Delete chat"
                >
                  {isDeletingChat === chat.id ? 'Deleting...' : 'Delete'}
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

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .view-button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
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

  .delete-button {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .view-button:hover {
    background-color: #388e3c;
  }

  .edit-button:hover {
    background-color: #1976d2;
  }

  .delete-button:hover:not(:disabled) {
    background-color: #d32f2f;
  }

  .delete-button:disabled {
    background-color: #ffcdd2;
    cursor: not-allowed;
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
