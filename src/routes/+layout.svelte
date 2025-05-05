<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import { updateUser } from '$lib/stores/user';

	let { children, data } = $props();

	// Update user store whenever data changes
	$effect(() => {
		if (data?.user) {
			updateUser(data.user);
		} else {
			updateUser({ isAuthenticated: false });
		}
	});
</script>

<div class="flex flex-col min-h-screen">
	<Navbar />

	<main class="flex-grow container mx-auto px-4 py-8">
		{@render children()}
	</main>

	<Footer />
</div>
