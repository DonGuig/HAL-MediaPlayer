import { io } from "socket.io-client";
import { toast } from "svelte-sonner";
import { api, errorMessage, isConnectionError, SERVER_URL } from "./api";

export const socket = io(SERVER_URL);

type PlayerStatus = { stopped: boolean; paused: boolean; time: number; length: number };
export type TransportCommand = "play" | "pause" | "restart" | "stop";
export type OfflineNotice = { title: string; detail?: string; waiting: boolean };

// Shared player state: any component can import `player`, read its fields and call its methods.
class Player {
  #socketUp = $state(true);
  // Uploading or copying a media file: a real connection loss makes the transfer itself fail
  transferring = $state(false);
  // A busy player can drop the socket during a transfer without being offline
  connected = $derived(this.#socketUp || this.transferring);
  // Replaces the reconnecting message when the player is going away on purpose
  offlineNotice = $state<OfflineNotice | null>(null);
  overlayActive = $state(false);
  stopped = $state(true);
  paused = $state(false);
  time = $state(0);
  length = $state(0);
  fileName = $state<string | null>(null);
  fileSize = $state(0);
  freeSpace = $state(0);
  hostname = $state("");
  piModel = $state<string | null>(null);
  // Full board name with its RAM. Null when not running on a Pi
  piName = $state<string | null>(null);
  rebootPrompt = $state<string | null>(null);

  #wentDown = false;

  get isPi5() {
    return this.piModel === "pi5";
  }

  async refreshFile() {
    const [file, space] = await Promise.all([
      api.get<{ fileName: string | null; fileSize: number }>("/getFileNameAndSize", { silent: true }),
      api.get<{ space: number }>("/getAvailableSpace", { silent: true }),
    ]);
    this.fileName = file.fileName;
    this.fileSize = file.fileSize;
    this.freeSpace = space.space;
  }

  async refreshHostname() {
    const res = await api.get<{ hostname: string }>("/getHostname", { silent: true });
    this.hostname = res.hostname;
  }

  async refreshOverlay() {
    const res = await api.get<{ overlayActive: boolean }>("/getOverlayInfo", { silent: true });
    this.overlayActive = res.overlayActive;
  }

  async refreshPiModel() {
    const res = await api.get<{ model: string; name: string | null }>("/getPiModel", { silent: true });
    this.piModel = res.model;
    this.piName = res.name;
  }

  refreshAll() {
    // Each one on its own: a request that fails shouldn't keep the others from showing
    for (const refresh of [
      this.refreshFile,
      this.refreshHostname,
      this.refreshOverlay,
      this.refreshPiModel,
    ]) {
      refresh.call(this).catch(() => {});
    }
  }

  async command(cmd: TransportCommand) {
    // The new state comes back through player_status; api shows any error
    await api.post(`/${cmd}`).catch(() => {});
  }

  #onStatus = (status: PlayerStatus) => {
    this.stopped = status.stopped;
    this.paused = status.paused;
    this.time = status.time;
    this.length = status.length;
  };

  // The fixed id makes repeated events reuse one toast instead of piling up
  #onUndervoltage = () => {
    toast.warning("Undervoltage detected", {
      id: "undervoltage",
      description: "The power supply is too weak for the Raspberry Pi. Playback may be affected.",
    });
  };

  #onUp = () => {
    this.#socketUp = true;
    if (!this.#wentDown) return;
    this.#wentDown = false;
    this.offlineNotice = null;
    this.refreshAll();
  };

  #onDown = () => {
    this.#socketUp = false;
    this.#wentDown = true;
  };

  // Returns the function that stops watching
  watchConnection() {
    this.refreshAll();
    socket.on("player_status", this.#onStatus);
    socket.on("undervoltage", this.#onUndervoltage);
    socket.on("connect", this.#onUp);
    socket.on("disconnect", this.#onDown);
    socket.on("connect_error", this.#onDown);
    return () => {
      socket.off("player_status", this.#onStatus);
      socket.off("undervoltage", this.#onUndervoltage);
      socket.off("connect", this.#onUp);
      socket.off("disconnect", this.#onDown);
      socket.off("connect_error", this.#onDown);
    };
  }

  // For actions that take the player down: losing the connection midway is expected
  async #goOffline(path: string, notice: OfflineNotice) {
    try {
      await api.post(path, { silent: true });
    } catch (err) {
      if (!isConnectionError(err)) {
        toast.error(errorMessage(err));
        return;
      }
    }
    this.offlineNotice = notice;
  }

  reboot() {
    return this.#goOffline("/reboot", { title: "The player is rebooting…", waiting: true });
  }

  shutdown() {
    return this.#goOffline("/shutdown", {
      title: "The player has shut down",
      detail: "It's safe to unplug it now.",
      waiting: false,
    });
  }

  factoryReset() {
    return this.#goOffline("/factory_reset", {
      title: "The player has been reset and is rebooting…",
      detail: "It comes back as raspberrypi.local, or at 192.168.1.2 on wired Ethernet.",
      waiting: true,
    });
  }

  askForReboot(detail = "") {
    this.rebootPrompt = `You need to reboot for the changes to take effect.${detail && ` ${detail}`}`;
  }
}

export const player = new Player();
