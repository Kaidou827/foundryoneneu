// ─── NAVIGATION ───────────────────────────────
let cur = 'home';

function go(page) {
  if (page === cur) {
    closeMob();
    return;
  }

  const skel = document.getElementById('skel');

  // Reset old page — remove .in so it's ready for next visit
  const oldWrap = document.querySelector('#page-' + cur + ' .page-wrap');
  if (oldWrap) oldWrap.classList.remove('in');
  document.getElementById('page-' + cur).classList.remove('active');

  // Show skeleton only when navigating to Preise
  if (page === 'preise') skel.classList.add('show');
  cur = page;

  setTimeout(() => {
    // Activate new page
    const pg = document.getElementById('page-' + page);
    pg.classList.add('active');
    updateNavLinks();
    window.scrollTo(0, 0);

    // Ensure wrap starts hidden (class removed, no inline styles)
    const newWrap = pg.querySelector('.page-wrap');
    if (newWrap) newWrap.classList.remove('in');

    setTimeout(() => {
      skel.classList.remove('show');
      // Trigger transition on next frame so browser registers the removed class first
      if (newWrap) {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => newWrap.classList.add('in'))
        );
      }
      initReveal();
      if (page === 'preise') updCalc();
    }, 320);
  }, 160);
}

function updateNavLinks() {
  document.querySelectorAll('[data-p]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-p') === cur);
  });
}

function toggleMob() {
  document.getElementById('mob').classList.toggle('open');
}
function closeMob() {
  document.getElementById('mob').classList.remove('open');
}

// ─── SCROLL REVEAL ────────────────────────────
function initReveal() {
  const items = document.querySelectorAll('#page-' + cur + ' .rv:not(.go)');
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

// ─── COUNT-UP ─────────────────────────────────
function countUp(el) {
  const target = parseFloat(el.dataset.target);
  const dec = parseInt(el.dataset.dec || '0');
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
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.done) {
        e.target.dataset.done = '1';
        countUp(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.count').forEach(el => io.observe(el));
}

// ─── PRICE CALC ───────────────────────────────
let svc = 'google', bud = 2000, dur = 3;

function setSvc(s) {
  svc = s;
  ['google', 'meta', 'beide'].forEach(id =>
    document.getElementById('sg-' + id).classList.toggle('on', id === s)
  );
  updCalc();
}
function setDur(d) {
  dur = d;
  [1, 3, 6, 12].forEach(n =>
    document.getElementById('sd-' + n).classList.toggle('on', n === d)
  );
  updCalc();
}
function nf(n) {
  return new Intl.NumberFormat('de-DE').format(Math.round(n)) + ' €';
}

// Animate a value change in an element
function animVal(el, newVal) {
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
  bud = parseInt(sl.value);
  const pct = ((bud - 500) / (50000 - 500)) * 100;
  sl.style.setProperty('--p', pct + '%');
  document.getElementById('bval').textContent = nf(bud);

  // Fee multiplier by duration — longer = cheaper per month
  const multipliers = { 1: 1.20, 3: 1.00, 6: 0.95, 12: 0.90 };
  let baseFee = Math.max(bud * 0.15, 800);
  if (svc === 'beide') baseFee = Math.max(bud * 0.20, 1200);
  const fee = baseFee * multipliers[dur];

  // Setup fee: 500€ per platform (einmalig)
  const setup = svc === 'beide' ? 1000 : 500;

  const mo = bud + fee;
  const tot = mo * dur + setup;

  // Animate values
  animVal(document.getElementById('rv-bud'), nf(bud));
  animVal(document.getElementById('rv-fee'), nf(fee));
  animVal(document.getElementById('rv-setup'), nf(setup));
  animVal(document.getElementById('rv-mo'), nf(mo));
  animVal(document.getElementById('rv-tot'), dur === 1 ? nf(mo + setup) : nf(tot));

  // Savings vs Flexibel row
  const dr = document.getElementById('rd-row');
  const baseFeeRef = svc === 'beide' ? Math.max(bud * 0.20, 1200) : Math.max(bud * 0.15, 800);
  if (dur > 1) {
    dr.style.display = '';
    const saved = Math.round((multipliers[1] - multipliers[dur]) * baseFeeRef);
    animVal(document.getElementById('rv-disc'), '−' + nf(saved) + ' vs. Flexibel');
    document.getElementById('rv-disc').style.color = '#34C759';
  } else {
    dr.style.display = 'none';
  }

  // Total label
  document.getElementById('rv-tot-lbl').textContent = dur === 1
    ? 'Gesamtkosten (1. Monat inkl. Setup)'
    : `Gesamtinvestition (${dur} Monate inkl. Setup)`;

  // Hint texts
  const hints = {
    1: '⚠ Flexibel = +20 % auf Agentur-Fee. Monatlich kündbar, aber teurer.',
    3: 'Standardpreis — 3 Monate Mindestlaufzeit.',
    6: '✓ 5 % günstiger als Flexibel. 6 Monate Laufzeit.',
    12: '✓ 10 % günstiger als Flexibel. Bestes Preis-Leistungs-Verhältnis.'
  };
  document.getElementById('disc-msg').textContent = hints[dur] || '';
}

// ─── MODAL ────────────────────────────────────
function openModal() {
  showOptions();
  const ov = document.getElementById('modal-overlay');
  const bx = document.getElementById('modal-box');
  // Make visible first (no transition yet)
  ov.style.transition = 'none';
  bx.style.transition = 'none';
  ov.style.opacity = '0';
  ov.style.pointerEvents = 'all';
  bx.style.transform = 'translateY(24px) scale(.96)';
  document.body.style.overflow = 'hidden';
  // Double RAF so browser paints the initial state before animating
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
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  const ov = document.getElementById('modal-overlay');
  const bx = document.getElementById('modal-box');
  ov.style.transition = 'opacity .25s ease';
  bx.style.transition = 'transform .25s ease';
  ov.style.opacity = '0';
  bx.style.transform = 'translateY(16px) scale(.97)';
  setTimeout(() => {
    ov.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  }, 260);
}

function showOptions() {
  document.getElementById('modal-options').style.display = 'flex';
  document.getElementById('modal-form').style.display = 'none';
  document.getElementById('modal-success').style.display = 'none';
}

function showForm() {
  document.getElementById('modal-options').style.display = 'none';
  document.getElementById('modal-form').style.display = 'block';
}

function submitForm(e) {
  e.preventDefault();
  document.getElementById('modal-form').style.display = 'none';
  document.getElementById('modal-success').style.display = 'block';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function submitKontakt(e) {
  e.preventDefault();
  document.getElementById('kontakt-form-el').style.display = 'none';
  document.getElementById('kontakt-success').style.display = 'block';
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNavLinks();
  initReveal();
  initCounters();
  const sl = document.getElementById('bslider');
  sl.addEventListener('input', updCalc);
  updCalc();
});
