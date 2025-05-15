<script lang="ts">
  import { onMount } from 'svelte';

  import type { ChatConfig, Llm } from '$lib/server/db/schema';
  import '$lib/styles/actionButtons.css';
  import ChatConfigForm from '$lib/components/admin/chatConfig/ChatConfigForm.svelte'

  // State
  let chatConfigs = $state<ChatConfig[]>([]);
  let llms = $state<Llm[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let editingConfig = $state<Partial<ChatConfig> | null>(null);
  let isDeleting = $state<string | null>(null);

  onMount(async () => {
    try {
      await fetchChatConfigs();
      await fetchLlms();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  });

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

  async function fetchLlms() {
    try {
      const response = await fetch('/api/llms');
      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      llms = data.llms || [];
    } catch (err) {
      console.error('Error fetching LLMs:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch LLM models';
    }
  }

  async function onNewChatConfig() {
    editingConfig = {};
  }

  async function hideForm() {
    editingConfig = null;
  }

  async function editConfig(config: ChatConfig) {
    editingConfig = config;
  }

  const onSubmit = async (changes: Partial<ChatConfig>) => {
    try {
      // console.log('Form data at submission:', changes);

      const url = changes.id && editingConfig
        ? `/api/chat-configs/${changes.id}`
        : '/api/chat-configs';

      const method = changes.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchChatConfigs();

      // Hide the form and clean up
      await hideForm();

      // Show success message
      error = null;
      success = changes.id ? 'Configuration updated successfully!' : 'Configuration created successfully!';

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        success = null;
      }, 3000);
    } catch (err) {
      console.error('Error saving chat config:', err);
      error = err instanceof Error ? err.message : 'Failed to save chat configuration';
    }
  };

  async function deleteConfig(id: string) {
    if (!confirm(`Are you sure you want to delete the configuration "${id}"? This action cannot be undone.`)) {
      return;
    }

    try {
      isDeleting = id;

      const response = await fetch(`/api/chat-configs/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.error) {
        error = data.error;
        return;
      }

      // Refresh the list
      await fetchChatConfigs();

      // Show success message
      error = null;
      success = 'Configuration deleted successfully!';

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        success = null;
      }, 3000);
    } catch (err) {
      console.error('Error deleting chat config:', err);
      error = err instanceof Error ? err.message : 'Failed to delete chat configuration';
    } finally {
      isDeleting = null;
    }
  }

  function formatDate(dateString: string | Date) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function getLlmName(llmId: string): string {
    const llm = llms.find(l => l.id === llmId);
    return llm ? `${llm.name} (${llm.provider})` : llmId;
  }

  async function duplicateConfig(config: ChatConfig) {
    editingConfig = { ...config, id: undefined, isDefault: false };
  }
</script>

<div class="admin-container">
  {#if error}
    <div class="error-message">
      <p>{error}</p>
      <button onclick={() => error = null}>Dismiss</button>
    </div>
  {/if}

  {#if success}
    <div class="success-message">
      <p>{success}</p>
      <button onclick={() => success = null}>Dismiss</button>
    </div>
  {/if}

  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading configurations...</p>
    </div>
  {:else if editingConfig}
    <ChatConfigForm
      chatConfig={editingConfig}
      llms={llms}
      onCancel={hideForm}
      onSubmit={onSubmit}
    />
  {:else if chatConfigs.length === 0}
    <div class="empty-state">
      <p>No chat configurations found.</p>
      <button onclick={onNewChatConfig}>Create your first chat configuration</button>
    </div>
  {:else}
    <div class="scrollable-table">
      <table class="configs-table">
        <thead>
        <tr>
          <th>Name</th>
          <th>LLM Model</th>
          <th>Default</th>
          <th>Last Updated</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        {#each chatConfigs as config}
          <tr>
            <td>{config.name}</td>
            <td>{getLlmName(config.llmId)}</td>
            <td>{config.isDefault ? '✓' : ''}</td>
            <td>{formatDate(config.updatedAt)}</td>
            <td class="action-buttons">
              <button
                class="action-button edit-button"
                onclick={() => editConfig(config)}
                title="Edit configuration"
                aria-label="Edit configuration"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                class="action-button delete-button"
                onclick={() => deleteConfig(config.id)}
                disabled={isDeleting === config.id}
                title="Delete configuration"
                aria-label="Delete configuration"
              >
                {#if isDeleting === config.id}
                  <div class="button-spinner"></div>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                       stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                {/if}
              </button>
              <button
                class="action-button duplicate-button"
                onclick={() => duplicateConfig(config)}
                title="Duplicate configuration"
                aria-label="Duplicate configuration"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19,2H8A3,3,0,0,0,5,5V19a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V5A3,3,0,0,0,19,2Zm1,17a1,1,0,0,1-1,1H8a1,1,0,0,1-1-1V5A1,1,0,0,1,8,4H19a1,1,0,0,1,1,1ZM14,5V7H11V5H7V17h7V15h3v2a1,1,0,0,1-1,1H11a1,1,0,0,1-1-1V13H9v4a1,1,0,0,1-1,1H8a1,1,0,0,1-1-1V5A1,1,0,0,1,8,4h2V7h4V5Z"/></svg>
              </button>
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
{#if !editingConfig}
  <div class="new-chat-config-section">
    <button class="new-chat-config-button" onclick={onNewChatConfig}>
      +
    </button>
  </div>
{/if}

<style>
  .admin-container {
    width: 100%;
    padding: 0;
  }

  .new-chat-config-section {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    z-index: 10;
  }

  .new-chat-config-button {
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

  .success-message {
    background-color: #e8f5e9;
    color: #2e7d32;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .success-message button {
    background: none;
    border: none;
    color: #2e7d32;
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
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  .empty-state button {
    margin-top: 1rem;
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Simplified scrollable table */
  .scrollable-table {
    width: 100%;
    max-height: 100vh;
    overflow: auto;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  .configs-table {
    width: 100%;
    min-width: 800px; /* Ensures table doesn't shrink too much */
    border-collapse: collapse;
    background-color: white;
  }

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    white-space: nowrap;
  }

  th {
    background-color: #f5f5f5;
    font-weight: 500;
    color: #333;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  tr:hover {
    background-color: #f9f9f9;
  }

  /* Action button styles are imported from actionButtons.css */

  .form-container {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    height: calc(100vh - 6rem);
    overflow-y: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    margin: 1rem;
  }

  .form-container h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: #333;
  }

  /* Global styles for EditorJS */
  :global(.ce-block__content) {
    max-width: 100%;
    margin: 0;
  }

  :global(.ce-toolbar__content) {
    max-width: 100%;
    margin: 0;
  }

  :global(.cdx-block) {
    padding: 0.5rem 0;
  }

  :global(.ce-header) {
    font-size: 1.3rem;
    font-weight: 600;
    padding: 0.5rem 0;
  }

  /* Button spinner for delete action */
  .button-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
</style>
