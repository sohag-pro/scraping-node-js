# scraping-node-js

**Repository:** https://github.com/sohag-pro/scraping-node-js

A collection of Node.js web scrapers built with [Puppeteer](https://pptr.dev/) (headless Chrome) and [Cheerio](https://cheerio.js.org/). The project contains two independent scraping jobs:

1. **Psychology Today** — scrapes therapist listings (name, phone, website) for a US state.
2. **Angi (formerly Angie's List)** — a multi-stage pipeline that scrapes service-provider companies (name, category, description, phone, address) across markets, then exports the results to CSV and SQL.

> ⚠️ **Disclaimer**: Web scraping may violate a site's Terms of Service. This project is for educational purposes. Scrape responsibly, respect `robots.txt`, throttle your requests, and make sure you have the right to collect and use any data.

---

## Table of contents

- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [Project layout](#project-layout)
- [Job 1 — Psychology Today scraper](#job-1--psychology-today-scraper)
- [Job 2 — Angi pipeline](#job-2--angi-pipeline)
- [Output formats](#output-formats)
- [Configuration knobs](#configuration-knobs)
- [Troubleshooting](#troubleshooting)
- [Notes for beginners](#notes-for-beginners)

---

## How it works

Each script is a standalone Node.js program that:

1. Launches a headless Chrome browser via Puppeteer.
2. Navigates to one or more pages.
3. Runs DOM queries (`document.querySelectorAll(...)`) inside the page to extract data.
4. Writes the result to a JSON file on disk.

Later stages read the JSON produced by earlier stages and transform it (more scraping, or conversion to CSV / SQL).

There is **no build step and no central entry point** — you run each script directly with `node <file>.js`.

---

## Requirements

- **Node.js** 14+ (16+ recommended). Check with `node -v`.
- **npm** (ships with Node).
- Enough disk space and a stable internet connection — large runs produce many JSON files.
- Puppeteer downloads a bundled Chromium (~170 MB) on install. On Linux you may need extra system libraries (see [Troubleshooting](#troubleshooting)).

---

## Installation

```bash
# 1. Clone and enter the project
git clone https://github.com/sohag-pro/scraping-node-js.git
cd scraping-node-js

# 2. Install dependencies (also downloads Chromium for Puppeteer)
npm install

# 3. (Optional) create an .env file — used by dotenv. Empty is fine.
touch .env

# 4. Create the output folders the scripts expect (they are gitignored)
mkdir -p data all company mysql
```

> The folders `data/`, `all/`, `company/`, `mysql/`, `.env`, and `node_modules/` are listed in `.gitignore` and are **not** committed. You must create the output folders yourself before running (step 4) or the file writes will fail.

---

## Project layout

| File | Role | Reads | Writes |
|------|------|-------|--------|
| `index.js` | **Psychology Today** scraper (standalone) | — | `data/data.json` |
| `angi.js` | Angi stage 1 — scrape category + market URLs | — | `data/data1.json`, `data/market.json` |
| `company.js` | Angi stage 2 — scrape company URLs per market | `data/market.json` | `data/company-<from>-<limit>.json` |
| `details.js` | Angi stage 3 — scrape each company's details | `data/company-*.json` | `all/all_details-*.json` |
| `merge.js` | Angi stage 4a — merge detail chunks → CSV | `all/all_*.json` | `company/all_details.csv` |
| `make_sql.js` | Angi stage 4b — build SQL `INSERT` statements | `company/ga-nv_details.json` | `mysql/ga-nv_details.sql` |
| `package.json` | Dependencies and metadata | — | — |
| `.vscode/settings.json` | Editor color theme (cosmetic only) | — | — |

---

## Job 1 — Psychology Today scraper

Scrapes therapist profiles from a state listing page, following "next page" links up to a page limit, then visits each profile to grab name, phone, and resolved website URL.

**Run:**

```bash
node index.js
```

**Output:** `data/data.json` — array of `{ serial, name, phone, website }`.

**Key settings** (top of `index.js`):

- `home_page` — the state listing URL (default: Illinois).
- `limit` — max number of listing pages to crawl (default `5`).

**See debug logs** (uses the [`debug`](https://www.npmjs.com/package/debug) package):

```bash
DEBUG=app node index.js
```

---

## Job 2 — Angi pipeline

Run these **in order**. Each stage consumes the previous stage's output.

### Stage 1 — `angi.js` (category + market URLs)

```bash
node angi.js
```

Scrapes the top-level company list, then each category's city/market links.
**Writes:** `data/data1.json` (categories) and `data/market.json` (markets per category).

### Stage 2 — `company.js` (company URLs)

```bash
node company.js
```

Reads `data/market.json`, visits each market, and collects company profile URLs.
**Writes:** `data/company-<from>-<limit>.json` in batches.

Control the range with the `from` / `limit` variables at the top of the file (they index into the flat list of market links). It writes a new file every `limit` links and advances the window by 50.

### Stage 3 — `details.js` (company details)

```bash
node details.js
```

Reads every `data/company-*.json`, de-duplicates and sorts the company URLs, then visits each company page to extract `name`, `category`, `description`, `phone`, `address`.
**Writes:** `all/all_details-<count>.json` — flushed every 10 companies so progress is never lost.

> Note: this stage skips the regions `nv` and `ga` (see the `region` filter), and only starts scraping once the running counter passes `from`. Adjust `from` / `limit` to resume a partial run.

### Stage 4a — `merge.js` (→ CSV)

```bash
node merge.js
```

Merges all `all/all_*.json` chunks into one dataset, flattens the `category` array into `category0..category177` columns, and writes a CSV.
**Writes:** `company/all_details.csv`.

### Stage 4b — `make_sql.js` (→ SQL)

```bash
node make_sql.js
```

Reads `company/ga-nv_details.json` and emits MySQL `INSERT INTO e_providers(...)` statements.
**Writes:** `mysql/ga-nv_details.sql`.

> This stage is application-specific (the `e_providers` table schema). Edit the `INSERT` template in `make_sql.js` to match your own database.

### Pipeline at a glance

```
angi.js ──► data/market.json
                │
                ▼
company.js ──► data/company-*.json
                │
                ▼
details.js ──► all/all_details-*.json
                │
        ┌───────┴────────┐
        ▼                ▼
   merge.js         make_sql.js
  (CSV output)     (SQL output)
```

---

## Output formats

**Psychology Today** (`data/data.json`):

```json
[
  { "serial": 1, "name": "Jane Doe", "phone": "(555) 123-4567", "website": "https://example.com" }
]
```

**Angi company detail** (`all/all_details-*.json`):

```json
[
  {
    "name": "ACME Plumbing",
    "category": ["Plumbing", "Drain Cleaning"],
    "description": "Full service plumbing...",
    "phone": "(555) 000-1111",
    "address": "123 Main St City ST 00000"
  }
]
```

---

## Configuration knobs

These are plain variables near the top of each file (no CLI flags):

| Variable | Files | Meaning |
|----------|-------|---------|
| `limit` | `index.js` | Max listing pages to crawl |
| `home_page` | `index.js`, `angi.js` | Start URL |
| `from` / `limit` | `company.js`, `details.js` | Resume window into the URL list |

Puppeteer launch options live in the `puppeteer.launch({...})` call (e.g. `details.js` runs with `--no-sandbox --headless --disable-gpu`).

---

## Troubleshooting

**`ENOENT: no such file or directory, open 'data/...'`**
You skipped folder creation. Run `mkdir -p data all company mysql`.

**`Cannot find module '...'`**
Run `npm install`.

**Puppeteer fails to launch on Linux** (missing shared libraries)
Install Chrome's dependencies, then re-run. On Debian/Ubuntu:

```bash
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libgbm1 libasound2 libxshmfp1 || true
```

If running as root or in Docker, launch with `--no-sandbox` (already set in `details.js`; add it to the other `puppeteer.launch()` calls if needed).

**Selectors return `null` / empty arrays**
The target sites change their HTML over time. Open the page in a real browser, inspect the elements, and update the CSS selectors (e.g. `.result-name`, `.geocat-cities-list__item a`).

**Scrape is slow or gets blocked**
Add delays between requests, run non-headless to debug (`puppeteer.launch({ headless: false })`), and avoid hammering the site.

---

## Notes for beginners

- **Run one script at a time** with `node <file>.js`. There is no `npm start`.
- **Puppeteer** drives a real (headless) Chrome browser; code inside `page.evaluate(() => {...})` runs *in the browser page*, not in Node — that's why it uses `document.querySelector`.
- **Cheerio / axios / json2csv** are listed as dependencies; the active scrapers use Puppeteer, while `merge.js` uses `json-2-csv` for CSV export.
- Output folders are **gitignored** on purpose — scraped data should not be committed.
- The Angi `from` / `limit` variables exist so a long scrape can be **stopped and resumed** without redoing work.
- Start by reading and running `index.js` — it is the smallest, self-contained example.

---

## License

ISC (see `package.json`).
