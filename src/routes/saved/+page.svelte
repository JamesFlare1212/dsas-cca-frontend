<script lang="ts">
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import SearchX from '@lucide/svelte/icons/search-x';
  import * as Field from '#lib/components/ui/field/index.js';
  import * as InputGroup from '#lib/components/ui/input-group/index.js';
  import * as Empty from '#lib/components/ui/empty/index.js';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Badge } from '#lib/components/ui/badge/index.js';
  import ActivityCard from '#lib/components/ActivityCard.svelte';
  import ActivityCardSkeleton from '#lib/components/ActivityCardSkeleton.svelte';
  import ActivityDetail from '#lib/components/ActivityDetail.svelte';
  import DirectoryPagination from '#lib/components/DirectoryPagination.svelte';
  import { saved } from '#lib/saved.svelte.js';
  import { searchClubs } from '#lib/catalog.js';
  import type { ClubBasic } from '#lib/types.js';
  let search = $state('');
  let currentPage = $state(1);
  let selected = $state<ClubBasic | null>(null);
  let open = $state(false);
  let results = $derived(searchClubs(saved.clubs, search, 'newest'));
  let page = $derived(Math.min(currentPage, Math.max(1, Math.ceil(results.length / 12))));
  let visible = $derived(results.slice((page - 1) * 12, page * 12));
  $effect(() => {
    void search;
    currentPage = 1;
  });
</script>

<svelte:head
  ><title>My shortlist · DSAS CCA</title><meta
    name="description"
    content="Keep your favourite DSAS activities together in a personal shortlist, saved on this device."
  /></svelte:head
>

<section class="collection-intro">
  <div>
    <p class="eyebrow"><Bookmark aria-hidden="true" /> A LITTLE MORE YOU</p>
    <h1>Your next possibilities<span class="heading-dot">.</span></h1>
    <p>
      The clubs that caught your eye, all in one place.<br />Keep exploring. Your shortlist is just
      the beginning.
    </p>
  </div>
  <div class="collection-art" aria-hidden="true">
    <Bookmark /><span>GOOD THINGS<br />WORTH KEEPING</span>
  </div>
</section>
<section class="collection-section" aria-labelledby="shortlist-heading">
  <div class="section-heading">
    <div class="flex flex-wrap items-center gap-3">
      <h2 id="shortlist-heading">My shortlist</h2>
      <Badge variant="secondary">{saved.clubs.length} saved</Badge>
    </div>
    <span class="local-note">Saved in this browser</span>
  </div>
  {#if !saved.ready}<div
      class="activity-grid collection-grid"
      aria-label="Loading saved activities"
      aria-busy="true"
    >
      {#each Array.from({ length: 3 }) as _, index (index)}<ActivityCardSkeleton />{/each}
    </div>
  {:else if !saved.clubs.length}
    <Empty.Root class="directory-empty shortlist-empty"
      ><Empty.Header
        ><Empty.Media variant="icon"><Bookmark /></Empty.Media><Empty.Title
          >Make a little room for possibility.</Empty.Title
        ><Empty.Description
          >Tap the bookmark on any activity to save it here. No account needed — just your
          curiosity.</Empty.Description
        ></Empty.Header
      ><Empty.Content
        ><Button href="/">Explore activities<ArrowUpRight data-icon="inline-end" /></Button
        ></Empty.Content
      ></Empty.Root
    >
  {:else}
    <Field.FieldGroup class="mb-6 max-w-md"
      ><Field.Field
        ><Field.FieldLabel for="saved-search" class="sr-only"
          >Search your shortlist</Field.FieldLabel
        ><InputGroup.Root
          ><InputGroup.Input
            id="saved-search"
            bind:value={search}
            placeholder="Find something in your shortlist…"
          /><InputGroup.Addon><Search /></InputGroup.Addon>{#if search}<InputGroup.Addon
              align="inline-end"
              ><InputGroup.Button
                size="icon-xs"
                aria-label="Clear shortlist search"
                onclick={() => (search = '')}><X /></InputGroup.Button
              ></InputGroup.Addon
            >{/if}</InputGroup.Root
        ></Field.Field
      ></Field.FieldGroup
    >
    {#if !results.length}<Empty.Root class="directory-empty"
        ><Empty.Header
          ><Empty.Media variant="icon"><SearchX /></Empty.Media><Empty.Title
            >No saved activities match.</Empty.Title
          ><Empty.Description
            >Try another name or clear your search to see your whole shortlist.</Empty.Description
          ></Empty.Header
        ><Empty.Content
          ><Button variant="outline" onclick={() => (search = '')}>Clear search</Button
          ></Empty.Content
        ></Empty.Root
      >
    {:else}<div class="activity-grid collection-grid">
        {#each visible as club (club.id)}<ActivityCard
            {club}
            onopen={(club) => {
              selected = club;
              open = true;
            }}
          />{/each}
      </div>
      <DirectoryPagination
        count={results.length}
        pageSize={12}
        {page}
        onPageChange={(value) => (currentPage = value)}
      />{/if}
  {/if}
</section>
<ActivityDetail club={selected} bind:open />
