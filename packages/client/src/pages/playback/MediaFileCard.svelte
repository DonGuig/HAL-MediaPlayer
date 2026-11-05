<script lang="ts">
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card";
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { Progress } from "$lib/components/ui/progress";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import UsbIcon from "@lucide/svelte/icons/usb";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import FileVideoIcon from "@lucide/svelte/icons/file-video";
  import { toast } from "svelte-sonner";
  import { player, socket } from "$lib/player.svelte";
  import { API_URL, send } from "$lib/api";
  import { uploadChunked } from "$lib/upload";
  import { formatBytes } from "$lib/format";

  const ACCEPTED_FILES = ".mov,.mp4,.mp3,.wav,.flac,.aac,.aiff";

  type Task = { title: string; name: string; size: number };
  let task = $state<Task | null>(null);
  let progress = $state(0);
  let confirmingRemove = $state(false);
  let fileInput: HTMLInputElement;

  function startTask(newTask: Task) {
    task = newTask;
    progress = 0;
    player.transferring = true;
  }

  function finishTask() {
    task = null;
    player.transferring = false;
    player.refreshAll();
  }

  async function upload(file: File) {
    startTask({ title: "Uploading", name: file.name, size: file.size });
    if (!(await send("/stop"))) {
      finishTask();
      return;
    }
    let uploaded = true;
    try {
      await uploadChunked(`${API_URL}/uploadMediaFile`, file, (percent) => (progress = percent));
    } catch (err) {
      uploaded = false;
      toast.error((err as Error).message);
    }
    // Even after a failure: the first chunk has already replaced the previous file
    const finalized = await send("/uploadFinalized", { silent: !uploaded });
    if (uploaded && finalized) toast.success("Media file changed");
    finishTask();
  }

  async function copyFromUsb() {
    startTask({ title: "Copying from USB drive", name: "Looking for a file…", size: 0 });
    socket.on("copy_progress", (percent: number) => (progress = percent));
    socket.on("file_info", (info: { fileName: string; fileSize: number }) => {
      if (task) task = { ...task, name: info.fileName, size: info.fileSize };
    });
    const copied = await send("/getFileFromUSBDrive");
    socket.off("copy_progress");
    socket.off("file_info");
    if (copied) toast.success("Media file changed");
    finishTask();
  }

  async function remove() {
    if ((await send("/stop")) && (await send("/removeMediaFile"))) toast.success("Media file removed");
    player.refreshAll();
  }

  onMount(() => {
    player.refreshFile().catch(() => {});
  });
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Media file</Card.Title>
  </Card.Header>
  <Card.Content class="space-y-5">
    <div class="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <div class="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <FileVideoIcon class="size-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium" title={player.fileName}>{player.fileName ?? "No media file"}</p>
        <p class="text-xs text-muted-foreground">
          {formatBytes(player.fileSize)} · {player.overlayActive ? "free space unavailable" : `${formatBytes(player.freeSpace)} free`}
        </p>
      </div>
    </div>

    <input
      bind:this={fileInput}
      type="file"
      accept={ACCEPTED_FILES}
      class="hidden"
      onchange={(e) => {
        const file = e.currentTarget.files?.[0];
        e.currentTarget.value = "";
        if (file) upload(file);
      }}
    />
    <div class="flex flex-wrap gap-2">
      <Button disabled={player.overlayActive} onclick={() => fileInput.click()}>
        <UploadIcon />Upload file
      </Button>
      <Button variant="outline" disabled={player.overlayActive} onclick={copyFromUsb}>
        <UsbIcon />Copy from USB
      </Button>
      <Button variant="destructive" disabled={player.overlayActive || !player.fileName} onclick={() => (confirmingRemove = true)}>
        <Trash2Icon />Remove
      </Button>
    </div>
    <p class="text-xs text-muted-foreground">
      To copy from USB: format a drive as exFAT or FAT32 (MBR partition map), put only the media file at its root, plug
      it into the player and press the button. Unplug it when done.
    </p>
  </Card.Content>
</Card.Root>

<ConfirmDialog
  bind:open={confirmingRemove}
  title="Remove the media file?"
  description={`Playback stops and ${player.fileName} is deleted from the player.`}
  confirmLabel="Remove"
  destructive
  onconfirm={remove}
/>

<Dialog.Root open={task !== null}>
  <Dialog.Content showCloseButton={false} interactOutsideBehavior="ignore" escapeKeydownBehavior="ignore">
    <Dialog.Header>
      <Dialog.Title>{task?.title}…</Dialog.Title>
      <Dialog.Description class="truncate">
        {task?.name}{task?.size ? ` (${formatBytes(task.size)})` : ""}
      </Dialog.Description>
    </Dialog.Header>
    <Progress value={progress} />
    <p class="text-right font-mono text-sm tabular-nums text-muted-foreground">{progress.toFixed(0)} %</p>
  </Dialog.Content>
</Dialog.Root>
