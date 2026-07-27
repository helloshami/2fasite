# 2FASite

An ad-free, mobile-responsive TOTP generator built with plain HTML, CSS, and JavaScript.

Open `index.html` in a modern browser, or run:

```text
node server.cjs
```

Then visit `http://127.0.0.1:4173`.

The matching About page is available at `http://127.0.0.1:4173/about.html`.

## Privacy

TOTP codes are generated locally using the browser's Web Crypto API. Secret keys are never transmitted or saved and disappear when the page is closed or refreshed.
