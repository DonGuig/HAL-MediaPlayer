<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import { player } from "$lib/player.svelte";
  import { api, send } from "$lib/api";
  import { formatBytes } from "$lib/format";

  let size = $state(0);
  let expanding = $state(false);

  async function expand() {
    expanding = true;
    if (await send("/expandFS")) player.askForReboot();
    expanding = false;
  }

  onMount(() => {
    api.get<{ size: number }>("/getFSSize").then((res) => (size = res.size), () => {});
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>File system size</Card.Title>
    <Card.Description>{player.overlayActive ? "Not available while read-only is on" : formatBytes(size)}</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-3">
    <p class="text-sm text-muted-foreground">
      Expand it if the size looks far smaller than the SD card (typically less than 5 GB).
    </p>
    <Button variant="secondary" disabled={player.overlayActive || expanding} onclick={expand}>
      {#if expanding}<LoaderIcon class="animate-spin" />{/if}Expand file system
    </Button>
  </Card.Content>
</Card.Root>
