<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import Users from '@lucide/svelte/icons/users';
  import Copy from '@lucide/svelte/icons/copy';
  import SearchX from '@lucide/svelte/icons/search-x';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import * as Card from '#lib/components/ui/card/index.js';
  import * as Avatar from '#lib/components/ui/avatar/index.js';
  import * as Field from '#lib/components/ui/field/index.js';
  import * as InputGroup from '#lib/components/ui/input-group/index.js';
  import * as Empty from '#lib/components/ui/empty/index.js';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Skeleton } from '#lib/components/ui/skeleton/index.js';
  import DirectoryPagination from '#lib/components/DirectoryPagination.svelte';
  import { getStaff } from '#lib/api.js';
  import { searchStaff, initials } from '#lib/catalog.js';
  import type { StaffMember } from '#lib/types.js';
  let staff = $state<StaffMember[]>([]);
  let search = $state('');
  let currentPage = $state(1);
  let loading = $state(true);
  let error = $state(false);
  let ready = $state(false);
  let retry = $state(0);
  let results = $derived(searchStaff(staff, search));
  let page = $derived(Math.min(currentPage, Math.max(1, Math.ceil(results.length / 24))));
  let visible = $derived(results.slice((page - 1) * 24, page * 24));
  onMount(() => {
    ready = true;
  });
  $effect(() => {
    void search;
    currentPage = 1;
  });
  $effect(() => {
    if (!ready) return;
    void retry;
    const controller = new AbortController();
    loading = true;
    error = false;
    getStaff(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) staff = data;
      })
      .catch(() => {
        if (!controller.signal.aborted) error = true;
      })
      .finally(() => {
        if (!controller.signal.aborted) loading = false;
      });
    return () => controller.abort();
  });
  async function copyId(member: StaffMember) {
    try {
      await navigator.clipboard.writeText(member.id);
      toast.success('Staff ID copied', { description: member.name });
    } catch {
      toast.error('Could not copy. Your browser may restrict clipboard access.', {
        description: `Staff ID: ${member.id}`,
      });
    }
  }
</script>

<svelte:head
  ><title>Staff directory · DSAS CCA</title><meta
    name="description"
    content="Find the people behind co-curricular activities at DSAS. Search staff by name or staff ID."
  /></svelte:head
>

<section class="staff-intro">
  <div>
    <p class="eyebrow"><Users aria-hidden="true" /> OUR SCHOOL COMMUNITY</p>
    <h1>Good people.<br /><span>Great possibilities.</span></h1>
    <p>
      Meet the people who help make it happen.<br />Find your activity leaders in the DSAS staff
      directory.
    </p>
  </div>
  <div class="staff-intro-aside">
    <div class="community-icons" aria-hidden="true">
      <Avatar.Root class="size-16"><Avatar.Fallback>DS</Avatar.Fallback></Avatar.Root><Avatar.Root
        class="size-20"><Avatar.Fallback><Users /></Avatar.Fallback></Avatar.Root
      ><Avatar.Root class="size-16"><Avatar.Fallback>AS</Avatar.Fallback></Avatar.Root>
    </div>
    <span>A COMMUNITY OF POSSIBILITY</span>
  </div>
</section>
<section class="staff-section" aria-labelledby="staff-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">THE PEOPLE BEHIND THE POSSIBILITIES</p>
      <h2 id="staff-heading">Staff directory<span class="heading-dot">.</span></h2>
    </div>
    <a href="/" class="text-link">Explore activities<ArrowUpRight aria-hidden="true" /></a>
  </div>
  <div class="staff-search-row">
    <Field.FieldGroup class="max-w-lg flex-1"
      ><Field.Field
        ><Field.FieldLabel for="staff-search" class="sr-only"
          >Search staff by name or ID</Field.FieldLabel
        ><InputGroup.Root
          ><InputGroup.Input
            id="staff-search"
            bind:value={search}
            placeholder="Search staff by name or ID…"
            autocomplete="off"
          /><InputGroup.Addon><Search /></InputGroup.Addon>{#if search}<InputGroup.Addon
              align="inline-end"
              ><InputGroup.Button
                size="icon-xs"
                aria-label="Clear staff search"
                onclick={() => (search = '')}><X /></InputGroup.Button
              ></InputGroup.Addon
            >{/if}</InputGroup.Root
        ></Field.Field
      ></Field.FieldGroup
    >
    <p class="staff-count" role="status" aria-live="polite">
      {#if loading}Loading our community…{:else if error}Directory unavailable{:else}<strong
          >{results.length}</strong
        >
        staff {results.length === 1 ? 'member' : 'members'}{/if}
    </p>
  </div>
  {#if loading}<div class="staff-grid">
      {#each Array.from({ length: 9 }) as _, index (index)}<Card.Root
          ><Card.Header class="flex-row items-center gap-4"
            ><Skeleton class="size-12 rounded-full" />
            <div class="flex flex-1 flex-col gap-3">
              <Skeleton class="h-5 w-3/4" /><Skeleton class="h-4 w-1/2" />
            </div></Card.Header
          ></Card.Root
        >{/each}
    </div>
  {:else if error}<Empty.Root class="directory-empty"
      ><Empty.Header
        ><Empty.Media variant="icon"><CircleAlert /></Empty.Media><Empty.Title
          >We couldn’t load the directory.</Empty.Title
        ><Empty.Description
          >Check your connection and try again. Your community will be right here.</Empty.Description
        ></Empty.Header
      ><Empty.Content
        ><Button onclick={() => retry++}><RotateCcw data-icon="inline-start" />Try again</Button
        ></Empty.Content
      ></Empty.Root
    >
  {:else if !results.length}<Empty.Root class="directory-empty"
      ><Empty.Header
        ><Empty.Media variant="icon"><SearchX /></Empty.Media><Empty.Title
          >No one by that name, yet.</Empty.Title
        ><Empty.Description>Try a different spelling or search using a staff ID.</Empty.Description
        ></Empty.Header
      >{#if search}<Empty.Content
          ><Button variant="outline" onclick={() => (search = '')}>Clear search</Button
          ></Empty.Content
        >{/if}</Empty.Root
    >
  {:else}<div class="staff-grid" id="staff-results">
      {#each visible as member (member.id)}<Card.Root class="staff-card"
          ><Card.Header class="flex-row items-center gap-4"
            ><Avatar.Root class="size-12 shrink-0"
              ><Avatar.Fallback>{initials(member.name)}</Avatar.Fallback></Avatar.Root
            >
            <div class="min-w-0">
              <Card.Title><h3>{member.name}</h3></Card.Title><Card.Description
                >DSAS staff</Card.Description
              >
            </div></Card.Header
          ><Card.Content
            ><p class="staff-id"><span>STAFF ID</span><code>{member.id}</code></p></Card.Content
          ><Card.Footer class="justify-between"
            ><span class="staff-card-note">School community</span><Button
              variant="ghost"
              size="icon"
              onclick={() => copyId(member)}
              aria-label="Copy staff ID for {member.name}"><Copy /></Button
            ></Card.Footer
          ></Card.Root
        >{/each}
    </div>
    <DirectoryPagination
      count={results.length}
      pageSize={24}
      {page}
      onPageChange={(value) => {
        currentPage = value;
        document.getElementById('staff-heading')?.scrollIntoView({ behavior: 'smooth' });
      }}
    />{/if}
</section>
