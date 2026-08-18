/* 七夕心愿礼 · 橘朵礼物挑选页 */
(function () {
  'use strict';

  var EMAIL = 'luyx@psych.ac.cn';
  // Web3Forms 中转发信（纯前端、无需后端，部署到 GitHub Pages 后仍可用）。
  // 获取方式：打开 https://web3forms.com ，用接收邮箱 luyx@psych.ac.cn 注册/生成，
  // 把得到的 access_key 粘贴到下面引号内即可。未填写时自动回退为 mailto。
  var WEB3FORMS_KEY = '794b64d3-54c7-414e-9e7b-dfc07c481586';
  var MAX_ITEMS = 3;
  var CATEGORY_ORDER = ['眼影', '腮红', '修容', '遮瑕', '底妆', '定妆', '唇妆', '眼线', '眉妆', '礼盒', '套装', '其他'];

  var products = [];
  var wishlist = [];        // [{ pid, name, model, image }]
  var activeCategory = '全部';
  var keyword = '';
  var current = null;       // 当前查看的商品

  var els = {
    grid: document.getElementById('productGrid'),
    chips: document.getElementById('categoryChips'),
    emptyTip: document.getElementById('emptyTip'),
    searchInput: document.getElementById('searchInput'),
    modalMask: document.getElementById('modalMask'),
    modalImage: document.getElementById('modalImage'),
    modalName: document.getElementById('modalName'),
    modalPrice: document.getElementById('modalPrice'),
    modelSelect: document.getElementById('modelSelect'),
    addBtn: document.getElementById('addBtn'),
    modalCount: document.getElementById('modalCount'),
    modalClose: document.getElementById('modalClose'),
    confirmMask: document.getElementById('confirmMask'),
    confirmClose: document.getElementById('confirmClose'),
    confirmCount: document.getElementById('confirmCount'),
    confirmList: document.getElementById('confirmList'),
    sendBtn: document.getElementById('sendBtn'),
    wishBar: document.getElementById('wishBar'),
    wishCount: document.getElementById('wishCount'),
    wishTags: document.getElementById('wishTags'),
    submitBtn: document.getElementById('submitBtn'),
    toast: document.getElementById('toast')
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { els.toast.hidden = true; }, 2200);
  }

  /* ---------- 列表渲染 ---------- */

  function renderChips() {
    var cats = products.reduce(function (acc, p) {
      if (acc.indexOf(p.category) === -1) acc.push(p.category);
      return acc;
    }, []);
    cats.sort(function (a, b) {
      var ia = CATEGORY_ORDER.indexOf(a);
      var ib = CATEGORY_ORDER.indexOf(b);
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
        (chosen ? '<span class="chosen-badge">' + wishlist.indexOf(chosen) + 1 + '</span>' : '') +
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
        // 点击爱心按钮：已选则移除，未选则打开详情选型号
        var heart = e.target.closest('.card-heart');
        if (heart) {
          e.stopPropagation();
          var pid = heart.dataset.id;
          var existing = wishlist.find(function (w) { return w.pid === pid; });
          if (existing) {
            wishlist.splice(wishlist.indexOf(existing), 1);
            renderGrid();
            renderWishBar();
          } else {
            openModal(pid);
          }
          return;
        }
        openModal(card.dataset.id);
      });
    });
  }

  /* ---------- 详情弹窗 ---------- */

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
      return '<option value="' + escapeHtml(o) + '"' + (existing && existing.model === o ? ' selected' : i === 0 ? ' selected' : '') + '>' + escapeHtml(o) + '</option>';
    }).join('');

    els.addBtn.textContent = existing ? '更新心愿单' : '加入心愿单';
    updateModalCount();
    els.modalMask.classList.add('open');
  }

  function closeModal() {
    els.modalMask.classList.remove('open');
    current = null;
  }

  function updateModalCount() {
    els.modalCount.textContent = String(wishlist.length);
  }

  function addCurrent() {
    if (!current) return;
    var model = els.modelSelect.value;
    var existing = wishlist.find(function (w) { return w.pid === current.id; });
    if (existing) {
      existing.model = model;
      toast('已更新心愿单 ✿');
    } else if (wishlist.length >= MAX_ITEMS) {
      toast('最多只能选 3 件心愿礼物哦～');
      return;
    } else {
      wishlist.push({ pid: current.id, name: current.name, model: model, image: current.image });
      toast('已加入心愿单 ♡');
    }
    renderGrid();
    renderWishBar();
    closeModal();
  }

  /* ---------- 心愿栏 ---------- */

  function renderWishBar() {
    els.wishBar.hidden = wishlist.length === 0;
    els.wishCount.textContent = String(wishlist.length);
    els.submitBtn.disabled = wishlist.length === 0;

    els.wishTags.innerHTML = wishlist.map(function (w, i) {
      return '<span class="wish-tag">' +
        '<b>' + (i + 1) + '</b> ' + escapeHtml(w.name) + ' · ' + escapeHtml(w.model) +
        '<button class="tag-x" data-idx="' + i + '" aria-label="移除">✕</button></span>';
    }).join('');

    els.wishTags.querySelectorAll('.tag-x').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        wishlist.splice(Number(btn.dataset.idx), 1);
        renderGrid();
        renderWishBar();
      });
    });
  }

  /* ---------- 提交 ---------- */

  function openConfirm() {
    if (!els.confirmMask) { sendWish(); return; }
    els.confirmCount.textContent = String(wishlist.length);
    els.confirmList.innerHTML = wishlist.map(function (w) {
      return '<li>' +
        '<img class="thumb" src="' + escapeHtml(w.image) + '" alt="">' +
        '<div class="li-info"><div class="li-name">' + escapeHtml(w.name) + '</div>' +
        '<div class="li-model">型号：' + escapeHtml(w.model) + '</div></div>' +
        '</li>';
    }).join('');
    els.confirmMask.classList.add('open');
  }

  function closeConfirm() { if (els.confirmMask) els.confirmMask.classList.remove('open'); }

  function composeText() {
    var lines = wishlist.map(function (w, i) {
      return (i + 1) + '. ' + w.name + '（型号：' + w.model + '）—— ￥0.00元';
    }).join('\n');
    return '我的七夕心愿清单（' + wishlist.length + ' 件）：\n\n' + lines + '\n\n—— 由橘朵七夕心愿页生成 ♡';
  }

  function sendWish() {
    var subject = '七夕心愿清单（' + wishlist.length + '件）';
    var body = composeText();

    // 优先走 Web3Forms 中转发信：纯前端、部署到 GitHub Pages 后仍可静默发到邮箱
    if (WEB3FORMS_KEY) {
      var payload = {
        access_key: WEB3FORMS_KEY,
        subject: subject,
        from_name: '七夕心愿页',
        email: EMAIL,
        message: body
      };
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            toast('心愿已送达，谢谢你 ♡');
          } else {
            fallbackMail(subject, body);
            toast('已为你打开邮件，点发送即可 ♡');
          }
        })
        .catch(function () { fallbackMail(subject, body); toast('网络异常，已为你打开邮件 ♡'); });
      closeConfirm();
      return;
    }

    // 未配置 Web3Forms：回退为 mailto
    fallbackMail(subject, body);
    closeConfirm();
    toast('心愿已送达，谢谢你 ♡');
  }

  function fallbackMail(subject, body) {
    try {
      var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = href;
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 事件绑定 ---------- */

  function on(el, ev, fn) {
    if (el) el.addEventListener(ev, fn);
  }

  function bind() {
    on(els.searchInput, 'input', function () {
      keyword = els.searchInput.value.trim().toLowerCase();
      renderGrid();
    });

    on(els.modalClose, 'click', closeModal);
    on(els.modalMask, 'click', function (e) { if (e.target === els.modalMask) closeModal(); });
    on(els.addBtn, 'click', addCurrent);

    on(els.confirmClose, 'click', closeConfirm);
    on(els.confirmMask, 'click', function (e) { if (e.target === els.confirmMask) closeConfirm(); });
    on(els.sendBtn, 'click', sendWish);

    on(els.submitBtn, 'click', openConfirm);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); closeConfirm(); }
    });
  }

  /* ---------- 启动 ---------- */

  fetch('products.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (data) {
      products = data;
      renderChips();
      renderGrid();
      renderWishBar();
      bind();
    })
    .catch(function (err) {
      els.grid.innerHTML = '<div class="empty">商品数据加载失败，请检查 products.json 是否存在。</div>';
      console.error(err);
    });
})();
