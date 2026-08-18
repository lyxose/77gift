/* ============================================================
   七夕心愿礼 · 橘朵礼物挑选页
   ============================================================ */
'use strict';

const EMAIL = 'luyx@psych.ac.cn';
const WEB3FORMS_KEY = '794b64d3-8f9a-494f-85b9-1fc1e7b3e8a2';
const MAX_ITEMS = 3;
const TARGET_DAYS = '951';

/* ---------- 小工具 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function on(el, ev, fn) {
  if (!el) return;
  el.addEventListener(ev, fn);
}

function requestFS() {
  const el = document.documentElement;
  try {
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (fn) (fn.call(el) || Promise.resolve()).catch(() => {});
  } catch (_) {}
}

function showScreen(node) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  if (node) node.classList.add('active');
}

function enterGift() {
  $('#introStage').classList.add('done');
  const g = $('#giftStage');
  g.hidden = false;
  requestFS();
}

/* ============================================================
   前置互动流程
   ============================================================ */
function initIntro() {
  // 第一屏：开场
  const optRight = $('#optRight');
  const optFlee = $('#optFlee');
  if (optRight) on(optRight, 'click', () => { requestFS(); showScreen($('#screenDays')); });

  // 逃跑按钮（滑稽溜走）
  makeFlee(optFlee);
  makeFlee($('#optNo'));

  // 第二屏：天数 951 输入
  initDays();

  // 第三屏：奖励
  const optYes = $('#optYes');
  if (optYes) on(optYes, 'click', () => { requestFS(); enterGift(); });
}

/* ---------- 天数 951 输入：三格 + 小键盘 ---------- */
function initDays() {
  const PAIRS = [['9', '9'], ['5', '5'], ['1', '1']];
  const slots = $$('#daySlots .day-slot');
  const digits = ['', '', ''];
  const confirmBtn = $('#daysConfirm');
  const hint = $('#daysHint');

  function refresh() {
    slots.forEach((slot, i) => {
      slot.textContent = digits[i];
      slot.classList.toggle('filled', !!digits[i]);
    });
    const ok = digits.join('') === TARGET_DAYS;
    confirmBtn.disabled = !ok;
    if (ok && hint) hint.textContent = '答对啦！点「确认」继续～';
  }

  // 键盘
  const numpad = $('#daysNumpad');
  if (numpad) {
    const pad = document.createElement('div');
    pad.className = 'numpad';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(d => {
      const k = document.createElement('button');
      k.className = 'numpad-key';
      k.type = 'button';
      k.textContent = d;
      on(k, 'click', () => tryDigit(d));
      pad.appendChild(k);
    });
    numpad.appendChild(pad);
  }

  function tryDigit(d) {
    const idx = digits.findIndex(x => x === '');
    if (idx === -1) return;
    if (PAIRS[idx][0] === d) {
      digits[idx] = d;
      refresh();
    } else {
      const slot = slots[idx];
      slot.classList.remove('wrong');
      void slot.offsetWidth; // 重启动画
      slot.classList.add('wrong');
    }
  }
  window.__tryDayDigit = tryDigit;

  // 物理键盘支持
  on(document, 'keydown', (e) => {
    if ($('#introStage').classList.contains('done')) return;
    if (/^[0-9]$/.test(e.key)) tryDigit(e.key);
  });

  if (confirmBtn) on(confirmBtn, 'click', () => { requestFS(); showScreen($('#screenReward')); });
  refresh();
}

/* ---------- 逃跑按钮：连续平滑溜走（先快后慢的滑稽感）---------- */
function makeFlee(btn) {
  if (!btn) return;
  const move = () => {
    const m = 16, w = btn.offsetWidth || 140, h = btn.offsetHeight || 48;
    const minX = m, minY = m;
    const maxX = Math.max(m, window.innerWidth - w - m);
    const maxY = Math.max(m, window.innerHeight - h - m);
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    btn.style.position = 'fixed';
    btn.style.left = x + 'px';
    btn.style.top = y + 'px';
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    btn.style.margin = '0';
  };
  on(btn, 'mouseover', move);
  on(btn, 'touchstart', (e) => { e.preventDefault(); move(); });
}

/* ============================================================
   礼物挑选
   ============================================================ */
let PRODUCTS = [];
let CATEGORIES = [];
const wishMap = new Map();      // id -> { product, model, price }
let current = null;             // 当前打开详情的商品
let allModels = [];
let modelIndex = 0;

function fmtPrice(p) {
  const n = Number(p);
  return isNaN(n) ? (p || '0') : n.toFixed(2);
}

async function loadProducts() {
  try {
    const res = await fetch('products.json', { cache: 'no-store' });
    const data = await res.json();
    PRODUCTS = Array.isArray(data) ? data : (data.products || []);
  } catch (e) {
    PRODUCTS = [];
  }
  CATEGORIES = ['全部', ...Array.from(new Set(PRODUCTS.map(p => p.category || '其他').filter(Boolean)))];
  renderChips();
  renderGrid();
}

