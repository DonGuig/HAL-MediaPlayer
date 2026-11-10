<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import Field from "$lib/components/Field.svelte";
  import Segmented from "$lib/components/Segmented.svelte";
  import StatusDot from "$lib/components/StatusDot.svelte";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import { toast } from "svelte-sonner";
  import { player } from "$lib/player.svelte";
  import { api, errorMessage, isConnectionError, SERVER } from "$lib/api";
  import { isIpv4 } from "$lib/format";

  type Mode = "DHCP" | "Fixed IP";
  type WiredConfig = { DHCPorFixed: Mode; ipAddress: string; netmask: string; gateway: string; connected: boolean };
  // Set when a change moves the player away from the address this page talks to
  type MovedTo = { ipAddress: string } | { dhcp: true };

  let mode = $state<Mode>("DHCP");
  let ipAddress = $state("");
  let netmask = $state("");
  let gateway = $state("");
  let cableConnected = $state(false);
  let applied = $state<{ mode: Mode; ipAddress: string } | null>(null);
  let movedTo = $state<MovedTo | null>(null);
  let applying = $state(false);

  const fixed = $derived(mode === "Fixed IP");
  const ipError = $derived(fixed && !isIpv4(ipAddress) ? "Incorrect address format" : "");
  const netmaskError = $derived(fixed && !isIpv4(netmask) ? "Incorrect address format" : "");
  // Optional: left empty, the player has no gateway
  const gatewayError = $derived(fixed && gateway.trim() !== "" && !isIpv4(gateway.trim()) ? "Incorrect address format" : "");
  const disabled = $derived(player.overlayActive || !fixed);

  const pageUrlAt = (address: string) => {
    const port = window.location.port;
    return `http://${address}${port ? `:${port}` : ""}`;
  };

  async function load(silent = false) {
    try {
      const res = await api.get<WiredConfig>("/getWiredNetwokConfig", { silent });
      applied = { mode: res.DHCPorFixed, ipAddress: res.ipAddress };
      mode = res.DHCPorFixed;
      ipAddress = res.ipAddress;
      netmask = res.netmask;
      gateway = res.gateway;
      cableConnected = res.connected;
    } catch {
      // api already shows the error, unless silent
    }
  }

  async function apply(event: SubmitEvent) {
    event.preventDefault();
    applying = true;
    // The new address may not answer from here, so the page can't check on it afterwards.
    // Only known when the page uses the wired IP: through Wi-Fi or a hostname it stays reachable.
    const pageUsesWiredIp = applied !== null && SERVER.split(":")[0] === applied.ipAddress;
    const moving = pageUsesWiredIp && (fixed ? ipAddress !== applied?.ipAddress : applied?.mode !== "DHCP");
    try {
      await api.post("/setWiredNetwokConfig", {
        body: { DHCPorFixed: mode, ipAddress, netmask, gateway: gateway.trim() },
        silent: moving,
      });
    } catch (err) {
      // Losing the connection is expected when moving: the request went through
      if (!moving || !isConnectionError(err)) {
        if (moving) toast.error(errorMessage(err));
        applying = false;
        return;
      }
    }
    applying = false;
    if (moving) {
      movedTo = fixed ? { ipAddress } : { dhcp: true };
    } else {
      // The server doesn't wait for the connection to come up, and DHCP can take a few seconds
      setTimeout(() => load(true), 1000);
      setTimeout(() => load(true), 5000);
    }
  }

  onMount(() => {
    load();
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Wired Ethernet</Card.Title>
    <Card.Description class="flex items-center gap-2">
      <StatusDot active={cableConnected} />{cableConnected ? "Connected" : "Not connected"}
    </Card.Description>
    <Card.Action>
      <Button variant="ghost" size="icon" aria-label="Refresh wired status" onclick={() => load()}><RefreshCwIcon /></Button>
    </Card.Action>
  </Card.Header>
  <Card.Content>
    <form class="space-y-4" onsubmit={apply}>
      <Segmented
        label="Address mode"
        options={[
          { value: "DHCP", label: "DHCP" },
          { value: "Fixed IP", label: "Fixed IP" },
        ]}
        value={mode}
        disabled={player.overlayActive}
        onchange={(value) => (mode = value)}
      />
      <div class="grid grid-cols-2 gap-3">
        <Field id="wired-ip" label="IP address" error={ipError}>
          <Input id="wired-ip" bind:value={ipAddress} {disabled} aria-invalid={!!ipError} inputmode="decimal" class="tabular-nums" />
        </Field>
        <Field id="wired-netmask" label="Netmask" error={netmaskError}>
          <Input id="wired-netmask" bind:value={netmask} {disabled} aria-invalid={!!netmaskError} inputmode="decimal" class="tabular-nums" />
        </Field>
        <Field id="wired-gateway" label="Gateway (optional)" error={gatewayError}>
          <Input id="wired-gateway" bind:value={gateway} {disabled} aria-invalid={!!gatewayError} inputmode="decimal" class="tabular-nums" />
        </Field>
      </div>
      <Button type="submit" disabled={player.overlayActive || applying || !!ipError || !!netmaskError || !!gatewayError}>
        {#if applying}<LoaderIcon class="animate-spin" />{/if}Apply
      </Button>
    </form>
  </Card.Content>
</Card.Root>

<Dialog.Root bind:open={() => movedTo !== null, (open) => !open && (movedTo = null)}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>The player's address changed</Dialog.Title>
      <Dialog.Description>
        {#if movedTo && "ipAddress" in movedTo}
          Continue at
          <a class="text-primary underline underline-offset-4" href={pageUrlAt(movedTo.ipAddress)}>{pageUrlAt(movedTo.ipAddress)}</a>.
          Your computer must be on the same network as this address.
        {:else}
          The player now takes its wired address from the DHCP server, so this page can no longer reach it at its old
          address. Look for the new address on your DHCP server, or try its hostname followed by .local in your browser.
        {/if}
      </Dialog.Description>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
