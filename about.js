(() => {
  "use strict";

  const THEME_KEY = "twofa-online-theme";
  const button = document.querySelector("[data-theme-toggle]");

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#030712" : "#ffffff";
    button.setAttribute("aria-label", theme === "dark" ? "Use light theme" : "Use dark theme");
    localStorage.setItem(THEME_KEY, theme);
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  setTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  button.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
})();
