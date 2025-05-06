<script lang="ts">
	export let user;
	export let closeMenu: () => void;
</script>

<ul class="md:hidden flex flex-col space-y-2 p-4 bg-gray-700 text-white">
	<li>
		<a href="/" class="hover:text-gray-300" on:click={closeMenu}>Home</a>
	</li>
	<li>
		<a href="/running" class="hover:text-gray-300" on:click={closeMenu}>Running</a>
	</li>
	{#if !user.isAuthenticated}
		<li>
			<a href="/demo/lucia/login" class="hover:text-gray-300" on:click={closeMenu}>Login</a>
		</li>
	{:else}
		<li>
			<span class="hover:text-gray-300">Welcome, {user.username}</span>
		</li>
		<li>
			<a href="/demo/lucia" class="hover:text-gray-300" on:click={closeMenu}>Logout</a>
		</li>
	{/if}
</ul>