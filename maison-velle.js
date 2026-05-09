/* ============================================================
   maison-velle.js — Maison Velle
   ============================================================ */

const MV_URL = 'https://tvaiqwwzneazdjlvyvik.supabase.co';
const MV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YWlxd3d6bmVhemRqbHZ5dmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNzM1NzQsImV4cCI6MjA5Mzg0OTU3NH0.AyVgP7_BHt3mip4dyRCDx34ha0asOu5wuyLrHPYPLWk';

const mvSb = window.supabase.createClient(MV_URL, MV_KEY);

/* ── Get primary image (supports both image_url and images array) */
function mvGetImg(p) {
  if (p.images && Array.isArray(p.images) && p.images.length) return p.images[0];
  if (p.image_url) return p.image_url;
  return '';
}

/* ── BUILD PRODUCT CARD (Best Sellers grid) ─────────────────── */
function mvBuildProdCard(p, delay) {
  const badgeClass = p.badge === 'Best Seller' ? 'badge-best' : 'badge-new';
  const imgUrl = mvGetImg(p);
  const el = document.createElement('div');
  el.className = `prod-card rv d${delay}`;
  el.dataset.name  = p.name;
  el.dataset.cat   = p.category;
  el.dataset.price = p.price_label || `$${p.price_from}`;
  el.dataset.desc  = p.description || '';
  el.innerHTML = `
    <div class="prod-img" style="background-image:url('${imgUrl}');background-size:cover;background-position:center">
      <div class="prod-inner">${p.badge ? `<div class="${badgeClass}">${p.badge}</div>` : ''}</div>
    </div>
    <button class="qv-btn">Quick View</button>
    <div class="prod-info">
      <p class="prod-cat">${p.category}</p>
      <p class="prod-name">${p.name}</p>
      <p class="prod-price">${p.price_label || 'From $' + Number(p.price_from).toLocaleString()}</p>
    </div>`;
  el.style.cursor = 'pointer';
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('qv-btn')) return;
    window.location.href = 'product-detail-page.html?id=' + p.slug;
  });
  return el;
}

/* ── BUILD NI CARD (New In list) ────────────────────────────── */
function mvBuildNiCard(p) {
  const imgUrl = mvGetImg(p);
  const el = document.createElement('div');
  el.className = 'ni-card';
  el.innerHTML = `
    <div class="ni-thumb" style="background-image:url('${imgUrl}');background-size:cover;background-position:center">
      <div class="ni-badge">New</div>
    </div>
    <div class="ni-info">
      <p class="ni-cat">${p.category}</p>
      <p class="ni-name">${p.name}</p>
      <p class="ni-price">${p.price_label || '$' + Number(p.price_from).toLocaleString()}</p>
    </div>`;
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => {
    window.location.href = 'product-detail-page.html?id=' + p.slug;
  });
  return el;
}

/* ── LOAD BEST SELLERS ──────────────────────────────────────── */
async function mvLoadBestSellers() {
  const grid = document.getElementById('bestSellersGrid');
  if (!grid) return;

  const { data, error } = await mvSb
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_bestseller', true)
    .order('sort_order', { ascending: true })
    .limit(4);

  if (error || !data?.length) return;

  grid.innerHTML = '';
  data.forEach((p, i) => grid.appendChild(mvBuildProdCard(p, i + 1)));
  mvInitQuickView();
  mvInitReveal();
}

/* ── LOAD NEW IN ────────────────────────────────────────────── */
async function mvLoadNewIn() {
  const container = document.getElementById('newInCards');
  if (!container) return;

  const { data, error } = await mvSb
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_new_in', true)
    .order('sort_order', { ascending: true })
    .limit(3);

  if (error || !data?.length) return;

  container.innerHTML = '';
  data.forEach(p => container.appendChild(mvBuildNiCard(p)));
  mvInitReveal();
}

/* ── SHARED UI HELPERS ──────────────────────────────────────── */
function mvInitReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(x => {
      if (x.isIntersecting) { x.target.classList.add('on'); io.unobserve(x.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.rv:not(.on), .rv-l:not(.on), .rv-r:not(.on)')
    .forEach(el => io.observe(el));
}

function mvInitQuickView() {
  const qvOv = document.getElementById('qvOv');
  if (!qvOv) return;
  document.querySelectorAll('.qv-btn').forEach(btn => {
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);
    fresh.addEventListener('click', e => {
      e.stopPropagation();
      const c = fresh.closest('.prod-card');
      document.getElementById('qvName').textContent  = c.dataset.name  || '';
      document.getElementById('qvCat').textContent   = c.dataset.cat   || '';
      document.getElementById('qvPrice').textContent = c.dataset.price || '';
      document.getElementById('qvDesc').textContent  = c.dataset.desc  || '';
      qvOv.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
}

/* ── AUTO INIT ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  mvLoadBestSellers();
  mvLoadNewIn();
});
