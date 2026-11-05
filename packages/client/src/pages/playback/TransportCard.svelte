<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Slider } from "$lib/components/ui/slider";
  import PlayIcon from "@lucide/svelte/icons/play";
  import PauseIcon from "@lucide/svelte/icons/pause";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import SquareIcon from "@lucide/svelte/icons/square";
  import { player, socket } from "$lib/player.svelte";
  import { api } from "$lib/api";
  import { formatTime } from "$lib/format";

  const POSITION_INTERVAL_MS = 900;

  let time = $state(0);
  let length = $state(0);
  let dragging = false; // not rendered, so a plain variable

  // Poll the position while playing; re-runs when `player.stopped` changes
  $effect(() => {
    if (player.stopped) {
      time = length = 0;
      return;
    }
    const poll = async () => {
      if (dragging) return;
      try {
        const res = await api.get<{ time: number; length: number }>("/getTime", { silent: true });
        if (!dragging) ({ time, length } = res);
      } catch {
        // the connection overlay covers this
      }
    };
    poll();
    const id = setInterval(poll, POSITION_INTERVAL_MS);
    return () => clearInterval(id);
  });

  const buttons = [
    { cmd: "play", label: "Play", icon: PlayIcon, variant: "default" },
    { cmd: "pause", label: "Pause", icon: PauseIcon, variant: "secondary" },
    { cmd: "restart", label: "Restart", icon: RotateCcwIcon, variant: "secondary" },
    { cmd: "stop", label: "Stop", icon: SquareIcon, variant: "destructive" },
  ] as const;
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Transport</Card.Title>
    <Card.Description class="truncate">{player.fileName ?? "No media file"}</Card.Description>
    <Card.Action>
      {#if player.stopped}
        <Badge variant="outline">Stopped</Badge>
      {:else}
        <Badge><span class="size-1.5 animate-pulse rounded-full bg-current"></span>Running</Badge>
      {/if}
    </Card.Action>
  </Card.Header>
  <Card.Content class="space-y-6">
    <div class="flex items-center gap-4 font-mono text-sm tabular-nums text-muted-foreground">
      <span class="w-14">{formatTime(time)}</span>
      <Slider
        type="single"
        aria-label="Seek"
        value={Math.floor(time)}
        max={Math.max(1, Math.floor(length))}
        step={1}
        disabled={player.stopped}
        onValueChange={(value) => {
          dragging = true;
          time = value;
          socket.emit("/setTime", value);
        }}
        onValueCommit={() => (dragging = false)}
      />
      <span class="w-14 text-right">{formatTime(length)}</span>
    </div>
    <div class="grid grid-cols-4 gap-2">
      {#each buttons as button (button.cmd)}
        <Button variant={button.variant} class="h-14 flex-col gap-1 text-xs" onclick={() => player.command(button.cmd)}>
          <button.icon class="size-5" />
          {button.label}
        </Button>
      {/each}
    </div>
  </Card.Content>
</Card.Root>
