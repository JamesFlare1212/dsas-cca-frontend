<script lang="ts">
  import Image from '@lucide/svelte/icons/image';
  import ZoomIn from '@lucide/svelte/icons/zoom-in';
  import X from '@lucide/svelte/icons/x';
  import { Button } from '#lib/components/ui/button/index.js';
  import * as Dialog from '#lib/components/ui/dialog/index.js';
  import { cn } from '#lib/utils.js';

  let {
    src,
    name,
    class: className = 'activity-thumbnail',
  }: {
    src: string;
    name: string;
    class?: string;
  } = $props();
  let open = $state(false);
  let failed = $state(false);

  $effect(() => {
    void src;
    open = false;
    failed = false;
  });

  function imageError() {
    failed = true;
    open = false;
  }
</script>

<Dialog.Root bind:open>
  {#if src && !failed}
    <Dialog.Trigger
      class={cn('activity-image-trigger', className)}
      aria-label="Enlarge image of {name}"
    >
      <img
        {src}
        alt=""
        loading="lazy"
        decoding="async"
        width="72"
        height="72"
        onerror={imageError}
      />
      <span class="image-zoom-hint" aria-hidden="true"><ZoomIn /></span>
    </Dialog.Trigger>
    <Dialog.Content
      class="image-lightbox gap-0 overflow-hidden bg-transparent p-0 shadow-none ring-0"
      showCloseButton={false}
    >
      <Dialog.Title class="sr-only">{name}</Dialog.Title>
      <Dialog.Description class="sr-only">Full activity image</Dialog.Description>
      <Dialog.Close class="image-lightbox-close" aria-label="Close image preview">
        <img {src} alt={name} onerror={imageError} />
      </Dialog.Close>
      <Dialog.Close>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="secondary"
            size="icon"
            class="image-lightbox-dismiss absolute top-2 right-2 rounded-full shadow-md"
            aria-label="Close image"><X /></Button
          >
        {/snippet}
      </Dialog.Close>
    </Dialog.Content>
  {:else}
    <span class={cn('activity-image-fallback', className)} aria-hidden="true"><Image /></span>
  {/if}
</Dialog.Root>
