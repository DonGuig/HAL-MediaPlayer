<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import { player } from "$lib/player.svelte";
  import { send } from "$lib/api";

  let busy = $state<"enable" | "disable" | null>(null);

  async function change(action: "enable" | "disable") {
    busy = action;
    if (await send(action === "enable" ? "/setReadOnlyFS" : "/disableOverlayFS")) player.askForReboot();
    busy = null;
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Read-only file system</Card.Title>
    <Card.Description>Protects the SD card from power failures. Turn it on once you are done configuring.</Card.Description>
    <Card.Action>
      <Badge variant="outline">{player.overlayActive ? "On" : "Off"}</Badge>
    </Card.Action>
  </Card.Header>
  <Card.Content class="space-y-3">
    <p class="text-sm text-muted-foreground">
      While it's on, writes go to RAM instead of the SD card, so any change is lost at the next reboot.
    </p>
    <div class="flex flex-wrap gap-2">
      <Button disabled={player.overlayActive || busy !== null} onclick={() => change("enable")}>
        {#if busy === "enable"}<LoaderIcon class="animate-spin" />{/if}Enable
      </Button>
      <Button variant="outline" disabled={busy !== null} onclick={() => change("disable")}>
        {#if busy === "disable"}<LoaderIcon class="animate-spin" />{/if}Disable
      </Button>
    </div>
  </Card.Content>
</Card.Root>
