// Stackbound icons: turns the icon art (iconart.js) into inline SVG for menus and Path2D shapes for canvases.
// Icon shapes from game-icons.net by Lorc, Delapouite and contributors, licensed CC BY 3.0.
'use strict';
(function (SB) {
  const P = SB.ICON_PATHS, MAP = SB.ICON_MAP;
  const svg = (name, cls, style) => `<svg class="gi${cls ? ' ' + cls : ''}" viewBox="0 0 512 512" aria-hidden="true"${style ? ` style="${style}"` : ''}><path d="${P[name] || ''}"/></svg>`;
  // inline icon by art name; color is optional (defaults to the text color or the container's CSS)
  SB.ico = (name, cls, color) => svg(name, cls, color ? 'fill:' + color : '');
  // inline icon for a UI role (trophy, settings, bag...)
  SB.uiIco = (k, cls, color) => SB.ico(MAP.UI[k] || k, cls, color);

  // small drawn UI marks that stand in for text symbols (arrows, triangles, a tick): they size to the text and take its colour
  const MARKS = {
    back: '<path d="M10.5 2.5L3.5 8L10.5 13.5Z"/>',
    next: '<path d="M5.5 2.5L12.5 8L5.5 13.5Z"/>',
    left: '<path d="M2.5 8L8.5 2.8V6H13.5V10H8.5V13.2Z"/>',
    right: '<path d="M13.5 8L7.5 2.8V6H2.5V10H7.5V13.2Z"/>',
    up: '<path d="M8 2.5L13.2 8.5H10V13.5H6V8.5H2.8Z"/>',
    down: '<path d="M8 13.5L13.2 7.5H10V2.5H6V7.5H2.8Z"/>',
    to: '<path d="M2 8H11.5M8.5 4.5L12 8L8.5 11.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    rotate: '<path d="M12.6 8.4A4.7 4.7 0 1 1 10.9 4.4" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/><path d="M9.2 1.6L13.6 3.4L10.7 7Z"/>',
    dot: '<circle cx="8" cy="8" r="3.6"/>',
    x: '<path d="M3.6 3.6L12.4 12.4M12.4 3.6L3.6 12.4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    tick: '<path d="M2.8 8.6L6.4 12L13.2 4.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  SB.glyph = (k, cls) => `<svg class="ug${cls ? ' ' + cls : ''}" viewBox="0 0 16 16" aria-hidden="true">${MARKS[k] || ''}</svg>`;

  const cache = new Map();
  SB.icoPath = (name) => {
    let p = cache.get(name);
    if (!p) { p = new Path2D(P[name] || ''); cache.set(name, p); }
    return p;
  };
  // draw an icon on a canvas, centred on (cx, cy), size in pixels
  SB.drawIco = (ctx, name, cx, cy, size, fill) => {
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);
    ctx.scale(size / 512, size / 512);
    if (fill) ctx.fillStyle = fill;
    ctx.fill(SB.icoPath(name));
    ctx.restore();
  };

  // every item in the data tables gets its art: d.icon becomes inline SVG, d.iconKey keeps the art name
  for (const t in MAP) {
    const tbl = SB[t];
    if (!tbl || t === 'UI') continue;
    for (const id in MAP[t]) {
      const d = tbl[id];
      if (!d) continue;
      d.iconKey = MAP[t][id];
      d.icon = svg(MAP[t][id]);
    }
  }

  // shared gradient fills for icon badges (referenced from CSS as url(#gi-...))
  const G = [
    ['gold', '#fff7cf', '#ffd23b', '#c47d0e'],
    ['common', '#ffffff', '#cdd7ea', '#8794ad'],
    ['uncommon', '#e4fff0', '#4dff9a', '#14a35a'],
    ['rare', '#ffe6f8', '#ff6bd6', '#9b3be0'],
    ['legendary', '#fff6c2', '#ffbe3b', '#ff4d6a'],
    ['mythic', '#ffe0c2', '#ff5a1c', '#7a0a24'],
    ['cyan', '#e6fdff', '#35e6ff', '#1f7ddb'],
    ['violet', '#f0e8ff', '#a98bff', '#5a3bd6'],
    ['red', '#ffe3e6', '#ff5a6a', '#a3123a'],
    ['green', '#e9ffe8', '#6dff7c', '#1c9e3c'],
    ['orange', '#fff0d9', '#ff9a3b', '#c2410c'],
    ['steel', '#ffffff', '#c7d2e2', '#6b7a90'],
  ];
  const defs = `<svg id="giDefs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${G.map(([id, a, b, c]) => `<linearGradient id="gi-${id}" x1="0.2" y1="0" x2="0.5" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`).join('')}</defs></svg>`;
  const put = () => { if (!document.getElementById('giDefs')) document.body.insertAdjacentHTML('afterbegin', defs); };
  if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
})(window.SB);
