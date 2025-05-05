<script lang="ts">
	import { user } from '$lib/stores/user';
	let menuOpen = false;
</script>

<nav class="bg-gray-800 text-white p-4">
	<div class="container mx-auto flex justify-between items-center">
		<a href="/" class="text-xl font-bold">PaceBuddy</a>
		<!-- Desktop menu (hidden on mobile) -->
		<div class="hidden md:flex space-x-4">
			<a href="/" class="hover:text-gray-300">Home</a>
			<a href="/running" class="hover:text-gray-300">Running</a>
			{#if !$user.isAuthenticated}
				<a href="/demo/lucia/login" class="hover:text-gray-300">Login</a>
			{:else}
				<span class="hover:text-gray-300">Welcome, {$user.username}</span>
				<a href="/demo/lucia" class="hover:text-gray-300">Logout</a>
			{/if}
		</div>
		<!-- Hamburger for mobile -->
		<button class="md:hidden" on:click={() => menuOpen = !menuOpen}>
			<!-- Simple hamburger icon -->
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	</div>
</nav>

<!-- Mobile dropdown (shown by default) -->
{#if menuOpen}
	<ul class="md:hidden flex flex-col space-y-2 p-4 bg-gray-700 text-white">
		<li><a href="/" class="hover:text-gray-300">Home</a></li>
		<li><a href="/running" class="hover:text-gray-300">Running</a></li>
		{#if !$user.isAuthenticated}
			<li><a href="/demo/lucia/login" class="hover:text-gray-300">Login</a></li>
		{:else}
			<li><span class="hover:text-gray-300">Welcome, {$user.username}</span></li>
			<li><a href="/demo/lucia" class="hover:text-gray-300">Logout</a></li>
		{/if}
	</ul>
{/if} 