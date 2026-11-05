<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import RotateCwIcon from "@lucide/svelte/icons/rotate-cw";
  import PowerIcon from "@lucide/svelte/icons/power";
  import { player } from "$lib/player.svelte";

  let confirmingReboot = $state(false);
  let confirmingShutdown = $state(false);
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Power</Card.Title>
  </Card.Header>
  <Card.Content class="flex flex-wrap gap-2">
    <Button variant="secondary" onclick={() => (confirmingReboot = true)}><RotateCwIcon />Reboot</Button>
    <Button variant="secondary" onclick={() => (confirmingShutdown = true)}><PowerIcon />Shut down</Button>
  </Card.Content>
</Card.Root>

<ConfirmDialog
  bind:open={confirmingReboot}
  title="Reboot the player?"
  description="Playback stops until it has restarted."
  confirmLabel="Reboot"
  onconfirm={() => player.reboot()}
/>
<ConfirmDialog
  bind:open={confirmingShutdown}
  title="Shut down the player?"
  description="It stays off until you unplug it and plug it back in."
  confirmLabel="Shut down"
  destructive
  onconfirm={() => player.shutdown()}
/>
