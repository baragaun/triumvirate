<script lang="ts">
  let { children } = $props<{ children: any }>();
</script>

<div class="admin-content">
  {@render children()}
</div>

<style>
  .admin-content {
    flex: 1;
    overflow-y: auto;
    width: 100%;
  }
</style>
