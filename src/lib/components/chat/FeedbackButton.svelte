<script lang="ts">
  import IconComponent from '$lib/components/icons/IconComponent.svelte'

  const {
    value,
    label,
    title,
    icon,
    onClick
  } = $props<{
    value: string | null | undefined;
    label: string | null | undefined;
    title: string | null | undefined;
    icon: string | null | undefined;
    onClick: (value: string) => void;
  }>();

  const handleClick = async (event: Event) => {
    event.preventDefault()
    onClick(value);
  };
</script>

<button
  class="feedback-button"
  onclick={handleClick}
  title={title}
>
  <IconComponent iconName={icon} size="14" />
  {label}
</button>

<style>
  .feedback-button {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.4rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f9f9f9;
    color: #555;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .feedback-button:hover {
    background-color: #e9e9e9;
    border-color: #ccc;
  }
</style>
