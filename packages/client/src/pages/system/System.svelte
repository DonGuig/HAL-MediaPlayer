<script lang="ts">
  import PowerCard from "./PowerCard.svelte";
  import FileSystemCard from "./FileSystemCard.svelte";
  import ReadOnlyCard from "./ReadOnlyCard.svelte";
  import FactoryResetCard from "./FactoryResetCard.svelte";
</script>

<PowerCard />
<div class="grid items-start gap-4 md:grid-cols-2">
  <ReadOnlyCard />
  <FileSystemCard />
</div>
<FactoryResetCard />
