<script lang="ts">
  let { active }: { active: boolean } = $props();
</script>

<span class={["size-2 shrink-0 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground/40"]}></span>
