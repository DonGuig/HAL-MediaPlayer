<script lang="ts">
  import OverlayNotice from "$lib/components/OverlayNotice.svelte";
  import TransportCard from "./TransportCard.svelte";
  import AudioCard from "./AudioCard.svelte";
  import MediaFileCard from "./MediaFileCard.svelte";
</script>

<OverlayNotice message="Volume and delay changes are lost after a reboot, and the media file can't be changed." />
<TransportCard />
<div class="grid gap-4 md:grid-cols-2">
  <AudioCard />
  <MediaFileCard />
</div>
