<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import { send } from "$lib/api";

  async function setSignal(on: boolean) {
    if (await send(on ? "/hdmi_on" : "/hdmi_off")) toast.success(`HDMI signal turned ${on ? "on" : "off"}`);
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>HDMI signal</Card.Title>
    <Card.Description>
      Useful to turn connected screens on or off, if they are set up to follow their HDMI input.
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-wrap gap-2">
    <Button variant="secondary" onclick={() => setSignal(true)}>Signal on</Button>
    <Button variant="secondary" onclick={() => setSignal(false)}>Signal off</Button>
  </Card.Content>
</Card.Root>
