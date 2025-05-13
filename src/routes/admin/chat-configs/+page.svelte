<script lang="ts">
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import EditorJS, { type OutputData } from '@editorjs/editorjs'

  import type { ChatConfig, Llm } from '$lib/server/db/schema';
  import { encryptString } from '$lib/helpers/encryptString';
  import '$lib/styles/actionButtons.css';
  import FeedbackButtonConfig from '$lib/components/FeedbackButtonConfig.svelte';
  import FeedbackButton from '$lib/components/chat/FeedbackButton.svelte'

  // State
  let chatConfigs = $state<ChatConfig[]>([]);
  let llms = $state<Llm[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let showCreateForm = $state(false);
  let editingConfig = $state<ChatConfig | null>(null);
  let isDeleting = $state<string | null>(null);
  let pulse = $state(false);
  let editor: EditorJS | null = null;

  // Form state
  let formData = $state<Partial<ChatConfig>>({
    id: '',
    isDefault: false,
    description: '',
    introduction: '',
    feedbackButtonValue0: '',
    feedbackButtonValue1: '',
    feedbackButtonValue2: '',
    feedbackButtonValue3: '',
    feedbackButtonValue4: '',
    feedbackButtonLabel0: '',
    feedbackButtonLabel1: '',
    feedbackButtonLabel2: '',
    feedbackButtonLabel3: '',
    feedbackButtonLabel4: '',
    feedbackButtonTitle0: '',
    feedbackButtonTitle1: '',
    feedbackButtonTitle2: '',
    feedbackButtonTitle3: '',
    feedbackButtonTitle4: '',
    feedbackButtonIcon0: '',
    feedbackButtonIcon1: '',
    feedbackButtonIcon2: '',
    feedbackButtonIcon3: '',
    feedbackButtonIcon4: '',
    feedbackButtonLlmText0: '',
    feedbackButtonLlmText1: '',
    feedbackButtonLlmText2: '',
    feedbackButtonLlmText3: '',
    feedbackButtonLlmText4: '',
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
    llmMaxTokens: 1000,
  });

  let introductionData = $state<OutputData | null>(null);

  onMount(async () => {
    try {
      if (editor) {
        // Clean up editor when component is destroyed
        editor.destroy();
        editor = null;
      }
      await fetchChatConfigs();
      await fetchLlms();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      isLoading = false;
    }
  });

  let feedbackButtons = $derived([
    { value: formData.feedbackButtonValue0, label: formData.feedbackButtonLabel0, title: formData.feedbackButtonTitle0, icon: formData.feedbackButtonIcon0 },
    { value: formData.feedbackButtonValue1, label: formData.feedbackButtonLabel1, title: formData.feedbackButtonTitle1, icon: formData.feedbackButtonIcon1 },
    { value: formData.feedbackButtonValue2, label: formData.feedbackButtonLabel2, title: formData.feedbackButtonTitle2, icon: formData.feedbackButtonIcon2 },
    { value: formData.feedbackButtonValue3, label: formData.feedbackButtonLabel3, title: formData.feedbackButtonTitle3, icon: formData.feedbackButtonIcon3 },
    { value: formData.feedbackButtonValue4, label: formData.feedbackButtonLabel4, title: formData.feedbackButtonTitle4, icon: formData.feedbackButtonIcon4 },
  ].filter(b => b.value))

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

  // Initialize EditorJS
  async function initializeEditor() {
    if (editor) {
      await editor.isReady;
      editor.destroy();
    }

    try {
      // Import required EditorJS tools
      const Header = (await import('@editorjs/header')).default;
      const List = (await import('@editorjs/list')).default;
      const Paragraph = (await import('@editorjs/paragraph')).default;

      // Parse introductionData if it exists
      let initialData = { blocks: [] };
      if (introductionData) {
        try {
          initialData = typeof introductionData === 'string'
            ? JSON.parse(introductionData)
            : introductionData;

          // Find any list blocks
          const listBlocks = introductionData.blocks.filter(block => block.type === 'list');
          if (listBlocks.length > 0) {
            console.log('List blocks to be saved:', JSON.stringify(listBlocks, null, 2));
          }
        } catch (e) {
          console.error('Error parsing editor data:', e);
          // If parsing fails, create a paragraph from the introduction text
          if (formData.introduction) {
            initialData = {
              blocks: [{
                type: 'paragraph',
                data: {
                  text: formData.introduction
                }
              }]
            };
          }
        }
      } else if (formData.introduction) {
        // If only plain text is available, convert it to EditorJS format
        initialData = {
          blocks: [{
            type: 'paragraph',
            data: {
              text: formData.introduction
            }
          }]
        };
      }

      // Initialize the editor
      editor = new EditorJS({
        holder: 'editorjs',
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [2, 3, 4],
              defaultLevel: 2
            }
          },
          list: {
            class: List,
            inlineToolbar: true
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true
          }
        },
        data: initialData,
        placeholder: 'Type your introduction here...',
        onChange: async () => {
          // Get data from editor when it changes
          if (editor) {
            const data: OutputData = await editor.save();
            introductionData = data;

            // Update the plain text version for backward compatibility
            const plainText = data.blocks
              .map(block => block.data.text || '')
              .join('\n\n');
            formData.introduction = plainText;
          }
        }
      });
    } catch (err) {
      console.error('Error initializing EditorJS:', err);
      error = err instanceof Error ? err.message : 'Failed to initialize editor';
    }
  }

  function resetForm() {
    formData = {
      id: '',
      isDefault: false,
      description: '',
      introduction: '',
      feedbackButtonValue0: '',
      feedbackButtonValue1: '',
      feedbackButtonValue2: '',
      feedbackButtonValue3: '',
      feedbackButtonValue4: '',
      feedbackButtonLabel0: '',
      feedbackButtonLabel1: '',
      feedbackButtonLabel2: '',
      feedbackButtonLabel3: '',
      feedbackButtonLabel4: '',
      feedbackButtonTitle0: '',
      feedbackButtonTitle1: '',
      feedbackButtonTitle2: '',
      feedbackButtonTitle3: '',
      feedbackButtonTitle4: '',
      feedbackButtonIcon0: '',
      feedbackButtonIcon1: '',
      feedbackButtonIcon2: '',
      feedbackButtonIcon3: '',
      feedbackButtonIcon4: '',
      feedbackButtonLlmText0: '',
      feedbackButtonLlmText1: '',
      feedbackButtonLlmText2: '',
      feedbackButtonLlmText3: '',
      feedbackButtonLlmText4: '',
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
    };
    introductionData = null;
    editingConfig = null;

    // Reset editor if it exists
    if (editor) {
      editor.blocks.clear();
    }
  }

  async function showCreateConfigForm() {
    resetForm();
    showCreateForm = true;

    // Initialize editor after DOM update
    await tick();
    await initializeEditor();
  }

  async function hideForm() {
    // Clean up editor
    if (editor) {
      await editor.isReady;
      editor.destroy();
      editor = null;
    }

    showCreateForm = false;
    editingConfig = null;
  }

  async function editConfig(config: ChatConfig) {
    editingConfig = config;

    // Make a deep copy of the config
    formData = { ...config };

    try {
      // Parse the introduction data if it exists
      if (config.introduction) {
        introductionData = JSON.parse(config.introduction);
      } else {
        introductionData = null;
      }
    } catch (e) {
      console.error('Error parsing introduction data:', e);
      introductionData = null;
    }

    // Show the form
    showCreateForm = true;

    // Wait for the DOM to update
    await tick();

    // Initialize editor with the config's data
    await initializeEditor();
  }

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    try {
      // Get the final editor data before submitting
      if (editor) {
        introductionData = await editor.save();
        if (introductionData && introductionData.blocks) {
          // Normalize list blocks before saving
          introductionData.blocks = introductionData.blocks.map(block => {
            if (block.type === 'list') {
              // Create a deep copy to avoid modifying the original
              const normalizedBlock = JSON.parse(JSON.stringify(block));

              // Convert complex items to simple strings if needed
              if (normalizedBlock.data && normalizedBlock.data.items && Array.isArray(normalizedBlock.data.items)) {
                normalizedBlock.data.items = normalizedBlock.data.items.map(item =>
                  typeof item === 'object' && item.content !== undefined ?
                    item.content :
                    String(item)
                );
              }

              return normalizedBlock;
            }
            return block;
          });

          console.log('Normalized blocks for saving:', JSON.stringify(introductionData.blocks, null, 2));
        }
      }

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
        isDefault: formData.isDefault,
        description: formData.description,
        caption: formData.caption,
        introduction: introductionData
          ? JSON.stringify(introductionData)
          : null,
        feedbackButtonValue0: formData.feedbackButtonValue0,
        feedbackButtonValue1: formData.feedbackButtonValue1,
        feedbackButtonValue2: formData.feedbackButtonValue2,
        feedbackButtonValue3: formData.feedbackButtonValue3,
        feedbackButtonValue4: formData.feedbackButtonValue4,
        feedbackButtonLabel0: formData.feedbackButtonLabel0,
        feedbackButtonLabel1: formData.feedbackButtonLabel1,
        feedbackButtonLabel2: formData.feedbackButtonLabel2,
        feedbackButtonLabel3: formData.feedbackButtonLabel3,
        feedbackButtonLabel4: formData.feedbackButtonLabel4,
        feedbackButtonTitle0: formData.feedbackButtonTitle0,
        feedbackButtonTitle1: formData.feedbackButtonTitle1,
        feedbackButtonTitle2: formData.feedbackButtonTitle2,
        feedbackButtonTitle3: formData.feedbackButtonTitle3,
        feedbackButtonTitle4: formData.feedbackButtonTitle4,
        feedbackButtonIcon0: formData.feedbackButtonIcon0,
        feedbackButtonIcon1: formData.feedbackButtonIcon1,
        feedbackButtonIcon2: formData.feedbackButtonIcon2,
        feedbackButtonIcon3: formData.feedbackButtonIcon3,
        feedbackButtonIcon4: formData.feedbackButtonIcon4,
        feedbackButtonLlmText0: formData.feedbackButtonLlmText0,
        feedbackButtonLlmText1: formData.feedbackButtonLlmText1,
        feedbackButtonLlmText2: formData.feedbackButtonLlmText2,
        feedbackButtonLlmText3: formData.feedbackButtonLlmText3,
        feedbackButtonLlmText4: formData.feedbackButtonLlmText4,
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

      // Hide the form and clean up
      await hideForm();

      // Show success message
      error = null;
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

  const onChange = async () => {
    formData = { ...formData };
    pulse = false;
    await tick();
    const el = document.querySelector('.feedback-button-preview') as HTMLElement;
    if (el) el.offsetWidth;
    pulse = true;
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
            <input type="checkbox" bind:checked={formData.isDefault} />
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
          <label for="introduction">Introduction</label>
          <div class="editor-container">
            <div id="editorjs" class="editor-content"></div>
          </div>
          <small>An introduction shown to the user with rich formatting</small>
        </div>

        <div class="form-parent-group">
          <div class="form-parent-group-caption">
            Feedback Button For AI Assistant Messages
          </div>
          <div class="form-parent-group-subcaption">
            Value/label for the first button shown below each AI assistant message
          </div>
          <div class="feedback-button-preview-caption">Preview:</div>
          <div class="feedback-button-preview {pulse ? 'pulse' : ''}">
            {#each feedbackButtons as feedbackButton}
              <FeedbackButton
                value={feedbackButton.value}
                label={feedbackButton.label}
                title={feedbackButton.title}
                icon={feedbackButton.icon}
                onClick={() => {}}
              />
            {/each}
          </div>
          <div class="form-group">
            <FeedbackButtonConfig buttonNumber={0} formData={formData} {onChange} />
          </div>
          <div class="form-group">
            <FeedbackButtonConfig buttonNumber={1} formData={formData} {onChange} />
          </div>
          <div class="form-group">
            <FeedbackButtonConfig buttonNumber={2} formData={formData} {onChange} />
          </div>
          <div class="form-group">
            <FeedbackButtonConfig buttonNumber={3} formData={formData} {onChange} />
          </div>
          <div class="form-group">
            <FeedbackButtonConfig buttonNumber={4} formData={formData} {onChange} />
          </div>
        </div>

        <div class="form-parent-group">
          <div class="form-parent-group-caption">Feedback Questions</div>
          <div class="form-parent-group-subcaption">
            These questions are shown to the user on the feedback form after ending the chat.
          </div>
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
            {editingConfig ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  {:else if chatConfigs.length === 0}
    <div class="empty-state">
      <p>No chat configurations found.</p>
      <button onclick={showCreateConfigForm}>Create your first chat configuration</button>
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
          <th>Actions</th>
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

  .form-parent-group {
    border: 1px solid #e8e8e8;
    padding: 1rem 1rem 0 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .form-parent-group-caption {
    font-weight: 500;
    color: #333;
  }

  .form-parent-group-subcaption {
    color: #797979;
    font-size: .8rem;
    margin-bottom: 1rem;
  }

  .feedback-button-preview-caption {
    font-weight: 500;
    color: #333;
    margin-bottom: .2rem;
  }

  .feedback-button-preview {
    display: flex;
    margin-bottom: 1rem;
    gap: .8rem;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 #2196f366; }
    70% { box-shadow: 0 0 0 10px #2196f300; }
    100% { box-shadow: 0 0 0 0 #2196f300; }
  }

  .feedback-button-preview.pulse {
    animation: pulse 1.5s;
  }

  /* EditorJS Specific Styles */
  .editor-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 200px;
    margin-bottom: 0.5rem;
    background-color: white;
  }

  .editor-content {
    padding: 0.5rem;
    min-height: 180px;
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
