<script lang="ts">
  import * as Pagination from '#lib/components/ui/pagination/index.js';
  let {
    count,
    pageSize,
    page,
    onPageChange,
  }: {
    count: number;
    pageSize: number;
    page: number;
    onPageChange: (page: number) => void;
  } = $props();
</script>

<div class="directory-pagination">
  <p>
    Showing {Math.min((page - 1) * pageSize + 1, count)}–{Math.min(page * pageSize, count)} of {count.toLocaleString()}
  </p>
  {#if count > pageSize}
    <Pagination.Root {count} perPage={pageSize} {page} {onPageChange} siblingCount={0}>
      {#snippet children({ pages, currentPage })}
        <Pagination.Content>
          <Pagination.Item><Pagination.Previous /></Pagination.Item>
          {#each pages as item (item.key)}
            {#if item.type === 'ellipsis'}<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
            {:else}<Pagination.Item
                ><Pagination.Link page={item} isActive={currentPage === item.value}
                  >{item.value}</Pagination.Link
                ></Pagination.Item
              >{/if}
          {/each}
          <Pagination.Item><Pagination.Next /></Pagination.Item>
        </Pagination.Content>
      {/snippet}
    </Pagination.Root>
  {/if}
</div>
