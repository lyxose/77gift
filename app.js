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

let enterPending = false;       // 是否已有“进入挑选页”等待中的请求
function enterGift() {
  enterPending = true;
  const doEnter = () => {
    enterPending = false;
    $('#introStage').classList.add('done');
    const g = $('#giftStage');
    g.hidden = false;
    requestFS();
  };
  // 图片还没加载完：保持加载进度条，加载好后才进入挑选页
  if (imagesReady) { hideLoading(); doEnter(); return; }
  const shownAt = Date.now();
  showLoading();
  whenImagesReady(() => {
    const wait = Math.max(0, 600 - (Date.now() - shownAt)); // 至少显示 0.6s，避免闪屏
    setTimeout(() => { hideLoading(); doEnter(); }, wait);
  });
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
  }

  // 键盘
  const numpad = $('#daysNumpad');
  let keyMap = {};
  if (numpad) {
    const pad = document.createElement('div');
    pad.className = 'numpad';
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(d => {
      const k = document.createElement('button');
      k.className = 'numpad-key';
      k.type = 'button';
      k.textContent = d;
      on(k, 'click', (e) => tryDigit(d, e));
      pad.appendChild(k);
      keyMap[d] = k;
    });
    numpad.appendChild(pad);
  }

  function fillAt(idx) {
    digits[idx] = PAIRS[idx][0];
    refresh();
  }

  function tryDigit(d, evt) {
    const idx = digits.findIndex(x => x === '');
    if (idx === -1) return;
    if (PAIRS[idx][0] === d) {
      fillAt(idx);
    } else {
      // 点错：让正确的按钮滑到点击处并"被点击"，再填入正确答案
      const correct = keyMap[PAIRS[idx][0]];
      if (!correct) { fillAt(idx); return; }
      const targetX = evt && evt.clientX ? evt.clientX : null;
      const targetY = evt && evt.clientY ? evt.clientY : null;
      if (targetX != null) {
        const r = correct.getBoundingClientRect();
        const dx = targetX - (r.left + r.width / 2);
        const dy = targetY - (r.top + r.height / 2);
        correct.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1)';
        correct.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
        correct.classList.add('sliding');
        setTimeout(() => {
          correct.style.transform = '';
          correct.classList.remove('sliding');
          correct.classList.add('pressed');
          fillAt(idx);
          setTimeout(() => correct.classList.remove('pressed'), 220);
        }, 360);
      } else {
        correct.classList.add('pressed');
        fillAt(idx);
        setTimeout(() => correct.classList.remove('pressed'), 220);
      }
    }
  }

  // 物理键盘支持
  on(document, 'keydown', (e) => {
    if ($('#introStage').classList.contains('done')) return;
    if (/^[0-9]$/.test(e.key)) tryDigit(e.key, null);
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
let imagesReady = false;        // 商品图片是否已全部预加载完成
let imageWaiters = [];          // 等待图片加载完成后再执行的回调
function whenImagesReady(fn) {
  if (imagesReady) { fn(); } else { imageWaiters.push(fn); }
}
const wishMap = new Map();      // id -> { product, model, price }
let current = null;             // 当前打开详情的商品
let allModels = [];
let modelIndex = 0;

function fmtPrice(p) {
  const n = Number(p);
  if (!isNaN(n)) return n.toFixed(2);
  // 兼容 products.json 里「￥0.00元」这种字符串，只保留数字
  const cleaned = String(p || '0').replace(/[￥¥,元\s]/g, '');
  const n2 = Number(cleaned);
  return !isNaN(n2) ? n2.toFixed(2) : '0.00';
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
  await preloadImages(); // 进入挑选页前把商品图全部预加载完成
}

/* ---------- 图片预加载 + 加载进度条 ---------- */
function setLoadProgress(ratio) {
  const fill = $('#loadingFill');
  const pct = $('#loadingPercent');
  const v = Math.max(0, Math.min(1, ratio));
  if (fill) fill.style.width = (v * 100).toFixed(0) + '%';
  if (pct) pct.textContent = (v * 100).toFixed(0);
}

function preloadImages() {
  const urls = [];
  const seen = new Set();
  const push = (u) => { if (u && !seen.has(u)) { seen.add(u); urls.push(u); } };
  PRODUCTS.forEach(p => push(imgSrc(p)));
  push('images/placeholder.png');          // 兜底占位图
  push('images/pigs/pig-courier.png');     // 成功页小猪
  const total = urls.length;
  if (!total) { setLoadProgress(1); return Promise.resolve(); }
  return new Promise(resolve => {
    let done = 0;
    let settled = false;
    const tick = () => {
      done++;
      setLoadProgress(done / total);
      if (done >= total && !settled) { settled = true; resolve(); }
    };
    urls.forEach(u => {
      const img = new Image();
      img.onload = tick;
      img.onerror = tick; // 加载失败也算完成，避免进度卡死
      img.src = u;
    });
  });
}

function showLoading() {
  const stage = $('#loadingStage');
  if (!stage) return;
  stage.hidden = false;
  stage.classList.remove('fading');
}

function hideLoading() {
  const stage = $('#loadingStage');
  if (!stage || stage.hidden) return;
  stage.classList.add('fading');
  setTimeout(() => { stage.hidden = true; }, 520);
}

function finishLoading() {
  imagesReady = true;
  imageWaiters.splice(0).forEach(fn => { try { fn(); } catch (_) {} });
  // 没有正在等待进入挑选页的动作时，直接收起加载页
  if (!enterPending) hideLoading();
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
  if (p.image) return p.image;
  if (p.cover) return p.cover;
  if (p.images && p.images.length) return p.images[0];
  return 'images/placeholder.png';
}

// 取商品的型号列表：兼容 models / options 两种字段（支持数组或换行分隔的字符串）
function getModels(p) {
  if (!p) return null;
  let m = p.models || p.options;
  if (!m) return null;
  if (typeof m === 'string') m = m.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  return Array.isArray(m) && m.length ? m : null;
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
    const models = getModels(p);
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
  const label = sel.previousElementSibling; // 「选择型号」标签
  const models = getModels(p);
  if (models) {
    label.hidden = false;
    sel.hidden = false;
    models.forEach(m => {
      const o = document.createElement('option');
      o.value = m; o.textContent = m;
      sel.appendChild(o);
    });
  } else {
    // 只隐藏「选择型号」标签和下拉框，名称/价格/加入按钮仍正常显示
    label.hidden = true;
    sel.hidden = true;
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
  const model = getModels(current) ? $('#modelSelect').value : '';
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
    price: fmtPrice(price),
    url: product.url || ''
  }));

  const lineOf = (it, i) => {
    const base = `${i + 1}. ${it.name}（${it.model}） ￥${it.price}`;
    return it.url ? `${base}\n   链接：${it.url}` : base;
  };

  const payload = {
    access_key: WEB3FORMS_KEY,
    subject: '七夕心愿清单 ♡',
    from_name: '七夕心愿',
    to: EMAIL,
    message: '收到一份七夕心愿清单：\n' + items.map(lineOf).join('\n')
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
  const lineOf = (it, i) => {
    const base = `${i + 1}. ${it.name}（${it.model}） ￥${it.price}`;
    return it.url ? `${base}\n   链接：${it.url}` : base;
  };
  const body = '我的七夕心愿清单：%0D%0A' +
    items.map((it, i) => lineOf(it, i).replace(/\n/g, '%0D%0A')).join('%0D%0A');
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
  startConfetti('confettiCanvas');
}

/* ---------- 成功页：不满意 / 满意 按钮 ---------- */
function bindSuccessButtons() {
  const noBtn = $('#successNo');
  const yesBtn = $('#successYes');
  if (!noBtn || !yesBtn) return;

  // 鼠标/手指移到“不满意” -> “满意”按钮滑过来挡住
  const block = () => {
    const a = noBtn.getBoundingClientRect();
    const b = yesBtn.getBoundingClientRect();
    const dx = (a.left + a.width / 2) - (b.left + b.width / 2);
    const dy = (a.top + a.height / 2) - (b.top + b.height / 2);
    yesBtn.classList.add('blocking');
    yesBtn.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
  };
  const unblock = () => {
    yesBtn.classList.remove('blocking');
    yesBtn.style.transform = '';
  };
  on(noBtn, 'mouseenter', block);
  on(noBtn, 'mouseleave', unblock);
  on(noBtn, 'touchstart', (e) => { e.preventDefault(); block(); }, { passive: false });

  const pick = (btn) => {
    btn.classList.add('picked');
    setTimeout(goToEnd, 500);
  };
  on(noBtn, 'click', () => pick(noBtn));
  on(yesBtn, 'click', () => pick(yesBtn));
}

function goToEnd() {
  const success = $('#successStage');
  const end = $('#endStage');
  if (success) {
    success.classList.remove('open');
    setTimeout(() => { success.hidden = true; }, 400);
  }
  if (end) {
    end.hidden = false;
    requestAnimationFrame(() => end.classList.add('open'));
  }
  exitFS();
  startConfetti('endConfetti');
}

function exitFS() {
  try {
    const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (fn) (fn.call(document) || Promise.resolve()).catch(() => {});
  } catch (_) {}
}

/* ---------- 彩带飘落动效 ---------- */
let confettiRAF = null;
function startConfetti(canvasId) {
  const canvas = document.getElementById(canvasId || 'confettiCanvas');
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
    requestAnimationFrame(draw);
  }
  draw();

  // 自动停止以省电（动画本身无限循环视觉足够）
  setTimeout(() => { /* 自然停止由页面切换处理 */ }, 12000);
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
  bindSuccessButtons();

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
  // 从打开页面起就显示加载进度条并预加载商品图片
  const t0 = Date.now();
  showLoading();
  loadProducts()
    .then(syncWishUI)
    .then(() => {
      // 至少展示 0.8s，避免本地缓存瞬间加载完导致进度条一闪而过
      const minWait = Math.max(0, 800 - (Date.now() - t0));
      setTimeout(finishLoading, minWait);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
