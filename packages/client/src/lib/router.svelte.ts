// The server answers any unknown path with index.html, so plain paths work on reload too.
export const HOME = "/playback";

class Router {
  path = $state(window.location.pathname);

  constructor() {
    window.addEventListener("popstate", () => (this.path = window.location.pathname));
    if (this.path === "/") {
      history.replaceState(null, "", HOME);
      this.path = HOME;
    }
  }

  go(path: string) {
    if (path === this.path) return;
    history.pushState(null, "", path);
    this.path = path;
    window.scrollTo(0, 0);
  }
}

export const router = new Router();

// For the onclick of <a> elements: keeps ctrl/cmd-click opening a new tab
export function navigate(event: MouseEvent, path: string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  router.go(path);
}
