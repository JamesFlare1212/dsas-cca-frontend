<script lang="ts">
  import * as Field from '#lib/components/ui/field/index.js';
  import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
  import { Separator } from '#lib/components/ui/separator/index.js';
  import { Button } from '#lib/components/ui/button/index.js';
  import FilterSelect from '#lib/components/FilterSelect.svelte';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import Palette from '@lucide/svelte/icons/palette';
  import Dumbbell from '@lucide/svelte/icons/dumbbell';
  import FlaskConical from '@lucide/svelte/icons/flask-conical';
  import Languages from '@lucide/svelte/icons/languages';
  import Globe from '@lucide/svelte/icons/globe';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import type { Counts, Filters } from '#lib/types.js';
  import { gradeOptions } from '#lib/grades.js';
  let {
    filters = $bindable(),
    categories,
    years,
    onreset,
    idPrefix = 'desktop',
  }: {
    filters: Filters;
    categories: Counts;
    years: Counts;
    onreset: () => void;
    idPrefix?: string;
  } = $props();

  const categoryIcons: Record<string, typeof LayoutGrid> = {
    'Sport & Health': Dumbbell,
    'Expressive Arts': Palette,
    STEAM: FlaskConical,
    'Languages & Media': Languages,
    Humanities: Globe,
    Supercurricular: Sparkles,
    'After School Care': HeartHandshake,
  };
  const preferredOrder = Object.keys(categoryIcons);
  let categoryOptions = $derived([
    ...new Set([
      ...preferredOrder.filter((name) => name in categories),
      ...Object.keys(categories),
    ]),
  ]);
  let yearItems = $derived([
    { value: 'all', label: 'All academic years' },
    ...Object.keys(years)
      .sort()
      .reverse()
      .map((year) => ({ value: year, label: year })),
  ]);
</script>

<div class="filter-panel">
  <div class="filter-panel-heading">
    <h2><SlidersHorizontal aria-hidden="true" />Filters</h2>
    <Button variant="ghost" size="sm" onclick={onreset}>Reset all</Button>
  </div>
  <Field.FieldGroup>
    <Field.Field>
      <Field.FieldLabel id="{idPrefix}-category-label"
        ><span class="filter-label">CATEGORIES</span></Field.FieldLabel
      >
      <ToggleGroup.Root
        type="single"
        orientation="vertical"
        value={filters.category}
        onValueChange={(value) => (filters.category = value || 'all')}
        aria-labelledby="{idPrefix}-category-label"
        class="category-options w-full items-stretch"
        spacing={1}
      >
        <ToggleGroup.Item value="all"><LayoutGrid /><span>All activities</span></ToggleGroup.Item>
        {#each categoryOptions as category (category)}
          {@const Icon = categoryIcons[category] || LayoutGrid}
          <ToggleGroup.Item value={category}><Icon /><span>{category}</span></ToggleGroup.Item>
        {/each}
      </ToggleGroup.Root>
    </Field.Field>
    <Separator />
    <Field.Field>
      <Field.FieldLabel for="{idPrefix}-year"
        ><span class="filter-label">ACADEMIC YEAR</span></Field.FieldLabel
      >
      <FilterSelect
        id="{idPrefix}-year"
        label="Academic year"
        bind:value={filters.academicYear}
        items={yearItems}
      />
    </Field.Field>
    <Field.Field>
      <Field.FieldLabel for="{idPrefix}-grade"
        ><span class="filter-label">YOUR GRADE</span></Field.FieldLabel
      >
      <FilterSelect
        id="{idPrefix}-grade"
        label="Grade"
        bind:value={filters.grade}
        items={gradeOptions}
      />
    </Field.Field>
    <Field.Field>
      <Field.FieldLabel id="{idPrefix}-leader-label"
        ><span class="filter-label">LED BY</span></Field.FieldLabel
      >
      <ToggleGroup.Root
        type="single"
        value={filters.leader}
        onValueChange={(value) => (filters.leader = value || 'all')}
        variant="outline"
        aria-labelledby="{idPrefix}-leader-label"
        class="leader-options w-full"
      >
        <ToggleGroup.Item value="all">Anyone</ToggleGroup.Item>
        <ToggleGroup.Item value="student">Students</ToggleGroup.Item>
        <ToggleGroup.Item value="staff">Staff</ToggleGroup.Item>
      </ToggleGroup.Root>
    </Field.Field>
  </Field.FieldGroup>
  <div class="filter-note">
    <Sparkles aria-hidden="true" />
    <p>Your next favourite thing<br />might be something new.</p>
  </div>
</div>
