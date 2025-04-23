<script lang="ts">
  import { onMount } from 'svelte';
  import type { Llm } from '$lib/server/db/schema'

  // State
  let llms = $state<Llm[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // Fetch llms on mount
  onMount(async () => {
    try {
      const response = await fetch('/api/llms');
      const data = await response.json();

      if (!data.error && data.llms) {
        llms = data.llms;
      } else {
        error = data.error || 'Failed to fetch LLMs';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="container">
  <header>
    <h1>AWS Bedrock Llms</h1>
    <p>Llms available to your AWS account</p>
  </header>

  <main>
    {#if isLoading}
      <div class="loading">Loading Models...</div>
    {:else if error}
      <div class="error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    {:else if llms.length === 0}
      <div class="no-llms">
        <p>No models found. Your AWS account might not have access to any Bedrock models.</p>
      </div>
    {:else}
      <div class="llms-list">
        <h2>Available Llms</h2>
        <table>
          <thead>
            <tr>
              <th>Model ID</th>
              <th>Name</th>
              <th>Provider</th>
              <th>On Demand?</th>
            </tr>
          </thead>
          <tbody>
            {#each llms as model}
              <tr>
                <td>{model.id}</td>
                <td>{model.provider}</td>
                <td>{model.name}</td>
                <td>{model.isOnDemand ? 'On Demand' : 'Not On Demand'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </main>
</div>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    margin-bottom: 2rem;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #2196f3;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    font-style: italic;
    color: #666;
  }

  .error {
    background-color: #ffebee;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }

  .error h2 {
    color: #c62828;
    margin-bottom: 0.5rem;
  }

  .no-llms {
    text-align: center;
    padding: 2rem;
    background-color: #f5f5f5;
    border-radius: 0.5rem;
  }

  .llms-list {
    margin-top: 1rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }

  th {
    background-color: #f5f5f5;
    font-weight: bold;
  }

  tr:hover {
    background-color: #f9f9f9;
  }
</style>
