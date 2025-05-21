<script lang="ts">
  import type { User } from '$lib/server/db/schema'

  let { user } = $props<{ user?: User }>();
</script>

<footer class="app-footer">
  <div class="footer-content">
    &copy; 2025 Micromentor
    &nbsp;|&nbsp; <a href="https://resources.micromentor.org/privacy-policy/">Privacy Policy</a>
    &nbsp;|&nbsp; <a href="https://resources.micromentor.org/terms-of-use/">Terms Of Use</a>
    &nbsp;|&nbsp; <a href="https://micromentor.org/contact">Contact</a>
    {#if user}
      &nbsp;|&nbsp; Signed in as {user?.username}
      &nbsp;|&nbsp; Built with Svelte 5
    {:else}
      &nbsp;|&nbsp; <a href="/login">Login</a>
      &nbsp;|&nbsp; <a href="/register">Register</a>
    {/if}
  </div>
</footer>

<style>
  .app-footer {
    background-color: #e8e8e8;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    height: 2rem;
    display: flex;
    align-items: center; /* Center content vertically */
  }

  .footer-content {
    margin: 0 auto;
    text-align: center;
    color: #666;
    font-size: .8rem;
    display: flex;
    justify-content: space-around;
    align-items: center; /* Center items vertically */
    text-wrap: nowrap;
  }
</style>
