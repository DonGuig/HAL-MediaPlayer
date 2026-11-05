<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";

  let {
    open = $bindable(false),
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    destructive = false,
    onconfirm,
  }: {
    open?: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    onconfirm: () => void;
  } = $props();
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>{cancelLabel}</AlertDialog.Cancel>
      <AlertDialog.Action
        variant={destructive ? "destructive" : "default"}
        onclick={() => {
          open = false;
          onconfirm();
        }}>{confirmLabel}</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
