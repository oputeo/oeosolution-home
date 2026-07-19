# Fix phone warning: net::ERR_CERT_COMMON_NAME_INVALID

## Cause
GitHub is still serving certificate **CN=*.github.io** instead of **www.oeosolution.com**.
Phones block this; desktop may still open over **http://**.

## Quick options for the meeting

1. Share **http://www.oeosolution.com** (works; less ideal for trust)
2. Share **https://aquatrack.oeosolution.com** for product demo (SSL already OK)
3. Fix homepage SSL properly (below)

## Recommended permanent fix — host homepage on Render (same as AquaTrack)

1. Render Dashboard → **New** → **Static Site**
2. Connect GitHub repo: `oputeo/oeosolution-home`
3. Build command: leave empty or `echo ok`
4. Publish directory: `.`
5. Create site → wait for live URL e.g. `oeosolution-home.onrender.com`
6. **Settings → Custom Domains** → add `www.oeosolution.com`
7. Namecheap Advanced DNS:
   - Edit CNAME **www** value from `oputeo.github.io` → **the Render target** (e.g. `oeosolution-home.onrender.com`)
   - Keep **aquatrack** CNAME unchanged
8. Wait for Render certificate **Issued**
9. Phone: open **https://www.oeosolution.com**

## Alternative — wait/retry GitHub certificate

GitHub Pages → Settings → Pages:
1. Remove custom domain → Save
2. Re-add `www.oeosolution.com` → Save  
3. Wait up to 24h for Enforce HTTPS
4. Only works when cert is for `www.oeosolution.com`, not `*.github.io`
