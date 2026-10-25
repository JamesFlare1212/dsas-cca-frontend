<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Users from '@lucide/svelte/icons/users';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import * as Card from '#lib/components/ui/card/index.js';
  import { Badge } from '#lib/components/ui/badge/index.js';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Skeleton } from '#lib/components/ui/skeleton/index.js';
  import { getCachedDetail, getClubDetail } from '#lib/api.js';
  import { gradeRange, meetingDays, locationLabel } from '#lib/catalog.js';
  import ActivityImage from '#lib/components/ActivityImage.svelte';
  import { isSaved, toggleSaved } from '#lib/saved.svelte.js';
  import { cn } from '#lib/utils.js';
  import type { ClubBasic, ClubDetail, ViewMode } from '#lib/types.js';

  let {
    club,
    view = 'grid',
    onopen,
  }: {
    club: ClubBasic;
    view?: ViewMode;
    onopen: (club: ClubBasic) => void;
  } = $props();
  let element: HTMLDivElement;
  let detail = $state<ClubDetail>();
  let loading = $state(true);

  onMount(() => {
    let active = true;
    detail = getCachedDetail(club.id);
    if (detail) {
      loading = false;
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        getClubDetail(club.id)
          .then((data) => {
            if (active) detail = data;
          })
          .catch(() => {
            /* Opening the detail dialog offers a retry. */
          })
          .finally(() => {
            if (active) loading = false;
          });
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => {
      active = false;
      observer.disconnect();
    };
  });

  function save() {
    const result = toggleSaved(club);
    toast(result.added ? 'Added to your shortlist' : 'Removed from your shortlist', {
      description: result.persisted
        ? undefined
        : 'Browser storage is unavailable. Changes are saved for this session.',
    });
  }
</script>

<div bind:this={element} class="activity-card-wrapper">
  <Card.Root class={cn('activity-card h-full', view === 'list' && 'activity-card-list')}>
    <Card.Header class="activity-card-header">
      <div class="activity-card-top">
        <div class="card-category">
          {#if detail}<Badge variant="secondary">{detail.category || 'Activity'}</Badge
            >{:else if loading}<Skeleton class="h-5 w-24" />{:else}<Badge variant="secondary"
              >Activity</Badge
            >{/if}
        </div>
        <Button
          variant={isSaved(club.id) ? 'secondary' : 'ghost'}
          size="icon"
          aria-label="{isSaved(club.id) ? 'Remove' : 'Save'} {club.name}"
          aria-pressed={isSaved(club.id)}
          onclick={save}
        >
          <Bookmark fill={isSaved(club.id) ? 'currentColor' : 'none'} />
        </Button>
      </div>
      <div class="activity-card-identity">
        <div class="activity-heading">
          <Card.Title>
            <h3>
              <button class="activity-title" onclick={() => onopen(club)}>{club.name}</button>
            </h3>
          </Card.Title>
          <div class="activity-eligibility">
            {#if detail}<Card.Description
                ><span class="activity-grade"
                  ><GraduationCap aria-hidden="true" />{gradeRange(detail)}</span
                ></Card.Description
              >{:else if loading}<Skeleton class="h-5 w-24" />{:else}<Card.Description
                >Open for activity information</Card.Description
              >{/if}
            {#if detail?.isStudentLed}<Badge variant="outline"
                ><Users data-icon="inline-start" />Student led</Badge
              >{/if}
          </div>
        </div>
        <ActivityImage src={club.photo} name={club.name} />
      </div>
    </Card.Header>
    <Card.Content class="activity-card-content mt-auto">
      <div class="activity-metadata">
        {#if detail}
          <p class="activity-when">
            <CalendarDays aria-hidden="true" /><span class="activity-schedule"
              ><span>{meetingDays(detail) || 'Day to be confirmed'}</span><span
                class="metadata-time"
                >{detail.meeting.startTime && detail.meeting.endTime
                  ? `${detail.meeting.startTime}–${detail.meeting.endTime}`
                  : 'Time to be confirmed'}</span
              ></span
            >
          </p>
          <p>
            <MapPin aria-hidden="true" /><span>{locationLabel(detail.meeting.location)}</span>
          </p>
        {:else if loading}
          <Skeleton class="h-4 w-4/5" /><Skeleton class="h-4 w-3/5" />
        {:else}
          <p><CalendarDays aria-hidden="true" /><span>Details temporarily unavailable</span></p>
          <p><MapPin aria-hidden="true" /><span>Open activity to try again</span></p>
        {/if}
      </div>
    </Card.Content>
    <Card.Footer class="activity-card-footer">
      <div class="activity-year" aria-label="Academic year">
        {#if detail}{detail.academicYear || 'Year to be confirmed'}{:else if loading}<Skeleton
            class="h-4 w-20"
          />{:else}CCA activity{/if}
      </div>
      <Button variant="ghost" size="sm" onclick={() => onopen(club)}
        >View activity<ArrowUpRight data-icon="inline-end" /></Button
      >
    </Card.Footer>
  </Card.Root>
</div>
