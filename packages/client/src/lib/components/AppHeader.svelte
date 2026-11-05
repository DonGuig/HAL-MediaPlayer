<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import PlayIcon from "@lucide/svelte/icons/play";
  import NetworkIcon from "@lucide/svelte/icons/network";
  import WrenchIcon from "@lucide/svelte/icons/wrench";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import InfoIcon from "@lucide/svelte/icons/info";
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import Logo from "./Logo.svelte";
  import { player } from "$lib/player.svelte";
  import { theme } from "$lib/theme.svelte";
  import { navigate, router, HOME } from "$lib/router.svelte";

  const pages = [
    { path: "/playback", label: "Playback", icon: PlayIcon },
    { path: "/network", label: "Network", icon: NetworkIcon },
    { path: "/setup", label: "Setup", icon: WrenchIcon },
    { path: "/system", label: "System", icon: SettingsIcon },
    { path: "/about", label: "About", icon: InfoIcon },
  ];
</script>

<header class="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
  <div class="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
    <a href={HOME} onclick={(e) => navigate(e, HOME)} class="flex min-w-0 items-center gap-3">
      <div class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Logo class="w-5" />
      </div>
      <div class="min-w-0 leading-tight">
        <p class="text-sm font-semibold">Media Player</p>
        <p class="truncate text-xs text-muted-foreground">{player.hostname}</p>
      </div>
    </a>
    <div class="ml-auto flex shrink-0 items-center gap-2">
      {#if player.overlayActive}
        <Badge variant="outline" class="border-amber-500/40 text-amber-600 dark:text-amber-400">
          <ShieldIcon />Read-only
        </Badge>
      {/if}
      <Badge variant={player.connected ? "outline" : "destructive"}>
        <span class={["size-1.5 rounded-full", player.connected ? "bg-emerald-500" : "bg-current"]}></span>
        {player.connected ? "Connected" : "Offline"}
      </Badge>
      <Button variant="ghost" size="icon" onclick={() => theme.toggle()} aria-label="Toggle light and dark theme">
        <SunIcon class="hidden dark:block" /><MoonIcon class="dark:hidden" />
      </Button>
    </div>
  </div>
  <nav class="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 text-sm">
    {#each pages as page (page.path)}
      {@const current = router.path === page.path}
      <a
        href={page.path}
        onclick={(e) => navigate(e, page.path)}
        aria-current={current ? "page" : undefined}
        class={[
          "flex items-center gap-1.5 border-b-2 px-3 py-2 whitespace-nowrap transition-colors",
          current ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
        ]}
      >
        <page.icon class="hidden size-4 sm:block" />
        {page.label}
      </a>
    {/each}
  </nav>
</header>
