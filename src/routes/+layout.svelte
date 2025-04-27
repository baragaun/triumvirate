<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppSidebar from '$lib/components/AppSidebar.svelte';

	let { children, data } = $props<{ children: any, data: LayoutData }>();

	let isSignedIn = $derived(!!data.user?.id);
	let isAdmin = $derived(!!data.user?.isAdmin);
</script>

<div class="app-container">
	<AppHeader />

	<div class="content-container">
		{#if isSignedIn}
			<AppSidebar isAdmin={isAdmin} />
		{/if}

		<main class="app-main">
			{@render children()}
		</main>
	</div>

	<footer class="app-footer">
		<AppFooter {isSignedIn} username={data.user?.username} />
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

	.content-container {
		display: flex;
		flex: 1;
		overflow: hidden;
		margin-top: 2rem; /* Space for header */
		margin-bottom: 2rem; /* Space for footer */
	}

	.app-main {
		flex: 1;
		overflow: hidden; /* Prevent scrolling at this level */
		position: relative; /* For absolute positioning of children if needed */
		height: calc(100vh - 4rem); /* Viewport height minus header and footer */
	}
</style>
