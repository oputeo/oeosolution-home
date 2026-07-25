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

  async function sha256Hex(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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
    const el = document.getElementById('statusMsg');
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    el.className = 'status' + (isErr ? ' err' : '');
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
      products: [],
    };
  }

  async function loadConfig() {
    let remote = null;
    try {
      const r = await fetch('../products-config.json?t=' + Date.now());
      if (r.ok) remote = await r.json();
    } catch {
      /* ignore */
    }
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
    // Ensure 6 product slots
    while (config.products.length < 6) {
      const i = config.products.length + 1;
      config.products.push({
        id: 'sku-0' + i,
        name: 'Catalogue item ' + i,
        tagline: '',
        listPrice: 4500,
        costFloor: 2800,
        stock: 0,
        image: 'images/sku-0' + i + '.jpg',
        badge: 'Coming soon',
        nutrition: '',
        color: '#64748b',
        available: false,
      });
    }
    config.products = config.products.slice(0, 6);
    if (!config.tiers || !config.tiers.length) {
      config.tiers = defaultConfig().tiers;
    }
  }

  function setSource(text) {
    const el = document.getElementById('configSource');
    if (el) el.textContent = '· ' + text;
  }

  function readFormIntoConfig() {
    config.whatsapp = document.getElementById('cfgWhatsapp').value.trim();
    config.deliveryBase = Number(document.getElementById('cfgDelivery').value) || 0;
    config.paystackPublicKey = document.getElementById('cfgPaystack').value.trim();
    config.franchiseName = document.getElementById('cfgFranchise').value.trim() || 'OEO Solution';
    config.updatedAt = new Date().toISOString();

    const tierRows = document.querySelectorAll('#tierBody tr');
    config.tiers = Array.from(tierRows).map((tr) => ({
      minQty: Number(tr.querySelector('[data-t="min"]').value) || 1,
      unitDiscount: Math.min(0.5, Math.max(0, Number(tr.querySelector('[data-t="disc"]').value) || 0)),
      deliveryFactor: Math.min(1, Math.max(0, Number(tr.querySelector('[data-t="del"]').value) || 0)),
      label: tr.querySelector('[data-t="label"]').value.trim() || 'Tier',
    }));

    config.products = Array.from(document.querySelectorAll('.product-card')).map((card, idx) => {
      const get = (name) => card.querySelector(`[data-p="${name}"]`);
      const listPrice = Number(get('listPrice').value) || 0;
      let costFloor = Number(get('costFloor').value) || 0;
      if (costFloor > listPrice && listPrice > 0) costFloor = listPrice;
      const stockRaw = get('stock').value;
      const stock =
        stockRaw === '' || stockRaw === 'null' ? null : Math.max(0, Number(stockRaw) || 0);
      return {
        id: get('id').value.trim() || 'sku-' + (idx + 1),
        name: get('name').value.trim() || 'Product ' + (idx + 1),
        tagline: get('tagline').value.trim(),
        listPrice,
        costFloor,
        stock,
        image: get('image').value.trim() || 'images/' + (get('id').value.trim() || 'sku') + '.jpg',
        badge: get('badge').value.trim(),
        nutrition: get('nutrition').value.trim(),
        color: get('color').value.trim() || '#0b3d91',
        available: get('available').checked,
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
        <td><input data-t="min" type="number" min="1" value="${t.minQty}" /></td>
        <td><input data-t="disc" type="number" min="0" max="0.5" step="0.01" value="${t.unitDiscount}" /></td>
        <td><input data-t="del" type="number" min="0" max="1" step="0.05" value="${t.deliveryFactor}" /></td>
        <td><input data-t="label" type="text" value="${escapeAttr(t.label || '')}" /></td>
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
          <label class="field"><span>ID (do not change often)</span><input data-p="id" value="${escapeAttr(p.id)}" /></label>
          <label class="field"><span>Name</span><input data-p="name" value="${escapeAttr(p.name)}" /></label>
          <label class="field full"><span>Tagline</span><input data-p="tagline" value="${escapeAttr(p.tagline || '')}" /></label>
          <label class="field"><span>List price (₦ retail)</span><input data-p="listPrice" type="number" min="0" step="50" value="${p.listPrice}" /></label>
          <label class="field"><span>Cost floor (₦ Navina cost)</span><input data-p="costFloor" type="number" min="0" step="50" value="${p.costFloor}" /></label>
          <label class="field"><span>Stock qty (blank = unlimited)</span><input data-p="stock" type="number" min="0" step="1" value="${p.stock == null ? '' : p.stock}" placeholder="unlimited" /></label>
          <label class="field"><span>Badge</span><input data-p="badge" value="${escapeAttr(p.badge || '')}" /></label>
          <label class="field full"><span>Nutrition / notes</span><input data-p="nutrition" value="${escapeAttr(p.nutrition || '')}" /></label>
          <label class="field"><span>Image path</span><input data-p="image" value="${escapeAttr(p.image || '')}" placeholder="images/ready-beans.jpg" /></label>
          <label class="field"><span>Accent colour</span><input data-p="color" type="color" value="${normalizeColor(p.color)}" /></label>
          <label class="field inline full"><input data-p="available" type="checkbox" ${p.available ? 'checked' : ''} /> <span>Available for sale (unchecked = Coming soon)</span></label>
        </div>
        <div class="preview-row">
          <img src="../${escapeAttr(p.image || '')}" alt="" onerror="this.style.opacity=0.3" />
          <div>
            <div class="muted">Preview from shop/${escapeHtml(p.image || '')}</div>
            <label class="file-upload">
              Upload image → saves as data URL in config (large files may slow page)
              <input type="file" accept="image/*" data-upload="${i}" hidden />
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
    readFormIntoConfig();
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(USE_LOCAL_KEY, '1');
    setSource('Browser preview (local)');
    showStatus('Saved. Open the shop in this browser to preview. Other visitors still see the published file until you push JSON.');
  }

  function downloadJson() {
    readFormIntoConfig();
    // Strip data URLs warning — keep them if user wants
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showStatus('Downloaded products-config.json — replace shop/products-config.json and git push.');
  }

  function clearLocal() {
    localStorage.removeItem(USE_LOCAL_KEY);
    localStorage.removeItem(CONFIG_KEY);
    loadConfig().then(() => {
      render();
      showStatus('Browser preview cleared. Shop will use live products-config.json.');
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

  async function tryLogin() {
    const err = document.getElementById('loginError');
    err.hidden = true;
    const pw = document.getElementById('adminPassword').value;
    const hash = await sha256Hex(pw);
    if (hash !== PASS_HASH) {
      err.textContent = 'Incorrect password.';
      err.hidden = false;
      return;
    }
    setSession();
    await enterAdmin();
  }

  async function enterAdmin() {
    document.getElementById('loginGate').hidden = true;
    document.getElementById('adminApp').hidden = false;
    await loadConfig();
    render();
  }

  function logout() {
    clearSession();
    document.getElementById('adminApp').hidden = true;
    document.getElementById('loginGate').hidden = false;
    document.getElementById('adminPassword').value = '';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('btnLogin').addEventListener('click', tryLogin);
    document.getElementById('adminPassword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
    });
    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('btnSaveLocal').addEventListener('click', saveLocalPreview);
    document.getElementById('btnDownload').addEventListener('click', downloadJson);
    document.getElementById('btnClearLocal').addEventListener('click', clearLocal);
    document.getElementById('importFile').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importJson(f);
    });

    if (sessionOk()) await enterAdmin();
  });
})();
