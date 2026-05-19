const THEME_KEY = 'foundryone-theme';
const COOKIE_CONSENT_KEY = 'cookie-consent-choice';

const ROUTES = {
  home: 'index.html',
  google: 'google-ads.html',
  meta: 'meta-ads.html',
  creatives: 'ad-creatives.html',
  preise: 'preise.html',
  'ueber-uns': 'ueber-uns.html',
  kontakt: 'kontakt.html',
  kampagnen: 'werbekampagnen.html',
  stimmen: 'kundenstimmen.html',
  portfolio: 'websites-portfolio.html',
  bewertungen: 'kundenbewertungen.html'
};

function replaceWithHtml(target, html) {
  if (!target) return;
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  target.replaceWith(tpl.content);
}

async function injectSharedLayout() {
  try {
    const nav = document.querySelector('nav');
    const mob = document.getElementById('mob');
    if (nav) {
      const res = await fetch('./header.html', { cache: 'no-store' });
      if (res.ok) {
        const headerHtml = await res.text();
        replaceWithHtml(nav, headerHtml);
        if (mob) mob.remove();
      }
    }

    const footer = document.querySelector('footer');
    if (footer) {
      const res = await fetch('./footer.html', { cache: 'no-store' });
      if (res.ok) {
        const footerHtml = await res.text();
        replaceWithHtml(footer, footerHtml);
      }
    }
  } catch (err) {
    // Keep page usable even if include loading fails.
    console.warn('Shared layout injection failed:', err);
  }
}

function getCurrentPageKey() {
  const file = window.location.pathname.split('/').pop() || 'index.html';
  const hit = Object.entries(ROUTES).find(([, v]) => v === file);
  return hit ? hit[0] : 'home';
}

function acceptCookies() {
  localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
  const banner = document.getElementById('cookie-banner');
  if (banner) banner.classList.add('is-hidden');
}

function rejectCookies() {
  localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
  const banner = document.getElementById('cookie-banner');
  if (banner) banner.classList.add('is-hidden');
}

function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!consent) banner.classList.remove('is-hidden');
  else banner.classList.add('is-hidden');
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

function go(page) {
  const next = ROUTES[page];
  if (!next) return;
  window.location.href = next;
}

function updateNavLinks() {
  const current = getCurrentPageKey();
  document.querySelectorAll('[data-p]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-p') === current);
  });
}

function toggleMob() {
  const mob = document.getElementById('mob');
  if (mob) mob.classList.toggle('open');
}

function closeMob() {
  const mob = document.getElementById('mob');
  if (mob) mob.classList.remove('open');
}

function initReveal() {
  const items = document.querySelectorAll('.rv:not(.go)');
  if (!items.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('go');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.07 });
  items.forEach(el => io.observe(el));
}

