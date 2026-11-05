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
  import StatusDot from "$lib/components/StatusDot.svelte";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import EyeIcon from "@lucide/svelte/icons/eye";
  import EyeOffIcon from "@lucide/svelte/icons/eye-off";
  import { toast } from "svelte-sonner";
  import { player } from "$lib/player.svelte";
  import { api, isConnectionError, send } from "$lib/api";

  // A little above the time the server gives nmcli to connect (utils/network.py)
  const WIFI_CONNECT_TIMEOUT_MS = 35000;
  const WIFI_SETTLE_MS = 3000;

  let active = $state(true);
  let currentSsid = $state<string | null>(null);
  let ssid = $state("");
  let password = $state("");
  let hidden = $state(false);
  let showPassword = $state(false);
  let connecting = $state(false);
  let confirmingForget = $state(false);
  let touched = $state({ ssid: false, password: false });

  const ssidInvalid = $derived(ssid.length < 1 || ssid.length > 32);
  const passwordInvalid = $derived(password.length < 8 || password.length > 64);
  const ssidError = $derived(touched.ssid && ssidInvalid ? "Between 1 and 32 characters" : "");
  const passwordError = $derived(touched.password && passwordInvalid ? "Between 8 and 64 characters" : "");
  const formDisabled = $derived(player.overlayActive || !active);

  function loadActive() {
    api.get<{ active: boolean }>("/getIsWifiActive").then((res) => (active = res.active), () => {});
  }

  function loadCurrent() {
    api.get<{ SSID: string | null }>("/getCurrentWifi").then((res) => (currentSsid = res.SSID || null), () => {});
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
        body: { SSID: ssid, pass: password, hidden },
        silent: true,
        timeoutMs: WIFI_CONNECT_TIMEOUT_MS,
      });
      toast.success(`Connected to ${ssid}`);
      password = "";
      touched.password = false;
      loadCurrent();
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
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <Checkbox id="wifi-hidden" bind:checked={hidden} disabled={formDisabled} />
          <Label for="wifi-hidden">Hidden network</Label>
        </div>
        <Button type="submit" disabled={formDisabled || connecting || ssidInvalid || passwordInvalid}>
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
