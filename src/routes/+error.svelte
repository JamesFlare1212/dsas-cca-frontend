<script lang="ts">
  import { page } from '$app/state';
  import Compass from '@lucide/svelte/icons/compass';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import * as Empty from '#lib/components/ui/empty/index.js';
  import { Button } from '#lib/components/ui/button/index.js';
</script>

<svelte:head><title>{page.status} · DSAS CCA</title></svelte:head>
<Empty.Root class="error-page"
  ><Empty.Header
    ><Empty.Media variant="icon"><Compass /></Empty.Media><Empty.Title
      >{page.status === 404
        ? 'A little off the beaten path.'
        : 'Something went off course.'}</Empty.Title
    ><Empty.Description
      >{page.status === 404
        ? 'This page could not be found. Let’s get you back to the possibilities.'
        : 'Please try again in a moment.'}</Empty.Description
    ></Empty.Header
  ><Empty.Content
    ><Button href="/">Back to activities<ArrowRight data-icon="inline-end" /></Button
    ></Empty.Content
  ></Empty.Root
>
