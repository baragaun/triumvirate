<script lang="ts">
  import type { ChatConfig } from '$lib/server/db/schema';

  // Props
  let { chatConfigs, onSubmit, onCancel } = $props<{
    chatConfigs: ChatConfig[];
    onSubmit: (title: string, configId: string) => Promise<void>;
    onCancel: () => void;
  }>();

  // Local state
  let title = $state('');
  let selectedConfigId = $state('');
  let error = $state<string | null>(null);

  // Set default selection when component mounts
  $effect(() => {
    if (chatConfigs.length > 0) {
      selectedConfigId = chatConfigs.find((config: ChatConfig) => config.isDefault)?.id ||
        chatConfigs.find((config: ChatConfig) => config.isDefault)?.id ||
        chatConfigs[0]?.id || '';
    }
  });

  // Handle form submission
  const handleSubmit = async () => {
    // Clear any previous error
    error = null;

    if (!selectedConfigId) {
      error = 'Please select a chat configuration';
      return;
    }

    const selectedChatConfig = chatConfigs.find((config: ChatConfig) => config.id === selectedConfigId);

    if (!selectedChatConfig) {
      error = 'Selected chat configuration not found';
      return;
    }

    try {
      await onSubmit(title.trim(), selectedConfigId);
      // Reset form on successful submission
      title = '';
      selectedConfigId = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    }
  };
</script>

<div class="new-chat-form">
  <h3>Create New Chat</h3>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

  <div class="form-group">
    <label for="chat-title">Title (optional)</label>
    <input
      id="chat-title"
      type="text"
      placeholder="Enter chat title"
      bind:value={title}
    />
  </div>

  <div class="form-group">
    <label for="chat-config">Configuration</label>
    <select id="chat-config" bind:value={selectedConfigId} required>
      <option value="" disabled>Select a configuration</option>
      {#each chatConfigs as config}
        <option value={config.id}>
          [{config.name}] - {config.description} {config.isDefault ? '(Default)' : ''}
        </option>
      {/each}
    </select>
  </div>

  <div class="form-actions">
    <button type="button" class="cancel-button" onclick={onCancel}>Cancel</button>
    <button type="button" class="create-button" onclick={handleSubmit}>Create</button>
  </div>
</div>

<style>
  .new-chat-form {
    width: 100%;
    padding: 1rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
  }

  .new-chat-form h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #333;
  }

  .error-message {
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .cancel-button {
    padding: 0.5rem 1rem;
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .create-button {
    padding: 0.5rem 1rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .cancel-button:hover {
    background-color: #e0e0e0;
  }

  .create-button:hover {
    background-color: #1976d2;
  }
</style>
