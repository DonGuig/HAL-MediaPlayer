<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import Field from "$lib/components/Field.svelte";
  import Segmented from "$lib/components/Segmented.svelte";
  import StatusDot from "$lib/components/StatusDot.svelte";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import EyeIcon from "@lucide/svelte/icons/eye";
  import EyeOffIcon from "@lucide/svelte/icons/eye-off";
  import { toast } from "svelte-sonner";
  import { player } from "$lib/player.svelte";
  import { api, isConnectionError, send } from "$lib/api";
  import { isIpv4 } from "$lib/format";

  // A little above the time the server gives nmcli to connect (utils/network.py)
  const WIFI_CONNECT_TIMEOUT_MS = 35000;
  const WIFI_SETTLE_MS = 3000;

  type Mode = "DHCP" | "Fixed IP";
  type CurrentWifi = { SSID: string; DHCPorFixed: Mode; ipAddress: string; netmask: string; gateway: string };

  let active = $state(true);
  let currentSsid = $state<string | null>(null);
  let ssid = $state("");
  let password = $state("");
  let hidden = $state(false);
  let mode = $state<Mode>("DHCP");
  let ipAddress = $state("");
  let netmask = $state("");
  let gateway = $state("");
  // The mode comes from the player only once: after that, it is what the user picked
  let modeLoaded = false;
  let showPassword = $state(false);
  let connecting = $state(false);
  let confirmingForget = $state(false);
  let touched = $state({ ssid: false, password: false });

  const ssidInvalid = $derived(ssid.length < 1 || ssid.length > 32);
  const passwordInvalid = $derived(password.length < 8 || password.length > 64);
  const ssidError = $derived(touched.ssid && ssidInvalid ? "Between 1 and 32 characters" : "");
  const passwordError = $derived(touched.password && passwordInvalid ? "Between 8 and 64 characters" : "");
  const formDisabled = $derived(player.overlayActive || !active);
  const fixed = $derived(mode === "Fixed IP");
  const ipError = $derived(fixed && !isIpv4(ipAddress) ? "Incorrect address format" : "");
  const netmaskError = $derived(fixed && !isIpv4(netmask) ? "Incorrect address format" : "");
  // Optional: left empty, the player has no gateway on Wi-Fi
  const gatewayError = $derived(fixed && gateway.trim() !== "" && !isIpv4(gateway.trim()) ? "Incorrect address format" : "");
  const ipDisabled = $derived(formDisabled || !fixed);

  function loadActive() {
    api.get<{ active: boolean }>("/getIsWifiActive").then((res) => (active = res.active), () => {});
  }

  function loadCurrent() {
    api.get<CurrentWifi>("/getCurrentWifi").then(
      (res) => {
        currentSsid = res.SSID || null;
        if (!modeLoaded && res.SSID) {
          mode = res.DHCPorFixed;
          modeLoaded = true;
        }
        // In DHCP mode the fields can't be edited and show the current address. Fixed IP
        // fields are left alone, as the user may be typing in them.
        if (mode === "DHCP") {
          ipAddress = res.ipAddress;
          netmask = res.netmask;
          gateway = res.gateway;
        }
      },
      () => {},
    );
  }

  async function setActive(value: boolean) {
    active = value;
    await send("/setIsWifiActive", { body: { active: value ? "true" : "false" } });
    // Also puts the switch back if that failed
    setTimeout(loadActive, WIFI_SETTLE_MS);
    setTimeout(loadCurrent, WIFI_SETTLE_MS);
  }

  async function connect(event: SubmitEvent) {
    event.preventDefault();
    connecting = true;
    try {
      await api.post("/setWifiConfig", {
        body: { SSID: ssid, pass: password, hidden, DHCPorFixed: mode, ipAddress, netmask, gateway: gateway.trim() },
        silent: true,
        timeoutMs: WIFI_CONNECT_TIMEOUT_MS,
      });
      toast.success(`Connected to ${ssid}`);
      password = "";
      touched.password = false;
      loadCurrent();
      // DHCP may hand out the address a moment after connecting
      if (!fixed) setTimeout(loadCurrent, WIFI_SETTLE_MS);
    } catch (err) {
      if (isConnectionError(err)) {
        toast.warning("Lost contact with the player while connecting. If you reach it through Wi-Fi, it may have moved to the new network.");
      } else {
        toast.error((err as Error).message);
      }
    }
    connecting = false;
  }

  async function forget() {
    if (await send("/forgetKnownWifis")) {
      setTimeout(loadActive, 1000);
      setTimeout(loadCurrent, 1000);
    }
  }

  onMount(() => {
    loadActive();
    loadCurrent();
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Title><Label for="wifi-active" class="text-base">Wi-Fi</Label></Card.Title>
    <Card.Description class="flex min-w-0 items-center gap-2">
      <StatusDot active={currentSsid !== null} />
      <span class="truncate">{currentSsid ? `Connected to ${currentSsid}` : "Not connected"}</span>
    </Card.Description>
    <Card.Action class="flex items-center gap-1">
      <Button variant="ghost" size="icon" aria-label="Refresh Wi-Fi status" onclick={loadCurrent}><RefreshCwIcon /></Button>
      <Switch id="wifi-active" checked={active} disabled={player.overlayActive} onCheckedChange={setActive} />
    </Card.Action>
  </Card.Header>
  <Card.Content class="space-y-4">
    <form class="space-y-4" onsubmit={connect}>
      <div class="grid grid-cols-2 gap-3">
        <Field id="wifi-ssid" label="Network name (SSID)" error={ssidError}>
          <Input
            id="wifi-ssid"
            bind:value={ssid}
            disabled={formDisabled}
            aria-invalid={!!ssidError}
            autocomplete="off"
            onblur={() => (touched.ssid = true)}
          />
        </Field>
        <Field id="wifi-password" label="Password" error={passwordError}>
          <div class="relative">
            <Input
              id="wifi-password"
              type={showPassword ? "text" : "password"}
              bind:value={password}
              disabled={formDisabled}
              aria-invalid={!!passwordError}
              autocomplete="new-password"
              class="pr-8"
              onblur={() => (touched.password = true)}
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 grid w-8 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onclick={() => (showPassword = !showPassword)}
            >
              {#if showPassword}<EyeOffIcon class="size-4" />{:else}<EyeIcon class="size-4" />{/if}
            </button>
          </div>
        </Field>
      </div>
      <Segmented
        label="Address mode"
        options={[
          { value: "DHCP", label: "DHCP" },
          { value: "Fixed IP", label: "Fixed IP" },
        ]}
        value={mode}
        disabled={formDisabled}
        onchange={(value) => (mode = value)}
      />
      <div class="grid grid-cols-2 gap-3">
        <Field id="wifi-ip" label="IP address" error={ipError}>
          <Input id="wifi-ip" bind:value={ipAddress} disabled={ipDisabled} aria-invalid={!!ipError} inputmode="decimal" class="tabular-nums" />
        </Field>
        <Field id="wifi-netmask" label="Netmask" error={netmaskError}>
          <Input id="wifi-netmask" bind:value={netmask} disabled={ipDisabled} aria-invalid={!!netmaskError} inputmode="decimal" class="tabular-nums" />
        </Field>
        <Field id="wifi-gateway" label="Gateway (optional)" error={gatewayError}>
          <Input id="wifi-gateway" bind:value={gateway} disabled={ipDisabled} aria-invalid={!!gatewayError} inputmode="decimal" class="tabular-nums" />
        </Field>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Checkbox id="wifi-hidden" bind:checked={hidden} disabled={formDisabled} />
          <Label for="wifi-hidden">Hidden network</Label>
        </div>
        <Button type="submit" disabled={formDisabled || connecting || ssidInvalid || passwordInvalid || !!ipError || !!netmaskError || !!gatewayError}>
          {#if connecting}<LoaderIcon class="animate-spin" />{/if}Connect
        </Button>
      </div>
    </form>
    <Button variant="outline" size="sm" disabled={player.overlayActive} onclick={() => (confirmingForget = true)}>
      Forget known networks
    </Button>
  </Card.Content>
</Card.Root>

<ConfirmDialog
  bind:open={confirmingForget}
  title="Forget all known Wi-Fi networks?"
  description="Wi-Fi will be turned off."
  confirmLabel="Forget"
  destructive
  onconfirm={forget}
/>
