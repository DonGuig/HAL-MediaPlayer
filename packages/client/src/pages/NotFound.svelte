<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { navigate, HOME } from "$lib/router.svelte";
</script>

<div class="py-24 text-center">
  <h1 class="text-2xl font-semibold">Page not found</h1>
  <p class="mt-2 mb-6 text-muted-foreground">This page doesn't exist.</p>
  <Button href={HOME} onclick={(e: MouseEvent) => navigate(e, HOME)}>Back to playback</Button>
</div>
