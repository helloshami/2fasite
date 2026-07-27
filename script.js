(() => {
  "use strict";

  const LEGACY_STORAGE_KEY = "twofa-online-accounts-v1";
  const THEME_KEY = "twofa-online-theme";
  const accountList = document.querySelector("[data-account-list]");
  const toast = document.querySelector("[data-toast]");
  let toastTimer;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // The app still works when browser storage is disabled.
  }
  const account = { secret: "" };

  function cleanSecret(value) {
    return value.toUpperCase().replace(/[\s-]/g, "");
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  function decodeBase32(input) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const normalized = cleanSecret(input).replace(/=+$/g, "");
    if (!normalized || /[^A-Z2-7]/.test(normalized)) {
      throw new Error("Enter a valid Base32 secret key.");
    }
    let bits = "";
    for (const char of normalized) bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    if (!bytes.length) throw new Error("This secret key is too short.");
    return new Uint8Array(bytes);
  }

  async function generateTotp(secret, time = Date.now()) {
    const keyData = decodeBase32(secret);
    const counter = Math.floor(time / 30000);
    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setUint32(4, counter, false);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBuffer));
    const offset = signature[signature.length - 1] & 0x0f;
    const binary =
      ((signature[offset] & 0x7f) << 24) |
      ((signature[offset + 1] & 0xff) << 16) |
      ((signature[offset + 2] & 0xff) << 8) |
      (signature[offset + 3] & 0xff);
    return String(binary % 1000000).padStart(6, "0");
  }

  async function updateCard(card, now = Date.now()) {
    const code = card.querySelector("[data-code-value]");
    const status = card.querySelector("[data-status]");
    const error = card.querySelector("[data-error]");
    const seconds = 30 - (Math.floor(now / 1000) % 30);
    card.querySelector("[data-timer]").textContent = seconds;
    card.querySelector("[data-progress]").style.transform = `scaleX(${seconds / 30})`;

    if (!account.secret.trim()) {
      code.textContent = "••••••";
      status.textContent = "Waiting for key";
      error.textContent = "";
      return;
    }

    try {
      code.textContent = await generateTotp(account.secret, now);
      status.textContent = "Active";
      error.textContent = "";
    } catch (reason) {
      code.textContent = "------";
      status.textContent = "Invalid key";
      error.textContent = reason.message;
    }
  }

  function updateCodes() {
    const now = Date.now();
    document.querySelectorAll("[data-account-card]").forEach((card) => updateCard(card, now));
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#0e131c" : "#ffffff";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.setAttribute("aria-label", theme === "dark" ? "Use light theme" : "Use dark theme");
    });
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Theme persistence is optional.
    }
  }

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch {
    // Use the system theme when browser storage is disabled.
  }
  setTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  updateCodes();

  accountList.addEventListener("input", (event) => {
    const card = event.target.closest("[data-account-card]");
    if (!card) return;
    if (event.target.matches("[data-secret-key]")) account.secret = event.target.value;
    updateCard(card);
  });

  accountList.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-account-card]");
    if (!card) return;
    if (event.target.closest("[data-reveal-secret]")) {
      const input = card.querySelector("[data-secret-key]");
      input.type = input.type === "password" ? "text" : "password";
      event.target.closest("button").setAttribute("aria-label", input.type === "password" ? "Show secret key" : "Hide secret key");
    }

    if (event.target.closest("[data-copy-code]")) {
      const value = card.querySelector("[data-code-value]").textContent;
      if (/^\d{6}$/.test(value)) {
        await copyText(value);
        showToast("Code copied to clipboard");
      }
    }

  });

  document.querySelectorAll("[data-refresh]").forEach((button) => {
    button.addEventListener("click", () => {
      updateCodes();
      showToast("Codes refreshed");
    });
  });

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  document.querySelector("[data-menu-toggle]").addEventListener("click", (event) => {
    const nav = document.querySelector("[data-mobile-nav]");
    const open = nav.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll("[data-mobile-nav] a").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelector("[data-mobile-nav]").classList.remove("open");
      document.querySelector("[data-menu-toggle]").setAttribute("aria-expanded", "false");
    });
  });

  window.addEventListener("pagehide", () => {
    account.secret = "";
    document.querySelectorAll("[data-secret-key]").forEach((input) => {
      input.value = "";
    });
  });

  window.setInterval(updateCodes, 1000);
})();
