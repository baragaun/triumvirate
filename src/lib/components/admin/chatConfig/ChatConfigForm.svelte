<script lang="ts">
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import EditorJS, { type OutputData } from '@editorjs/editorjs'
  import Header from '@editorjs/header';
  import List from '@editorjs/list';
  import Paragraph from '@editorjs/paragraph';

  import type { ChatConfig, Llm } from '$lib/server/db/schema'
  import { encryptString } from '$lib/helpers/encryptString';
  import '$lib/styles/actionButtons.css';
  import FeedbackButtonConfig from '$lib/components/FeedbackButtonConfig.svelte';
  import FeedbackButton from '$lib/components/chat/FeedbackButton.svelte'

  // Props:
  let {
    chatConfig,
    llms,
    onCancel,
    onSubmit,
  } = $props<{
    chatConfig: Partial<ChatConfig>;
    llms: Llm[];
    onCancel: () => void;
    onSubmit: (changes: Partial<ChatConfig>) => void;
  }>();

  // State
  let error = $state<string | null>(null);
  let pulse = $state(false);
  let editor: EditorJS | null = null;
  let formData = $state<Partial<ChatConfig>>({
    id: chatConfig.id || '',
    isDefault: chatConfig.isDefault,
    description: chatConfig.description || '',
    introduction: chatConfig.introduction || '',
    feedbackButtonValue0: chatConfig.feedbackButtonValue0 || '',
    feedbackButtonValue1: chatConfig.feedbackButtonValue1 || '',
    feedbackButtonValue2: chatConfig.feedbackButtonValue2 || '',
    feedbackButtonValue3: chatConfig.feedbackButtonValue3 || '',
    feedbackButtonValue4: chatConfig.feedbackButtonValue4 || '',
    feedbackButtonLabel0: chatConfig.feedbackButtonLabel0 || '',
    feedbackButtonLabel1: chatConfig.feedbackButtonLabel1 || '',
    feedbackButtonLabel2: chatConfig.feedbackButtonLabel2 || '',
    feedbackButtonLabel3: chatConfig.feedbackButtonLabel3 || '',
    feedbackButtonLabel4: chatConfig.feedbackButtonLabel4 || '',
    feedbackButtonTitle0: chatConfig.feedbackButtonTitle0 || '',
    feedbackButtonTitle1: chatConfig.feedbackButtonTitle1 || '',
    feedbackButtonTitle2: chatConfig.feedbackButtonTitle2 || '',
    feedbackButtonTitle3: chatConfig.feedbackButtonTitle3 || '',
    feedbackButtonTitle4: chatConfig.feedbackButtonTitle4 || '',
    feedbackButtonIcon0: chatConfig.feedbackButtonIcon0 || '',
    feedbackButtonIcon1: chatConfig.feedbackButtonIcon1 || '',
    feedbackButtonIcon2: chatConfig.feedbackButtonIcon2 || '',
    feedbackButtonIcon3: chatConfig.feedbackButtonIcon3 || '',
    feedbackButtonIcon4: chatConfig.feedbackButtonIcon4 || '',
    feedbackButtonLlmText0: chatConfig.feedbackButtonLlmText0 || '',
    feedbackButtonLlmText1: chatConfig.feedbackButtonLlmText1 || '',
    feedbackButtonLlmText2: chatConfig.feedbackButtonLlmText2 || '',
    feedbackButtonLlmText3: chatConfig.feedbackButtonLlmText3 || '',
    feedbackButtonLlmText4: chatConfig.feedbackButtonLlmText4 || '',
    feedbackQuestion0: chatConfig.feedbackQuestion0 || '',
    feedbackQuestion1: chatConfig.feedbackQuestion1 || '',
    feedbackQuestion2: chatConfig.feedbackQuestion2 || '',
    feedbackQuestion3: chatConfig.feedbackQuestion3 || '',
    feedbackQuestion4: chatConfig.feedbackQuestion4 || '',
    feedbackQuestion5: chatConfig.feedbackQuestion5 || '',
    feedbackQuestion6: chatConfig.feedbackQuestion6 || '',
    feedbackQuestion7: chatConfig.feedbackQuestion7 || '',
    feedbackQuestion8: chatConfig.feedbackQuestion8 || '',
    feedbackQuestion9: chatConfig.feedbackQuestion9 || '',
    welcomeMessage: chatConfig.welcomeMessage || '',
    llmId: chatConfig.llmId || '',
    llmInstructions: chatConfig.llmInstructions || '',
    llmTemperature: chatConfig.llmTemperature || 0.7,
    llmMaxTokens: chatConfig.llmMaxTokens || 1000,
  });
  let introductionData = $state<OutputData | undefined>(undefined);

  onMount(async () => {
    try {
      await tick();
      await initializeEditorJs();
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    }
  });

  let feedbackButtons = $derived([
    { value: formData.feedbackButtonValue0, label: formData.feedbackButtonLabel0, title: formData.feedbackButtonTitle0, icon: formData.feedbackButtonIcon0 },
    { value: formData.feedbackButtonValue1, label: formData.feedbackButtonLabel1, title: formData.feedbackButtonTitle1, icon: formData.feedbackButtonIcon1 },
    { value: formData.feedbackButtonValue2, label: formData.feedbackButtonLabel2, title: formData.feedbackButtonTitle2, icon: formData.feedbackButtonIcon2 },
    { value: formData.feedbackButtonValue3, label: formData.feedbackButtonLabel3, title: formData.feedbackButtonTitle3, icon: formData.feedbackButtonIcon3 },
    { value: formData.feedbackButtonValue4, label: formData.feedbackButtonLabel4, title: formData.feedbackButtonTitle4, icon: formData.feedbackButtonIcon4 },
  ].filter(b => b.value))

  async function initializeEditorJs() {
    if (editor) {
      return;
    }

    try {
      if (chatConfig.introduction) {
        introductionData = JSON.parse(chatConfig.introduction);
      } else {
        introductionData = undefined;
      }
      // if (editor) {
      //   if (introductionData) {
      //     await editor.render(introductionData);
      //   } else {
      //     editor.clear();
      //   }
      // }

      editor = new EditorJS({
        holder: 'editorjs',
        tools: {
          header: {
            class: Header,
            config: {
              placeholder: 'Enter a header',
              levels: [2, 3, 4],
              defaultLevel: 2,
            }
          },
          list: List,
          paragraph: {
            class: Paragraph,
            inlineToolbar: true
          }
        },
        data: introductionData,
        placeholder: 'Type your introduction here...',
        onChange: async () => {
          // Get data from editor when it changes
          if (editor) {
            introductionData = await editor.save();
          }
        }
      });
    } catch (err) {
      console.error('Error initializing EditorJS:', err);
      error = err instanceof Error ? err.message : 'Failed to initialize editor';
    }
  }

  const handleSubmit = async (event: Event) => {
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
              if (
                normalizedBlock.data &&
                normalizedBlock.data.items &&
                Array.isArray(normalizedBlock.data.items)
              ) {
                normalizedBlock.data.items = normalizedBlock.data.items.map(item =>
                  typeof item === 'object' && item.content !== undefined
                    ? item.content
                    : String(item)
                );
              }

              return normalizedBlock;
            }
            return block;
          });
          // console.log('Normalized blocks for saving:', JSON.stringify(introductionData.blocks, null, 2));
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

      console.log('Form data at submission:', changes);

      onSubmit(changes);
      error = null;
    } catch (err) {
      console.error('Error saving chat config:', err);
      error = err instanceof Error ? err.message : 'Failed to save chat configuration';
    }
  };

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

  <div class="form-container">
    <h2>{chatConfig.id ? 'Edit Chat Configuration' : 'Create Chat Configuration'}</h2>

    <form onsubmit={handleSubmit} class="full-height-form">
      <div class="form-group">
        <label for="id">ID</label>
        <input
          type="text"
          id="id"
          bind:value={formData.id}
          required
          disabled={!chatConfig.id}
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
        <button type="button" class="cancel-button" onclick={onCancel}>Cancel</button>
        <button type="submit" class="submit-button">
          Save
        </button>
      </div>
    </form>
  </div>
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

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
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
    font-size: 1.3rem;
    font-weight: 600;
    padding: 0.5rem 0;
  }
</style>
