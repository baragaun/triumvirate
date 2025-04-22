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
			{/if}
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
		background-color: #275c87;
		color: white;
		padding: .1rem 0;
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
		/*font-size: .8rem;*/
		letter-spacing: 8px;
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
