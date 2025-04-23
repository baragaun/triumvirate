<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { children, data } = $props<{ children: any, data: LayoutData }>();

	let isInChatPage = $derived(page.url.pathname.startsWith('/chats/'));
	let isSignedIn = $derived(!!data.user?.id);
</script>

<div class="app-container">
	<header class="app-header">
		<div class="header-content">
			<a href="/" class="logo">Micromentor Assistant (Alpha)</a>

			<nav class="main-nav">
				<ul>
					{#if isSignedIn}
						<li><a href="/chats">Chats</a></li>
						<li>
							<form method="POST" action="/logout">
								<button type="submit" class="logout-button">Logout</button>
							</form>
						</li>
					{/if}
				</ul>
			</nav>
		</div>
	</header>

	<main class="app-main">
		{@render children()}
	</main>

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
				| Signed in as {data.user.username}
				| Built with Svelte 5
			{/if}
		</div>
	</footer>
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh; /* Use exact viewport height */
		overflow: hidden; /* Prevent scrolling at the body level */
		background-color: #9d9d9d;
	}

	.app-header {
		background-color: #275c87;
		color: white;
		padding: 0.75rem 0; /* Increased vertical padding */
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		padding-left: 10px;
		height: auto; /* Allow the header to expand based on content */
		min-height: 2rem; /* Minimum height for the header */
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-right: 1rem; /* Keep padding on the right side only */
		/* No padding on the left */
	}

	.logo {
		/*font-size: .8rem;*/
		letter-spacing: 5px;
		color: white;
		text-decoration: none;
		text-align: left;
		padding-left: 0; /* No padding */
		margin-left: 0; /* No margin */
		position: absolute; /* Absolute positioning */
		left: 10px; /* Very close to the left edge */
		top: 50%; /* Center vertically */
		transform: translateY(-50%); /* Perfect vertical centering */
		font-size: .9rem; /* Slightly larger font size */
	}

	.main-nav {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
	}

	.main-nav ul {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 1.5rem;
	}

	.main-nav a {
		color: white;
		text-decoration: none;
		/*font-weight: 500;*/
		transition: opacity 0.2s;
	}

	.main-nav a:hover {
		opacity: 0.8;
	}

	.logout-button {
		background: none;
		border: none;
		color: white;
		/*font-weight: 500;*/
		cursor: pointer;
		padding: 0;
		font-size: 1rem;
		transition: opacity 0.2s;
	}

	.logout-button:hover {
		opacity: 0.8;
	}

	.app-main {
		flex: 1;
		margin-top: 3.5rem; /* Space for header */
		margin-bottom: 3.5rem; /* Space for footer */
		overflow: hidden; /* Prevent scrolling at this level */
		position: relative; /* For absolute positioning of children if needed */
		height: calc(100vh - 7rem); /* Viewport height minus header and footer */
	}

	.app-footer {
		background-color: #e8e8e8;
		padding: .2rem 0;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 1000;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 .2rem;
		text-align: center;
		color: #666;
		font-size: 0.875rem;
	}
</style>
