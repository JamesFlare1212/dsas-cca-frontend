<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import List from '@lucide/svelte/icons/list';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import SearchX from '@lucide/svelte/icons/search-x';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import * as Field from '#lib/components/ui/field/index.js';
  import * as InputGroup from '#lib/components/ui/input-group/index.js';
  import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
  import * as Sheet from '#lib/components/ui/sheet/index.js';
  import * as Empty from '#lib/components/ui/empty/index.js';
  import * as Alert from '#lib/components/ui/alert/index.js';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Badge } from '#lib/components/ui/badge/index.js';
  import ActivityFilters from '#lib/components/ActivityFilters.svelte';
  import ActivityCard from '#lib/components/ActivityCard.svelte';
  import ActivityCardSkeleton from '#lib/components/ActivityCardSkeleton.svelte';
  import ActivityDetail from '#lib/components/ActivityDetail.svelte';
  import FilterSelect from '#lib/components/FilterSelect.svelte';
  import DirectoryPagination from '#lib/components/DirectoryPagination.svelte';
  import { getClubs, getCategories, getAcademicYears } from '#lib/api.js';
  import { emptyFilters, readFilters, filterCount, searchClubs } from '#lib/catalog.js';
  import { gradeLabel } from '#lib/grades.js';
  import { cn } from '#lib/utils.js';
  import type { ClubBasic, Counts, Filters, SortOrder, ViewMode } from '#lib/types.js';

  let filters = $state<Filters>({ ...emptyFilters });
  let categories = $state<Counts>({});
  let years = $state<Counts>({});
  let clubs = $state<ClubBasic[]>([]);
  let ready = $state(false);
  let loading = $state(true);
  let optionsError = $state(false);
  let error = $state(false);
  let refresh = $state(0);
  let search = $state('');
  let debouncedSearch = $state('');
  let sort = $state<SortOrder>('newest');
  let view = $state<ViewMode>('grid');
  let currentPage = $state(1);
  let mobileFilters = $state(false);
  let selected = $state<ClubBasic | null>(null);
  let detailOpen = $state(false);
  const pageSize = 12;
  const sortItems = [
    { value: 'newest', label: 'Recently added' },
    { value: 'name-asc', label: 'Name: A–Z' },
    { value: 'name-desc', label: 'Name: Z–A' },
  ];
  let results = $derived(searchClubs(clubs, debouncedSearch, sort));
  let totalPages = $derived(Math.max(1, Math.ceil(results.length / pageSize)));
  let displayedPage = $derived(Math.min(currentPage, totalPages));
  let visible = $derived(results.slice((displayedPage - 1) * pageSize, displayedPage * pageSize));
  let activeCount = $derived(filterCount(filters));
  let chips = $derived([
    ...(filters.category !== 'all' ? [{ key: 'category' as const, label: filters.category }] : []),
    ...(filters.academicYear !== 'all'
      ? [{ key: 'academicYear' as const, label: filters.academicYear }]
      : []),
    ...(filters.grade !== 'all'
      ? [{ key: 'grade' as const, label: gradeLabel(filters.grade, 'full') }]
      : []),
    ...(filters.leader !== 'all'
      ? [
          {
            key: 'leader' as const,
            label: filters.leader === 'student' ? 'Student led' : 'Staff led',
          },
        ]
      : []),
  ]);

  function readLocation() {
    const params = new URLSearchParams(location.search);
    filters = readFilters(params);
    search = params.get('q') || '';
    const order = params.get('sort');
    sort = order === 'name-asc' || order === 'name-desc' ? order : 'newest';
    view = params.get('view') === 'list' ? 'list' : 'grid';
    const activity = params.get('activity');
    if (activity && /^\d+$/.test(activity)) {
      selected = { id: activity, name: 'Activity details', photo: '' };
      detailOpen = true;
    } else {
      detailOpen = false;
    }
  }

  onMount(() => {
    const controller = new AbortController();
    readLocation();
    const hasYear = new URLSearchParams(location.search).has('year');
    Promise.allSettled([
      getCategories(controller.signal),
      getAcademicYears(controller.signal),
    ]).then(([categoryResult, yearResult]) => {
      if (controller.signal.aborted) return;
      if (categoryResult.status === 'fulfilled') categories = categoryResult.value;
      if (yearResult.status === 'fulfilled') {
        years = yearResult.value;
        if (!hasYear) filters.academicYear = Object.keys(years).sort().reverse()[0] || 'all';
      }
      optionsError = categoryResult.status === 'rejected' || yearResult.status === 'rejected';
      ready = true;
    });
    window.addEventListener('popstate', readLocation);
    return () => {
      controller.abort();
      window.removeEventListener('popstate', readLocation);
    };
  });

  $effect(() => {
    const text = search;
    const timeout = setTimeout(() => (debouncedSearch = text), 180);
    return () => clearTimeout(timeout);
  });

  $effect(() => {
    if (!ready) return;
    const snapshot = { ...filters };
    void refresh;
    const controller = new AbortController();
    loading = true;
    error = false;
    getClubs(snapshot, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) clubs = data;
      })
      .catch(() => {
        if (!controller.signal.aborted) error = true;
      })
      .finally(() => {
        if (!controller.signal.aborted) loading = false;
      });
    return () => controller.abort();
  });

  $effect(() => {
    void debouncedSearch;
    void sort;
    void filters.category;
    void filters.academicYear;
    void filters.grade;
    void filters.leader;
    currentPage = 1;
  });

  $effect(() => {
    if (!ready) return;
    const url = new URL(location.href);
    url.searchParams.set('year', filters.academicYear);
    for (const [key, value] of [
      ['category', filters.category === 'all' ? '' : filters.category],
      ['grade', filters.grade === 'all' ? '' : filters.grade],
      ['leader', filters.leader === 'all' ? '' : filters.leader],
      ['q', search.trim()],
      ['sort', sort === 'newest' ? '' : sort],
      ['view', view === 'grid' ? '' : view],
      ['activity', detailOpen && selected ? selected.id : ''],
    ]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href !== location.href) void goto(url, { shallow: true, replace: true });
  });

  function reset() {
    filters = { ...emptyFilters };
    search = '';
  }
  function openClub(club: ClubBasic) {
    selected = club;
    detailOpen = true;
  }
  function changePage(value: number) {
    currentPage = value;
    document
      .getElementById('activity-results')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<section id="activities" class="activities-section" aria-labelledby="activities-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">A LITTLE SOMETHING FOR EVERYONE</p>
      <h2 id="activities-heading">Explore activities<span class="heading-dot">.</span></h2>
    </div>
    <a class="text-link" href="/saved/">Your shortlist<ArrowUpRight aria-hidden="true" /></a>
  </div>
  <div class="directory-layout">
    <aside class="desktop-filters" aria-label="Activity filters">
      <ActivityFilters bind:filters {categories} {years} onreset={reset} />
    </aside>
    <div class="directory-content" id="activity-results">
      <div class="search-toolbar">
        <Field.FieldGroup class="min-w-0 flex-1"
          ><Field.Field
            ><Field.FieldLabel for="activity-search" class="sr-only"
              >Search activities</Field.FieldLabel
            ><InputGroup.Root
              ><InputGroup.Input
                id="activity-search"
                bind:value={search}
                placeholder="Search activities…"
                autocomplete="off"
              /><InputGroup.Addon><Search /></InputGroup.Addon>{#if search}<InputGroup.Addon
                  align="inline-end"
                  ><InputGroup.Button
                    size="icon-xs"
                    aria-label="Clear activity search"
                    onclick={() => (search = '')}><X /></InputGroup.Button
                  ></InputGroup.Addon
                >{/if}</InputGroup.Root
            ></Field.Field
          ></Field.FieldGroup
        >
        <div class="sort-control">
          <FilterSelect
            id="activity-sort"
            label="Sort activities"
            bind:value={sort}
            items={sortItems}
          />
        </div>
        <div class="mobile-filter-button">
          <Button variant="outline" onclick={() => (mobileFilters = true)}
            ><SlidersHorizontal data-icon="inline-start" />Filters{#if activeCount}<Badge
                variant="secondary">{activeCount}</Badge
              >{/if}</Button
          >
        </div>
      </div>
      <div class="results-toolbar">
        <p role="status" aria-live="polite">
          {#if loading}<span>Finding your possibilities…</span>{:else if error}<span
              >Activities unavailable</span
            >{:else}<strong>{results.length.toLocaleString()}</strong>
            {results.length === 1 ? 'activity' : 'activities'}<span class="results-suffix"
              >{' '}to explore</span
            >{/if}
        </p>
        <ToggleGroup.Root
          type="single"
          value={view}
          onValueChange={(value) => {
            if (value === 'grid' || value === 'list') view = value;
          }}
          variant="outline"
          size="sm"
          aria-label="Activity view"
        >
          <ToggleGroup.Item value="grid" aria-label="Grid view"><LayoutGrid /></ToggleGroup.Item
          ><ToggleGroup.Item value="list" aria-label="List view"><List /></ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
      {#if chips.length}<div class="active-filters" aria-label="Active filters">
          {#each chips as chip (chip.key)}<Badge variant="secondary"
              >{chip.label}<button
                aria-label="Remove {chip.label} filter"
                onclick={() => (filters[chip.key] = 'all')}><X /></button
              ></Badge
            >{/each}
        </div>{/if}
      {#if optionsError}<Alert.Root class="mb-5"
          ><CircleAlert /><Alert.Title>Some filters are unavailable</Alert.Title><Alert.Description
            >You can still browse and search activities. Reload to try loading all filters again.</Alert.Description
          ><Alert.Action
            ><Button variant="outline" size="sm" onclick={() => location.reload()}>Reload</Button
            ></Alert.Action
          ></Alert.Root
        >{/if}
      {#if loading}
        <div
          class={cn('activity-grid', view === 'list' && 'activity-list')}
          aria-label="Loading activities"
          aria-busy="true"
        >
          {#each Array.from({ length: 6 }) as _, index (index)}<ActivityCardSkeleton
              {view}
            />{/each}
        </div>
      {:else if error}
        <Empty.Root class="directory-empty"
          ><Empty.Header
            ><Empty.Media variant="icon"><CircleAlert /></Empty.Media><Empty.Title
              >Let’s try that again</Empty.Title
            ><Empty.Description
              >We couldn’t load the activity directory. Check your connection and give it another
              go.</Empty.Description
            ></Empty.Header
          ><Empty.Content
            ><Button onclick={() => refresh++}
              ><RotateCcw data-icon="inline-start" />Try again</Button
            ></Empty.Content
          ></Empty.Root
        >
      {:else if results.length === 0}
        <Empty.Root class="directory-empty"
          ><Empty.Header
            ><Empty.Media variant="icon"><SearchX /></Empty.Media><Empty.Title
              >No matches, yet.</Empty.Title
            ><Empty.Description
              >Try a different search or loosen a filter. There’s plenty more to discover.</Empty.Description
            ></Empty.Header
          ><Empty.Content
            ><Button variant="outline" onclick={reset}>Clear search & filters</Button
            ></Empty.Content
          ></Empty.Root
        >
      {:else}
        <div class={cn('activity-grid', view === 'list' && 'activity-list')}>
          {#each visible as club (club.id)}<ActivityCard {club} {view} onopen={openClub} />{/each}
        </div>
        <DirectoryPagination
          count={results.length}
          {pageSize}
          page={displayedPage}
          onPageChange={changePage}
        />
      {/if}
    </div>
  </div>
</section>

<Sheet.Root bind:open={mobileFilters}>
  <Sheet.Content side="left" class="w-[min(88vw,360px)] overflow-y-auto">
    <Sheet.Header
      ><Sheet.Title>Find your fit</Sheet.Title><Sheet.Description
        >Make the directory a little more you.</Sheet.Description
      ></Sheet.Header
    >
    <div class="p-5">
      <ActivityFilters bind:filters {categories} {years} onreset={reset} idPrefix="mobile" />
    </div>
    <Field.FieldGroup class="px-5 pb-5"
      ><Field.Field
        ><Field.FieldLabel for="mobile-sort">Sort activities</Field.FieldLabel><FilterSelect
          id="mobile-sort"
          label="Sort activities"
          bind:value={sort}
          items={sortItems}
        /></Field.Field
      ></Field.FieldGroup
    >
    <Sheet.Footer
      ><Button onclick={() => (mobileFilters = false)}>Show activities</Button></Sheet.Footer
    >
  </Sheet.Content>
</Sheet.Root>
<ActivityDetail club={selected} bind:open={detailOpen} />
