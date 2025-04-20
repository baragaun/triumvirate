<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';

	let { children, data } = $props<{ children: any, data: LayoutData }>();

	// Get user and guestUserName directly from data
	// This avoids the need for a reactive state that could cause infinite loops

	// Check if we're in a chat page by looking at the URL path
	let isInChatPage = $derived(page.url.pathname.startsWith('/chats/'));

	// Determine if the user is a guest (no user but has guestUserName)
	let isGuestUser = $derived(!data.user && !!data.guestUserName);

	// Determine if we should show the Chats menu item
	let showChatsMenu = $derived(
		// Show for logged-in users
		(!!data.user) ||
		// Show for guest users only when not in a chat page
		(isGuestUser && !isInChatPage)
	);
</script>

<div class="app-container">
	<header class="app-header">
		<div class="header-content">
			<a href="/" class="logo">Triumvirate</a>

			<nav class="main-nav">
				<ul>
					<li><a href="/">Home</a></li>
					{#if showChatsMenu}
						<li><a href="/chats">Chats</a></li>
					{/if}
					{#if data.user}
						<li><a href="/profile">Profile</a></li>
						<li>
							<form method="POST" action="/logout">
								<button type="submit" class="logout-button">Logout</button>
							</form>
						</li>
					{:else if !data.guestUserName}
						<li><a href="/login">Login</a></li>
						<li><a href="/register">Register</a></li>
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
			<p>© 2023 Triumvirate. All rights reserved.</p>
		</div>
	</footer>
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.app-header {
		background-color: #2196f3;
		color: white;
		padding: 1rem 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: white;
		text-decoration: none;
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
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.main-nav a:hover {
		opacity: 0.8;
	}

	.logout-button {
		background: none;
		border: none;
		color: white;
		font-weight: 500;
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
	}

	.app-footer {
		background-color: #f5f5f5;
		padding: 1rem 0;
		margin-top: auto;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		text-align: center;
		color: #666;
		font-size: 0.875rem;
	}
</style>
