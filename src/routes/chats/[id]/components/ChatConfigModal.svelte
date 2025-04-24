<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Chat, Llm, ChatConfig } from '$lib/server/db/schema'
  import { ChatMode } from '$lib/enums';

  // Props
  let {
    chat,
    chatConfig,
    chatConfigs,
    llms,
    onClose,
    updateChat,
    updateChatConfig,
  } = $props<{
    chat: Chat,
    chatConfig: ChatConfig | null,
    chatConfigs: ChatConfig[],
    llms: Llm[],
    onClose: () => void,
    updateChat: (changes: Partial<Chat>) => Promise<string>,
    updateChatConfig: (changes: Partial<ChatConfig>) => Promise<string>,
  }>();

  // State
  let isSaving = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let isInstructionsMaximized = $state(false);

  // Form values
  let title = $state(chat.title || '');
  let mode = $state<ChatMode>(chat.mode as ChatMode || ChatMode.experiment);
  let configId = $state(chat.configId || '');
  let llmId = $state(chat.llmId || chatConfig?.llmId || '');
  let llmTemperature = $state(chat.llmTemperature ?? chatConfig?.llmTemperature ?? 0.7);
  let llmInstructions = $state(chat.llmInstructions || chatConfig?.llmInstructions || '');

  // References to DOM elements
  let modalOverlay: HTMLElement;
  let firstFocusableElement: HTMLElement;
  let lastFocusableElement: HTMLElement;

  // Handle ESC key press
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // If instructions are maximized, minimize them first
      if (isInstructionsMaximized) {
        isInstructionsMaximized = false;
        event.preventDefault();
        event.stopPropagation();
      } else {
        // Otherwise close the modal
        onClose();
      }
    }
  };

  // Handle tab key to trap focus within the modal
  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    // If shift + tab and focus is on first element, move to last element
    if (event.shiftKey && document.activeElement === firstFocusableElement) {
      event.preventDefault();
      lastFocusableElement.focus();
    }
    // If tab and focus is on last element, move to first element
    else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
      event.preventDefault();
      firstFocusableElement.focus();
    }
  };

  // Set up and clean up event listeners
  onMount(() => {
    // Add global keydown listener
    window.addEventListener('keydown', handleKeydown);

    // Focus the modal when it opens for better accessibility
    if (modalOverlay) {
      modalOverlay.focus();

      // Find all focusable elements within the modal
      const focusableElements = modalOverlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        // Set first and last focusable elements
        firstFocusableElement = focusableElements[0] as HTMLElement;
        lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        // Focus the first element
        firstFocusableElement.focus();

        // Add event listener for tab key to trap focus
        modalOverlay.addEventListener('keydown', handleTabKey);
      }
    }
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    if (modalOverlay) {
      modalOverlay.removeEventListener('keydown', handleTabKey);
    }
  });

  const processUpdateChat = async (closeModal: boolean) => {
    error = null;
    success = null;
    isSaving = true;

    try {
      const changes: Partial<Chat> = {
        id: chat.id,
        title,
        mode,
        configId,
        llmId,
        llmInstructions,
        llmTemperature,
      };

      const response = await updateChat(changes);

      if (response !== 'ok') {
        error = response;
        return;
      }
      success = 'Settings saved successfully';

      if (closeModal) {
        onClose();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred while saving settings';
    } finally {
      isSaving = false;
    }
  }

  const onSubmit = async (event: Event) => {
    event.preventDefault();
    await processUpdateChat(true);
  }

  const onUpdateConfig = async (event: Event) => {
    event.preventDefault();
    error = null;
    success = null;
    isSaving = true;

    try {
      // First, we'll save the pending changes to the chat:
      await processUpdateChat(false);

      // Now the chat config:
      const changes: Partial<ChatConfig> = {
        id: chat.configId,
        llmId,
        llmInstructions,
        llmTemperature,
      };

      const response = await updateChatConfig(changes);

      if (response !== 'ok') {
        error = response;
        return;
      }
      success = 'Config saved successfully';
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred while saving settings';
    } finally {
      isSaving = false;
    }
  }
</script>

<div
  class="modal-overlay"
  role="dialog"
  aria-labelledby="settings-title"
  aria-modal="true"
  tabindex="-1"
  bind:this={modalOverlay}
  onclick={(e) => {
    // Close modal when clicking on the overlay (outside the modal content)
    if (e.target === e.currentTarget) onClose();
  }}
  onkeydown={handleKeydown}
>
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="settings-title">Edit Chat Settings</h3>
    </div>

    <div class="modal-body">
      <form id="chatConfigForm" onsubmit={onSubmit}>
        <div class="form-group">
          <label for="title">Chat Title</label>
          <input
            type="text"
            id="title"
            bind:value={title}
            placeholder="Enter chat title"
          />
        </div>

        <div class="form-group">
          <label for="mode">Chat Mode</label>
          <select id="mode" bind:value={mode}>
            <option value={ChatMode.experiment}>Experiment</option>
            <option value={ChatMode.tuning}>Tuning</option>
          </select>
        </div>

        <div class="form-group">
          <label for="configId">Chat Config</label>
          <select id="configId" bind:value={configId}>
            <option value="">None</option>
            {#each chatConfigs as config (config.id)}
              <option value={config.id}>{config.id} - {config.description || 'No description'}</option>
            {/each}
          </select>
          <div class="update-config-button-div">
            <button
              type="button"
              class="update-config-button"
              onclick={onUpdateConfig}
              disabled={isSaving}
            >
              Update Config
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="llmId">LLM Model</label>
          <select id="llmId" bind:value={llmId}>
            {#if llms.length === 0}
              <option value="">No models available</option>
            {:else}
              {#each llms as model (model.id)}
                <option value={model.id}>{model.provider} - {model.name}</option>
              {/each}
            {/if}
          </select>
        </div>

        <div class="form-group">
          <label for="llmTemperature">Temperature</label>
          <div class="range-container">
            <input
              type="range"
              id="llmTemperature"
              bind:value={llmTemperature}
              min="0"
              max="1"
              step="0.1"
            />
            <span class="range-value">{llmTemperature}</span>
          </div>
        </div>

        <div class="form-group {isInstructionsMaximized ? 'maximized' : ''}">
          <div class="label-container">
            <label for="llmInstructions">LLM Instructions</label>
            <button
              type="button"
              class="toggle-maximize-button"
              onclick={() => isInstructionsMaximized = !isInstructionsMaximized}
              title={isInstructionsMaximized ? "Minimize" : "Maximize"}
              aria-label={isInstructionsMaximized ? "Minimize instructions" : "Maximize instructions"}
            >
              {#if isInstructionsMaximized}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="4 14 10 14 10 20"></polyline>
                  <polyline points="20 10 14 10 14 4"></polyline>
                  <line x1="14" y1="10" x2="21" y2="3"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              {/if}
            </button>
          </div>
          <textarea
            id="llmInstructions"
            bind:value={llmInstructions}
            rows={isInstructionsMaximized ? 20 : 5}
            placeholder="Instructions for the LLM"
            class={isInstructionsMaximized ? "maximized" : ""}
          ></textarea>
        </div>

        {#if error}
          <div class="error-message" role="alert">
            <p>{error}</p>
          </div>
        {/if}

        {#if success}
          <div class="success-message" role="status">
            <p>{success}</p>
          </div>
        {/if}

      </form>
    </div>

    <div class="modal-footer">
      <div class="modal-actions">
        <button
          type="button"
          class="cancel-button"
          onclick={() => onClose()}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          class="save-button"
          form="chatConfigForm"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    outline: none; /* Remove default outline */
  }

  /* Ensure the modal content has a visible focus indicator for accessibility */
  .modal-content:focus-within {
    outline: 2px solid #2196f3;
    outline-offset: -2px;
  }

  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
  }

  .modal-body {
    padding: 1rem 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
    min-height: 100px;
    max-height: calc(80vh - 140px); /* Subtract header and footer heights */
  }

  .modal-footer {
    padding: 1rem 1.5rem 1.5rem;
    border-top: 1px solid #eee;
    background-color: white;
    border-radius: 0 0 8px 8px;
    flex-shrink: 0;
  }

  h3 {
    margin-top: 0;
    margin-bottom: 0;
    color: #333;
  }

  /* Loading styles removed as they're not used */

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  input[type="text"],
  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
  }

  textarea {
    resize: vertical;
    min-height: 100px;
    transition: all 0.3s ease;
  }

  .label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .toggle-maximize-button {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .toggle-maximize-button:hover {
    background-color: #f0f0f0;
    color: #2196f3;
  }

  .form-group.maximized {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: white;
    z-index: 2000;
    margin: 0;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .form-group.maximized .label-container {
    margin-bottom: 1rem;
  }

  .form-group.maximized textarea {
    flex-grow: 1;
    min-height: 0;
    height: calc(100vh - 80px);
    font-size: 1.1rem;
    line-height: 1.5;
  }

  .range-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  input[type="range"] {
    flex: 1;
  }

  .range-value {
    min-width: 2.5rem;
    text-align: center;
    font-weight: bold;
  }

  .error-message {
    padding: 0.75rem;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .success-message {
    padding: 0.75rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .cancel-button {
    background-color: #f5f5f5;
    color: #333;
  }

  .cancel-button:hover:not(:disabled) {
    background-color: #e0e0e0;
  }

  .save-button {
    background-color: #2196f3;
    color: white;
  }

  .save-button:hover:not(:disabled) {
    background-color: #1976d2;
  }

  .update-config-button {
    background-color: #2196f3;
    color: white;
  }

  .update-config-button:hover:not(:disabled) {
    background-color: #1976d2;
  }

  .update-config-button-div {
    text-align: right;
    padding: 0.5rem 0;
  }
</style>
