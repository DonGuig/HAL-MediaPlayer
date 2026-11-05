<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import Field from "$lib/components/Field.svelte";
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import { player } from "$lib/player.svelte";
  import { api, send } from "$lib/api";
  import { isHostname } from "$lib/format";

  let hostname = $state("");
  let applying = $state(false);

  const error = $derived(
    !hostname ? "Hostname is required" : !isHostname(hostname) ? "Incorrect hostname format" : "",
  );

  async function apply(event: SubmitEvent) {
    event.preventDefault();
    applying = true;
    if (await send("/setHostname", { body: { hostname } })) {
      player.askForReboot(`The player will then be at ${hostname}.local.`);
      player.refreshHostname().catch(() => {});
    }
    applying = false;
  }

  onMount(() => {
    api.get<{ hostname: string }>("/getHostname").then((res) => (hostname = res.hostname), () => {});
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Hostname</Card.Title>
    <Card.Description>The player is reachable at <i>hostname</i>.local on the network.</Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="flex flex-wrap items-start gap-3" onsubmit={apply}>
      <Field id="hostname" label="Hostname" {error}>
        <Input id="hostname" bind:value={hostname} disabled={player.overlayActive} aria-invalid={!!error} autocapitalize="off" class="w-56" />
      </Field>
      <Button type="submit" class="mt-5.5" disabled={player.overlayActive || applying || !!error}>
        {#if applying}<LoaderIcon class="animate-spin" />{/if}Apply
      </Button>
    </form>
  </Card.Content>
</Card.Root>
