/* 七夕心愿礼 · 橘朵礼物挑选页 */
(function () {
  'use strict';

  var EMAIL = 'luyx@psych.ac.cn';
  var WEB3FORMS_KEY = '794b64d3-54c7-414e-9e7b-dfc07c481586';
  var MAX_ITEMS = 3;
  var CATEGORY_ORDER = ['眼影', '腮红', '修容', '遮瑕', '底妆', '定妆', '唇妆', '眼线', '眉妆', '礼盒', '套装', '其他'];

  /* ============ 全屏 ============ */
  function requestFullscreen() {
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (fn) { try { fn.call(el); } catch (e) {} }
  }
  // 打开页面、任意按键/点击时尝试全屏（需用户手势，浏览器才会允许）
  document.addEventListener('click', requestFullscreen, { once: false });
  document.addEventListener('keydown', requestFullscreen);

  /* ============ 工具 ============ */
  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /* ============ 前置互动流程 ============ */
  function initIntro() {
    var stage = $('introStage');
    var sStart = $('screenStart');
    var sDays = $('screenDays');
    var sReward = $('screenReward');

    function show(screen) {
      [sStart, sDays, sReward].forEach(function (s) { s.classList.remove('active'); });
      screen.classList.add('active');
    }

    // 1) 开场：点“七夕”进入天数页；“2026年8月18日”会逃跑
    $('optRight').addEventListener('click', function () { show(sDays); });
    makeFlee($('optFlee'));

    // 2) 天数密码：只能输入 951（每键锁定一个正确位）
    var daysInput = $('daysInput');
    var expected = ['9', '5', '1'];
    var filled = [false, false, false];
    var digits = ['', '', ''];

    // 数字小键盘弹窗（移动端无实体键盘时也能用）
    buildNumpad(daysInput, function (key) { tryDigit(key); });

    daysInput.addEventListener('input', function () {
      // 限制为数字并按位置校正
      var raw = daysInput.value.replace(/\D/g, '').slice(0, 3);
      daysInput.value = raw;
      checkDays();
    });

    function tryDigit(d) {
      if (!/^\d$/.test(d)) return;
      // 找第一个还没填的位，且该位期望值 == d 才接受
      for (var i = 0; i < 3; i++) {
        if (!filled[i]) {
          if (expected[i] === d) {
            digits[i] = d; filled[i] = true;
          }
          break; // 只允许按顺序填；填错的位置直接忽略（无法填入）
        }
      }
      daysInput.value = digits.join('');
      checkDays();
    }

    function checkDays() {
      if (filled[0] && filled[1] && filled[2]) {
        $('daysConfirm').disabled = false;
        $('daysHint').textContent = '答对啦！点确认继续～';
      }
    }

    // 模拟键盘：监听真实键盘事件（桌面端）
    document.addEventListener('keydown', function (e) {
      if (!sDays.classList.contains('active')) return;
      if (e.key >= '0' && e.key <= '9') { tryDigit(e.key); e.preventDefault(); }
      if (e.key === 'Backspace') { /* 不允许删除，保持锁定 */ e.preventDefault(); }
      if (e.key === 'Enter' && !$('daysConfirm').disabled) { goReward(); }
    });

    $('daysConfirm').addEventListener('click', function () {
      if (!$('daysConfirm').disabled) goReward();
    });

    function goReward() { show(sReward); }

    // 3) 奖励页：“不用了”逃跑；“好耶！我要！”进入礼物页
    makeFlee($('optNo'));
    $('optYes').addEventListener('click', function () {
      stage.classList.add('done');
      $('giftStage').hidden = false;
      initGift();
      requestFullscreen();
    });
  }

  // 让按钮在 hover/touch/靠近时迅速跑到随机位置
  function makeFlee(btn) {
    if (!btn) return;
    var busy = false;
    function flee() {
      if (busy) return; busy = true;
      var w = btn.offsetWidth, h = btn.offsetHeight;
      var maxX = Math.max(10, window.innerWidth - w - 16);
      var maxY = Math.max(10, window.innerHeight - h - 16);
      var x = Math.random() * maxX;
      var y = Math.random() * maxY;
      btn.style.position = 'fixed';
      btn.style.left = x + 'px';
      btn.style.top = y + 'px';
      btn.style.zIndex = 60;
      setTimeout(function () { busy = false; }, 120);
    }
    btn.addEventListener('mouseenter', flee);
    btn.addEventListener('touchstart', function (e) { e.preventDefault(); flee(); }, { passive: false });
    // 鼠标靠近也躲
    document.addEventListener('mousemove', function (e) {
      if (btn.style.position !== 'fixed') return;
      var r = btn.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var d = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (d < 90) flee();
    });
  }

  // 数字小键盘（触屏友好）
  function buildNumpad(input, onKey) {
    var pad = document.createElement('div');
    pad.className = 'numpad';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清除', '0', '⌫'];
    keys.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'numpad-key';
      b.textContent = k;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (k === '清除') { input.value = ''; }
        else if (k === '⌫') { /* 锁定不允许删 */ }
        else { onKey(k); }
      });
      pad.appendChild(b);
    });
    var wrap = input.parentElement;
    wrap.appendChild(pad);
  }

  /* ============ 礼物挑选页 ============ */
  function initGift() {
    if (initGift._done) return; initGift._done = true;

    var products = [];
    var wishlist = [];
    var activeCategory = '全部';
    var keyword = '';
    var current = null;

    var els = {
      grid: $('productGrid'),
      chips: $('categoryChips'),
      emptyTip: $('emptyTip'),
      searchInput: $('searchInput'),
      modalMask: $('modalMask'),
      modalImage: $('modalImage'),
      modalName: $('modalName'),
      modalPrice: $('modalPrice'),
      modelSelect: $('modelSelect'),
      addBtn: $('addBtn'),
      modalCount: $('modalCount'),
      modalClose: $('modalClose'),
      confirmMask: $('confirmMask'),
      confirmClose: $('confirmClose'),
      confirmCount: $('confirmCount'),
      confirmList: $('confirmList'),
      sendBtn: $('sendBtn'),
      wishBar: $('wishBar'),
      wishCount: $('wishCount'),
      wishTags: $('wishTags'),
      submitBtn: $('submitBtn'),
      toast: $('toast')
    };

    function renderChips() {
      var cats = products.reduce(function (acc, p) {
        if (acc.indexOf(p.category) === -1) acc.push(p.category);
        return acc;
      }, []);
      cats.sort(function (a, b) {
        var ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
      var html = '<div class="chip active" data-cat="全部">全部</div>';
      cats.forEach(function (c) {
        html += '<div class="chip" data-cat="' + escapeHtml(c) + '">' + escapeHtml(c) + '</div>';
      });
      els.chips.innerHTML = html;
      els.chips.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        activeCategory = chip.dataset.cat;
        els.chips.querySelectorAll('.chip').forEach(function (c) {
          c.classList.toggle('active', c === chip);
        });
        renderGrid();
      });
    }

    function visibleProducts() {
      return products.filter(function (p) {
        var okCat = activeCategory === '全部' || p.category === activeCategory;
        var okKw = !keyword ||
          (p.name && p.name.toLowerCase().indexOf(keyword) > -1) ||
          (p.fullName && p.fullName.toLowerCase().indexOf(keyword) > -1) ||
          p.options.some(function (o) { return o.toLowerCase().indexOf(keyword) > -1; });
        return okCat && okKw;
      });
    }

    function renderGrid() {
      var list = visibleProducts();
      els.grid.innerHTML = list.map(function (p) {
        var chosen = wishlist.find(function (w) { return w.pid === p.id; });
        return '' +
          '<div class="card' + (chosen ? ' chosen' : '') + '" data-id="' + escapeHtml(p.id) + '">' +
          '<div class="card-img-wrap"><img class="card-img" src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.name) + '" loading="lazy"></div>' +
          '<span class="card-tag">' + escapeHtml(p.category) + '</span>' +
          (chosen ? '<span class="chosen-badge">' + (wishlist.indexOf(chosen) + 1) + '</span>' : '') +
          '<div class="card-body">' +
          '<div class="card-name">' + escapeHtml(p.name) + '</div>' +
          '<div class="card-row">' +
          '<div class="card-price"><small>￥</small>0.00<small>元</small></div>' +
          '<button class="card-heart" data-id="' + escapeHtml(p.id) + '" aria-label="加入心愿单" title="加入心愿单">' +
          '<span class="outline">♡</span><span class="filled">♥</span></button>' +
          '</div></div></div>';
      }).join('');
      els.emptyTip.hidden = list.length > 0;

      els.grid.querySelectorAll('.card').forEach(function (card) {
        card.addEventListener('click', function (e) {
          var heart = e.target.closest('.card-heart');
          if (heart) {
            e.stopPropagation();
            var pid = heart.dataset.id;
            var existing = wishlist.find(function (w) { return w.pid === pid; });
            if (existing) {
              wishlist.splice(wishlist.indexOf(existing), 1);
              renderGrid(); renderWishBar();
            } else { openModal(pid); }
            return;
          }
          openModal(card.dataset.id);
        });
      });
    }

    function openModal(pid) {
      var p = products.find(function (x) { return x.id === pid; });
      if (!p) return;
      current = p;
      els.modalImage.src = p.image;
      els.modalImage.alt = p.name;
      els.modalName.textContent = p.name;
      els.modalPrice.textContent = '0.00';
      var existing = wishlist.find(function (w) { return w.pid === pid; });
      els.modelSelect.innerHTML = p.options.map(function (o, i) {
        return '<option value="' + escapeHtml(o) + '"' +
          (existing && existing.model === o ? ' selected' : (i === 0 ? ' selected' : '')) + '>' +
          escapeHtml(o) + '</option>';
      }).join('');
      els.addBtn.textContent = existing ? '更新心愿单' : '加入心愿单';
      updateModalCount();
      els.modalMask.classList.add('open');
    }
    function closeModal() { els.modalMask.classList.remove('open'); current = null; }
    function updateModalCount() { els.modalCount.textContent = String(wishlist.length); }

    function addCurrent() {
      if (!current) return;
      var model = els.modelSelect.value;
      var existing = wishlist.find(function (w) { return w.pid === current.id; });
      if (existing) {
        existing.model = model; toast('已更新心愿单 ✿');
      } else if (wishlist.length >= MAX_ITEMS) {
        toast('最多只能选 3 件心愿礼物哦～'); return;
      } else {
        wishlist.push({ pid: current.id, name: current.name, model: model, image: current.image });
        toast('已加入心愿单 ♡');
      }
      renderGrid(); renderWishBar(); closeModal();
    }

    function renderWishBar() {
      els.wishBar.hidden = wishlist.length === 0;
      els.wishCount.textContent = String(wishlist.length);
      els.submitBtn.disabled = wishlist.length === 0;
      els.wishTags.innerHTML = wishlist.map(function (w, i) {
        return '<span class="wish-tag"><b>' + (i + 1) + '</b> ' + escapeHtml(w.name) + ' · ' + escapeHtml(w.model) +
          '<button class="tag-x" data-idx="' + i + '" aria-label="移除">✕</button></span>';
      }).join('');
      els.wishTags.querySelectorAll('.tag-x').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          wishlist.splice(Number(btn.dataset.idx), 1);
          renderGrid(); renderWishBar();
        });
      });
    }

    function openConfirm() {
      els.confirmCount.textContent = String(wishlist.length);
      els.confirmList.innerHTML = wishlist.map(function (w) {
        return '<li><img class="thumb" src="' + escapeHtml(w.image) + '" alt="">' +
          '<div class="li-info"><div class="li-name">' + escapeHtml(w.name) + '</div>' +
          '<div class="li-model">型号：' + escapeHtml(w.model) + '</div></div></li>';
      }).join('');
      els.confirmMask.classList.add('open');
    }
    function closeConfirm() { els.confirmMask.classList.remove('open'); }

    function composeText() {
      var lines = wishlist.map(function (w, i) {
        return (i + 1) + '. ' + w.name + '（型号：' + w.model + '）—— ￥0.00元';
      }).join('\n');
      return '我的七夕心愿清单（' + wishlist.length + ' 件）：\n\n' + lines + '\n\n—— 由橘朵七夕心愿页生成 ♡';
    }

    function sendWish() {
      var subject = '七夕心愿清单（' + wishlist.length + '件）';
      var body = composeText();
      if (WEB3FORMS_KEY) {
        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: subject, from_name: '七夕心愿页', email: EMAIL, message: body })
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.success) toast('心愿已送达，谢谢你 ♡');
            else { fallbackMail(subject, body); toast('已为你打开邮件，点发送即可 ♡'); }
          })
          .catch(function () { fallbackMail(subject, body); toast('网络异常，已为你打开邮件 ♡'); });
        closeConfirm(); return;
      }
      fallbackMail(subject, body);
      closeConfirm(); toast('心愿已送达，谢谢你 ♡');
    }
    function fallbackMail(subject, body) {
      try {
        window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      } catch (e) {}
    }

    function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
    on(els.searchInput, 'input', function () { keyword = els.searchInput.value.trim().toLowerCase(); renderGrid(); });
    on(els.modalClose, 'click', closeModal);
    on(els.modalMask, 'click', function (e) { if (e.target === els.modalMask) closeModal(); });
    on(els.addBtn, 'click', addCurrent);
    on(els.confirmClose, 'click', closeConfirm);
    on(els.confirmMask, 'click', function (e) { if (e.target === els.confirmMask) closeConfirm(); });
    on(els.sendBtn, 'click', sendWish);
    on(els.submitBtn, 'click', openConfirm);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); closeConfirm(); } });

    fetch('products.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        products = data;
        renderChips(); renderGrid(); renderWishBar();
      })
      .catch(function (err) {
        els.grid.innerHTML = '<div class="empty">商品数据加载失败，请检查 products.json 是否存在。</div>';
        console.error(err);
      });
  }

  /* ============ 启动 ============ */
  initIntro();
})();
