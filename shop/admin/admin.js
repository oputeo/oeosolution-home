/**
 * Manna Life shop admin
 * Password: Admin@oeo2026 (SHA-256 checked — not stored in plain text here as primary auth note)
 */
(function () {
  'use strict';

  // SHA-256("Admin@oeo2026")
  const PASS_HASH =
    'dc6f4adcace4b3374f1491805cd9b3d4ed31226199272a39f081c2e492149b15';
  const SESSION_KEY = 'manna_admin_session_v1';
  const CONFIG_KEY = 'manna_shop_config_v1';
  const USE_LOCAL_KEY = 'manna_shop_use_local';
  const SESSION_HOURS = 8;

  let config = null;

  /** Pure JS SHA-256 fallback when crypto.subtle is missing/blocked */
  function sha256HexSync(str) {
    function rotr(n, x) {
      return (x >>> n) | (x << (32 - n));
    }
    function utf8(s) {
      const out = [];
      for (let i = 0; i < s.length; i++) {
        let c = s.charCodeAt(i);
        if (c < 0x80) out.push(c);
        else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
        else if (c < 0xd800 || c >= 0xe000)
          out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
        else {
          i++;
          c = 0x10000 + (((c & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
          out.push(
            0xf0 | (c >> 18),
            0x80 | ((c >> 12) & 0x3f),
            0x80 | ((c >> 6) & 0x3f),
            0x80 | (c & 0x3f),
          );
        }
      }
      return out;
    }
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const bytes = utf8(str);
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 0xff);
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    for (let i = 0; i < bytes.length; i += 64) {
      const w = new Array(64);
      for (let j = 0; j < 16; j++) {
        w[j] =
          (bytes[i + j * 4] << 24) |
          (bytes[i + j * 4 + 1] << 16) |
          (bytes[i + j * 4 + 2] << 8) |
          bytes[i + j * 4 + 3];
      }
      for (let j = 16; j < 64; j++) {
        const s0 = rotr(7, w[j - 15]) ^ rotr(18, w[j - 15]) ^ (w[j - 15] >>> 3);
        const s1 = rotr(17, w[j - 2]) ^ rotr(19, w[j - 2]) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let j = 0; j < 64; j++) {
        const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) | 0;
        h = g;
        g = f;
        f = e;
        e = (d + t1) | 0;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) | 0;
      }
      H = [
        (H[0] + a) | 0,
        (H[1] + b) | 0,
        (H[2] + c) | 0,
        (H[3] + d) | 0,
        (H[4] + e) | 0,
        (H[5] + f) | 0,
        (H[6] + g) | 0,
        (H[7] + h) | 0,
      ];
    }
    return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }

  function normalizePassword(pw) {
    // Trim spaces / invisible chars users often paste by accident
    return String(pw || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
  }

  /** Login uses sync hash only — crypto.subtle can hang on some mobile browsers. */
  function passwordMatches(pw) {
    const normalized = normalizePassword(pw);
    if (!normalized) return false;
    try {
      return sha256HexSync(normalized) === PASS_HASH;
    } catch (e) {
      console.error('hash error', e);
      // Last-resort exact match if hash impl fails
      return normalized === 'Admin@oeo2026';
    }
  }

  function sessionOk() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      return s && s.ok && s.exp > Date.now();
    } catch {
      return false;
    }
  }

  function setSession() {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ok: true, exp: Date.now() + SESSION_HOURS * 3600 * 1000 }),
    );
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function showStatus(msg, isErr) {
    const text = String(msg || '');
    const el = document.getElementById('statusMsg');
    if (el) {
      el.hidden = false;
      el.textContent = text;
      el.className = 'status' + (isErr ? ' err' : '');
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch {
        /* ignore */
      }
    }
    // Fixed toast — always visible even if status row is off-screen
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.className = 'admin-toast' + (isErr ? ' err' : ' ok');
    toast.hidden = false;
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(() => {
      toast.hidden = true;
    }, isErr ? 10000 : 6000);
    if (isErr) console.error('[shop-admin]', text);
    else console.log('[shop-admin]', text);
  }

  function defaultProducts() {
    return [
      {
        id: 'ready-beans',
        name: 'Ready Beans',
        tagline: 'Protein-forward ready pouch',
        listPrice: 4500,
        costFloor: 2800,
        stock: 500,
        image: 'images/ready-beans.svg',
        badge: 'BPA-free pouch',
        nutrition: 'Energy + plant protein · Ready to eat',
        color: '#0d9488',
        available: true,
      },
      {
        id: 'yam-plantain',
        name: 'Yam & Plantain',
        tagline: 'Local staple energy blend',
        listPrice: 4500,
        costFloor: 2800,
        stock: 500,
        image: 'images/yam-plantain.svg',
        badge: 'BPA-free pouch',
        nutrition: 'Complex carbs · Ready to eat',
        color: '#0b3d91',
        available: true,
      },
      {
        id: 'sweet-potato',
        name: 'Sweet Potato',
        tagline: 'Natural sweetness · sustained energy',
        listPrice: 4500,
        costFloor: 2800,
        stock: 500,
        image: 'images/sweet-potato.svg',
        badge: 'BPA-free pouch',
        nutrition: 'Vitamins + energy · Ready to eat',
        color: '#b45309',
        available: true,
      },
      {
        id: 'sku-04',
        name: 'Catalogue item 4',
        tagline: 'Edit when Navina SKU is ready',
        listPrice: 4500,
        costFloor: 2800,
        stock: 0,
        image: 'images/sku-04.svg',
        badge: 'Coming soon',
        nutrition: 'Nutrition panel from Navina pack',
        color: '#64748b',
        available: false,
      },
      {
        id: 'sku-05',
        name: 'Catalogue item 5',
        tagline: 'Reserved slot',
        listPrice: 4500,
        costFloor: 2800,
        stock: 0,
        image: 'images/sku-05.svg',
        badge: 'Coming soon',
        nutrition: 'Nutrition panel from Navina pack',
        color: '#475569',
        available: false,
      },
      {
        id: 'sku-06',
        name: 'Catalogue item 6',
        tagline: 'Reserved slot',
        listPrice: 4500,
        costFloor: 2800,
        stock: 0,
        image: 'images/sku-06.svg',
        badge: 'Coming soon',
        nutrition: 'Nutrition panel from Navina pack',
        color: '#334155',
        available: false,
      },
    ];
  }

  function defaultConfig() {
    return {
      version: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      franchiseName: 'OEO Solution',
      producer: 'Navina Food Industry',
      brand: 'Manna Life',
      whatsapp: '2348036685485',
      officeWhatsapp: '2349039613889',
      paystackPublicKey: '',
      deliveryBase: 2500,
      deliveryZones: [
        { id: 'south-south', label: 'South-South (Asaba, Warri, PH, …)', mult: 1 },
        { id: 'south-west', label: 'South-West (Lagos, Ibadan, …)', mult: 1.15 },
        { id: 'south-east', label: 'South-East', mult: 1.1 },
        { id: 'north', label: 'North / FCT', mult: 1.35 },
        { id: 'other', label: 'Other Nigeria', mult: 1.4 },
      ],
      tiers: [
        { minQty: 1, unitDiscount: 0, deliveryFactor: 1, label: 'Individual' },
        { minQty: 10, unitDiscount: 0.1, deliveryFactor: 0.7, label: 'Small group (10–49)' },
        { minQty: 50, unitDiscount: 0.16, deliveryFactor: 0.5, label: 'Hostel / class (50–99)' },
        { minQty: 100, unitDiscount: 0.22, deliveryFactor: 0, label: 'School / dept (100+)' },
      ],
      products: defaultProducts(),
    };
  }

  function ensureSixProducts(cfg) {
    if (!cfg.products) cfg.products = [];
    const defaults = defaultProducts();
    // If empty or only placeholder sku-01 style junk, reset to defaults
    const broken = cfg.products.some(
      (p) => p && /^sku-0[123]$/.test(p.id) && (!p.image || String(p.image).indexOf('sku-0') >= 0),
    );
    if (!cfg.products.length || (cfg.products.length < 3 && broken)) {
      cfg.products = defaults.slice();
    }
    while (cfg.products.length < 6) {
      const i = cfg.products.length;
      cfg.products.push(JSON.parse(JSON.stringify(defaults[i] || defaults[defaults.length - 1])));
      if (cfg.products.length > 3 && !cfg.products[cfg.products.length - 1].id) {
        const n = cfg.products.length;
        cfg.products[cfg.products.length - 1].id = 'sku-0' + n;
        cfg.products[cfg.products.length - 1].image = 'images/sku-0' + n + '.svg';
      }
    }
    // Fix legacy image paths that 404
    cfg.products.forEach((p, idx) => {
      if (!p.image || /sku-0[123]\.(svg|jpg|png)$/i.test(p.image)) {
        const map = {
          'sku-01': 'images/ready-beans.svg',
          'sku-02': 'images/yam-plantain.svg',
          'sku-03': 'images/sweet-potato.svg',
        };
        if (map[p.id]) {
          p.image = map[p.id];
          if (p.id === 'sku-01') {
            p.id = 'ready-beans';
            p.name = p.name || 'Ready Beans';
          }
          if (p.id === 'sku-02') {
            p.id = 'yam-plantain';
            p.name = p.name || 'Yam & Plantain';
          }
          if (p.id === 'sku-03') {
            p.id = 'sweet-potato';
            p.name = p.name || 'Sweet Potato';
          }
        } else if (!p.image) {
          p.image = defaults[idx] ? defaults[idx].image : 'images/sku-04.svg';
        }
      }
      // Prefer .svg placeholders over missing .jpg
      if (p.image && /\.jpg$/i.test(p.image) && !/^data:/.test(p.image)) {
        const svgPath = p.image.replace(/\.jpg$/i, '.svg');
        p.image = svgPath;
      }
    });
    cfg.products = cfg.products.slice(0, 6);
    return cfg;
  }

  async function fetchJsonWithTimeout(url, ms) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => {
      try {
        ctrl && ctrl.abort();
      } catch {
        /* ignore */
      }
    }, ms);
    try {
      const r = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadConfig() {
    let remote = null;
    // Never hang login on a slow network fetch
    remote = await fetchJsonWithTimeout('../products-config.json?t=' + Date.now(), 4000);
    let local = null;
    try {
      local = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    } catch {
      /* ignore */
    }
    const useLocal = localStorage.getItem(USE_LOCAL_KEY) === '1';
    if (useLocal && local) {
      config = local;
      setSource('Browser preview (local)');
    } else if (remote) {
      config = remote;
      setSource('Live products-config.json');
    } else if (local) {
      config = local;
      setSource('Browser only (no remote file)');
    } else {
      config = defaultConfig();
      setSource('Empty defaults');
    }
    ensureSixProducts(config);
    if (!config.tiers || !config.tiers.length) {
      config.tiers = defaultConfig().tiers;
    }
  }

  function setSource(text) {
    const el = document.getElementById('configSource');
    if (el) el.textContent = '· ' + text;
  }

  function readFormIntoConfig() {
    if (!config) config = defaultConfig();

    const whatsappEl = document.getElementById('cfgWhatsapp');
    const deliveryEl = document.getElementById('cfgDelivery');
    const paystackEl = document.getElementById('cfgPaystack');
    const franchiseEl = document.getElementById('cfgFranchise');
    if (!whatsappEl || !deliveryEl || !paystackEl || !franchiseEl) {
      throw new Error('Store settings fields not found — hard-refresh the admin page.');
    }

    config.whatsapp = whatsappEl.value.trim();
    config.deliveryBase = Number(deliveryEl.value) || 0;
    config.paystackPublicKey = paystackEl.value.trim();
    config.franchiseName = franchiseEl.value.trim() || 'OEO Solution';
    config.updatedAt = new Date().toISOString();

    const tierRows = document.querySelectorAll('#tierBody tr');
    config.tiers = Array.from(tierRows).map((tr, i) => {
      const min = tr.querySelector('[data-t="min"]');
      const disc = tr.querySelector('[data-t="disc"]');
      const del = tr.querySelector('[data-t="del"]');
      const label = tr.querySelector('[data-t="label"]');
      if (!min || !disc || !del || !label) {
        throw new Error('Tier row ' + (i + 1) + ' is incomplete — hard-refresh admin.');
      }
      return {
        minQty: Number(min.value) || 1,
        unitDiscount: Math.min(0.5, Math.max(0, Number(disc.value) || 0)),
        deliveryFactor: Math.min(1, Math.max(0, Number(del.value) || 0)),
        label: label.value.trim() || 'Tier',
      };
    });

    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) {
      throw new Error('No product cards on page — hard-refresh admin.');
    }

    config.products = Array.from(cards).map((card, idx) => {
      const get = (name) => card.querySelector('[data-p="' + name + '"]');
      const idEl = get('id');
      const nameEl = get('name');
      const listEl = get('listPrice');
      const costEl = get('costFloor');
      const stockEl = get('stock');
      const imageEl = get('image');
      const availEl = get('available');
      if (!idEl || !nameEl || !listEl || !costEl || !stockEl || !imageEl || !availEl) {
        throw new Error('Product slot ' + (idx + 1) + ' is missing fields — hard-refresh admin.');
      }
      const listPrice = Number(listEl.value) || 0;
      let costFloor = Number(costEl.value) || 0;
      if (costFloor > listPrice && listPrice > 0) costFloor = listPrice;
      const stockRaw = stockEl.value;
      const stock =
        stockRaw === '' || stockRaw === 'null' ? null : Math.max(0, Number(stockRaw) || 0);
      const taglineEl = get('tagline');
      const badgeEl = get('badge');
      const nutritionEl = get('nutrition');
      const colorEl = get('color');
      return {
        id: idEl.value.trim() || 'sku-' + (idx + 1),
        name: nameEl.value.trim() || 'Product ' + (idx + 1),
        tagline: taglineEl ? taglineEl.value.trim() : '',
        listPrice,
        costFloor,
        stock,
        image: imageEl.value.trim() || 'images/' + (idEl.value.trim() || 'sku') + '.jpg',
        badge: badgeEl ? badgeEl.value.trim() : '',
        nutrition: nutritionEl ? nutritionEl.value.trim() : '',
        color: colorEl && colorEl.value.trim() ? colorEl.value.trim() : '#0b3d91',
        available: !!availEl.checked,
      };
    });
  }

  function render() {
    document.getElementById('cfgWhatsapp').value = config.whatsapp || '';
    document.getElementById('cfgDelivery').value = config.deliveryBase ?? 2500;
    document.getElementById('cfgPaystack').value = config.paystackPublicKey || '';
    document.getElementById('cfgFranchise').value = config.franchiseName || 'OEO Solution';

    const tierBody = document.getElementById('tierBody');
    tierBody.innerHTML = (config.tiers || [])
      .map(
        (t, i) => `
      <tr>
        <td><input id="tier-${i}-min" name="tier-${i}-min" data-t="min" type="number" min="1" value="${t.minQty}" autocomplete="off" /></td>
        <td><input id="tier-${i}-disc" name="tier-${i}-disc" data-t="disc" type="number" min="0" max="0.5" step="0.01" value="${t.unitDiscount}" autocomplete="off" /></td>
        <td><input id="tier-${i}-del" name="tier-${i}-del" data-t="del" type="number" min="0" max="1" step="0.05" value="${t.deliveryFactor}" autocomplete="off" /></td>
        <td><input id="tier-${i}-label" name="tier-${i}-label" data-t="label" type="text" value="${escapeAttr(t.label || '')}" autocomplete="off" /></td>
      </tr>`,
      )
      .join('');

    const forms = document.getElementById('productForms');
    forms.innerHTML = config.products
      .map(
        (p, i) => `
      <div class="product-card" data-index="${i}">
        <h3>
          <span>${escapeHtml(p.name || 'Product')}</span>
          <span class="slot">Slot ${i + 1} / 6</span>
        </h3>
        <div class="product-grid">
          <label class="field"><span>ID (do not change often)</span><input id="p-${i}-id" name="p-${i}-id" data-p="id" value="${escapeAttr(p.id)}" autocomplete="off" /></label>
          <label class="field"><span>Name</span><input id="p-${i}-name" name="p-${i}-name" data-p="name" value="${escapeAttr(p.name)}" autocomplete="off" /></label>
          <label class="field full"><span>Tagline</span><input id="p-${i}-tagline" name="p-${i}-tagline" data-p="tagline" value="${escapeAttr(p.tagline || '')}" autocomplete="off" /></label>
          <label class="field"><span>List price (₦ retail)</span><input id="p-${i}-listPrice" name="p-${i}-listPrice" data-p="listPrice" type="number" min="0" step="50" value="${p.listPrice}" autocomplete="off" /></label>
          <label class="field"><span>Cost floor (₦ Navina cost)</span><input id="p-${i}-costFloor" name="p-${i}-costFloor" data-p="costFloor" type="number" min="0" step="50" value="${p.costFloor}" autocomplete="off" /></label>
          <label class="field"><span>Stock qty (blank = unlimited)</span><input id="p-${i}-stock" name="p-${i}-stock" data-p="stock" type="number" min="0" step="1" value="${p.stock == null ? '' : p.stock}" placeholder="unlimited" autocomplete="off" /></label>
          <label class="field"><span>Badge</span><input id="p-${i}-badge" name="p-${i}-badge" data-p="badge" value="${escapeAttr(p.badge || '')}" autocomplete="off" /></label>
          <label class="field full"><span>Nutrition / notes</span><input id="p-${i}-nutrition" name="p-${i}-nutrition" data-p="nutrition" value="${escapeAttr(p.nutrition || '')}" autocomplete="off" /></label>
          <label class="field"><span>Image path</span><input id="p-${i}-image" name="p-${i}-image" data-p="image" value="${escapeAttr(p.image || '')}" placeholder="images/ready-beans.jpg" autocomplete="off" /></label>
          <label class="field"><span>Accent colour</span><input id="p-${i}-color" name="p-${i}-color" data-p="color" type="color" value="${normalizeColor(p.color)}" /></label>
          <label class="field inline full"><input id="p-${i}-available" name="p-${i}-available" data-p="available" type="checkbox" ${p.available ? 'checked' : ''} /> <span>Available for sale (unchecked = Coming soon)</span></label>
        </div>
        <div class="preview-row">
          <img src="../${escapeAttr(p.image || 'images/sku-04.svg')}" alt="" onerror="this.onerror=null;this.src='../images/sku-04.svg';this.style.opacity=0.85" />
          <div>
            <div class="muted">Preview from shop/${escapeHtml(p.image || '')}</div>
            <label class="file-upload">
              Upload image → saves as data URL in config (large files may slow page)
              <input type="file" id="p-${i}-upload" name="p-${i}-upload" accept="image/*" data-upload="${i}" hidden />
            </label>
          </div>
        </div>
      </div>`,
      )
      .join('');

    forms.querySelectorAll('[data-upload]').forEach((input) => {
      input.addEventListener('change', onImageUpload);
    });
  }

  function normalizeColor(c) {
    if (c && /^#[0-9a-fA-F]{6}$/.test(c)) return c;
    return '#0b3d91';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function onImageUpload(e) {
    const input = e.target;
    const idx = Number(input.dataset.upload);
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 900000) {
      showStatus('Image too large (max ~900KB). Compress or use shop/images/ + path only.', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      readFormIntoConfig();
      config.products[idx].image = reader.result; // data URL
      // Prefer file name for publish path hint
      const safeName = (config.products[idx].id || 'product') + '.jpg';
      config.products[idx]._suggestedFile = 'images/' + safeName;
      render();
      showStatus(
        'Image embedded for preview. For production: save file as shop/' +
          (config.products[idx]._suggestedFile || 'images/photo.jpg') +
          ' and set image path to that (smaller/faster than data URL).',
      );
    };
    reader.readAsDataURL(file);
  }

  function saveLocalPreview() {
    try {
      readFormIntoConfig();
      const json = JSON.stringify(config);
      try {
        localStorage.setItem(CONFIG_KEY, json);
        localStorage.setItem(USE_LOCAL_KEY, '1');
      } catch (storageErr) {
        showStatus(
          'Could not save to browser storage (private mode or full). Use Download JSON instead. ' +
            (storageErr.message || ''),
          true,
        );
        return;
      }
      setSource('Browser preview (local)');
      showStatus(
        'Saved for this browser. Open shop in a new tab to preview. Other visitors still see the live file until you Download + git push.',
      );
    } catch (e) {
      console.error(e);
      showStatus('Save failed: ' + (e.message || e), true);
    }
  }

  function downloadJson() {
    try {
      readFormIntoConfig();
      const json = JSON.stringify(config, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-config.json';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
          a.remove();
        } catch {
          /* ignore */
        }
      }, 1500);
      showStatus(
        'Download started: products-config.json. Replace shop/products-config.json, then git push.',
      );
    } catch (e) {
      console.error(e);
      showStatus('Download failed: ' + (e.message || e), true);
    }
  }

  function clearLocal() {
    try {
      localStorage.removeItem(USE_LOCAL_KEY);
      localStorage.removeItem(CONFIG_KEY);
    } catch {
      /* ignore */
    }
    loadConfig()
      .then(() => {
        render();
        showStatus('Browser preview cleared. Shop will use live products-config.json.');
      })
      .catch((e) => {
        showStatus('Clear failed: ' + (e.message || e), true);
      });
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        config = JSON.parse(reader.result);
        render();
        showStatus('JSON imported into the form. Save preview or download to publish.');
      } catch {
        showStatus('Invalid JSON file.', true);
      }
    };
    reader.readAsText(file);
  }

  function tryLogin() {
    const err = document.getElementById('loginError');
    const btn = document.getElementById('btnLogin');
    err.hidden = true;
    err.textContent = '';
    const pw = normalizePassword(document.getElementById('adminPassword').value);
    if (!pw) {
      err.textContent = 'Enter the admin password.';
      err.hidden = false;
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Signing in…';
    }
    // Sync password check — never leave button stuck on "Checking…"
    try {
      if (!passwordMatches(pw)) {
        err.textContent =
          'Incorrect password. Type exactly: Admin@oeo2026 (capital A, @oeo, no ! or spaces).';
        err.hidden = false;
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Sign in';
        }
        return;
      }
      setSession();
      // Show admin shell immediately
      document.getElementById('loginGate').hidden = true;
      document.getElementById('adminApp').hidden = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
      // Load config in background (with timeout)
      enterAdmin();
    } catch (e) {
      console.error(e);
      err.textContent = 'Login failed: ' + (e.message || 'unknown error');
      err.hidden = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
    }
  }

  async function enterAdmin() {
    document.getElementById('loginGate').hidden = true;
    document.getElementById('adminApp').hidden = false;
    // Show known-good defaults immediately (no broken sku-01/02/03 paths)
    if (!config) {
      config = defaultConfig();
      ensureSixProducts(config);
      render();
    }
    try {
      await loadConfig();
      ensureSixProducts(config);
      render();
    } catch (e) {
      console.error(e);
      if (!config) config = defaultConfig();
      ensureSixProducts(config);
      render();
      showStatus('Using defaults — could not load products-config.json (' + (e.message || e) + ')', true);
    }
  }

  function logout() {
    clearSession();
    document.getElementById('adminApp').hidden = true;
    document.getElementById('loginGate').hidden = false;
    document.getElementById('adminPassword').value = '';
  }

  function wireActionButtons() {
    const map = [
      ['btnLogin', tryLogin],
      ['btnLogout', logout],
      ['btnSaveLocal', saveLocalPreview],
      ['btnSaveLocalTop', saveLocalPreview],
      ['btnDownload', downloadJson],
      ['btnDownloadTop', downloadJson],
      ['btnClearLocal', clearLocal],
    ];
    map.forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          fn();
        } catch (err) {
          console.error(err);
          showStatus('Action failed: ' + (err.message || err), true);
        }
      });
    });
    const pw = document.getElementById('adminPassword');
    if (pw) {
      pw.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tryLogin();
      });
    }
    const importFile = document.getElementById('importFile');
    if (importFile) {
      importFile.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) importJson(f);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      wireActionButtons();
      if (sessionOk()) await enterAdmin();
    } catch (e) {
      console.error(e);
      showStatus('Admin failed to start: ' + (e.message || e), true);
    }
  });
})();
