<script lang="ts">
  import * as Alert from "$lib/components/ui/alert";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import { player } from "$lib/player.svelte";

  let { message }: { message: string } = $props();
</script>

{#if player.overlayActive}
  <Alert.Root class="border-amber-500/40">
    <ShieldIcon class="text-amber-600 dark:text-amber-400" />
    <Alert.Title>Read-only file system is on</Alert.Title>
    <Alert.Description>{message}</Alert.Description>
  </Alert.Root>
{/if}
