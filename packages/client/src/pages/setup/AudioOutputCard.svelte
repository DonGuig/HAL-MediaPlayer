<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import Segmented from "$lib/components/Segmented.svelte";
  import { player } from "$lib/player.svelte";
  import { api, send } from "$lib/api";

  type AudioOutput = "jack" | "HDMI" | "USB" | "Hifiberry";

  let output = $state<AudioOutput>("HDMI");

  // The Pi 5 has no headphone jack
  const options = $derived<{ value: AudioOutput; label: string }[]>([
    ...(player.isPi5 ? [] : [{ value: "jack" as const, label: "Headphone jack" }]),
    { value: "HDMI", label: "HDMI" },
    { value: "USB", label: "USB audio" },
    { value: "Hifiberry", label: "HiFiBerry" },
  ]);

  function load() {
    api.get<{ audioOutput: AudioOutput }>("/getAudioOutput").then((res) => (output = res.audioOutput), () => {});
  }

  async function change(value: AudioOutput) {
    output = value;
    await send("/setAudioOutput", { body: { audioOutput: value } });
    // Also puts the selection back if that failed
    setTimeout(load, 500);
  }

  onMount(load);
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Audio output</Card.Title>
    <Card.Description>HiFiBerry also needs its overlay in /boot/firmware/config.txt: use the editor below.</Card.Description>
  </Card.Header>
  <Card.Content>
    <Segmented label="Audio output" {options} value={output} disabled={player.overlayActive} onchange={change} />
  </Card.Content>
</Card.Root>
