<script lang="ts">
  import { page } from '$app/state';
  import { mode, toggleMode } from 'mode-watcher';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import Compass from '@lucide/svelte/icons/compass';
  import Users from '@lucide/svelte/icons/users';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import CircleHelp from '@lucide/svelte/icons/circle-help';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import { Button } from '#lib/components/ui/button/index.js';
  import { Badge } from '#lib/components/ui/badge/index.js';
  import * as Dialog from '#lib/components/ui/dialog/index.js';
  import * as Tooltip from '#lib/components/ui/tooltip/index.js';
  import Brand from '#lib/components/Brand.svelte';
  import { saved } from '#lib/saved.svelte.js';
  import { cn } from '#lib/utils.js';
  let guideOpen = $state(false);
  const navigation = [
    { href: '/', label: 'Explore activities', Icon: Compass },
    { href: '/saved/', label: 'My shortlist', Icon: Bookmark },
    { href: '/staff/', label: 'Staff directory', Icon: Users },
  ];
</script>

<header class="site-header">
  <div class="header-inner">
    <Brand />
    <nav class="main-nav" aria-label="Main navigation">
      {#each navigation as item (item.href)}
        {@const active = page.url.pathname === item.href}
        <a
          href={item.href}
          class={cn('nav-link', active && 'is-active')}
          aria-current={active ? 'page' : undefined}
        >
          <item.Icon aria-hidden="true" />
          <span>{item.label}</span>
          {#if item.href === '/saved/' && saved.clubs.length > 0}
            <Badge variant="secondary">{saved.clubs.length}</Badge>
          {/if}
        </a>
      {/each}
    </nav>
    <div class="header-actions">
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="icon-lg"
              aria-label={mode.current === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'}
              onclick={toggleMode}
            >
              {#if mode.current === 'dark'}<Sun />{:else}<Moon />{/if}
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>Switch appearance</Tooltip.Content>
      </Tooltip.Root>
      <Button
        variant="outline"
        onclick={() => (guideOpen = true)}
        class="guide-button"
        aria-label="Quick guide"
      >
        <CircleHelp data-icon="inline-start" /><span>Quick guide</span>
      </Button>
    </div>
  </div>
</header>

<Dialog.Root bind:open={guideOpen}>
  <Dialog.Content class="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Make room for something new.</Dialog.Title>
      <Dialog.Description>Your guide to co-curricular life at DSAS.</Dialog.Description>
    </Dialog.Header>
    <ol class="guide-steps">
      <li>
        <span>01</span>
        <div>
          <h3>Follow your curiosity</h3>
          <p>Explore activities by category, academic year, grade or club leader.</p>
        </div>
      </li>
      <li>
        <span>02</span>
        <div>
          <h3>Get the full picture</h3>
          <p>Open an activity for meeting times, locations, costs and requirements.</p>
        </div>
      </li>
      <li>
        <span>03</span>
        <div>
          <h3>Build your shortlist</h3>
          <p>
            Save the activities you love. Your shortlist stays in this browser, ready when you are.
          </p>
        </div>
      </li>
    </ol>
    <p class="text-sm text-muted-foreground">
      This is an information directory. To join an activity, follow your school’s registration
      process or speak with the listed staff.
    </p>
    <Dialog.Footer
      ><Button onclick={() => (guideOpen = false)}
        >Let's explore<ArrowRight data-icon="inline-end" /></Button
      ></Dialog.Footer
    >
  </Dialog.Content>
</Dialog.Root>