function countUp(el) {
  const target = parseFloat(el.dataset.target);
  const dec = parseInt(el.dataset.dec || '0', 10);
  const suf = el.dataset.suf || '';
  const dur = 1400;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    el.textContent = val.toFixed(dec) + suf;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initCounters() {
  const counters = document.querySelectorAll('.count');
  if (!counters.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.done) {
        e.target.dataset.done = '1';
        countUp(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(el => io.observe(el));
}

let svc = 'google', bud = 2000, dur = 3;

function setSvc(s) {
  svc = s;
  ['google', 'meta', 'beide'].forEach(id => {
    const el = document.getElementById('sg-' + id);
    if (el) el.classList.toggle('on', id === s);
  });
  updCalc();
}

function setDur(d) {
  dur = d;
  [1, 3, 6, 12].forEach(n => {
    const el = document.getElementById('sd-' + n);
    if (el) el.classList.toggle('on', n === d);
  });
  updCalc();
}

function nf(n) {
  return new Intl.NumberFormat('de-DE').format(Math.round(n)) + ' €';
}

function animVal(el, newVal) {
  if (!el) return;
  el.style.transition = 'opacity .18s ease, transform .18s ease';
  el.style.opacity = '0';
  el.style.transform = 'translateY(-6px)';
  setTimeout(() => {
    el.textContent = newVal;
    el.style.transform = 'translateY(6px)';
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, 180);
}

function updCalc() {
  const sl = document.getElementById('bslider');
  if (!sl) return;
  bud = parseInt(sl.value, 10);
  const pct = ((bud - 500) / (50000 - 500)) * 100;
  sl.style.setProperty('--p', pct + '%');
  const bval = document.getElementById('bval');
  if (bval) bval.textContent = nf(bud);

  const accountCount = svc === 'beide' ? 2 : 1;
  const fee = 299;
  const setup = 499 * accountCount;
  const mo = fee;
  const tot = mo * dur + setup;

  animVal(document.getElementById('rv-bud'), nf(bud));
  animVal(document.getElementById('rv-fee'), nf(fee));
  animVal(document.getElementById('rv-setup'), nf(setup));
  animVal(document.getElementById('rv-mo'), nf(mo));
  animVal(document.getElementById('rv-tot'), dur === 1 ? nf(setup + mo) : nf(tot));
  animVal(document.getElementById('rv-disc'), 'Ad Spend nicht enthalten');

  const rvDisc = document.getElementById('rv-disc');
  if (rvDisc) rvDisc.style.color = 'var(--blue)';

  const rvTotLbl = document.getElementById('rv-tot-lbl');
  if (rvTotLbl) {
    rvTotLbl.textContent = dur === 1
      ? 'Gesamte Agenturkosten (1. Monat inkl. Setup)'
      : `Gesamte Agenturkosten (${dur} Monate inkl. Setup)`;
  }

  const hints = {
    1: 'Fixe Agenturgebühr: 299 € / Monat.',
    3: 'Setup: 499 € pro Account (einmalig).',
    6: 'Ad Spend ist nicht enthalten und wird direkt an Google/Meta gezahlt.',
    12: 'Volle Kostentransparenz für Neukunden ohne Prozentmodell.'
  };
  const discMsg = document.getElementById('disc-msg');
  if (discMsg) discMsg.textContent = hints[dur] || '';
}

function openModal() {
  closeMob();
  showOptions();
  const ov = document.getElementById('modal-overlay');
  const bx = document.getElementById('modal-box');
  if (!ov || !bx) {
    window.location.href = ROUTES.kontakt;
    return;
  }
  ov.style.transition = 'none';
  bx.style.transition = 'none';
  ov.style.opacity = '0';
  ov.style.pointerEvents = 'all';
  bx.style.transform = 'translateY(24px) scale(.96)';
  document.body.classList.add('modal-open');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      ov.style.transition = 'opacity .3s cubic-bezier(.16,1,.3,1)';
      bx.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1)';
      ov.style.opacity = '1';
      bx.style.transform = 'translateY(0) scale(1)';
    })
  );
}

function closeModal(e) {
  const ov = document.getElementById('modal-overlay');
  const bx = document.getElementById('modal-box');
  if (!ov || !bx) return;
  if (e && e.target !== ov) return;
  ov.style.transition = 'opacity .25s ease';
  bx.style.transition = 'transform .25s ease';
  ov.style.opacity = '0';
  bx.style.transform = 'translateY(16px) scale(.97)';
  setTimeout(() => {
    ov.style.pointerEvents = 'none';
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }, 260);
}

function showOptions() {
  const options = document.getElementById('modal-options');
  const form = document.getElementById('modal-form');
  const success = document.getElementById('modal-success');
  if (options) options.style.display = 'flex';
  if (form) form.style.display = 'none';
  if (success) success.style.display = 'none';
}

function showForm() {
  const options = document.getElementById('modal-options');
  const form = document.getElementById('modal-form');
  if (options) options.style.display = 'none';
  if (form) form.style.display = 'block';
}

function submitForm(e) {
  e.preventDefault();
  const form = document.getElementById('modal-form');
  const success = document.getElementById('modal-success');
  if (form) form.style.display = 'none';
  if (success) success.style.display = 'block';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function submitKontakt(e) {
  e.preventDefault();
  const form = document.getElementById('kontakt-form-el');
  const success = document.getElementById('kontakt-success');
  if (form) form.style.display = 'none';
  if (success) success.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', async () => {
  await injectSharedLayout();
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);
  initCookieBanner();
  updateNavLinks();
  initReveal();
  initCounters();
  const sl = document.getElementById('bslider');
  if (sl) {
    sl.addEventListener('input', updCalc);
    updCalc();
  }
});
