<script lang="ts">
  import { onMount } from 'svelte'
  import type { ChatConfig, Llm } from '$lib/server/db/schema'
  import { encryptString } from '$lib/helpers/encryptString'
  import '$lib/styles/actionButtons.css'

  // State
  let chatConfigs = $state<ChatConfig[]>([])
  let llms = $state<Llm[]>([])
  let isLoading = $state(true)
  let error = $state<string | null>(null)
  let showCreateForm = $state(false)
  let editingConfig = $state<ChatConfig | null>(null)
  let isDeleting = $state<string | null>(null)

  // Form state
  let formData = $state<Partial<ChatConfig>>({
    id: '',
    isDefault: false,
    description: '',
    introduction: '',
    feedbackQuestion0: '',
    feedbackQuestion1: '',
    feedbackQuestion2: '',
    feedbackQuestion3: '',
    feedbackQuestion4: '',
    feedbackQuestion5: '',
    feedbackQuestion6: '',
    feedbackQuestion7: '',
    feedbackQuestion8: '',
    feedbackQuestion9: '',
    welcomeMessage: '',
    llmId: '',
    llmInstructions: '',
    llmTemperature: 0.7,
    llmMaxTokens: 1000
  })

  onMount(async () => {
    try {
      await fetchChatConfigs()
      await fetchLlms()
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred'
    } finally {
      isLoading = false
    }
  })

  async function fetchChatConfigs() {
    try {
      const response = await fetch('/api/chat-configs')
      const data = await response.json()

      if (data.error) {
        error = data.error
        return
      }

      chatConfigs = data.chatConfigs || []
    } catch (err) {
      console.error('Error fetching chat configs:', err)
      error = err instanceof Error ? err.message : 'Failed to fetch chat configurations'
    }
  }

  async function fetchLlms() {
    try {
      const response = await fetch('/api/llms')
      const data = await response.json()

      if (data.error) {
        error = data.error
        return
      }

      llms = data.llms || []
    } catch (err) {
      console.error('Error fetching LLMs:', err)
      error = err instanceof Error ? err.message : 'Failed to fetch LLM models'
    }
  }

  function resetForm() {
    formData = {
      id: '',
      isDefault: false,
      description: '',
      introduction: '',
      feedbackQuestion0: '',
      feedbackQuestion1: '',
      feedbackQuestion2: '',
      feedbackQuestion3: '',
      feedbackQuestion4: '',
      feedbackQuestion5: '',
      feedbackQuestion6: '',
      feedbackQuestion7: '',
      feedbackQuestion8: '',
      feedbackQuestion9: '',
      welcomeMessage: '',
      llmId: llms.length > 0 ? llms[0].id : '',
      llmInstructions: '',
      llmTemperature: 0.7,
      llmMaxTokens: 1000
    }
    editingConfig = null
  }

  function showCreateConfigForm() {
    resetForm()
    showCreateForm = true
  }

  function hideForm() {
    showCreateForm = false
    editingConfig = null
  }

  function editConfig(config: ChatConfig) {
    editingConfig = config
    formData = { ...config }
    showCreateForm = true
  }

  const onSubmit = async (event: Event) => {
    event.preventDefault()

    try {
      if (!formData.id) {
        error = 'ID is required'
        return
      }

      if (!formData.llmId) {
        error = 'LLM model is required'
        return
      }

      if (!formData.llmInstructions) {
        error = 'Instructions are required'
        return
      }

      const changes: Partial<ChatConfig> = {
        id: formData.id,
        isDefault: formData.isDefault,
        description: formData.description,
        caption: formData.caption,
        introduction: formData.introduction,
        feedbackQuestion0: formData.feedbackQuestion0,
        feedbackQuestion1: formData.feedbackQuestion1,
        feedbackQuestion2: formData.feedbackQuestion2,
        feedbackQuestion3: formData.feedbackQuestion3,
        feedbackQuestion4: formData.feedbackQuestion4,
        feedbackQuestion5: formData.feedbackQuestion5,
        feedbackQuestion6: formData.feedbackQuestion6,
        feedbackQuestion7: formData.feedbackQuestion7,
        feedbackQuestion8: formData.feedbackQuestion8,
        feedbackQuestion9: formData.feedbackQuestion9,
        welcomeMessage: formData.welcomeMessage,
        llmId: formData.llmId,
        llmInstructions: formData.llmInstructions
          // Sending the raw instructions can trigger a security alarm. CloudFlare rejects
          // the request. This prevents security concerns
          ? await encryptString(formData.llmInstructions)
          : '',
        llmTemperature: formData.llmTemperature,
        llmMaxTokens: formData.llmMaxTokens,
      }

      // console.log('Form data at submission:', changes);

      const isEditing = !!editingConfig
      const url = isEditing && editingConfig
        ? `/api/chat-configs/${editingConfig.id}`
        : '/api/chat-configs'

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
      })

      const data = await response.json()

      if (data.error) {
        error = data.error
        return
      }

      // Refresh the list
      await fetchChatConfigs()

      // Hide the form
      hideForm()

      // Show success message
      error = null
    } catch (err) {
      console.error('Error saving chat config:', err)
      error = err instanceof Error ? err.message : 'Failed to save chat configuration'
    }
  }

  async function deleteConfig(id: string) {
    if (!confirm(`Are you sure you want to delete the configuration "${id}"? This action cannot be undone.`)) {
      return
    }

    try {
      isDeleting = id

      const response = await fetch(`/api/chat-configs/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.error) {
        error = data.error
        return
      }

      // Refresh the list
      await fetchChatConfigs()

      // Show success message
      error = null
    } catch (err) {
      console.error('Error deleting chat config:', err)
      error = err instanceof Error ? err.message : 'Failed to delete chat configuration'
    } finally {
      isDeleting = null
    }
  }

  function formatDate(dateString: string | Date) {
    const date = new Date(dateString)
    return date.toLocaleString()
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

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" bind:checked={formData.isDefault}/>
            Set as default configuration
          </label>
          <small>If checked, this will be the default configuration for new chats</small>
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

        <div class="form-group">
          <label for="description">Introduction</label>
          <textarea
            id="introduction"
            bind:value={formData.introduction}
            rows="3"
            placeholder="Introduction for the user..."
          ></textarea>
          <small>An introduction shown to the user</small>
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #1</label>
          <input
            type="text"
            id="feedbackQuestion0"
            bind:value={formData.feedbackQuestion0}
            placeholder="Tell us about your experience..."
          />
          <small>This question is shown to the user on the feedback form</small>
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #2</label>
          <input
            type="text"
            id="feedbackQuestion1"
            bind:value={formData.feedbackQuestion1}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #3</label>
          <input
            type="text"
            id="feedbackQuestion2"
            bind:value={formData.feedbackQuestion2}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #4</label>
          <input
            type="text"
            id="feedbackQuestion3"
            bind:value={formData.feedbackQuestion3}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #5</label>
          <input
            type="text"
            id="feedbackQuestion4"
            bind:value={formData.feedbackQuestion4}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #6</label>
          <input
            type="text"
            id="feedbackQuestion5"
            bind:value={formData.feedbackQuestion5}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #7</label>
          <input
            type="text"
            id="feedbackQuestion6"
            bind:value={formData.feedbackQuestion6}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #8</label>
          <input
            type="text"
            id="feedbackQuestion7"
            bind:value={formData.feedbackQuestion7}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #9</label>
          <input
            type="text"
            id="feedbackQuestion8"
            bind:value={formData.feedbackQuestion8}
            placeholder="Tell us about your experience..."
          />
        </div>

        <div class="form-group">
          <label for="description">Feedback Question #10</label>
          <input
            type="text"
            id="feedbackQuestion9"
            bind:value={formData.feedbackQuestion9}
            placeholder="Tell us about your experience..."
          />
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
          <small>The first message shown to users when starting a chat with this
            configuration</small>
        </div>

        <div class="form-group">
          <label for="llmInstructions">Instructions for LLM</label>
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
    <div class="scrollable-table">
      <table class="configs-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>LLM Model</th>
          <th>Default</th>
          <th>Last Updated</th>
        </tr>
        </thead>
        <tbody>
        {#each chatConfigs as config}
          <tr>
            <td>{config.id}</td>
            <td>{config.llmId}</td>
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
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
{#if !showCreateForm}
  <div class="new-chat-config-section">
    <button class="new-chat-config-button" onclick={showCreateConfigForm}>
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