function renderChips() {
  const wrap = $('#categoryChips');
  if (!wrap) return;
  wrap.innerHTML = '';
  CATEGORIES.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'chip' + (i === 0 ? ' active' : '');
    b.textContent = c;
    on(b, 'click', () => {
      $$('.chip', wrap).forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderGrid();
    });
    wrap.appendChild(b);
  });
}

function getFiltered() {
  const q = ($('#searchInput').value || '').trim().toLowerCase();
  const active = $('.chip.active');
  const cat = active ? active.textContent : '全部';
  return PRODUCTS.filter(p => {
    const okCat = cat === '全部' || (p.category || '其他') === cat;
    const okQ = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.subtitle || '').toLowerCase().includes(q);
    return okCat && okQ;
  });
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function imgSrc(p) {
  if (p.cover) return p.cover;
  if (p.images && p.images.length) return p.images[0];
  return 'images/placeholder.png';
}

function renderGrid() {
  const grid = $('#productGrid');
  const emptyTip = $('#emptyTip');
  if (!grid) return;
  const list = getFiltered();
  grid.innerHTML = '';
  emptyTip.hidden = list.length > 0;

  list.forEach(p => {
    const id = p.id;
    const card = document.createElement('div');
    card.className = 'card' + (wishMap.has(id) ? ' chosen' : '');
    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="card-img" loading="lazy" src="${esc(imgSrc(p))}" alt="${esc(p.name)}" onerror="this.src='images/placeholder.png'">
      </div>
      <span class="card-tag">${esc(p.tag || p.category || '橘朵')}</span>
      <span class="chosen-badge">♥</span>
      <div class="card-body">
        <div class="card-name">${esc(p.name)}</div>
        <div class="card-row">
          <span class="card-price"><small>￥</small>${esc(fmtPrice(p.price))}</span>
          <button class="card-heart" type="button" aria-label="选中心愿">
            <span class="outline">♡</span><span class="filled">♥</span>
          </button>
        </div>
      </div>`;
    on(card, 'click', (e) => {
      if (e.target.closest('.card-heart')) return;
      openDetail(p);
    });
    const heart = $('.card-heart', card);
    on(heart, 'click', (e) => { e.stopPropagation(); toggleWish(p); });
    grid.appendChild(card);
  });
}

function toggleWish(p) {
  const id = p.id;
  if (wishMap.has(id)) {
    wishMap.delete(id);
  } else {
    const models = (p.models && p.models.length) ? p.models : null;
    if (models) {
      openDetail(p);
      return;
    }
    wishMap.set(id, { product: p, model: '', price: p.price });
  }
  syncWishUI();
  renderGrid();
}

function openDetail(p) {
  current = p;
  const mask = $('#modalMask');
  if (!mask) return;
  $('#modalImage').src = imgSrc(p);
  $('#modalImage').onerror = function () { this.src = 'images/placeholder.png'; };
  $('#modalName').textContent = p.name || '';
  $('#modalPrice').textContent = fmtPrice(p.price);

  const sel = $('#modelSelect');
  sel.innerHTML = '';
  const models = (p.models && p.models.length) ? p.models : null;
  if (models) {
    sel.parentElement.style.display = '';
    models.forEach(m => {
      const o = document.createElement('option');
      o.value = m; o.textContent = m;
      sel.appendChild(o);
    });
  } else {
    sel.parentElement.style.display = 'none';
  }
  updateModalCount();
  mask.hidden = false;
  requestAnimationFrame(() => mask.classList.add('open'));
}

function updateModalCount() {
  const id = current && current.id;
  const c = id && wishMap.has(id) ? (wishMap.get(id).model ? 1 : 1) : 0;
  const el = $('#modalCount');
  if (el) el.textContent = c;
}

function closeModal() {
  const mask = $('#modalMask');
  if (!mask) return;
  mask.classList.remove('open');
  setTimeout(() => { mask.hidden = true; }, 200);
}

function addToWish() {
  if (!current) return;
  const model = current.models && current.models.length ? $('#modelSelect').value : '';
  wishMap.set(current.id, { product: current, model, price: current.price });
  updateModalCount();
  syncWishUI();
  renderGrid();
  closeModal();
}

function removeWish(id) {
  wishMap.delete(id);
  syncWishUI();
  renderGrid();
}

function syncWishUI() {
  const count = wishMap.size;
  const bar = $('#wishBar');
  const submitBtn = $('#submitBtn');
  const countEl = $('#wishCount');
  if (countEl) countEl.textContent = count;
  if (bar) bar.hidden = count === 0;
  if (submitBtn) submitBtn.disabled = count === 0;

  const tags = $('#wishTags');
  if (tags) {
    tags.innerHTML = '';
    for (const { product, model } of wishMap.values()) {
      const t = document.createElement('span');
      t.className = 'wish-tag';
      t.innerHTML = `<img class="thumb" src="${esc(imgSrc(product))}" onerror="this.style.display='none'">` +
        `<span>${esc(product.name)}${model ? ' · ' + esc(model) : ''}</span>` +
        `<button class="tag-x" aria-label="移除">✕</button>`;
      on($('.tag-x', t), 'click', () => removeWish(product.id));
      tags.appendChild(t);
    }
  }
}

/* ---------- 提交 / 确认弹窗 ---------- */
function openConfirm() {
  if (wishMap.size === 0) return;
  const mask = $('#confirmMask');
  if (!mask) return;
  $('#confirmCount').textContent = wishMap.size;
  const list = $('#confirmList');
  list.innerHTML = '';
  for (const { product, model, price } of wishMap.values()) {
    const li = document.createElement('li');
    li.innerHTML = `
      <img class="thumb" src="${esc(imgSrc(product))}" onerror="this.style.display='none'">
      <div class="li-info">
        <div class="li-name">${esc(product.name)}</div>
        <div class="li-model">${esc(model || '默认型号')} · ￥${esc(fmtPrice(price))}</div>
      </div>`;
    list.appendChild(li);
  }
  mask.hidden = false;
  requestAnimationFrame(() => mask.classList.add('open'));
}

function closeConfirm() {
  const mask = $('#confirmMask');
  if (!mask) return;
  mask.classList.remove('open');
  setTimeout(() => { mask.hidden = true; }, 200);
}

function sendWish() {
  const items = Array.from(wishMap.values()).map(({ product, model, price }) => ({
    name: product.name,
    model: model || '默认型号',
    price: fmtPrice(price)
  }));

  const payload = {
    access_key: WEB3FORMS_KEY,
    subject: '七夕心愿清单 ♡',
    from_name: '七夕心愿',
    to: EMAIL,
    message: '收到一份七夕心愿清单：\n' + items.map((it, i) =>
      `${i + 1}. ${it.name}（${it.model}） ￥${it.price}`).join('\n')
  };

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(r => r.json())
    .then(() => { closeConfirm(); showSuccess(); })
    .catch(() => { closeConfirm(); fallbackMail(items); showSuccess(); });
}

function fallbackMail(items) {
  const body = '我的七夕心愿清单：%0D%0A' +
    items.map((it, i) => `${i + 1}. ${it.name}（${it.model}） ￥${it.price}`).join('%0D%0A');
  window.location.href = `mailto:${EMAIL}?subject=七夕心愿清单 ♡&body=${body}`;
}

/* ---------- 提交成功全屏页 ---------- */
function showSuccess() {
  // 关闭挑选商品的页面
  const gift = $('#giftStage');
  if (gift) gift.style.display = 'none';
  const intro = $('#introStage');
  if (intro) intro.style.display = 'none';

  const stage = $('#successStage');
  stage.hidden = false;
  requestAnimationFrame(() => stage.classList.add('open'));
  requestFS();
  startConfetti();
}

function closeSuccess() {
  const stage = $('#successStage');
  stage.classList.remove('open');
  setTimeout(() => { stage.hidden = true; }, 400);
  location.reload();
}

/* ---------- 彩带飘落动效 ---------- */
let confettiRAF = null;
function startConfetti() {
  const canvas = $('#confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth * dpr;
    H = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#d94f6f', '#e87391', '#c9a35c', '#f7ecd7', '#ffd1dd', '#ffb3c6'];
  const N = 160;
  const parts = Array.from({ length: N }, () => ({
    x: Math.random() * W,
    y: Math.random() * -H,
    r: (6 + Math.random() * 8) * dpr,
    c: colors[(Math.random() * colors.length) | 0],
    vy: (1.5 + Math.random() * 3) * dpr,
    vx: (Math.random() - 0.5) * 1.2 * dpr,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.15,
    shape: Math.random() > 0.5 ? 'rect' : 'circle'
  }));

  let frames = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y += p.vy;
      p.x += p.vx;
      p.rot += p.vr;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    frames++;
    confettiRAF = requestAnimationFrame(draw);
  }
  if (confettiRAF) cancelAnimationFrame(confettiRAF);
  draw();

  // 自动停止以省电（动画本身无限循环视觉足够）
  setTimeout(() => { if (confettiRAF) { cancelAnimationFrame(confettiRAF); confettiRAF = null; } }, 12000);
}

/* ============================================================
   事件绑定
   ============================================================ */
function initGift() {
  on($('#searchInput'), 'input', renderGrid);

  on($('#modalClose'), 'click', closeModal);
  on($('#modalMask'), 'click', (e) => { if (e.target === $('#modalMask')) closeModal(); });
  on($('#addBtn'), 'click', addToWish);

  on($('#confirmClose'), 'click', closeConfirm);
  on($('#confirmMask'), 'click', (e) => { if (e.target === $('#confirmMask')) closeConfirm(); });
  on($('#sendBtn'), 'click', sendWish);

  on($('#submitBtn'), 'click', openConfirm);
  on($('#successClose'), 'click', closeSuccess);

  // 自动全屏：首次交互
  const kickFS = () => { requestFS(); document.removeEventListener('click', kickFS); document.removeEventListener('keydown', kickFS); };
  document.addEventListener('click', kickFS);
  document.addEventListener('keydown', kickFS);
}

/* ============================================================
   启动
   ============================================================ */
function init() {
  initIntro();
  initGift();
  loadProducts().then(syncWishUI);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
