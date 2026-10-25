<script lang="ts">
  import Asterisk from '@lucide/svelte/icons/asterisk';
  let { compact = false }: { compact?: boolean } = $props();
</script>

<a class="brand" href="/" aria-label="DSAS CCA home">
  <span class="brand-symbol" aria-hidden="true"><Asterisk /></span>
  <span class="brand-name"
    >DSAS<span class="brand-subtitle">{compact ? 'CCA' : 'Co-curricular'}</span></span
  >
</a>
