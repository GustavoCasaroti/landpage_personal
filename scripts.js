// ===================== CONFIG =====================
const USERNAME = 'GustavoCasaroti';
const GITHUB_API = 'https://api.github.com';
const HEADERS = { 'Accept': 'application/vnd.github+json' };

// ===================== LANG COLORS =====================
const LANG_COLORS = {
  JavaScript:       '#F0DB4F',
  TypeScript:       '#007ACC',
  'Tailwind':       '#38B2AC',
  PHP:              '#777BB4',
  Python:           '#3776AB',
  HTML:             '#E34F26',
  CSS:              '#563D7C',
  'C#':             '#178600',
  Java:             '#B07219',
  Ruby:             '#CC342D',
  Go:               '#00ADD8',
  Rust:             '#DEA584',
  'Node.js':        '#339933',
  'Next.js':        '#000000',
  'AngularJS':      '#DD0031',
  'React Native':   '#61DAFB',
  Laravel:          '#FF2D20',
  WordPress:        '#21759B',
  MySQL:            '#4479A1',
  Git:              '#F05032',
  Docker:           '#2496ED',
  Vercel:           '#000000',
  'VS Code':        '#007ACC',
  Windows:          '#0078D6'
};
function getLangColor(name) {
  return LANG_COLORS[name] || '#8888aa';
}

// ===================== FAVICON =====================

function initFaviconBlink() {
  const favicon = document.getElementById('favicon');

  function createIcon(text) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="transparent"/>
        <text x="50%" y="60%" font-size="60" fill="#00ff88" text-anchor="middle" dominant-baseline="middle" font-family="monospace">
          ${text}
        </text>
      </svg>
    `;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  const icons = [
    createIcon(">_"),
    createIcon("")
  ];

  let i = 0;

  setInterval(() => {
    favicon.href = icons[i % 2];
    i++;
  }, 500);
}

// ===================== HELPERS =====================
async function apiFetch(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Erro ${res.status}: ${url}`);
  return res.json();
}

// ===================== LANGUAGE STATS =====================
async function fetchLanguageStats(repos) {
  const langTotals = {};
  const topRepos = repos
    .filter(r => !r.fork)
    .slice(0, 15);

  const results = await Promise.all(
    topRepos.map(repo =>
      apiFetch(repo.languages_url).catch(() => ({}))
    )
  );

  results.forEach(langData => {
    Object.entries(langData).forEach(([lang, bytes]) => {
      langTotals[lang] = (langTotals[lang] || 0) + bytes;
    });
  });

  const total = Object.values(langTotals).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Object.entries(langTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, bytes]) => ({
      name,
      pct: ((bytes / total) * 100).toFixed(1)
    }));
}

// ===================== DOM UPDATES =====================
function updateStats(user, repos) {
  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const totalForks = repos.reduce((acc, r) => acc + r.forks_count, 0);

  setCounter('.stat-stars',     totalStars);
  setCounter('.stat-repos',     user.public_repos);
  setCounter('.stat-followers', user.followers);
  setCounter('.stat-following', user.following);
  setCounter('.stat-forks',     totalForks);
}

function setCounter(selector, value) {
  const el = document.querySelector(selector);
  if (el) { el.setAttribute('data-target', value); el.textContent = '0'; }
}

function updateAvatar(user) {
  const el = document.getElementById('avatar');
  if (el) el.src = user.avatar_url;
}

function updateLanguages(langs) {
  const bar = document.querySelector('.lang-combined-bar');
  if (!langs.length) {
    bar.innerHTML = '<div class="lang-loading">Sem dados</div>';
    return;
  }
  bar.innerHTML = langs.map(l =>
    `<div class="lang-seg" style="width:${l.pct}%; background:${getLangColor(l.name)};"></div>`
  ).join('');

  const list = document.querySelector('.lang-list');
  list.innerHTML = langs.map(l => `
    <div class="lang-row">
      <span class="lang-dot" style="background:${getLangColor(l.name)}"></span>
      <span class="lang-name">${l.name}</span>
      <span class="lang-pct">${l.pct}%</span>
    </div>
  `).join('');
}

function updateRepos(repos) {
  const container = document.getElementById('reposList');
  const top = repos
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 6);

  container.innerHTML = top.map(r => `
    <a class="repo-item" href="${r.html_url}" target="_blank">
      <div class="repo-name">📁 ${r.name}</div>
      <div class="repo-desc">${r.description || 'Sem descrição'}</div>
      <div class="repo-meta">
        ${r.language ? `<span><span class="repo-lang-dot" style="background:${getLangColor(r.language)}"></span>${r.language}</span>` : ''}
        <span>⭐ ${r.stargazers_count}</span>
        <span>🍴 ${r.forks_count}</span>
      </div>
    </a>
  `).join('');
}

// ===================== COUNTER ANIMATION =====================
function animateCounters() {
  document.querySelectorAll('.stat-value[data-target]').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target) || target === 0) { el.textContent = '0'; return; }

    const duration = 1200;
    const start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// ===================== CARD TILT =====================
function initCardTilt() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const rotateX = (((e.clientY - rect.top)  / rect.height) - 0.5) * -6;
      const rotateY = (((e.clientX - rect.left) / rect.width)  - 0.5) *  6;
      card.style.transform = `translateY(-2px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      card.style.transition = 'transform 0.1s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'border-color 0.3s, transform 0.4s ease';
    });
  });
}

// ===================== TOOL TAGS =====================
function initToolTags() {
  document.querySelectorAll('.tool-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.style.transform = 'scale(0.95)';
      setTimeout(() => { tag.style.transform = ''; }, 150);
    });
  });
}

// ===================== MAIN =====================
async function init() {
  try {
    const [user, repos] = await Promise.all([
      apiFetch(`${GITHUB_API}/users/${USERNAME}`),
      apiFetch(`${GITHUB_API}/users/${USERNAME}/repos?per_page=100&sort=pushed`)
    ]);

    const langs = await fetchLanguageStats(repos);

    updateAvatar(user);
    updateStats(user, repos);
    updateLanguages(langs);
    updateRepos(repos);

    // Show page
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    animateCounters();
    initCardTilt();
    initToolTags();
    initFaviconBlink();

  } catch (err) {
    document.querySelector('.loading-text').textContent = 'Erro ao carregar dados do GitHub.';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', init);
