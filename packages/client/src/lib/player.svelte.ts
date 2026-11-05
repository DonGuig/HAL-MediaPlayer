import { io } from "socket.io-client";
import { toast } from "svelte-sonner";
import { api, errorMessage, isConnectionError, SERVER_URL } from "./api";

export const socket = io(SERVER_URL);

const PING_INTERVAL_MS = 3000;
// A busy player can miss a ping (during an upload for instance), so one miss isn't "offline"
const PINGS_MISSED_WHEN_OFFLINE = 2;
const NO_MEDIA_FILE = "black_1920.jpg";

export type TransportCommand = "play" | "pause" | "restart" | "stop";
export type OfflineNotice = { title: string; detail?: string; waiting: boolean };

// Shared player state: any component can import `player`, read its fields and call its methods.
class Player {
  connected = $state(true);
  // Replaces the reconnecting message when the player is going away on purpose
  offlineNotice = $state<OfflineNotice | null>(null);
  overlayActive = $state(false);
  stopped = $state(true);
  fileName = $state<string | null>(null);
  fileSize = $state(0);
  freeSpace = $state(0);
  hostname = $state("");
  piModel = $state<string | null>(null);
  rebootPrompt = $state<string | null>(null);

  #missedPings = 0;
  #wentDown = false;

  get isPi5() {
    return this.piModel === "pi5";
  }

  async refreshStatus() {
    const res = await api.get<{ stopped: boolean }>("/getTransportStatus", { silent: true });
    this.stopped = res.stopped;
  }

  async refreshFile() {
    const [file, space] = await Promise.all([
      api.get<{ fileName: string; fileSize: number }>("/getFileNameAndSize", { silent: true }),
      api.get<{ space: number }>("/getAvailableSpace", { silent: true }),
    ]);
    const none = file.fileName === NO_MEDIA_FILE;
    this.fileName = none ? null : file.fileName;
    this.fileSize = none ? 0 : file.fileSize;
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
    const res = await api.get<{ model: string }>("/getPiModel", { silent: true });
    this.piModel = res.model;
  }

  refreshAll() {
    // Each one on its own: a request that fails shouldn't keep the others from showing
    for (const refresh of [
      this.refreshStatus,
      this.refreshFile,
      this.refreshHostname,
      this.refreshOverlay,
      this.refreshPiModel,
    ]) {
      refresh.call(this).catch(() => {});
    }
  }

  async command(cmd: TransportCommand) {
    try {
      await api.post(`/${cmd}`);
      await this.refreshStatus();
    } catch {
      // api already shows the error
    }
  }

  async #ping() {
    try {
      await api.post("/ping", { silent: true, timeoutMs: PING_INTERVAL_MS });
      const cameBack = this.#wentDown;
      this.#missedPings = 0;
      this.#wentDown = false;
      this.connected = true;
      if (cameBack) {
        this.offlineNotice = null;
        this.refreshAll();
      } else {
        // Keeps the state right when something else drives the player, like OSC
        this.refreshStatus().catch(() => {});
      }
    } catch {
      this.#wentDown = true;
      this.#missedPings++;
      if (this.#missedPings >= PINGS_MISSED_WHEN_OFFLINE) this.connected = false;
    }
  }

  // Returns the function that stops watching
  watchConnection() {
    this.refreshAll();
    this.#ping();
    const id = setInterval(() => this.#ping(), PING_INTERVAL_MS);
    return () => clearInterval(id);
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
