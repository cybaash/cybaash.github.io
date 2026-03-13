// ── GitHub Storage Layer ────────────────────────────────────────────────────
// Replaces Supabase. All portfolio data lives in portfolio/data.json in the
// GitHub repo. The admin panel reads/writes it via the GitHub Contents API
// using a Personal Access Token stored in localStorage (never leaves browser).

const CONFIG_KEY = 'portfolio_github_config'

export function getGithubConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveGithubConfig(owner, repo, token) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ owner, repo, token }))
}

export function clearGithubConfig() {
  localStorage.removeItem(CONFIG_KEY)
}

// ── GitHub API helpers ──────────────────────────────────────────────────────

const DATA_PATH = 'portfolio/data.json'

function apiUrl(cfg) {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${DATA_PATH}`
}

function headers(cfg) {
  return {
    'Authorization': `Bearer ${cfg.token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

// Fetch the current file — returns { content, sha } or null
async function fetchFile(cfg) {
  const r = await fetch(apiUrl(cfg), { headers: headers(cfg) })
  if (r.status === 404) return { content: {}, sha: null }
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(`GitHub read failed: ${err.message || r.status}`)
  }
  const meta = await r.json()
  const decoded = JSON.parse(atob(meta.content.replace(/\n/g, '')))
  return { content: decoded, sha: meta.sha }
}

// Write the file back — creates or updates
async function writeFile(cfg, data, sha) {
  const body = {
    message: `chore: update portfolio data [skip ci]`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
    ...(sha ? { sha } : {}),
  }
  const r = await fetch(apiUrl(cfg), {
    method: 'PUT',
    headers: headers(cfg),
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(`GitHub write failed: ${err.message || r.status}`)
  }
  const res = await r.json()
  return res.content.sha // return new sha
}

// ── Cached sha so consecutive saves don't re-fetch ─────────────────────────
let _sha = null

// ── Public API (mirrors supabase.js interface) ──────────────────────────────

export async function loadAll(defaults) {
  const cfg = getGithubConfig()
  if (!cfg?.token) return defaults
  try {
    const { content, sha } = await fetchFile(cfg)
    _sha = sha
    return { ...defaults, ...content }
  } catch (e) {
    console.error('[GitHub] loadAll failed:', e.message)
    return defaults
  }
}

export async function loadSection(section, fallback) {
  const cfg = getGithubConfig()
  if (!cfg?.token) return fallback
  try {
    const { content, sha } = await fetchFile(cfg)
    _sha = sha
    return content[section] ?? fallback
  } catch { return fallback }
}

export async function saveSection(section, value) {
  const cfg = getGithubConfig()
  if (!cfg?.token) throw new Error('GitHub not configured')
  try {
    // Always re-fetch to get latest sha + merge with other sections
    const { content, sha } = await fetchFile(cfg)
    const updated = { ...content, [section]: value }
    _sha = await writeFile(cfg, updated, sha)
  } catch (e) {
    console.error('[GitHub] saveSection error:', e.message)
    throw new Error(`Save failed for "${section}": ${e.message}`)
  }
}

export async function testConnection(owner, repo, token) {
  if (!owner || !repo || !token) {
    return { ok: false, msg: 'Owner, repository name, and token are all required.' }
  }
  try {
    // Verify token by checking repo access
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    })
    if (r.status === 401) return { ok: false, msg: 'Token invalid or expired.' }
    if (r.status === 403) return { ok: false, msg: 'Token lacks repo access — enable "Contents" read+write permission.' }
    if (r.status === 404) return { ok: false, msg: `Repository "${owner}/${repo}" not found. Check the owner and repo name.` }
    if (!r.ok) return { ok: false, msg: `GitHub returned ${r.status}.` }

    // Check write permission by reading the repo metadata
    const meta = await r.json()
    if (!meta.permissions?.push) {
      return { ok: false, msg: 'Token has read access but no write permission to this repo.' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, msg: e.message }
  }
}

// No-op stubs to keep App.jsx import surface identical
export function resetClient() {}
export function subscribeToChanges() { return () => {} }
