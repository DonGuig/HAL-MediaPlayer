<script lang="ts">
  import OverlayNotice from "$lib/components/OverlayNotice.svelte";
  import WiredCard from "./WiredCard.svelte";
  import WifiCard from "./WifiCard.svelte";
  import HostnameCard from "./HostnameCard.svelte";
</script>

<OverlayNotice message="Network settings can't be changed." />
<div class="grid items-start gap-4 md:grid-cols-2">
  <WiredCard />
  <WifiCard />
</div>
<HostnameCard />
