'use strict';

const $ = (id) => document.getElementById(id);

const el = {
  drop: $('drop'), picker: $('picker'), pickBtn: $('pickBtn'),
  listBar: $('listBar'), count: $('count'), sort: $('sort'), reverse: $('reverse'),
  clear: $('clear'), thumbs: $('thumbs'), loadErrors: $('loadErrors'), orderHint: $('orderHint'),
  doAll: $('doAll'), allCols: $('allCols'), allRows: $('allRows'), allFit: $('allFit'), allInfo: $('allInfo'),
  doSplit: $('doSplit'), splitCols: $('splitCols'), splitRows: $('splitRows'), splitInfo: $('splitInfo'),
  cellMode: $('cellMode'), cellW: $('cellW'), cellH: $('cellH'), fit: $('fit'),
  gutter: $('gutter'), bg: $('bg'),
  format: $('format'), quality: $('quality'), qualityVal: $('qualityVal'),
  transparent: $('transparent'), maxMp: $('maxMp'), prefix: $('prefix'),
  generate: $('generate'), status: $('status'), barWrap: $('barWrap'), bar: $('bar'),
  resultsCard: $('resultsCard'), results: $('results'),
  saveAllBtn: $('saveAllBtn'), zipBtn: $('zipBtn'), saveHint: $('saveHint'),
};

const state = { items: [], results: [], added: 0, busy: false };

/* Phones have much tighter canvas limits than desktops. */
const smallTouch = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 820;
if (smallTouch) el.maxMp.value = '16';

/* ---------- decoding ---------- */

async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) {}
  try { return await createImageBitmap(file); } catch (_) {}
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { img._url = url; resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('cannot decode')); };
    img.src = url;
  });
}

const release = (img) => { if (img.close) img.close(); else if (img._url) URL.revokeObjectURL(img._url); };
const dims = (img) => [img.naturalWidth || img.width, img.naturalHeight || img.height];

const thumbCanvas = document.createElement('canvas');

/* Keep the photo's real proportions — a square crop here would misrepresent
   every non-square photo in the picker. */
function makeThumb(img) {
  const [w, h] = dims(img);
  const s = Math.min(200 / w, 200 / h, 1);
  thumbCanvas.width = Math.max(1, Math.round(w * s));
  thumbCanvas.height = Math.max(1, Math.round(h * s));
  const ctx = thumbCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
  return new Promise((res) => thumbCanvas.toBlob((b) => res(b ? URL.createObjectURL(b) : ''), 'image/jpeg', 0.75));
}

/* ---------- adding files ---------- */

