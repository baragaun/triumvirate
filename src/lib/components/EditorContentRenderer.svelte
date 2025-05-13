<script lang="ts">
  import { onMount } from 'svelte';

  // Props
  export let contentData: string | null = null;

  // Local state
  let content: any = null;
  let error: string | null = null;

  onMount(() => {
    if (contentData) {
      try {
        // Parse JSON if string
        if (typeof contentData === 'string') {
          try {
            const parsed = JSON.parse(contentData);

            // Verify it has the expected structure
            if (parsed && parsed.blocks && Array.isArray(parsed.blocks)) {
              content = parsed;
            } else {
              // JSON but not in EditorJS format
              content = {
                blocks: [{
                  type: 'paragraph',
                  data: { text: contentData }
                }]
              };
            }
          } catch (e) {
            // Not valid JSON, treat as plain text
            content = {
              blocks: [{
                type: 'paragraph',
                data: { text: contentData }
              }]
            };
          }
        } else if (contentData.blocks && Array.isArray(contentData.blocks)) {
          // Already an object with the correct structure
          content = contentData;
        } else {
          // Object but wrong structure
          content = {
            blocks: [{
              type: 'paragraph',
              data: { text: JSON.stringify(contentData) }
            }]
          };
        }
      } catch (e) {
        console.error('Error processing content data:', e);
        error = 'Could not process content data';

        // Fallback to plain text
        content = {
          blocks: [{
            type: 'paragraph',
            data: {
              text: typeof contentData === 'string' ? contentData : 'Invalid content data'
            }
          }]
        };
      }
    }
  });

  // Function to render different block types
  function renderBlock(block: any) {
    if (!block || !block.type) {
      return '<p>Invalid block format</p>';
    }

    try {
      switch (block.type.toLowerCase()) {
        case 'header':
          const level = block.data?.level || 2;
          return `<h${level}>${block.data?.text || ''}</h${level}>`;

        case 'paragraph':
          return `<p>${block.data?.text || ''}</p>`;

        case 'list':
          // Determine if this is an ordered or unordered list
          const isOrdered = block.data?.style === 'ordered';
          const listType = isOrdered ? 'ol' : 'ul';

          // The class will add proper styling based on list type
          const listClass = isOrdered ? 'editor-ordered-list' : 'editor-unordered-list';

          let items = '';

          if (block.data?.items && Array.isArray(block.data.items)) {
            items = block.data.items
              .map((item: any) => {
                // Handle both string items and complex items with content property
                const itemText = typeof item === 'string' ?
                  item :
                  (item?.content || '');
                return `<li>${itemText}</li>`;
              })
              .join('');
          }

          return `<${listType} class="${listClass}">${items}</${listType}>`;

        default:
          return `<p>${block.data?.text || `Unknown block type: ${block.type}`}</p>`;
      }
    } catch (e) {
      console.error('Error rendering block:', e, block);
      return `<p>Error rendering content</p>`;
    }
  }
</script>

{#if error}
  <div class="editor-content-error">
    <p>{error}</p>
  </div>
{:else if content && content.blocks && content.blocks.length > 0}
  <div class="editor-content-display">
    {#each content.blocks as block}
      {@html renderBlock(block)}
    {/each}
  </div>
{:else if contentData}
  <!-- Fallback for content that couldn't be parsed properly -->
  <div class="editor-content-display">
    <p>{typeof contentData === 'string' ? contentData : 'Invalid content format'}</p>
  </div>
{:else}
  <!-- Empty state -->
  <div class="editor-content-display empty">
    <p>No content available</p>
  </div>
{/if}

<style>
  .editor-content-display {
    font-family: inherit;
    line-height: 1.5;
  }

  .editor-content-error {
    color: #c62828;
    font-style: italic;
    padding: 0.5rem;
    border-left: 3px solid #c62828;
    background-color: #ffebee;
  }

  .editor-content-display.empty {
    color: #888;
    font-style: italic;
  }

  .editor-content-display :global(h2) {
    font-size: 1.5rem;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  .editor-content-display :global(h3) {
    font-size: 1.25rem;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .editor-content-display :global(h4) {
    font-size: 1.125rem;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .editor-content-display :global(p) {
    margin-bottom: 1rem;
  }

  /* List styles */
  .editor-content-display :global(ul),
  .editor-content-display :global(ol) {
    /*margin-left: 1.5rem;*/
    margin-bottom: 1rem;
    padding-left: 1.25rem;
  }

  .editor-content-display :global(ol) {
    list-style-type: decimal;
  }

  .editor-content-display :global(ul) {
    list-style-type: disc;
  }

  .editor-content-display :global(.editor-ordered-list) {
    list-style-type: decimal;
  }

  .editor-content-display :global(.editor-unordered-list) {
    list-style-type: disc;
  }

  .editor-content-display :global(li) {
    margin-bottom: 0.25rem;
    padding-left: 0.25rem;
  }

  /* Ensure list items display properly */
  .editor-content-display :global(ol li::marker) {
    color: inherit;
    /*font-weight: bold;*/
  }
</style>
