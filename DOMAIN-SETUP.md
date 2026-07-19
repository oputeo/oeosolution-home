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

## B) Company home → `www.oeosolution.com` (GitHub Pages — LIVE deploy)

Repo: https://github.com/oputeo/oeosolution-home  
Pages source: `main` branch, root `/`  
CNAME file: `www.oeosolution.com`

### Namecheap Advanced DNS (do this now)

**1. Remove parking for www (if present)**  
Delete any CNAME where Host = `www` and Value = `parkingpage.namecheap.com`

**2. Add / edit CNAME for homepage**

| Type | Host | Value | TTL |
|------|------|--------|-----|
| CNAME | `www` | `oputeo.github.io` | Automatic |

**3. Apex redirect (already often present)**  

Keep or set:

| Type | Host | Value |
|------|------|--------|
| URL Redirect | `@` | `https://www.oeosolution.com/` (prefer https) |

Leave **aquatrack** CNAME untouched.

**4. After DNS propagates (5–60 min)**  
- Open https://www.oeosolution.com  
- GitHub → repo → Settings → Pages → enable **Enforce HTTPS** when available  

### GitHub Pages UI check
https://github.com/oputeo/oeosolution-home/settings/pages  
Custom domain should show: `www.oeosolution.com`

---

## C) Optional: Render instead of GitHub Pages

Repo is public; on Render: New Static Site → connect `oputeo/oeosolution-home` → publish dir `.` → custom domain `www.oeosolution.com`.  
Then CNAME `www` → the Render hostname (not oputeo.github.io).

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
