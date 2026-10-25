<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '#lib/components/ui/sonner/index.js';
  import * as Tooltip from '#lib/components/ui/tooltip/index.js';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import SiteFooter from '#lib/components/SiteFooter.svelte';
  import { loadSaved } from '#lib/saved.svelte.js';
  let { children } = $props();
  onMount(loadSaved);
</script>

<svelte:head>
  <meta
    name="description"
    content="Discover co-curricular activities at DSAS. Find your next club, explore your interests and build your shortlist."
  />
</svelte:head>

<ModeWatcher modeStorageKey="theme" />
<Tooltip.Provider delayDuration={300}>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <SiteHeader />
  <main id="main-content" class="page-shell" tabindex="-1">{@render children()}</main>
  <SiteFooter />
  <Toaster position="bottom-right" closeButton />
</Tooltip.Provider>
