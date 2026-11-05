<script lang="ts">
  import OverlayNotice from "$lib/components/OverlayNotice.svelte";
  import AudioOutputCard from "./AudioOutputCard.svelte";
  import VideoOutputCard from "./VideoOutputCard.svelte";
  import HdmiSignalCard from "./HdmiSignalCard.svelte";
</script>

<OverlayNotice message="Audio and video outputs can't be changed." />
<AudioOutputCard />
<VideoOutputCard />
<HdmiSignalCard />
