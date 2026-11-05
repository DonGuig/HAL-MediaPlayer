<script lang="ts">
  import { onMount } from "svelte";
  import { Toaster } from "$lib/components/ui/sonner";
  import AppHeader from "$lib/components/AppHeader.svelte";
  import OfflineOverlay from "$lib/components/OfflineOverlay.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import Playback from "./pages/playback/Playback.svelte";
  import Network from "./pages/network/Network.svelte";
  import Setup from "./pages/setup/Setup.svelte";
  import System from "./pages/system/System.svelte";
  import About from "./pages/About.svelte";
  import NotFound from "./pages/NotFound.svelte";
  import { player } from "$lib/player.svelte";
  import { router } from "$lib/router.svelte";

  const pages: Record<string, typeof About> = {
    "/playback": Playback,
    "/network": Network,
    "/setup": Setup,
    "/system": System,
    "/about": About,
  };
  const Page = $derived(pages[router.path] ?? NotFound);

  onMount(() => player.watchConnection());
</script>

<Toaster position="bottom-right" richColors />

<AppHeader />
<main class="mx-auto max-w-4xl space-y-4 p-4 pb-16">
  <Page />
</main>

<OfflineOverlay />
<ConfirmDialog
  bind:open={() => player.rebootPrompt !== null, (open) => !open && (player.rebootPrompt = null)}
  title="Reboot needed"
  description={player.rebootPrompt ?? ""}
  confirmLabel="Reboot now"
  cancelLabel="Later"
  onconfirm={() => player.reboot()}
/>
