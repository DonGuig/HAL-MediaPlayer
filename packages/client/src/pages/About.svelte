<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { version } from "../../package.json";
  import Logo from "$lib/components/Logo.svelte";
  import { API_URL } from "$lib/api";

  const oscCommands = [
    "/play",
    "/pause",
    "/stop",
    "/restart",
    "/reboot",
    "/shutdown",
    "/hdmi_on",
    "/hdmi_off",
    "/set_time time_in_seconds_float",
  ];
  const link = "text-primary underline underline-offset-4";
</script>

<div class="flex flex-col items-center gap-1 py-6 text-center">
  <div class="mb-3 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
    <Logo class="w-9" />
  </div>
  <h1 class="text-2xl font-semibold">HAL Media Player</h1>
  <p class="text-sm text-muted-foreground">v{version} · <a class={link} href="http://www.hal-art.io">www.hal-art.io</a></p>
</div>

<div class="grid items-start gap-4 md:grid-cols-2">
  <Card.Root>
    <Card.Header><Card.Title>Media files</Card.Title></Card.Header>
    <Card.Content class="text-sm text-muted-foreground">
      Media files have to be encoded in H264, with a maximum resolution of 1920x1080. Any other format would be decoded
      in software and likely lead to lagging. For encoding, we recommend the free and open source Handbrake software
      <a class={link} href={`${API_URL}/handbrakepreset`}>with this preset</a>.
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header><Card.Title>Audio</Card.Title></Card.Header>
    <Card.Content class="text-sm text-muted-foreground">
      Audio volume can go up to 200%, but values above 100% can lead to clipping depending on the media.
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header><Card.Title>Network</Card.Title></Card.Header>
    <Card.Content class="text-sm text-muted-foreground">
      Changing the hostname in the Network tab changes how you reach the player: it's no longer available through
      raspberrypi.local, but through <i>yourhostname</i>.local.
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header><Card.Title>Expanding the file system</Card.Title></Card.Header>
    <Card.Content class="text-sm text-muted-foreground">
      On first boot after flashing an SD card, the player should expand its file system to the full size of the card, so
      the available space is just a bit smaller than the card's capacity. If not, you can expand it manually in the
      System tab.
    </Card.Content>
  </Card.Root>

  <Card.Root class="md:col-span-2">
    <Card.Header><Card.Title>Read-only file system</Card.Title></Card.Header>
    <Card.Content class="space-y-2 text-sm text-muted-foreground">
      <p>
        Like any computer, a Raspberry Pi shouldn't just have its power cut: on rare occasions this corrupts the SD card,
        if the system was writing to it at that moment.
      </p>
      <p>
        To be able to unplug your player with confidence, enable the read-only file system. Any write then goes to RAM
        instead of the SD card, which also means any configuration change is lost after a reboot. So only enable it once
        you are done configuring.
      </p>
    </Card.Content>
  </Card.Root>

  <Card.Root class="md:col-span-2">
    <Card.Header><Card.Title>OSC control</Card.Title></Card.Header>
    <Card.Content class="space-y-3 text-sm text-muted-foreground">
      <p>The player can be controlled by OSC messages sent to <b class="text-foreground">port 5005</b>. Available commands:</p>
      <div class="flex flex-wrap gap-1.5">
        {#each oscCommands as command (command)}
          <code class="rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-xs text-foreground">{command}</code>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>
</div>
