<script lang="ts">
  import { toast } from 'svelte-sonner';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import Share2 from '@lucide/svelte/icons/share-2';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import Clock from '@lucide/svelte/icons/clock';
  import MapPin from '@lucide/svelte/icons/map-pin';
  import Users from '@lucide/svelte/icons/users';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import CloudSun from '@lucide/svelte/icons/cloud-sun';
  import Info from '@lucide/svelte/icons/info';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Badge } from '#lib/components/ui/badge/index.js';
  import { Skeleton } from '#lib/components/ui/skeleton/index.js';
  import * as Field from '#lib/components/ui/field/index.js';
  import * as InputGroup from '#lib/components/ui/input-group/index.js';
  import * as Dialog from '#lib/components/ui/dialog/index.js';
  import * as Alert from '#lib/components/ui/alert/index.js';
  import { getCachedDetail, getClubDetail } from '#lib/api.js';
  import { gradeRange, meetingsFor, costLabel, locationLabel } from '#lib/catalog.js';
  import ActivityImage from '#lib/components/ActivityImage.svelte';
  import { isSaved, toggleSaved } from '#lib/saved.svelte.js';
  import type { ClubBasic, ClubDetail } from '#lib/types.js';

  let { club, open = $bindable(false) }: { club: ClubBasic | null; open?: boolean } = $props();
  let detail = $state<ClubDetail | null>(null);
  let loading = $state(false);
  let error = $state('');
  let retry = $state(0);
  let shareFallback = $state('');

  $effect(() => {
    const id = club?.id;
    void retry;
    if (!open || !id) return;
    let active = true;
    const cached = getCachedDetail(id) || null;
    detail = cached;
    error = '';
    shareFallback = '';
    loading = !cached;
    getClubDetail(id)
      .then((data) => {
        if (active) detail = data;
      })
      .catch((cause: unknown) => {
        if (active)
          error = cause instanceof Error ? cause.message : 'Unable to load this activity.';
      })
      .finally(() => {
        if (active) loading = false;
      });
    return () => {
      active = false;
    };
  });

  function save() {
    if (!club) return;
    const result = toggleSaved(detail || club);
    toast(result.added ? 'Added to your shortlist' : 'Removed from your shortlist', {
      description: result.persisted
        ? undefined
        : 'Saved for this session. Browser storage is unavailable.',
    });
  }

  async function share() {
    if (!club) return;
    const url = new URL('/', location.origin);
    url.searchParams.set('activity', club.id);
    try {
      await navigator.clipboard.writeText(url.href);
      toast.success('Activity link copied');
    } catch {
      shareFallback = url.href;
      toast.info('Select and copy the activity link below.');
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="activity-dialog flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-3xl"
  >
    <div class="detail-header">
      <div class="flex flex-wrap gap-2 pr-8">
        <Badge variant="secondary">{detail?.category || 'Co-curricular activity'}</Badge>
        {#if detail?.isStudentLed}<Badge variant="outline"
            ><Users data-icon="inline-start" />Student led</Badge
          >{/if}
      </div>
      <div class="detail-heading-row">
        <Dialog.Header class="min-w-0 flex-1 text-left">
          <Dialog.Title
            ><span class="detail-title">{detail?.name || club?.name || 'Activity details'}</span
            ></Dialog.Title
          >
          <Dialog.Description
            >{detail
              ? `${detail.academicYear} · ${detail.schedule}`
              : 'Explore the details and find your fit.'}</Dialog.Description
          >
        </Dialog.Header>
        {#if detail?.photo}<ActivityImage
            class="detail-photo"
            src={detail.photo}
            name={detail.name}
          />{/if}
      </div>
    </div>
    <div class="detail-scroll">
      {#if loading}
        <div class="flex flex-col gap-5 p-6" aria-label="Loading activity details" role="status">
          <Skeleton class="h-5 w-2/3" /><Skeleton class="h-4 w-full" /><Skeleton
            class="h-4 w-4/5"
          /><span class="sr-only">Loading activity details</span>
        </div>
      {:else if error}
        <div class="p-6">
          <Alert.Root variant="destructive"
            ><CircleAlert /><Alert.Title>We couldn’t load this activity</Alert.Title
            ><Alert.Description>{error}</Alert.Description></Alert.Root
          ><Button variant="outline" onclick={() => retry++} class="mt-4"
            ><RotateCcw data-icon="inline-start" />Try again</Button
          >
        </div>
      {:else if detail}
        <div class="detail-body">
          <div class="detail-facts">
            <div>
              <GraduationCap aria-hidden="true" /><span
                >WHO IT'S FOR<strong>{gradeRange(detail)}</strong></span
              >
            </div>
            <div>
              <CalendarDays aria-hidden="true" /><span
                >DURATION<strong>{detail.duration.startDate} – {detail.duration.endDate}</strong
                ></span
              >
            </div>
          </div>
          <div class="detail-sections">
            <section>
              <h3>About this activity</h3>
              <p class="whitespace-pre-wrap">
                {detail.description || 'A description has not been provided for this activity.'}
              </p>
            </section>
            {#if detail.descriptionZh}<section lang="zh">
                <h3>活动介绍</h3>
                <p class="whitespace-pre-wrap">{detail.descriptionZh}</p>
              </section>{/if}
            {#if detail.studentLeaders?.length}<section>
                <h3>Student leaders</h3>
                <p>{detail.studentLeaders.join(', ')}</p>
              </section>{/if}
            <section>
              <h3>When & where</h3>
              <div class="meeting-list">
                {#each meetingsFor(detail) as meeting, index (index)}<div class="meeting-item">
                    <p>
                      <CalendarDays aria-hidden="true" /><strong
                        >{meeting.day || 'Day to be confirmed'}</strong
                      ><span class="meeting-frequency"
                        >{detail.duration.isRecurringWeekly
                          ? 'Every week'
                          : 'Scheduled session'}</span
                      >
                    </p>
                    <p><Clock aria-hidden="true" />{meeting.startTime}–{meeting.endTime}</p>
                    <p>
                      <MapPin aria-hidden="true" /><span>{locationLabel(meeting.location)}</span>
                    </p>
                    {#if meeting.staff?.length}<p>
                        <Users aria-hidden="true" /><span>{meeting.staff.join(', ')}</span>
                      </p>{/if}
                  </div>{/each}
              </div>
            </section>
            <section>
              <h3>Activity staff</h3>
              <div class="flex flex-wrap gap-2">
                {#each [...new Set(detail.staff || [])] as name (name)}<Badge variant="secondary"
                    >{name}</Badge
                  >{:else}<p>Staff to be confirmed.</p>{/each}
              </div>
            </section>
            {#if detail.staffForReports?.length}<section>
                <h3>Staff for reports</h3>
                <p>{detail.staffForReports.join(', ')}</p>
              </section>{/if}
            <section>
              <h3>Semester cost</h3>
              <p class="whitespace-pre-wrap">{costLabel(detail.semesterCost)}</p>
            </section>
            <section>
              <h3>Requirements</h3>
              {#if detail.requirements?.length}<ul>
                  {#each detail.requirements as requirement, index (index)}<li>
                      {requirement}
                    </li>{/each}
                </ul>{:else}<p>No specific requirements listed.</p>{/if}
            </section>
            <section>
              <h3>What to bring</h3>
              {#if detail.materials?.length}<ul>
                  {#each detail.materials as material, index (index)}<li>{material}</li>{/each}
                </ul>{:else}<p>No special materials listed.</p>{/if}
            </section>
            {#if detail.poorWeatherPlan}<Alert.Root
                ><CloudSun /><Alert.Title>Poor weather plan</Alert.Title><Alert.Description
                  ><p class="whitespace-pre-wrap">{detail.poorWeatherPlan}</p></Alert.Description
                ></Alert.Root
              >{/if}
            {#if detail.isPreSignup}<Alert.Root
                ><Info /><Alert.Title>Pre-registration required</Alert.Title><Alert.Description
                  >Check with your school before joining this activity.</Alert.Description
                ></Alert.Root
              >{/if}
          </div>
        </div>
      {/if}
    </div>
    {#if shareFallback}
      <Field.FieldGroup class="px-6 pb-5">
        <Field.Field>
          <Field.FieldLabel for="activity-share-link">Activity link</Field.FieldLabel>
          <InputGroup.Root>
            <InputGroup.Input
              id="activity-share-link"
              value={shareFallback}
              readonly
              onfocus={(event) => event.currentTarget.select()}
            />
            <InputGroup.Addon><Share2 /></InputGroup.Addon>
          </InputGroup.Root>
        </Field.Field>
      </Field.FieldGroup>
    {/if}
    <Dialog.Footer
      class="detail-footer mx-0 mb-0 flex-row flex-wrap items-center justify-between gap-3"
    >
      <span class="detail-id">ACTIVITY #{club?.id}</span>
      <div class="flex gap-2">
        <Button variant="outline" onclick={share}><Share2 data-icon="inline-start" />Share</Button
        ><Button
          onclick={save}
          aria-pressed={!!club && isSaved(club.id)}
          disabled={loading || (!detail && club?.name === 'Activity details')}
          ><Bookmark
            data-icon="inline-start"
            fill={club && isSaved(club.id) ? 'currentColor' : 'none'}
          />{club && isSaved(club.id) ? 'Saved' : 'Save activity'}</Button
        >
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
