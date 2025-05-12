<script lang="ts">
  import ThumbsUpIcon from '$lib/components/icons/ThumbsUpIcon.svelte'
  import ThumbsDownIcon from '$lib/components/icons/ThumbsDownIcon.svelte'
  import WrongIcon from '$lib/components/icons/WrongIcon.svelte'

  const {
    iconName,
    size,
  } = $props<{
    iconName: string;
    size: string;
  }>();

  const iconMap = {
    'thumbs-up': ThumbsUpIcon,
    'thumbs-down': ThumbsDownIcon,
    'wrong': WrongIcon
  };

  // @ts-ignore
  const IconComponent = $derived(iconMap[iconName] || null);
</script>

{#if IconComponent}
  <IconComponent class="icon" style={`width: ${size}px; height: ${size}px;`} />
{/if}

<style>
  .icon {
    display: inline-block;
  }
</style>
