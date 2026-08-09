# Faxriddinbek — Portfolio Frontend

React + Vite frontend for the portfolio site. Content (projects, gallery,
contact messages) comes from the FastAPI backend in `../backent_me`.

---

## Quick start

```powershell
# 1. Backend (separate terminal, from ../backent_me)
docker compose up -d

# 2. Frontend
npm install
npm run dev          # http://localhost:5173
```

> **Port note:** the backend's host port is **8001**, not 8000 — the Yarrow
> gateway already occupies 8000 on this machine. Override with `API_PORT` in
> `backent_me/.env` if you need something else, and update
> `VITE_DEV_API_TARGET` here to match.

Seed some content so the page is not empty:

```powershell
cd ..\backent_me
python scripts\seed.py            # edit scripts\seed_data.json first
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on :5173 |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Serve `dist/` locally to check the real build |
| `npm run lint` | oxlint |
| `npm run optimize:images` | Convert `public/**` images to WebP (one-off) |

---

## How the frontend reaches the backend

Requests are **always same-origin**. The page fetches `/api/v1/...`; something
in front forwards it:

| Environment | Who forwards | Configured in |
| --- | --- | --- |
| Development | Vite dev-server proxy | `vite.config.js` → `VITE_DEV_API_TARGET` |
| Production | Vercel rewrite | `vercel.json` |

That means no CORS, no preflight, and no "works locally, breaks in production"
difference in request behaviour. `VITE_API_URL` stays empty in both; it exists
only as an escape hatch if you ever need to point the browser straight at
another host.

**Never put a secret in a `VITE_*` variable** — everything with that prefix is
inlined into the JavaScript bundle in plain text. `ADMIN_TOKEN` is server-side
only.

---

## Admin panel

Private screen at **`/admin`**. Sign in with the backend's `ADMIN_TOKEN`; it is
held in `sessionStorage`, so it dies with the tab.

What it manages:

- **Media** — add, edit, reorder, hide and delete gallery items and the
  home-page carousel photos (`placement: hero | gallery`)
- **Xabarlar** — read contact-form submissions and mark them read

### Uploads

Files go **straight from the browser to Cloudinary**; they never pass through
the backend, whose filesystem is ephemeral on Railway. Set two variables to
enable it:

```
VITE_CLOUDINARY_CLOUD_NAME=…
VITE_CLOUDINARY_UPLOAD_PRESET=…    # an *unsigned* preset
```

Both are public by design — an unsigned preset names the target, it does not
authorise anything. Restrict the preset itself in the Cloudinary dashboard
(folder, allowed formats, max size); that is what limits abuse.

Leave them empty and the panel still works — only the file picker is disabled,
and URLs can be pasted by hand.

### Videos

Cloudinary's free plan caps a single file at **100 MB** and the whole account at
**25 GB of delivery per month**, so a long video does not belong there — one
viewer streaming a 4 GB file would burn a sixth of the monthly quota. Paste a
**YouTube** link instead: the gallery detects it, shows the thumbnail, and
mounts the player only after a click.

## Layout

```
src/
├── api/
│   ├── client.js          Every backend call — the only place URLs are built
│   └── cloudinary.js      Browser → Cloudinary uploads with progress
├── lib/video.js           YouTube URL detection and embedding
├── pages/
│   ├── SitePage.jsx       The public one-pager
│   └── AdminPage.jsx      /admin — auth plus the two tabs
├── components/
│   ├── MatrixRain.jsx     Full-screen canvas background
│   ├── Nav.jsx            Fixed header, scroll-spy underline, mobile menu
│   ├── Hero.jsx           Photo carousel + intro copy
│   ├── Projects.jsx       Grid ← GET /api/v1/projects
│   ├── Contact.jsx        Form → POST /api/v1/contact
│   ├── Media.jsx          Gallery ← GET /api/v1/media
│   ├── AiButton.jsx       Floating action button
│   ├── SectionHeader.jsx  Shared section heading + empty state
│   └── admin/             MediaManager, MediaForm, ContactsList, ui, tokens
├── hooks/
│   ├── useApiResource.js  loading / success / error state machine
│   ├── useBreakpoint.js   isMobile / isTablet
│   ├── useReveal.js       Fade sections in on scroll
│   ├── useScrollSpy.js    Which section is active
│   └── useScrolled.js     Has the page scrolled past the top
├── i18n/translations.js   UI copy (uz / en)
├── config.js              Contact details, hero photos
├── styles/                Design-system tokens from the original export
├── index.css              Globals, keyframes, :hover / :focus states
├── App.jsx                Routes / vs /admin
└── main.jsx               Entry point
```

**Where to change things**

| I want to change… | Edit |
| --- | --- |
| Email / Telegram / GitHub links | `src/config.js` |
| Hero carousel photos | Admin panel → placement "Home karusel". `src/config.js` is only the fallback for when none exist |
| Gallery photos and videos | Admin panel → placement "Galereya" |
| Any UI text | `src/i18n/translations.js` |
| Projects | `../backent_me/scripts/seed_data.json`, then re-run the seed |
| Colours, fonts, spacing | `src/styles/tokens/*.css` |

Layout styling is inline in each component, matching the original design
export. Only `:hover` / `:focus-visible` states live in `index.css`, because
inline styles cannot express them.

---

## Deploying

1. Push to GitHub.
2. Vercel → Import repo → framework **Vite** (detected automatically).
3. In `vercel.json`, replace `REPLACE-WITH-BACKEND-HOST` with the real backend
   host (e.g. `portfolio-api.up.railway.app`) — **both** rewrite rules.
4. Deploy. `VITE_API_URL` needs no value in Vercel's dashboard.

Before going live: swap the sample content in `seed_data.json` for real
projects and re-run the seed against the production API.
