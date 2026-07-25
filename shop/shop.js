/**
 * Manna Life shop — OEO online franchise of Navina Food Industry
 * Pricing: never below Navina cost floor. Bulk tiers cut OEO margin only.
 */
(function () {
  'use strict';

  /**
   * Default catalogue — overridden by products-config.json and/or admin browser preview.
   * Prefer editing via /shop/admin/ then publishing products-config.json
   */
  let CONFIG = {
    currency: 'NGN',
    whatsapp: '2348036685485', // 08036685485
    officeWhatsapp: '2349039613889',
    paystackPublicKey: '', // paste pk_live_... or pk_test_... when ready
    franchiseName: 'OEO Solution',
    producer: 'Navina Food Industry',
    brand: 'Manna Life',
    // Delivery base (single-unit path)
    deliveryBase: 2500,
    deliveryZones: [
      { id: 'south-south', label: 'South-South (Asaba, Warri, PH, …)', mult: 1 },
      { id: 'south-west', label: 'South-West (Lagos, Ibadan, …)', mult: 1.15 },
      { id: 'south-east', label: 'South-East', mult: 1.1 },
      { id: 'north', label: 'North / FCT', mult: 1.35 },
      { id: 'other', label: 'Other Nigeria', mult: 1.4 },
    ],
    /**
     * Bulk tiers: minQty inclusive.
     * unitDiscount = fraction off list price (OEO margin only).
     * deliveryFactor = multiplier on delivery (1 = full, 0 = free).
     */
    tiers: [
      { minQty: 1, unitDiscount: 0, deliveryFactor: 1, label: 'Individual' },
      { minQty: 10, unitDiscount: 0.1, deliveryFactor: 0.7, label: 'Small group (10–49)' },
      { minQty: 50, unitDiscount: 0.16, deliveryFactor: 0.5, label: 'Hostel / class (50–99)' },
      { minQty: 100, unitDiscount: 0.22, deliveryFactor: 0, label: 'School / dept (100+)' },
    ],
    /**
     * Up to 6 catalogue slots. Set available: false to show “Coming soon” (not addable).
     * Edit name/prices when Navina adds SKUs. costFloor = never sell below Navina cost.
     */
    products: [
      {
        id: 'ready-beans',
        name: 'Ready Beans',
        tagline: 'Protein-forward ready pouch',
        listPrice: 4500, // retail price customers see
        costFloor: 2800, // Navina cost — never sell below
        stock: 500, // max orderable qty (null = unlimited)
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
        tagline: 'Edit name in shop.js when Navina SKU is ready',
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
        tagline: 'Reserved slot for next Manna Life variant',
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
        tagline: 'Reserved slot for next Manna Life variant',
        listPrice: 4500,
        costFloor: 2800,
        stock: 0,
        image: 'images/sku-06.svg',
        badge: 'Coming soon',
        nutrition: 'Nutrition panel from Navina pack',
        color: '#334155',
        available: false,
      },
    ],
  };

  const state = {
    cart: loadCart(),
    zoneId: 'south-south',
  };

  function applyRemoteConfig(remote) {
    if (!remote || typeof remote !== 'object') return;
    if (remote.franchiseName) CONFIG.franchiseName = remote.franchiseName;
    if (remote.producer) CONFIG.producer = remote.producer;
    if (remote.brand) CONFIG.brand = remote.brand;
    if (remote.whatsapp) CONFIG.whatsapp = remote.whatsapp;
    if (remote.officeWhatsapp) CONFIG.officeWhatsapp = remote.officeWhatsapp;
    if (remote.paystackPublicKey != null) CONFIG.paystackPublicKey = remote.paystackPublicKey;
    if (remote.deliveryBase != null) CONFIG.deliveryBase = Number(remote.deliveryBase) || CONFIG.deliveryBase;
    if (Array.isArray(remote.deliveryZones) && remote.deliveryZones.length) {
      CONFIG.deliveryZones = remote.deliveryZones;
    }
    if (Array.isArray(remote.tiers) && remote.tiers.length) CONFIG.tiers = remote.tiers;
    if (Array.isArray(remote.products) && remote.products.length) {
      CONFIG.products = remote.products.slice(0, 6);
    }
  }

  async function loadPublishedConfig() {
    // 1) Admin "preview on this browser"
    try {
      if (localStorage.getItem('manna_shop_use_local') === '1') {
        const local = JSON.parse(localStorage.getItem('manna_shop_config_v1') || 'null');
        if (local) {
          applyRemoteConfig(local);
          return 'local-preview';
        }
      }
    } catch {
      /* ignore */
    }
    // 2) Live products-config.json (all visitors)
    try {
      const r = await fetch('products-config.json?t=' + Date.now());
      if (r.ok) {
        applyRemoteConfig(await r.json());
        return 'published';
      }
    } catch {
      /* ignore */
    }
    return 'embedded';
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem('manna_cart_v1') || '{}');
    } catch {
      return {};
    }
  }

  function saveCart() {
    localStorage.setItem('manna_cart_v1', JSON.stringify(state.cart));
  }

  function money(n) {
    return (
      '₦' +
      Math.round(n).toLocaleString('en-NG', { maximumFractionDigits: 0 })
    );
  }

  function totalQty() {
    return Object.values(state.cart).reduce((s, q) => s + Number(q || 0), 0);
  }

  function activeTier(qty) {
    let tier = CONFIG.tiers[0];
    CONFIG.tiers.forEach((t) => {
      if (qty >= t.minQty) tier = t;
    });
    return tier;
  }

  /** Unit price after discount, never below cost floor. */
  function unitPrice(product, qty) {
    const tier = activeTier(qty);
    const discounted = product.listPrice * (1 - tier.unitDiscount);
    return Math.max(product.costFloor, Math.round(discounted));
  }

  function deliveryCost(qty, zoneMult) {
    if (qty <= 0) return 0;
    const tier = activeTier(qty);
    const base = CONFIG.deliveryBase * (zoneMult || 1);
    // slight volume curve then tier factor
    const volumeFactor = qty >= 100 ? 1 : qty >= 50 ? 1.2 : qty >= 10 ? 1.5 : 1.8;
    return Math.round(base * volumeFactor * tier.deliveryFactor);
  }

  function cartLines() {
    const qty = totalQty();
    return CONFIG.products
      .filter((p) => state.cart[p.id] > 0)
      .map((p) => {
        const q = state.cart[p.id];
        const unit = unitPrice(p, qty);
        return {
          product: p,
          qty: q,
          unit,
          line: unit * q,
          listLine: p.listPrice * q,
          floored: unit === p.costFloor && unit < p.listPrice * (1 - activeTier(qty).unitDiscount),
        };
      });
  }

  function totals() {
    const lines = cartLines();
    const qty = totalQty();
    const zone = CONFIG.deliveryZones.find((z) => z.id === state.zoneId) || CONFIG.deliveryZones[0];
    const subtotal = lines.reduce((s, l) => s + l.line, 0);
    const listSubtotal = lines.reduce((s, l) => s + l.listLine, 0);
    const delivery = deliveryCost(qty, zone.mult);
    const productSavings = Math.max(0, listSubtotal - subtotal);
    const fullDelivery = deliveryCost(qty, zone.mult) === 0
      ? 0
      : Math.round(CONFIG.deliveryBase * zone.mult * (qty >= 100 ? 1 : qty >= 50 ? 1.2 : qty >= 10 ? 1.5 : 1.8));
    // delivery savings vs no-tier (factor 1)
    const deliveryNoTier = qty <= 0 ? 0 : Math.round(CONFIG.deliveryBase * zone.mult * (qty >= 100 ? 1 : qty >= 50 ? 1.2 : qty >= 10 ? 1.5 : 1.8));
    const deliverySavings = Math.max(0, deliveryNoTier - delivery);
    return {
      lines,
      qty,
      tier: activeTier(qty),
      zone,
      subtotal,
      listSubtotal,
      delivery,
      total: subtotal + delivery,
      productSavings,
      deliverySavings,
      totalSavings: productSavings + deliverySavings,
    };
  }

  function productById(id) {
    return CONFIG.products.find((p) => p.id === id);
  }

  function maxStock(product) {
    if (!product || product.available === false) return 0;
    if (product.stock == null || product.stock === '') return 9999;
    return Math.max(0, Number(product.stock) || 0);
  }

  function setQty(id, qty) {
    const product = productById(id);
    const cap = maxStock(product);
    let n = Math.max(0, parseInt(qty, 10) || 0);
    if (n > cap) n = cap;
    if (n === 0) delete state.cart[id];
    else state.cart[id] = n;
    saveCart();
    render();
  }

  function renderProducts() {
    const root = document.getElementById('productGrid');
    if (!root) return;
    const qty = totalQty();
    // Show up to 6 catalogue spaces
    const catalog = CONFIG.products.slice(0, 6);
    root.innerHTML = catalog
      .map((p) => {
        const available = p.available !== false;
        const q = available ? state.cart[p.id] || 0 : 0;
        const unit = unitPrice(p, Math.max(qty, q || 1));
        const stock = maxStock(p);
        const stockLabel =
          p.stock == null || p.stock === ''
            ? 'In stock'
            : stock <= 0
              ? 'Out of stock'
              : `${stock} in stock`;
        const imgSrc = p.image
          ? p.image.indexOf('data:') === 0 || p.image.indexOf('http') === 0
            ? p.image
            : p.image
          : '';
        const visual = imgSrc
          ? `<img class="shop-card-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="shop-card-emoji shop-card-emoji-fallback" style="display:none" aria-hidden="true">🍲</span>`
          : `<span class="shop-card-emoji" aria-hidden="true">${available ? '🍲' : '📦'}</span>`;

        if (!available) {
          return `
        <article class="shop-card shop-card-soon" id="product-${p.id}">
          <div class="shop-card-visual" style="--accent:${p.color}">
            ${visual}
            <span class="shop-badge">${escapeHtml(p.badge || 'Coming soon')}</span>
          </div>
          <div class="shop-card-body">
            <p class="shop-kicker">Manna Life · ${escapeHtml(CONFIG.producer)}</p>
            <h2>${escapeHtml(p.name)}</h2>
            <p class="shop-tagline">${escapeHtml(p.tagline)}</p>
            <p class="shop-nutrition">${escapeHtml(p.nutrition)}</p>
            <p class="shop-price"><strong>—</strong> <span class="shop-price-note">Pricing on release</span></p>
            <button type="button" class="btn btn-ghost shop-add" disabled>Coming soon</button>
          </div>
        </article>`;
        }
        const soldOut = stock <= 0;
        return `
        <article class="shop-card" id="product-${p.id}">
          <div class="shop-card-visual" style="--accent:${p.color}">
            ${visual}
            <span class="shop-badge">${escapeHtml(p.badge)}</span>
          </div>
          <div class="shop-card-body">
            <p class="shop-kicker">Manna Life · ${escapeHtml(CONFIG.producer)}</p>
            <h2>${escapeHtml(p.name)}</h2>
            <p class="shop-tagline">${escapeHtml(p.tagline)}</p>
            <p class="shop-nutrition">${escapeHtml(p.nutrition)}</p>
            <p class="shop-price">
              <strong>${money(unit)}</strong>
              <span class="shop-price-note">/ pouch${q || qty ? ' (cart tier)' : ''}</span>
            </p>
            <p class="shop-floor">Cost floor protected · list ${money(p.listPrice)} · ${stockLabel}</p>
            <div class="shop-qty-row">
              <label for="qty-${p.id}">Qty</label>
              <div class="shop-qty-controls">
                <button type="button" data-dec="${p.id}" aria-label="Decrease" ${soldOut ? 'disabled' : ''}>−</button>
                <input id="qty-${p.id}" name="qty-${p.id}" type="number" min="0" max="${stock}" value="${q}" data-qty="${p.id}" autocomplete="off" ${soldOut ? 'disabled' : ''} />
                <button type="button" data-inc="${p.id}" aria-label="Increase" ${soldOut ? 'disabled' : ''}>+</button>
              </div>
            </div>
            <button type="button" class="btn btn-primary shop-add" data-add="${p.id}" ${soldOut ? 'disabled' : ''}>
              ${soldOut ? 'Out of stock' : q ? 'Update cart' : 'Add to cart'}
            </button>
          </div>
        </article>`;
      })
      .join('');
  }

  function renderTiers() {
    const el = document.getElementById('tierTable');
    if (!el) return;
    const qty = totalQty();
    const active = activeTier(qty);
    el.innerHTML = `
      <table class="shop-table">
        <thead>
          <tr>
            <th>Quantity</th>
            <th>Discount</th>
            <th>Delivery</th>
            <th>Use case</th>
          </tr>
        </thead>
        <tbody>
          ${CONFIG.tiers
            .map((t) => {
              const on = t.minQty === active.minQty && qty > 0;
              const next = CONFIG.tiers.find((x) => x.minQty > t.minQty);
              const range = next
                ? `${t.minQty}–${next.minQty - 1}`
                : `${t.minQty}+`;
              return `<tr class="${on ? 'is-active' : ''}">
                <td>${range} pouches</td>
                <td>${t.unitDiscount ? Math.round(t.unitDiscount * 100) + '% off*' : 'Full price'}</td>
                <td>${t.deliveryFactor === 0 ? 'Free / promo' : t.deliveryFactor < 1 ? Math.round((1 - t.deliveryFactor) * 100) + '% less' : 'Standard'}</td>
                <td>${escapeHtml(t.label)}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
      <p class="shop-fine">*Discount applied only while unit price stays at or above Navina cost floor.</p>`;
  }

  function renderZone() {
    const sel = document.getElementById('zoneSelect');
    if (!sel) return;
    if (!sel.options.length) {
      CONFIG.deliveryZones.forEach((z) => {
        const o = document.createElement('option');
        o.value = z.id;
        o.textContent = z.label;
        sel.appendChild(o);
      });
    }
    sel.value = state.zoneId;
  }

  function renderCart() {
    const t = totals();
    const linesEl = document.getElementById('cartLines');
    const summaryEl = document.getElementById('cartSummary');
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = String(t.qty);

    if (linesEl) {
      if (!t.lines.length) {
        linesEl.innerHTML =
          '<p class="shop-empty">Cart is empty. Add pouches above — group discounts apply automatically.</p>';
      } else {
        linesEl.innerHTML = t.lines
          .map(
            (l) => `
          <div class="cart-line">
            <div>
              <strong>${escapeHtml(l.product.name)}</strong>
              <span class="cart-meta">${l.qty} × ${money(l.unit)}</span>
              ${l.floored ? '<span class="cart-floor-tag">Floor price applied</span>' : ''}
            </div>
            <div class="cart-line-right">
              <span>${money(l.line)}</span>
              <button type="button" class="cart-remove" data-remove="${l.product.id}">Remove</button>
            </div>
          </div>`,
          )
          .join('');
      }
    }

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="sum-row"><span>Items</span><span>${t.qty} pouch(es)</span></div>
        <div class="sum-row"><span>Tier</span><span>${t.qty ? escapeHtml(t.tier.label) : '—'}</span></div>
        <div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        <div class="sum-row"><span>Delivery (${escapeHtml(t.zone.label.split('(')[0].trim())})</span><span>${money(t.delivery)}</span></div>
        ${
          t.totalSavings > 0
            ? `<div class="sum-row sum-save"><span>You save</span><span>${money(t.totalSavings)}</span></div>`
            : ''
        }
        <div class="sum-row sum-total"><span>Total</span><span>${money(t.total)}</span></div>
        <p class="cart-attribution">
          Product by <strong>Manna Life (${escapeHtml(CONFIG.producer)})</strong><br />
          Sold &amp; delivered by <strong>${escapeHtml(CONFIG.franchiseName)}</strong>
        </p>`;
    }

    const wa = document.getElementById('btnWhatsApp');
    const pay = document.getElementById('btnPaystack');
    if (wa) wa.disabled = t.qty === 0;
    if (pay) pay.disabled = t.qty === 0;
  }

  function orderMessage() {
    const t = totals();
    const lines = t.lines
      .map((l) => `• ${l.product.name}: ${l.qty} × ${money(l.unit)} = ${money(l.line)}`)
      .join('\n');
    return (
      `Manna Life order (OEO online franchise)\n` +
      `Producer: ${CONFIG.producer}\n` +
      `Seller: ${CONFIG.franchiseName}\n\n` +
      `${lines}\n\n` +
      `Tier: ${t.tier.label}\n` +
      `Zone: ${t.zone.label}\n` +
      `Subtotal: ${money(t.subtotal)}\n` +
      `Delivery: ${money(t.delivery)}\n` +
      `TOTAL: ${money(t.total)}\n` +
      (t.totalSavings ? `Savings: ${money(t.totalSavings)}\n` : '') +
      `\nName:\nPhone:\nDelivery address:\n`
    );
  }

  function openWhatsApp() {
    const t = totals();
    if (!t.qty) return;
    const url =
      'https://wa.me/' +
      CONFIG.whatsapp +
      '?text=' +
      encodeURIComponent(orderMessage());
    window.open(url, '_blank', 'noopener');
  }

  function paystackPlaceholder() {
    const t = totals();
    if (!t.qty) return;
    if (!CONFIG.paystackPublicKey) {
      alert(
        'Paystack public key not set yet.\n\nUse “Order via WhatsApp” for now, or paste pk_test_/pk_live_ into shop/shop.js → CONFIG.paystackPublicKey.\n\nMerchant of record: OEO Solution.',
      );
      return;
    }
    // Paystack Inline (load script if key present)
    if (typeof PaystackPop === 'undefined') {
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.onload = () => launchPaystack(t);
      document.body.appendChild(s);
    } else {
      launchPaystack(t);
    }
  }

  function launchPaystack(t) {
    const handler = PaystackPop.setup({
      key: CONFIG.paystackPublicKey,
      email: 'customer@example.com',
      amount: Math.round(t.total * 100),
      currency: 'NGN',
      ref: 'MANNA-' + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: 'Items', variable_name: 'qty', value: String(t.qty) },
          { display_name: 'Seller', variable_name: 'seller', value: CONFIG.franchiseName },
          { display_name: 'Producer', variable_name: 'producer', value: CONFIG.producer },
        ],
      },
      callback: function () {
        alert('Payment complete (Paystack). We will confirm fulfilment on WhatsApp.');
        state.cart = {};
        saveCart();
        render();
      },
      onClose: function () {},
    });
    handler.openIframe();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    renderProducts();
    renderTiers();
    renderZone();
    renderCart();
  }

  function onClick(e) {
    const t = e.target;
    if (t.dataset.inc) {
      const id = t.dataset.inc;
      setQty(id, (state.cart[id] || 0) + 1);
    } else if (t.dataset.dec) {
      const id = t.dataset.dec;
      setQty(id, (state.cart[id] || 0) - 1);
    } else if (t.dataset.add) {
      const id = t.dataset.add;
      const input = document.querySelector(`[data-qty="${id}"]`);
      const v = input ? input.value : state.cart[id] || 1;
      setQty(id, Math.max(1, parseInt(v, 10) || 1));
    } else if (t.dataset.remove) {
      setQty(t.dataset.remove, 0);
    }
  }

  function onChange(e) {
    const t = e.target;
    if (t.dataset.qty) {
      setQty(t.dataset.qty, t.value);
    }
    if (t.id === 'zoneSelect') {
      state.zoneId = t.value;
      renderCart();
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('productGrid')?.addEventListener('click', onClick);
    document.getElementById('cartLines')?.addEventListener('click', onClick);
    document.body.addEventListener('change', onChange);
    document.getElementById('btnWhatsApp')?.addEventListener('click', openWhatsApp);
    document.getElementById('btnPaystack')?.addEventListener('click', paystackPlaceholder);
    document.getElementById('year') &&
      (document.getElementById('year').textContent = String(new Date().getFullYear()));
    await loadPublishedConfig();
    // Ensure zone still valid after config load
    if (!CONFIG.deliveryZones.some((z) => z.id === state.zoneId)) {
      state.zoneId = CONFIG.deliveryZones[0]?.id || 'south-south';
    }
    render();
  });
})();
