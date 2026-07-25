# Manna Life shop — Admin guide (pictures, prices, stock)

**Live shop:** https://oeosolution-home.onrender.com/shop/  
**Admin page:** https://oeosolution-home.onrender.com/shop/admin/  
**Password:** `Admin@oeo2026` (same family as other OEO admin demos — change hash in `admin/admin.js` if needed)

---

## Recommended: use the Admin page

1. Open **/shop/admin/**
2. Enter password **Admin@oeo2026**
3. Edit prices, stock, names, availability, tiers, delivery base
4. **Save & preview on this browser** — test shop on same device
5. **Download products-config.json**
6. Replace `shop/products-config.json` in the project
7. Put photos in `shop/images/` if needed
8. `git push` → wait for Render

---

---

## Quick map

| What to change | Where |
|----------------|--------|
| **Pictures** | Put JPG/PNG in `shop/images/` · path already set in `shop/shop.js` |
| **Prices** | `shop/shop.js` → each product `listPrice` and `costFloor` |
| **Stock / quantity** | `shop/shop.js` → each product `stock` |
| **Bulk discount tiers** | `shop/shop.js` → `tiers` array |
| **Delivery fee base** | `shop/shop.js` → `deliveryBase` |
| **Enable SKU 4–6** | Set `available: true` + name + prices + image |
| **WhatsApp number** | `shop/shop.js` → `whatsapp` |
| **Paystack** | `shop/shop.js` → `paystackPublicKey` |

---

## 1. Update product pictures

### Step A — Prepare images
- Format: **JPG or PNG**
- Recommended size: **800×800** or **1200×1200** (square)
- File size: under **500 KB** each if possible (faster on phone)
- Use **Navina-approved** pack photos only

### Step B — File names (match shop.js)

Put files in:

```
oeosolution-home/shop/images/
```

| Product | Save as |
|---------|---------|
| Ready Beans | `ready-beans.jpg` |
| Yam & Plantain | `yam-plantain.jpg` |
| Sweet Potato | `sweet-potato.jpg` |
| Slot 4 | `sku-04.jpg` |
| Slot 5 | `sku-05.jpg` |
| Slot 6 | `sku-06.jpg` |

### Step C — Confirm path in shop.js

Each product has:

```js
image: 'images/ready-beans.jpg',
```

If your file is `.png`, change to:

```js
image: 'images/ready-beans.png',
```

### Step D — Publish (see §5)

Until the image file exists, the shop shows a placeholder icon (page still works).

---

## 2. Update prices (admin)

Open **`shop/shop.js`** and find the product, e.g. Ready Beans:

```js
listPrice: 4500,   // ← customer retail price (₦)
costFloor: 2800,   // ← Navina cost — NEVER sell below this
```

| Field | Meaning |
|-------|---------|
| **listPrice** | Full unit price before bulk discount |
| **costFloor** | Navina wholesale/cost — system will not discount below this |

**Example:** Navina invoice ₦3,000 · you sell at ₦5,000  

```js
listPrice: 5000,
costFloor: 3000,
```

Bulk % off only reduces *your* margin; if discount would go under `costFloor`, the floor price is used.

---

## 3. Update stock quantity (admin)

Still in each product block:

```js
stock: 500,   // max customers can order
```

| Value | Effect |
|-------|--------|
| `500` | Max 500 pouches of that SKU in cart |
| `0` | Shows **Out of stock** (cannot add) |
| `null` | Unlimited (no stock cap) |

**After a big order:** lower `stock` to match what you still have at the warehouse, then publish again.

Example after selling 80 Ready Beans from 500:

```js
stock: 420,
```

---

## 4. Turn on catalogue items 4–6

```js
{
  id: 'sku-04',
  name: 'Your new product name',
  tagline: 'Short sales line',
  listPrice: 4800,
  costFloor: 3000,
  stock: 200,
  image: 'images/sku-04.jpg',
  badge: 'BPA-free pouch',
  nutrition: 'From Navina label',
  color: '#0d9488',
  available: true,   // was false
},
```

Add matching photo under `shop/images/sku-04.jpg`.

---

## 5. Publish changes (so customers see them)

### Option A — Git (recommended)

1. Save files on your PC under:
   `C:\Users\user\Documents\Production Projects\oeosolution-home\shop\`
2. Open terminal:

```powershell
cd "C:\Users\user\Documents\Production Projects\oeosolution-home"
git add shop/
git commit -m "Update Manna Life prices, stock, and images"
git push origin main
```

3. Wait **2–5 minutes** for Render to redeploy  
4. Open https://oeosolution-home.onrender.com/shop/  
5. Hard refresh: **Ctrl + Shift + R**

### Option B — Ask your developer / agent
Send: new photos + spreadsheet of prices/stock → they edit `shop.js` and push.

---

## 6. Bulk quantity tiers (group discounts)

In `shop/shop.js` → `tiers`:

```js
{ minQty: 10, unitDiscount: 0.1, deliveryFactor: 0.7, label: 'Small group (10–49)' },
```

| Field | Meaning |
|-------|---------|
| `minQty` | From this many **total pouches in cart** |
| `unitDiscount` | `0.1` = 10% off list (still ≥ costFloor) |
| `deliveryFactor` | `0.7` = pay 70% of normal delivery; `0` = free delivery |

---

## 7. Checklist after every change

- [ ] `listPrice` ≥ `costFloor`  
- [ ] Photos named correctly under `shop/images/`  
- [ ] `stock` matches real warehouse  
- [ ] `git push` done  
- [ ] Live site refreshed on phone + PC  

---

## 8. What customers do (not admin)

- Change **cart qty** with + / − on the product card  
- That is **not** stock admin — only their order quantity  
- **You** control real stock with the `stock` field in `shop.js`

---

## 9. Future: real “Admin login” panel

Today there is **no password-protected admin page** (static site).  
Later we can add a small admin login to edit price/stock without code — until then, **editing `shop.js` + images = admin rights**.

---

**Contact (ops):** Opute Eric Opute (ACA) · WhatsApp 0803 668 5485 · Office 0903 961 3889 · oeosolution@gmail.com  