async function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(f.name));
  if (!files.length) return;
  const seen = new Set(state.items.map((i) => i.key));
  const failed = [];
  setBusy(true);

  for (let n = 0; n < files.length; n++) {
    const file = files[n];
    const key = `${file.name}|${file.size}|${file.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    setStatus(`Reading ${n + 1} / ${files.length}\u2026`);
    progress((n + 1) / files.length);
    try {
      const img = await decode(file);
      const [w, h] = dims(img);
      const thumb = await makeThumb(img);
      release(img);
      const pos = state.added++;
      state.items.push({ key, file, name: file.name, w, h, thumb, added: pos, pos });
    } catch (_) {
      failed.push(file.name);
    }
    if (n % 4 === 3) await new Promise((r) => setTimeout(r));
  }

  el.loadErrors.hidden = !failed.length;
  if (failed.length) {
    el.loadErrors.textContent = `Could not read ${failed.length} file(s) — browsers cannot decode HEIC/HEIF:\n` +
      failed.slice(0, 8).join(', ') + (failed.length > 8 ? `, +${failed.length - 8} more` : '');
  }
  setBusy(false);
  setStatus('');
  progress(0);
  render();
}

/* ---------- ordering ---------- */

function view() {
  const arr = [...state.items];
  const by = {
    name: (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
    date: (a, b) => a.file.lastModified - b.file.lastModified,
    size: (a, b) => a.file.size - b.file.size,
    manual: (a, b) => a.pos - b.pos,
    added: (a, b) => a.added - b.added,
  }[el.sort.value] || ((a, b) => a.added - b.added);
  arr.sort(by);
  if (el.reverse.checked) arr.reverse();
  return arr;
}

/* Freeze what's on screen as the manual order, so later moves behave predictably. */
function commitManual(order) {
  order.forEach((item, i) => { item.pos = i; });
  el.sort.value = 'manual';
  el.reverse.checked = false;
}

function move(item, delta) {
  const order = view();
  const from = order.indexOf(item);
  const to = from + delta;
  if (to < 0 || to >= order.length) return;
  order.splice(to, 0, ...order.splice(from, 1));
  commitManual(order);
  render();
}

function remove(item) {
  URL.revokeObjectURL(item.thumb);
  state.items = state.items.filter((i) => i !== item);
  render();
}

/* ---------- layout maths ---------- */

function cell() {
  if (el.cellMode.value === 'custom') {
    return [Math.max(16, +el.cellW.value || 960), Math.max(16, +el.cellH.value || 1280)];
  }
  const tally = new Map();
  for (const i of state.items) {
    const k = `${i.w}x${i.h}`;
    tally.set(k, (tally.get(k) || 0) + 1);
  }
  let best = null;
  for (const [k, n] of tally) if (!best || n > best.n) best = { k, n };
  if (!best) return [960, 1280];
  const [w, h] = best.k.split('x').map(Number);
  return [w, h];
}

const sheetSize = (cols, rows, cw, ch, g) => [cols * cw + (cols + 1) * g, rows * ch + (rows + 1) * g];

/* Nearest-to-square grid for n cells, penalising empty cells. */
function bestGrid(n, cw, ch) {
  let best = { cols: n, rows: 1, score: Infinity };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    if (cols * (rows - 1) >= n) continue; // trailing row entirely empty
    const blanks = cols * rows - n;
    const score = Math.abs(Math.log((cols * cw) / (rows * ch))) + 0.15 * blanks;
    if (score < best.score) best = { cols, rows, score };
  }
  return best;
}

/* ---------- rendering ---------- */

function drawFitted(ctx, img, x, y, w, h, mode) {
  const [iw, ih] = dims(img);
  const s = mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
  if (mode === 'cover') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
}

async function renderOnce(items, cols, rows, budget, onStep) {
  const [cw, ch] = cell();
  const g = Math.max(0, +el.gutter.value || 0);
  const [lw, lh] = sheetSize(cols, rows, cw, ch, g);

  const MAX_SIDE = 16384;
  let scale = Math.min(1, MAX_SIDE / lw, MAX_SIDE / lh);
  if (budget > 0 && lw * lh * scale * scale > budget) scale = Math.sqrt(budget / (lw * lh));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(lw * scale));
  canvas.height = Math.max(1, Math.round(lh * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(canvas.width / lw, 0, 0, canvas.height / lh, 0, 0);

  const png = el.format.value === 'image/png';
  if (!(png && el.transparent.checked)) {
    ctx.fillStyle = el.bg.value;
    ctx.fillRect(0, 0, lw, lh);
  }

  for (let i = 0; i < items.length; i++) {
    const img = await decode(items[i].file);
    drawFitted(ctx, img, g + (i % cols) * (cw + g), g + Math.floor(i / cols) * (ch + g), cw, ch, el.fit.value);
    release(img);
    if (onStep) await onStep();
  }

  const quality = +el.quality.value / 100;
  const blob = await new Promise((res) => canvas.toBlob(res, el.format.value, quality));
  const [w, h] = [canvas.width, canvas.height];
  canvas.width = canvas.height = 0; // let the backing store go straight away
  return blob ? { blob, w, h, scale } : null;
}

/* A canvas the browser won't allocate yields null/throws; halve and retry. */
async function renderCollage(items, cols, rows, name, onStep) {
  let budget = Math.max(1, +el.maxMp.value || 40) * 1e6;
  for (let attempt = 0; attempt < 4; attempt++) {
    let out = null;
    try { out = await renderOnce(items, cols, rows, budget, attempt === 0 ? onStep : null); } catch (_) {}
    if (out) return { name, blob: out.blob, w: out.w, h: out.h, scale: out.scale };
    budget = Math.floor(budget / 2);
  }
  throw new Error(`"${name}" is too large for this browser to render — lower "max size".`);
}

function jobs() {
  const order = view();
  const list = [];
  const prefix = (el.prefix.value.trim() || 'collage').replace(/[\/\\:*?"<>|\u0000-\u001f]/g, '_');
  const ext = el.format.value === 'image/png' ? 'png' : 'jpg';

  if (el.doAll.checked && order.length) {
    list.push({ items: order, cols: +el.allCols.value, rows: +el.allRows.value, name: `${prefix}_all_${order.length}.${ext}` });
  }
  if (el.doSplit.checked && order.length) {
    const per = Math.max(1, (+el.splitCols.value) * (+el.splitRows.value));
    for (let i = 0, n = 1; i < order.length; i += per, n++) {
      list.push({
        items: order.slice(i, i + per),
        cols: +el.splitCols.value, rows: +el.splitRows.value,
        name: `${prefix}_${String(n).padStart(2, '0')}.${ext}`,
      });
    }
  }
  return list;
}

async function generate() {
  const list = jobs();
  if (!list.length) return;
  setBusy(true);
  clearResults();

  const total = list.reduce((s, j) => s + j.items.length, 0);
  let done = 0;
  const step = async () => {
    done++;
    progress(done / total);
    setStatus(`Rendering ${done} / ${total} photos\u2026`);
    if (done % 3 === 0) await new Promise((r) => setTimeout(r));
  };

  try {
    for (const job of list) {
      const res = await renderCollage(job.items, job.cols, job.rows, job.name, step);
      state.results.push(res);
      showResult(res);
    }
    const shrunk = state.results.filter((r) => r.scale < 0.999).length;
    setStatus(`Done — ${state.results.length} collage(s)` + (shrunk ? `, ${shrunk} scaled down to fit the size limit` : ''));
  } catch (err) {
    setStatus('');
    el.loadErrors.hidden = false;
    el.loadErrors.textContent = err.message;
  }
  progress(0);
  setBusy(false);
}

/* ---------- results ---------- */

function clearResults() {
  for (const r of state.results) if (r.url) URL.revokeObjectURL(r.url);
  state.results = [];
  el.results.textContent = '';
  el.saveHint.textContent = '';
  el.resultsCard.hidden = true;
}

function showResult(r) {
  r.url = URL.createObjectURL(r.blob);
  el.resultsCard.hidden = false;
  el.saveHint.textContent = canPickFolder
    ? 'Save all writes every collage straight into a folder you pick — no zip to open.'
    : 'Save all downloads the collages one after another; your browser may ask once to allow multiple files. Each row below also has its own Save button.';
  const li = document.createElement('li');
  const img = document.createElement('img');
  img.src = r.url;
  img.alt = r.name;
  const meta = document.createElement('div');
  meta.className = 'meta';
  const b = document.createElement('b');
  b.textContent = r.name;
  const sub = document.createElement('span');
  sub.className = 'mono';
  sub.textContent = `${r.w} \u00d7 ${r.h} px \u00b7 ${(r.blob.size / 1e6).toFixed(1)} MB` + (r.scale < 0.999 ? ` \u00b7 scaled ${Math.round(r.scale * 100)}%` : '');
  meta.append(b, sub);
  const a = document.createElement('a');
  a.className = 'dl';
  a.href = r.url;
  a.download = r.name;
  a.textContent = 'Save';
  li.append(img, meta, a);
  el.results.append(li);
}

const canPickFolder = typeof window.showDirectoryPicker === 'function';

function saveOne(r) {
  const a = document.createElement('a');
  a.href = r.url;
  a.download = r.name;
  document.body.append(a);
  a.click();
  a.remove();
}

/* Chrome/Edge on desktop: write every file into one folder the user picks. */
async function saveToFolder() {
  const dir = await window.showDirectoryPicker({ mode: 'readwrite', id: 'collages' });
  let n = 0;
  for (const r of state.results) {
    const handle = await dir.getFileHandle(r.name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(r.blob);
    await writable.close();
    n++;
    setStatus(`Saving ${n} / ${state.results.length}…`);
  }
  setStatus(`Saved ${n} file${n > 1 ? 's' : ''} to the folder you chose`);
}

/* Everywhere else: fire the downloads one at a time. Browsers throttle bursts,
   hence the gap; some ask once for permission to save multiple files. */
async function saveSeparately() {
  for (let i = 0; i < state.results.length; i++) {
    saveOne(state.results[i]);
    setStatus(`Sending ${i + 1} / ${state.results.length} to downloads…`);
    await new Promise((r) => setTimeout(r, 400));
  }
  setStatus(`Sent ${state.results.length} file(s) to your downloads`);
}

async function saveAll() {
  if (!state.results.length) return;
  el.saveAllBtn.disabled = true;
  try {
    if (canPickFolder) await saveToFolder();
    else await saveSeparately();
  } catch (err) {
    if (err && err.name === 'AbortError') setStatus(''); // folder picker dismissed
    else await saveSeparately();
  }
  el.saveAllBtn.disabled = false;
}

async function downloadZip() {
  if (!state.results.length) return;
  el.zipBtn.disabled = true;
  const prev = el.zipBtn.textContent;
  el.zipBtn.textContent = 'Packing…';
  const entries = [];
  for (const r of state.results) entries.push({ name: r.name, data: new Uint8Array(await r.blob.arrayBuffer()) });
  const url = URL.createObjectURL(makeZip(entries));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(el.prefix.value.trim() || 'collage')}s.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  el.zipBtn.textContent = prev;
  el.zipBtn.disabled = false;
}

/* ---------- UI ---------- */

function setStatus(t) { el.status.textContent = t; }

function progress(f) {
  el.barWrap.hidden = f <= 0;
  el.bar.style.width = `${Math.min(100, f * 100)}%`;
}

function setBusy(b) {
  state.busy = b;
  el.generate.disabled = b || !jobs().length;
  el.pickBtn.disabled = b;
}

let dragged = null;

function thumbNode(item) {
  if (item.node) return item.node;

  const li = document.createElement('li');
  li.draggable = true;
  li.title = item.name;
  const img = document.createElement('img');
  img.src = item.thumb;
  img.alt = item.name;
  const badge = document.createElement('span');
  badge.className = 'idx';
  const tools = document.createElement('div');
  tools.className = 'tools';

  const tool = (label, title, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-label', `${title}: ${item.name}`);
    b.onclick = fn;
    tools.append(b);
    return b;
  };
  const prevBtn = tool('\u2039', 'Move earlier', () => move(item, -1));
  tool('\u2715', 'Remove', () => remove(item));
  const nextBtn = tool('\u203a', 'Move later', () => move(item, 1));
  li.append(img, badge, tools);

  li.ondragstart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.name);
    dragged = item;
    li.classList.add('dragging');
  };
  li.ondragend = () => { li.classList.remove('dragging'); dragged = null; };
  li.ondragover = (e) => { if (dragged && dragged !== item) { e.preventDefault(); li.classList.add('dropTarget'); } };
  li.ondragleave = () => li.classList.remove('dropTarget');
  li.ondrop = (e) => {
    e.preventDefault();
    li.classList.remove('dropTarget');
    if (!dragged || dragged === item) return;
    const arr = view();
    arr.splice(arr.indexOf(dragged), 1); // pull it out first, then locate the target
    arr.splice(arr.indexOf(item), 0, dragged);
    commitManual(arr);
    dragged = null;
    render();
  };

  Object.assign(item, { node: li, badge, prevBtn, nextBtn });
  return li;
}

/* Tiles are created once and only re-ordered afterwards, so changing the order
   or editing any other field never makes the images reload and flicker. */
function renderThumbs() {
  const order = view();
  const frag = document.createDocumentFragment();
  order.forEach((item, i) => {
    frag.append(thumbNode(item));
    item.badge.textContent = i + 1;
    item.prevBtn.disabled = i === 0;
    item.nextBtn.disabled = i === order.length - 1;
  });
  el.thumbs.replaceChildren(frag);

  const n = order.length;
  el.listBar.hidden = !n;
  el.count.textContent = n ? `${n} photo${n > 1 ? 's' : ''} selected` : '';
  el.orderHint.hidden = !n;
  el.orderHint.textContent = el.sort.value === 'manual'
    ? 'Manual order — drag a photo, or use \u2039 \u203a on it. Choosing another order discards it.'
    : 'Cells are filled left to right, top to bottom, in this order.';
}

function renderInfo() {
  const n = state.items.length;
  const [cw, ch] = cell();
  const g = Math.max(0, +el.gutter.value || 0);
  el.cellW.disabled = el.cellH.disabled = el.cellMode.value !== 'custom';
  if (el.cellMode.value === 'auto' && n) { el.cellW.value = cw; el.cellH.value = ch; }
  el.thumbs.style.setProperty('--tile-aspect', `${cw} / ${ch}`);

  const cap = Math.max(1, +el.maxMp.value || 40) * 1e6;
  const describe = (cols, rows) => {
    const [w, h] = sheetSize(cols, rows, cw, ch, g);
    const s = Math.min(1, Math.sqrt(cap / (w * h)));
    const out = `${Math.round(w * s)} \u00d7 ${Math.round(h * s)} px`;
    return s < 0.999 ? `${out}, scaled ${Math.round(s * 100)}% to fit ${el.maxMp.value} MP` : out;
  };

  if (n) {
    const cells = (+el.allCols.value) * (+el.allRows.value);
    const short = n - cells;
    el.allInfo.textContent = short > 0
      ? `\u26a0 ${cells} cells cannot hold ${n} photos \u2014 ${short} would be left out`
      : `${n} photos \u2192 ${cells} cells, ${cells - n} empty \u00b7 ${describe(+el.allCols.value, +el.allRows.value)}`;

    const per = Math.max(1, (+el.splitCols.value) * (+el.splitRows.value));
    const count = Math.ceil(n / per);
    const last = n - per * (count - 1);
    el.splitInfo.textContent = `${per} per collage \u2192 ${count} collage${count > 1 ? 's' : ''}` +
      (last === per ? '' : `, last has ${last}`) + ` \u00b7 ${describe(+el.splitCols.value, +el.splitRows.value)}`;
  } else {
    el.allInfo.textContent = el.splitInfo.textContent = 'Add photos to see the output size.';
  }

  el.transparent.disabled = el.format.value !== 'image/png';
  el.quality.disabled = el.format.value !== 'image/jpeg';
  el.qualityVal.textContent = el.quality.value;
  el.generate.disabled = state.busy || !jobs().length;
}

function render() { renderThumbs(); renderInfo(); }

/* ---------- wiring ---------- */

el.pickBtn.onclick = () => el.picker.click();
el.picker.onchange = () => { addFiles(el.picker.files); el.picker.value = ''; };

for (const type of ['dragenter', 'dragover']) {
  el.drop.addEventListener(type, (e) => { e.preventDefault(); el.drop.classList.add('over'); });
}
for (const type of ['dragleave', 'drop']) {
  el.drop.addEventListener(type, (e) => { e.preventDefault(); el.drop.classList.remove('over'); });
}
el.drop.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

el.clear.onclick = () => {
  for (const i of state.items) URL.revokeObjectURL(i.thumb);
  state.items = [];
  el.loadErrors.hidden = true;
  clearResults();
  render();
};

el.allFit.onclick = () => {
  const n = view().length;
  if (!n) return;
  const [cw, ch] = cell();
  const g = bestGrid(n, cw, ch);
  el.allCols.value = g.cols;
  el.allRows.value = g.rows;
  renderInfo();
};

/* Only the two order controls affect the tile sequence; everything else just
   changes the numbers, so it must not touch the thumbnail list. */
for (const c of [el.sort, el.reverse]) c.addEventListener('change', render);

for (const c of [el.doAll, el.doSplit, el.allCols, el.allRows, el.splitCols, el.splitRows,
                 el.cellMode, el.cellW, el.cellH, el.fit, el.gutter, el.bg,
                 el.format, el.quality, el.transparent, el.maxMp, el.prefix]) {
  c.addEventListener('input', renderInfo);
  c.addEventListener('change', renderInfo);
}

el.generate.onclick = generate;
el.saveAllBtn.onclick = saveAll;
el.zipBtn.onclick = downloadZip;

render();
