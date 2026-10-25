<script lang="ts">
  import * as Card from '#lib/components/ui/card/index.js';
  import { Skeleton } from '#lib/components/ui/skeleton/index.js';
  import { cn } from '#lib/utils.js';
  import type { ViewMode } from '#lib/types.js';

  let { view = 'grid' }: { view?: ViewMode } = $props();
</script>

<Card.Root
  class={cn('activity-card h-full', view === 'list' && 'activity-card-list')}
  aria-hidden="true"
>
  <Card.Header class="activity-card-header">
    <div class="activity-card-top"><Skeleton class="h-5 w-28" /><Skeleton class="size-9" /></div>
    <div class="activity-card-identity">
      <div class="activity-heading">
        <Card.Title>
          <div class="flex flex-col gap-2">
            <Skeleton class="h-5 w-full" /><Skeleton class="h-5 w-3/4" />
          </div>
        </Card.Title>
        <div class="activity-eligibility"><Skeleton class="h-5 w-24" /></div>
      </div>
      <Skeleton class="activity-thumbnail" />
    </div>
  </Card.Header>
  <Card.Content class="activity-card-content mt-auto">
    <div class="activity-metadata">
      <Skeleton class="h-5 w-3/4" /><Skeleton class="h-5 w-1/2" />
    </div>
  </Card.Content>
  <Card.Footer class="activity-card-footer"
    ><Skeleton class="h-4 w-20" /><Skeleton class="h-8 w-28" /></Card.Footer
  >
</Card.Root>
