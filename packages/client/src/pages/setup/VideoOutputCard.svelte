<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import * as Alert from "$lib/components/ui/alert";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import FileCogIcon from "@lucide/svelte/icons/file-cog";
  import { toast } from "svelte-sonner";
  import { player } from "$lib/player.svelte";
  import { api, send } from "$lib/api";

  type VideoOutput = "HDMI" | "HDMIForce1080p60" | "CompositePAL" | "CompositeNTSC";

  const CONFIG_DOCS = "https://www.raspberrypi.com/documentation/computers/config_txt.html";

  // The Pi 5 has no composite support in HAL Media Player
  const modes = $derived<{ value: VideoOutput; label: string; detail: string }[]>([
    { value: "HDMI", label: "HDMI", detail: "Follows what the connected screen supports." },
    {
      value: "HDMIForce1080p60",
      label: "HDMI, force 1080p60",
      detail: "Keeps the output on, for example to start the player before the screen.",
    },
    ...(player.isPi5
      ? []
      : [
          { value: "CompositePAL" as const, label: "Composite PAL", detail: "720x576, 50 Hz." },
          { value: "CompositeNTSC" as const, label: "Composite NTSC", detail: "720x480, 60 Hz." },
        ]),
  ]);

  let applying = $state<VideoOutput | null>(null);
  let editing = $state(false);
  let configTxt = $state("");
  let loadingConfig = $state(false);
  let saving = $state(false);

  async function setMode(value: VideoOutput) {
    applying = value;
    if (await send("/setVideoOutput", { body: { videoOutput: value } })) player.askForReboot();
    applying = null;
  }

  async function openEditor() {
    configTxt = "";
    loadingConfig = true;
    editing = true;
    try {
      configTxt = (await api.get<{ txt: string }>("/getConfigTXT")).txt;
    } catch {
      editing = false;
    }
    loadingConfig = false;
  }

  async function saveConfig() {
    saving = true;
    if (await send("/sendConfigTXT", { body: { txt: configTxt } })) {
      editing = false;
      toast.success("config.txt saved");
      player.askForReboot();
    }
    saving = false;
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Video output</Card.Title>
    <Card.Description>
      Choosing a mode only rewrites the HAL Media Player block of config.txt and its video values in cmdline.txt.
      HiFiBerry and other manual edits are kept.
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-4">
    <div class="grid gap-2 sm:grid-cols-2">
      {#each modes as mode (mode.value)}
        <Button
          variant="outline"
          class="h-auto flex-col items-start gap-0.5 whitespace-normal p-3 text-left"
          disabled={player.overlayActive || applying !== null}
          onclick={() => setMode(mode.value)}
        >
          <span class="flex items-center gap-1.5">
            {#if applying === mode.value}<LoaderIcon class="animate-spin" />{/if}{mode.label}
          </span>
          <span class="text-xs font-normal text-muted-foreground">{mode.detail}</span>
        </Button>
      {/each}
    </div>
    <Button variant="secondary" disabled={player.overlayActive} onclick={openEditor}>
      <FileCogIcon />Edit /boot/firmware/config.txt
    </Button>
  </Card.Content>
</Card.Root>

<Dialog.Root bind:open={editing}>
  <Dialog.Content class="sm:max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>/boot/firmware/config.txt</Dialog.Title>
    </Dialog.Header>
    <Alert.Root class="border-amber-500/40">
      <TriangleAlertIcon class="text-amber-600 dark:text-amber-400" />
      <Alert.Title>For advanced users</Alert.Title>
      <Alert.Description>
        <span>
          See the <a class="text-primary underline underline-offset-4" href={CONFIG_DOCS} target="_blank" rel="noopener">config.txt documentation</a>.
          The marked HAL Media Player block is rewritten when you choose a video mode. Video modes also set values in
          cmdline.txt, which isn't editable here: a bad edit there can make the player unbootable.
        </span>
      </Alert.Description>
    </Alert.Root>
    <Textarea bind:value={configTxt} disabled={loadingConfig} spellcheck={false} aria-label="config.txt content" class="h-80 max-h-[50dvh] resize-y font-mono text-xs [field-sizing:fixed]" />
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (editing = false)}>Cancel</Button>
      <Button disabled={loadingConfig || saving || !configTxt} onclick={saveConfig}>
        {#if saving}<LoaderIcon class="animate-spin" />{/if}Save
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
