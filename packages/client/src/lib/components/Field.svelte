<script lang="ts">
  import type { Snippet } from "svelte";
  import { Label } from "$lib/components/ui/label";

  let { id, label, error = "", children }: { id: string; label: string; error?: string; children: Snippet } = $props();
</script>

<div class="min-w-0 space-y-1.5">
  <Label for={id} class="text-muted-foreground">{label}</Label>
  {@render children()}
  {#if error}
    <p class="text-xs text-destructive">{error}</p>
  {/if}
</div>
