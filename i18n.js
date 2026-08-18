'use strict';

/* Two languages only, so a plain dictionary is enough — no framework, no
   fetching. Values may contain markup; they are author-written, never input. */
const STRINGS = {
  ru: {
    language: 'Язык',
    title: 'Конструктор коллажей',
    tagline: 'Сетка любого размера — строки × столбцы. Всё работает в браузере: ничего не загружается на сервер, без регистрации.',

    step1: '1. Выберите фото',
    choose: 'Выбрать изображения…',
    dropHint: 'или перетащите их сюда — добавлять можно в любой момент',
    order: 'порядок',
    orderAdded: 'как добавлены',
    orderName: 'по имени файла',
    orderDate: 'по дате файла',
    orderSize: 'по размеру файла',
    orderManual: 'вручную',
    reverse: 'обратный',
    clearAll: 'Очистить',
    countSelected_one: 'Выбрано фото: {n}',
    countSelected_other: 'Выбрано фото: {n}',
    orderHintNormal: 'Ячейки заполняются слева направо, сверху вниз в этом порядке.',
    orderHintManual: 'Порядок вручную — перетащите фото или используйте ‹ ›. При выборе другого порядка он сбросится.',
    moveEarlier: 'Переместить раньше',
    remove: 'Удалить',
    moveLater: 'Переместить позже',

    step2: '2. Раскладка',
    doAll: 'Один коллаж, <b>все</b> фото',
    doSplit: 'Разбить на <b>несколько</b> коллажей',
    columns: 'столбцы',
    rows: 'строки',
    fitToCount: 'Подобрать под количество фото',
    fitToCountTitle: 'Подбирается автоматически при изменении числа фото. Если задать столбцы или строки вручную, автоподбор отключится — нажмите, чтобы включить снова.',

    cellsLegend: 'Ячейки',
    cellSize: 'размер ячейки',
    auto: 'авто',
    custom: 'вручную',
    cellWidth: 'ширина ячейки',
    cellHeight: 'высота ячейки',
    fit: 'вписывание',
    contain: 'целиком',
    cover: 'с обрезкой',
    gutter: 'отступ (px)',
    background: 'фон',
    cellsHint: '<b>авто</b> — самый частый размер фото в выборке. <b>целиком</b> сохраняет фото полностью (по краям появятся поля, если пропорции отличаются от ячейки); <b>с обрезкой</b> заполняет ячейку и обрезает края. При «авто + целиком» фото совпадающего размера ставятся в исходном разрешении — без масштабирования и обрезки.',

    outputLegend: 'Результат',
    format: 'формат',
    quality: 'качество',
    maxSize: 'макс. размер (Мпикс)',
    filePrefix: 'префикс файла',
    transparentBg: 'прозрачный фон (только PNG)',
    outputHint: 'Коллажи больше <b>макс. размера</b> пропорционально уменьшаются, иначе браузер откажется их отрисовывать. Увеличьте значение для максимальной детализации на компьютере.',
    generate: 'Создать коллажи',

    step3: '3. Скачать',
    saveAll: 'Сохранить все',
    asZip: 'в .zip',
    save: 'Сохранить',
    saveHintFolder: '«Сохранить все» запишет каждый коллаж прямо в выбранную папку — без zip.',
    saveHintSequential: '«Сохранить все» скачает коллажи один за другим; браузер может один раз спросить разрешение на несколько файлов. У каждой строки ниже есть своя кнопка «Сохранить».',
    packing: 'Упаковка…',

    footerPrivacy: 'Ваши фото не покидают устройство: с ними не отправляется ни один сетевой запрос. После загрузки работает без интернета.',
    footerHeic: 'Браузеры не умеют декодировать HEIC/HEIF — сначала конвертируйте их в JPEG.',

    addPhotosFirst: 'Добавьте фото, чтобы увидеть размер результата.',
    infoAll: '{n} фото → ячеек: {cells}, пустых: {empty} · {dims}',
    infoAllShort: '⚠ {cells} ячеек не хватит для {n} фото — {short} останется вне коллажа',
    infoSplit_one: '{per} на коллаж → коллажей: {count}{tail} · {dims}',
    infoSplit_other: '{per} на коллаж → коллажей: {count}{tail} · {dims}',
    infoSplitTail: ', в последнем: {last}',
    dims: '{w} × {h} px',
    dimsScaled: '{w} × {h} px, уменьшено до {pct}% под {mp} Мпикс',

    statusReading: 'Чтение {i} / {n}…',
    statusRendering: 'Отрисовка {i} / {n} фото…',
    statusDone_one: 'Готово — коллажей: {n}',
    statusDone_other: 'Готово — коллажей: {n}',
    statusScaled: ', уменьшено: {n}',
    statusSaving: 'Сохранение {i} / {n}…',
    statusSaved_one: 'Сохранено файлов в выбранную папку: {n}',
    statusSaved_other: 'Сохранено файлов в выбранную папку: {n}',
    statusSending: 'Отправка {i} / {n} в загрузки…',
    statusSent_one: 'Отправлено файлов в загрузки: {n}',
    statusSent_other: 'Отправлено файлов в загрузки: {n}',

    errHeic: 'Не удалось прочитать файлов: {n} — браузеры не умеют декодировать HEIC/HEIF:',
    errMore: ', ещё {n}',
    errTooLarge: '«{name}» слишком большой для этого браузера — уменьшите «макс. размер».',
  },

  en: {
    language: 'Language',
    title: 'Collage Maker',
    tagline: 'Grid collages, any rows × columns. Everything runs in your browser — no upload, no server, no account.',

    step1: '1. Pick photos',
    choose: 'Choose images…',
    dropHint: 'or drag & drop them here — you can add more at any time',
    order: 'order',
    orderAdded: 'as added',
    orderName: 'file name',
    orderDate: 'file date',
    orderSize: 'file size',
    orderManual: 'manual',
    reverse: 'reverse',
    clearAll: 'Clear all',
    countSelected_one: '{n} photo selected',
    countSelected_other: '{n} photos selected',
    orderHintNormal: 'Cells are filled left to right, top to bottom, in this order.',
    orderHintManual: 'Manual order — drag a photo, or use ‹ › on it. Choosing another order discards it.',
    moveEarlier: 'Move earlier',
    remove: 'Remove',
    moveLater: 'Move later',

    step2: '2. Layout',
    doAll: 'One collage, <b>all</b> photos',
    doSplit: 'Split into <b>several</b> collages',
    columns: 'columns',
    rows: 'rows',
    fitToCount: 'Fit to photo count',
    fitToCountTitle: 'Fits automatically when the number of photos changes. Setting columns or rows by hand turns that off — press to turn it back on.',

    cellsLegend: 'Cells',
    cellSize: 'cell size',
    auto: 'auto',
    custom: 'custom',
    cellWidth: 'cell width',
    cellHeight: 'cell height',
    fit: 'fit',
    contain: 'contain',
    cover: 'cover',
    gutter: 'gutter (px)',
    background: 'background',
    cellsHint: '<b>auto</b> cell size = the most common photo size in your selection. <b>contain</b> keeps every photo whole (margins appear where a photo\'s shape differs from the cell); <b>cover</b> fills the cell and crops the edges. With auto + contain, photos matching the common size land at native resolution — no scaling, no cropping.',

    outputLegend: 'Output',
    format: 'format',
    quality: 'quality',
    maxSize: 'max size (MP)',
    filePrefix: 'file prefix',
    transparentBg: 'transparent background (PNG only)',
    outputHint: 'Collages larger than <b>max size</b> are scaled down proportionally so browsers don\'t refuse to render them. Raise it for maximum detail on a desktop.',
    generate: 'Generate collages',

    step3: '3. Download',
    saveAll: 'Save all',
    asZip: 'as .zip',
    save: 'Save',
    saveHintFolder: 'Save all writes every collage straight into a folder you pick — no zip to open.',
    saveHintSequential: 'Save all downloads the collages one after another; your browser may ask once to allow multiple files. Each row below also has its own Save button.',
    packing: 'Packing…',

    footerPrivacy: 'Your photos never leave this device: no network request is made with them. Works offline once loaded.',
    footerHeic: 'HEIC/HEIF files can\'t be decoded by browsers — convert them to JPEG first.',

    addPhotosFirst: 'Add photos to see the output size.',
    infoAll: '{n} photos → {cells} cells, {empty} empty · {dims}',
    infoAllShort: '⚠ {cells} cells cannot hold {n} photos — {short} would be left out',
    infoSplit_one: '{per} per collage → {count} collage{tail} · {dims}',
    infoSplit_other: '{per} per collage → {count} collages{tail} · {dims}',
    infoSplitTail: ', last has {last}',
    dims: '{w} × {h} px',
    dimsScaled: '{w} × {h} px, scaled {pct}% to fit {mp} MP',

    statusReading: 'Reading {i} / {n}…',
    statusRendering: 'Rendering {i} / {n} photos…',
    statusDone_one: 'Done — {n} collage',
    statusDone_other: 'Done — {n} collages',
    statusScaled: ', {n} scaled down to fit the size limit',
    statusSaving: 'Saving {i} / {n}…',
    statusSaved_one: 'Saved {n} file to the folder you chose',
    statusSaved_other: 'Saved {n} files to the folder you chose',
    statusSending: 'Sending {i} / {n} to downloads…',
    statusSent_one: 'Sent {n} file to your downloads',
    statusSent_other: 'Sent {n} files to your downloads',

    errHeic: 'Could not read {n} file(s) — browsers cannot decode HEIC/HEIF:',
    errMore: ', +{n} more',
    errTooLarge: '"{name}" is too large for this browser to render — lower "max size".',
  },
};

const DEFAULT_LANG = 'ru';
let lang = DEFAULT_LANG;

function t(key, vars) {
  const s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS[DEFAULT_LANG][key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)) : s;
}

/* Russian would need three plural forms; every counted string here is phrased
   as a label ("Коллажей: 3") so one form covers it, and only English varies. */
function tn(key, n, vars) {
  return t(`${key}${n === 1 ? '_one' : '_other'}`, { n, ...vars });
}

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (_) {
    return null; // Safari private mode and similar throw on localStorage
  }
}

function applyStaticText() {
  document.documentElement.lang = lang;
  for (const node of document.querySelectorAll('[data-i18n]')) node.innerHTML = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-title]')) node.title = t(node.dataset.i18nTitle);
}

function setLang(next) {
  lang = STRINGS[next] ? next : DEFAULT_LANG;
  store('collageLang', lang);
  applyStaticText();
}

function initLang() {
  const saved = store('collageLang');
  lang = STRINGS[saved] ? saved : DEFAULT_LANG;
  return lang;
}
