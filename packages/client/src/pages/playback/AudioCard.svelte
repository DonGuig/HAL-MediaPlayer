<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import { Slider } from "$lib/components/ui/slider";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import Volume2Icon from "@lucide/svelte/icons/volume-2";
  import TimerIcon from "@lucide/svelte/icons/timer";
  import { api, send } from "$lib/api";

  const MAX_VOLUME = 200;

  // null while the number input is empty
  let volume = $state<number | null>(100);
  let delayMs = $state<number | null>(0);

  function sendVolume() {
    volume = Math.min(MAX_VOLUME, Math.max(0, Math.round(volume ?? 0)));
    send("/setVolume", { body: { volume } });
  }

  function resetVolumeOnThumbDoubleClick(event: MouseEvent) {
    if (!(event.target as Element).closest('[data-slot="slider-thumb"]')) return;
    volume = 100;
    sendVolume();
  }

  function sendDelay() {
    delayMs ??= 0;
    // The server counts in microseconds
    send("/setAudioDelay", { body: { delay: delayMs * 1000 } });
  }

  onMount(() => {
    api.get<{ volume: number }>("/getVolume").then((res) => (volume = res.volume), () => {});
    api.get<{ delay: number }>("/getAudioDelay").then((res) => (delayMs = res.delay / 1000), () => {});
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Audio</Card.Title>
    <Card.Description>Above 100%, volume can clip depending on the media.</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-6">
    <div class="space-y-3">
      <Label for="volume" class="text-muted-foreground"><Volume2Icon class="size-4" />Volume</Label>
      <div class="flex items-center gap-4">
        <Slider
          type="single"
          aria-label="Volume"
          value={volume ?? 0}
          max={MAX_VOLUME}
          step={1}
          onValueChange={(value) => (volume = value)}
          onValueCommit={sendVolume}
          ondblclick={resetVolumeOnThumbDoubleClick}
        />
        <div class="relative w-24 shrink-0">
          <!-- `onchange` fires on blur, Enter and the spinner arrows: exactly when to send -->
          <Input id="volume" type="number" min={0} max={MAX_VOLUME} bind:value={volume} onchange={sendVolume} class="pr-7 tabular-nums" />
          <span class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">%</span>
        </div>
      </div>
    </div>
    <div class="space-y-3">
      <Label for="delay" class="text-muted-foreground"><TimerIcon class="size-4" />Audio delay</Label>
      <div class="relative w-32">
        <Input id="delay" type="number" step={1} bind:value={delayMs} onchange={sendDelay} class="pr-9 tabular-nums" />
        <span class="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">ms</span>
      </div>
    </div>
  </Card.Content>
</Card.Root>
