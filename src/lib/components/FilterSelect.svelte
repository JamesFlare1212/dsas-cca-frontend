<script lang="ts">
  import * as Select from '#lib/components/ui/select/index.js';
  let {
    id,
    label,
    value = $bindable('all'),
    items,
    disabled = false,
  }: {
    id: string;
    label: string;
    value?: string;
    items: { value: string; label: string }[];
    disabled?: boolean;
  } = $props();
</script>

<Select.Root type="single" {items} bind:value {disabled}>
  <Select.Trigger {id} aria-label={label} class="w-full">
    <Select.Value placeholder={label} />
  </Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.Label>{label}</Select.Label>
      {#each items as item (item.value)}
        <Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
      {/each}
    </Select.Group>
  </Select.Content>
</Select.Root>
