# oeosolution.com — Domain wiring guide

## Recommendation (final map)

| Host | Purpose | Platform |
|------|---------|----------|
| `oeosolution.com` | Company homepage (this site) | Vercel or Render static |
| `www.oeosolution.com` | Same homepage | CNAME → apex or platform |
| `aquatrack.oeosolution.com` | AquaTrack ERP | Render (aquatrack-frontend) |
| `recon.oeosolution.com` | ReconFlow (later) | Vercel |
| `smartdelta.oeosolution.com` | SmartDelta (later) | Railway |

**Why this order**
1. Brand home on your real domain (builds trust for proposals).
2. AquaTrack on a clean product subdomain (matches marketing + pricing docs).
3. Other products later without confusing the root brand.

---

## A) Wire AquaTrack → `aquatrack.oeosolution.com`

### 1. Render dashboard
1. Login → open **aquatrack-frontend** (static site).
2. **Settings** → **Custom Domains** → **Add Custom Domain**.
3. Enter: `aquatrack.oeosolution.com`
4. Copy the DNS target Render shows (often a CNAME to `*.onrender.com`).

### 2. Namecheap DNS
1. Domain List → **oeosolution.com** → **Manage** → **Advanced DNS**.
2. Delete parking records for `www` if they point to `parkingpage.namecheap.com` (when you are ready for the homepage).
3. **Add new record:**
   - Type: **CNAME Record**
   - Host: **aquatrack**
   - Value: *(paste Render target exactly)*
   - TTL: Automatic
4. Save.

### 3. Wait for SSL
- Render: domain status → **Certificate issued**
- Test: https://aquatrack.oeosolution.com

### 4. App env (if needed)
In Render **aquatrack-frontend** env, ensure public URLs still work (API can remain on `*.onrender.com` until you add `api.aquatrack.oeosolution.com`).

---

## B) Company home → `oeosolution.com` + `www`

Deploy the folder `oeosolution-home` as a static site.

### Option 1 — Render Static Site (same account as AquaTrack)
1. New → Static Site  
2. Upload/connect this folder (or GitHub repo)  
3. Build: leave empty or `echo ok`  
4. Publish directory: `.`  
5. Custom domains: add `oeosolution.com` and `www.oeosolution.com`  
6. Namecheap DNS as Render instructs:
   - **www** → CNAME to Render  
   - **@** → URL Redirect to `https://www.oeosolution.com` **or** A record(s) Render provides  

### Option 2 — Vercel
1. `npx vercel` from this folder after `vercel login`  
2. Domains: add `oeosolution.com` and `www.oeosolution.com`  
3. Namecheap: CNAME/A as Vercel dashboard shows  

---

## C) Remove Namecheap parking

Under Advanced DNS, remove:
- CNAME `www` → `parkingpage.namecheap.com`
- Any URL redirect that points only to parking

Then add your real records for home + aquatrack.

---

## D) Quick checklist

- [ ] Render custom domain `aquatrack.oeosolution.com` added  
- [ ] Namecheap CNAME host `aquatrack` set  
- [ ] Homepage static site deployed  
- [ ] `www` + apex pointed at homepage  
- [ ] Parking records removed  
- [ ] HTTPS green on both URLs  
- [ ] Homepage “Launch AquaTrack” button works  

---

## Local preview

```powershell
cd "C:\Users\user\Documents\Production Projects\oeosolution-home"
npx --yes serve -l 5500
```

Open http://localhost:5500
