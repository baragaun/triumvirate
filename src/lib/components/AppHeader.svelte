<script lang="ts">
  // No props needed anymore since we're removing the navigation
</script>

<header class="app-header">
  <div class="header-content">
    <a href="/" class="logo">
      <img src="/logo-512.png" alt="Micromentor Logo" class="logo-image" />
      <span class="logo-text">Micromentor Juno (Alpha)</span>
    </a>
  </div>
</header>

<style>
  .app-header {
    background-color: #b2cce1;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 0.75rem 0 0.75rem 10px;
    height: auto; /* Allow the header to expand based on content */
    min-height: 2rem; /* Minimum height for the header */
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem 0 0;
  }

  .logo {
    color: #466876;
    text-decoration: none;
    font-weight: bold;
    text-align: left;
    padding-left: 0;
    margin-left: 0;
    position: absolute;
    left: 10px;
    top: 50%; /* Center vertically */
    transform: translateY(-50%); /* Perfect vertical centering */
    font-size: 1rem;
    cursor: pointer;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-image {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .logo-text {
    display: inline-block;
  }
</style>
