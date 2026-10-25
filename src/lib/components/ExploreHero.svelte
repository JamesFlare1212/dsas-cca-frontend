<script lang="ts">
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Asterisk from '@lucide/svelte/icons/asterisk';
  import MoveUpRight from '@lucide/svelte/icons/move-up-right';
  import { Button } from '#lib/components/ui/button/index.js';
</script>

<section class="explore-hero" aria-labelledby="hero-heading">
  <div class="hero-copy">
    <p class="eyebrow"><span class="live-dot"></span>BEYOND THE CLASSROOM</p>
    <h1 id="hero-heading">
      Find your thing.<br /><span>Make it yours.</span><svg
        class="hero-underline"
        aria-hidden="true"
        viewBox="0 0 320 14"><path d="M3 10 Q140 -4 317 6" /></svg
      >
    </h1>
    <p class="hero-description">
      A new skill. Your next team. A place to belong.<br class="hidden sm:block" /> Discover the activities
      that make your school life, yours.
    </p>
    <div class="hero-bottom">
      <Button href="#activities" size="lg" class="rounded-full px-5"
        >Find an activity<ArrowDown data-icon="inline-end" /></Button
      >
      <span class="hero-note">Stay curious. Try something new.</span>
    </div>
  </div>
  <div class="hero-art" aria-hidden="true">
    <div class="hero-orbit"></div>
    <div class="hero-photo hero-photo-sport">
      <img
        src="/images/basketball.avif"
        alt=""
        width="450"
        height="245"
        fetchpriority="high"
      /><span>Find your team<MoveUpRight /></span>
    </div>
    <div class="hero-photo hero-photo-art">
      <img src="/images/art.avif" alt="" width="450" height="235" /><span
        >Make something new<Sparkles /></span
      >
    </div>
    <div class="hero-spark"><Asterisk /></div>
    <div class="hero-sticker"><Sparkles /><span>More than<br />an after-school thing.</span></div>
    <span class="hero-small-note">YOUR NEXT CHAPTER STARTS HERE ↗</span>
  </div>
</section>
