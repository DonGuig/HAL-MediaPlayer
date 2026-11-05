<script lang="ts" generics="T extends string">
  let {
    options,
    value,
    disabled = false,
    label,
    onchange,
  }: {
    options: { value: T; label: string }[];
    value: T;
    disabled?: boolean;
    label: string;
    onchange: (value: T) => void;
  } = $props();
</script>

<div role="group" aria-label={label} class="inline-flex flex-wrap gap-0.5 rounded-lg border bg-muted/40 p-0.5">
  {#each options as option (option.value)}
    <button
      type="button"
      {disabled}
      aria-pressed={option.value === value}
      onclick={() => option.value !== value && onchange(option.value)}
      class={[
        "h-8 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        option.value === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      ]}
    >
      {option.label}
    </button>
  {/each}
</div>
