# Collage Maker

Build photo-grid collages in the browser. Pick any number of photos, choose how many
columns and rows, get downloadable JPEG/PNG collages.

**Live: https://israel-kli.github.io/collage-maker/**

Everything runs client-side on `<canvas>`. Your photos are never uploaded — no server,
no account, no image hosting, no cost. Once the page has loaded it works offline.

## What it does

- **Multi-select** photos (file picker or drag & drop), added cumulatively — drop more at any time
- **One collage of everything** with a chosen columns × rows, plus a *Fit to photo count*
  button that picks the grid closest to square
- **Split into several collages** — columns × rows sets how many photos each one holds, and the
  selection is sliced into consecutive collages
- **Reorder** by file name, date, size, or manually (‹ › buttons on every thumbnail, drag on desktop)
- **Cell size** taken automatically from the most common photo size, so same-size photos are
  placed at **native resolution** — no scaling, no cropping — or set it by hand
- **Fit mode**: `contain` (whole photo, margins where shapes differ) or `cover` (fill and crop)
- Adjustable gutter, background colour, JPEG quality, transparent PNG
- Download collages one by one, or all at once as a `.zip`

## Notes and limits

- **HEIC/HEIF** cannot be decoded by browsers. Convert to JPEG first (on a Mac: open in
  Preview → Export). Unreadable files are listed rather than silently skipped.
- Browsers cap canvas size, phones far more tightly than desktops. The **max size (MP)**
  control scales output down to stay under that cap — it defaults to 16 MP on phones and
  40 MP elsewhere, and the app retries at a smaller size if a browser still refuses.
  Raise it for maximum detail on a desktop.
- Very large batches are limited by device memory. Photos are decoded one at a time and
  released immediately, so hundreds of images are fine; a single enormous collage is the
  binding constraint, not the number of photos.

## Run locally

No build step, no dependencies:

```sh
git clone https://github.com/Israel-Kli/collage-maker.git
cd collage-maker
python3 -m http.server 8765
# open http://127.0.0.1:8765
```

Opening `index.html` directly from disk also works.

## Deploy your own copy (free)

1. Fork this repo, or push these files to a new **public** repo.
2. Repo **Settings → Pages → Build and deployment**: source **Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. Wait a minute; the site appears at `https://<your-user>.github.io/<repo>/`.

GitHub Pages serves static files only, which is all this needs. Public repos get Pages for
free with no usage cost.

## Files

| File | Purpose |
|---|---|
| `index.html` | markup and controls |
| `styles.css` | mobile-first responsive styling |
| `app.js` | file handling, ordering, canvas rendering, downloads |
| `zip.js` | dependency-free STORE-only ZIP writer for *Download all* |
