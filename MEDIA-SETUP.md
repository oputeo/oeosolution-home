# OEO media + social setup

## Live URLs (after deploy)

| Page | URL |
|------|-----|
| Home | https://oeosolution.com/ |
| AquaTrack modules | https://oeosolution.com/aquatrack/ |
| Link-in-bio (IG etc.) | https://oeosolution.com/links/ |
| Deep link example | https://oeosolution.com/aquatrack/#gate-qr |

## 1. Paste YouTube clip IDs

Edit `aquatrack/index.html` — find `YOUTUBE_IDS`:

```js
var YOUTUBE_IDS = {
  sales: 'PASTE_ID',
  purchases: 'PASTE_ID',
  'gate-qr': 'PASTE_ID',
  production: 'PASTE_ID',
  inventory: 'PASTE_ID',
  qc: 'PASTE_ID'
};
```

Use the video id only (`watch?v=XXXXXXXX` → `XXXXXXXX`). Full YouTube URLs also work.

Suggested YouTube titles:

1. `AquaTrack · Sales / POS & credit | OEO Solution`
2. `AquaTrack · Purchases & approvals | OEO Solution`
3. `AquaTrack · Gate pass & drivers QR | OEO Solution`
4. `AquaTrack · Production & batches | OEO Solution`
5. `AquaTrack · Inventory & low-stock | OEO Solution`
6. `AquaTrack · Quality control (QC) | OEO Solution`

Description footer on every video:

```
Full module page: https://oeosolution.com/aquatrack#sales
Demo: https://aquatrack.oeosolution.com/login
Pilot: https://oeosolution.com/#pilot-form
OEO Solution · oeosolution.com
```

## 2. Paste social profile URLs

Edit `js/social-config.js`:

```js
youtube: 'https://www.youtube.com/@YourHandle',
facebook: 'https://www.facebook.com/...',
x: 'https://x.com/...',
instagram: 'https://www.instagram.com/...',
```

Empty strings keep buttons visible but disabled until you fill them.

## 3. Instagram / TikTok bio

Set profile link to:

**https://oeosolution.com/links/**

## 4. Deploy

Push to `oputeo/oeosolution-home` (Render / GitHub Pages follows the repo).
