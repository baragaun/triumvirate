<script lang="ts">
  let {
    isSignedIn,
    username,
  } = $props<{
    isSignedIn: boolean;
    username: string;
  }>();
</script>

<footer class="app-footer">
  <div class="footer-content">
    &copy; 2025 Micromentor |
    <a href="https://resources.micromentor.org/privacy-policy/">Privacy Policy</a>
    | <a href="https://resources.micromentor.org/terms-of-use/">Terms Of Use</a>
    | <a href="https://micromentor.org/contact">Contact</a>
    {#if !isSignedIn}
      | <a href="/login">Login</a>
      | <a href="/register">Register</a>
    {:else}
      | Signed in as {username}
      | Built with Svelte 5
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
  }
</style>
