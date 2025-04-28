<script lang="ts">
  import { onMount } from 'svelte';
  import type { ChatConfig, Llm } from '$lib/server/db/schema';
  import { encryptString } from '$lib/helpers/encryptString'

  // State
  let chatConfigs = $state<ChatConfig[]>([]);
  let llms = $state<Llm[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let showCreateForm = $state(false);
  let editingConfig = $state<ChatConfig | null>(null);
  let isDeleting = $state<string | null>(null);

  // Form state
  let formData = $state<Partial<ChatConfig>>({
    id: '',
    description: '',
    isDefault: false,
    welcomeMessage: '',
    llmId: '',
    llmInstructions: '',
    llmTemperature: 0.7,
    llmMaxTokens: 1000
  });

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

  function resetForm() {
    formData = {
      id: '',
      description: '',
      isDefault: false,
      welcomeMessage: '',
      llmId: llms.length > 0 ? llms[0].id : '',
      llmInstructions: '',
      llmTemperature: 0.7,
      llmMaxTokens: 1000
    };
    editingConfig = null;
  }

  function showCreateConfigForm() {
    resetForm();
    showCreateForm = true;
  }

  function hideForm() {
    showCreateForm = false;
    editingConfig = null;
  }

  function editConfig(config: ChatConfig) {
    editingConfig = config;
    formData = { ...config };
    showCreateForm = true;
  }

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    try {
      if (!formData.id) {
        error = 'ID is required';
        return;
      }

      if (!formData.llmId) {
        error = 'LLM model is required';
        return;
      }

      if (!formData.llmInstructions) {
        error = 'Instructions are required';
        return;
      }

      const changes: Partial<ChatConfig> = {
        id: formData.id,
        description: formData.description,
        caption: formData.caption,
        isDefault: formData.isDefault,
        welcomeMessage: formData.welcomeMessage,
        llmId: formData.llmId,
        llmInstructions: formData.llmInstructions
          // Sending the raw instructions can trigger a security alarm. CloudFlare rejects
          // the request. This prevents security concerns
          ? await encryptString(formData.llmInstructions)
          : '',
        llmTemperature: formData.llmTemperature,
        llmMaxTokens: formData.llmMaxTokens,
      };

      // console.log('Form data at submission:', changes);

      const isEditing = !!editingConfig;
      const url = isEditing && editingConfig
        ? `/api/chat-configs/${editingConfig.id}`
        : '/api/chat-configs';

      const method = isEditing ? 'PUT' : 'POST';

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

      // Hide the form
      hideForm();

      // Show success message
      error = null;
    } catch (err) {
      console.error('Error saving chat config:', err);
      error = err instanceof Error ? err.message : 'Failed to save chat configuration';
    }
  }

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
      <p>Loading configurations...</p>
    </div>
  {:else if showCreateForm}
    <div class="form-container">
      <h2>{editingConfig ? 'Edit Chat Configuration' : 'Create Chat Configuration'}</h2>

      <form onsubmit={onSubmit} class="full-height-form">
        <div class="form-group">
          <label for="id">ID</label>
          <input
            type="text"
            id="id"
            bind:value={formData.id}
            required
            disabled={!!editingConfig}
            placeholder="unique-config-id"
          />
          <small>A unique identifier for this configuration</small>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <input
            type="text"
            id="description"
            bind:value={formData.description}
            placeholder="Brief description of this configuration"
          />
          <small>A short description explaining the purpose of this configuration</small>
        </div>

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" bind:checked={formData.isDefault} />
            Set as default configuration
          </label>
          <small>If checked, this will be the default configuration for new chats</small>
        </div>

        <div class="form-group">
          <label for="llmId">LLM Model</label>
          <select id="llmId" bind:value={formData.llmId} required>
            <option value="">Select a model</option>
            {#each llms as llm}
              <option value={llm.id}>{llm.name} ({llm.provider})</option>
            {/each}
          </select>
          <small>The language model to use for this configuration</small>
        </div>

        <div class="form-group">
          <label for="llmTemperature">Temperature</label>
          <input
            type="number"
            id="llmTemperature"
            bind:value={formData.llmTemperature}
            min="0"
            max="1"
            step="0.1"
          />
          <small>Controls randomness: 0 is deterministic, 1 is very creative</small>
        </div>

        <div class="form-group">
          <label for="llmMaxTokens">Max Tokens</label>
          <input
            type="number"
            id="llmMaxTokens"
            bind:value={formData.llmMaxTokens}
            min="100"
            step="100"
          />
          <small>Maximum number of tokens in the response</small>
        </div>

        <div class="form-group">
          <label for="welcomeMessage">Welcome Message</label>
          <textarea
            id="welcomeMessage"
            bind:value={formData.welcomeMessage}
            rows="3"
            placeholder="Optional welcome message to display when starting a chat"
          ></textarea>
          <small>The first message shown to users when starting a chat with this configuration</small>
        </div>

        <div class="form-group">
          <label for="llmInstructions">Instructions</label>
          <textarea
            id="llmInstructions"
            bind:value={formData.llmInstructions}
            rows="6"
            required
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
          <button type="submit" class="submit-button">
            {editingConfig ? 'Update Configuration' : 'Create Configuration'}
          </button>
        </div>
      </form>
    </div>
  {:else if chatConfigs.length === 0}
    <div class="empty-state">
      <p>No chat configurations found.</p>
      <button onclick={showCreateConfigForm}>Create your first configuration</button>
    </div>
  {:else}
    <div class="configs-list">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>LLM Model</th>
            <th>Default</th>
            <th>Last Updated</th>
            <th>
              <button class="create-button" onclick={showCreateConfigForm}>
                New
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each chatConfigs as config}
            <tr>
              <td>{config.id}</td>
              <td>{config.llmId}</td>
              <td>{config.isDefault ? '✓' : ''}</td>
              <td>{formatDate(config.updatedAt)}</td>
              <td class="actions">
                <button
                  class="edit-button"
                  onclick={() => editConfig(config)}
                  title="Edit configuration"
                >
                  Edit
                </button>
                <button
                  class="delete-button"
                  onclick={() => deleteConfig(config.id)}
                  disabled={isDeleting === config.id}
                  title="Delete configuration"
                >
                  {isDeleting === config.id ? 'Deleting...' : 'Delete'}
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

  .create-button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 0.1rem .5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
    margin-left: .5rem;
  }

  .create-button:hover {
    background-color: #388e3c;
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

  .empty-state button {
    margin-top: 1rem;
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .configs-list {
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

  .full-height-form {
    display: flex;
    flex-direction: column;
    flex: 1;
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

  .form-group.checkbox label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
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

  .form-group input[type="checkbox"] {
    margin: 0;
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
    margin-top: auto; /* Push to bottom */
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
