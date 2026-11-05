<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import { player } from "$lib/player.svelte";

  let confirming = $state(false);
</script>

<Card.Root class="ring-destructive/30">
  <Card.Header>
    <Card.Title>Factory reset</Card.Title>
    <Card.Description>
      {player.overlayActive ? "Not available while read-only is on." : "Deletes the media file and every setting, then reboots."}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Button variant="destructive" disabled={player.overlayActive} onclick={() => (confirming = true)}>Factory reset</Button>
  </Card.Content>
</Card.Root>

<ConfirmDialog
  bind:open={confirming}
  title="Factory reset the player?"
  description="The media file and known Wi-Fi networks are deleted, the hostname goes back to raspberrypi, wired Ethernet to the fixed IP 192.168.1.2, and audio and video settings to their defaults. The player then reboots."
  confirmLabel="Factory reset"
  destructive
  onconfirm={() => player.factoryReset()}
/>
