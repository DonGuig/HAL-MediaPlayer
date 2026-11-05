// index.html applies the saved mode before the page shows, to avoid a flash of the wrong theme
const STORAGE_KEY = "theme";

class Theme {
  mode = $state<"dark" | "light">(document.documentElement.classList.contains("dark") ? "dark" : "light");

  toggle() {
    this.mode = this.mode === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", this.mode === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, this.mode);
    } catch {
      // private browsing: the choice just isn't remembered
    }
  }
}

export const theme = new Theme();
