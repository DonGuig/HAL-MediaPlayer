<script lang="ts">
  import LoaderIcon from "@lucide/svelte/icons/loader-circle";
  import { player } from "$lib/player.svelte";

  const notice = $derived(player.offlineNotice ?? { title: "Reconnecting to the player…", waiting: true });
</script>

{#if !player.connected || player.offlineNotice}
  <div class="fixed inset-0 z-100 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
    <div class="flex flex-col items-center gap-3 text-center">
      {#if notice.waiting}
        <LoaderIcon class="size-8 animate-spin text-muted-foreground" />
      {/if}
      <p class="font-medium">{notice.title}</p>
      {#if notice.detail}
        <p class="text-sm text-muted-foreground">{notice.detail}</p>
      {/if}
    </div>
  </div>
{/if}
