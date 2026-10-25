<script lang="ts">
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import Asterisk from '@lucide/svelte/icons/asterisk';
  import { Separator } from '#lib/components/ui/separator/index.js';
</script>

<footer class="site-footer">
  <Separator />
  <div class="footer-inner">
    <div class="footer-signature">
      <Asterisk aria-hidden="true" /><span>A little curiosity. A world of possibilities.</span>
    </div>
    <div class="footer-meta">
      <span>© {new Date().getFullYear()} DSAS CCA</span><a
        href="https://dsas-cca.jamesflare.com"
        target="_blank"
        rel="noreferrer">Data by James Flare<ArrowUpRight aria-hidden="true" /></a
      >
    </div>
  </div>
</footer>
