#!/usr/bin/env node
/* =========================================================
   XICA MARKETING — gerador do site estático (sem dependências)
   Uso:  node build.js
   Lê:   src/config.json, src/locales/*.json, src/data/brands.json
   Gera: dist/  (e dist-<idioma>/ para idiomas com domínio próprio)
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(SRC, p), 'utf8'));

const cfg = readJSON('config.json');
const brands = readJSON('data/brands.json').brands;
const LANGS = Object.keys(cfg.locales);
const T = Object.fromEntries(LANGS.map((l) => [l, readJSON(`locales/${l}.json`)]));
const SECTION_KEYS = ['about', 'services', 'packages', 'brands', 'method', 'contact'];
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/* ---------- utilitários ---------- */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const trimSlash = (s) => s.replace(/\/+$/, '');

/** Raiz de saída e caminho base de cada idioma (idioma com domínio próprio vira um site separado). */
function localeTarget(lang) {
  const L = cfg.locales[lang];
  if (L.domain) return { outDir: path.join(ROOT, `dist-${lang}`), base: '/', origin: trimSlash(L.domain) };
  return { outDir: path.join(ROOT, 'dist'), base: L.path, origin: trimSlash(cfg.siteUrl) };
}
/** URL absoluta (para canonical, hreflang, sitemap, Open Graph). */
function absUrl(lang, sub = '') {
  const t = localeTarget(lang);
  return t.origin + t.base + sub;
}
/** Prefixo relativo até a raiz de saída, a partir de uma página. */
function relRoot(lang, sub = '') {
  const depth = (localeTarget(lang).base + sub).split('/').filter(Boolean).length;
  return depth ? '../'.repeat(depth) : './';
}
/** Link entre idiomas: relativo quando no mesmo site, absoluto quando em outro domínio. */
function crossLink(fromLang, fromSub, toLang, toSub) {
  const a = localeTarget(fromLang), b = localeTarget(toLang);
  if (a.outDir !== b.outDir) return absUrl(toLang, toSub);
  const target = (b.base + toSub).replace(/^\//, '');
  return relRoot(fromLang, fromSub) + target;
}

function waUrl(lang, item) {
  const w = T[lang].whatsapp;
  const text = item ? `${w.message} ${w.interestPrefix} ${item}.` : w.message;
  return `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
function waAttrs(lang, source, item) {
  return `href="${esc(waUrl(lang, item))}" target="_blank" rel="noopener" data-wa="${source}"${item ? ` data-wa-item="${esc(item)}"` : ''}`;
}

/* ---------- ícones (desenhados para a marca: traço grafite + diagonal verde do X) ---------- */
const G = 'url(#xg)';
const svgWrap = (inner, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">${inner}</svg>`;
const S = 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  social: svgWrap(`<rect x="7" y="7" width="15" height="15" rx="3" ${S}/><rect x="26" y="7" width="15" height="15" rx="3" ${S}/><rect x="7" y="26" width="15" height="15" rx="3" ${S}/><path d="M31 41 36 26h6l-5 15z" fill="${G}"/>`),
  traffic: svgWrap(`<path d="M7 41h34" ${S}/><path d="M9 33l9-9 7 6 12-14" ${S}/><path d="M31 12h9v9z" fill="${G}"/>`),
  content: svgWrap(`<rect x="6" y="9" width="36" height="30" rx="3" ${S}/><path d="M20 17l11 7-11 7z" fill="${G}"/>`),
  brand: svgWrap(`<path d="M10 9h8l20 30h-8z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M30 9h8L18 39h-8z" fill="${G}"/>`),
  web: svgWrap(`<rect x="6" y="8" width="36" height="32" rx="3" ${S}/><path d="M6 16h36" ${S}/><circle cx="11" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><path d="M14 22h16l-3 7H11z" fill="${G}"/><path d="M12 34h14" ${S}/>`),
  leads: svgWrap(`<path d="M7 9h34L28 25v11l-8 4V25z" ${S}/><path d="M12 13h24l-4 5H16z" fill="${G}"/>`),
  ai: svgWrap(`<circle cx="11" cy="12" r="4" ${S}/><circle cx="37" cy="12" r="4" ${S}/><circle cx="24" cy="38" r="4" ${S}/><path d="M15 13.5l5 6M33 13.5l-5 6M24 34v-4" ${S}/><path d="M24 17l5 6.5-5 6.5-5-6.5z" fill="${G}"/>`),
  code: svgWrap(`<path d="M15 14 6 24l9 10M33 14l9 10-9 10" ${S}/><path d="M26 9h5l-9 30h-5z" fill="${G}"/>`)
};
const ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_RIGHT = '<svg class="btn-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_WA = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M16 3.5A12.5 12.5 0 0 0 5.2 22.3L3.5 28.5l6.4-1.7A12.5 12.5 0 1 0 16 3.5z" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/><path d="M11.6 9.8c.5-.5 1.3-.4 1.7.1l1.6 2.2c.3.5.3 1.1-.1 1.5l-.9.9c.8 1.8 2.2 3.2 4 4l.9-.9c.4-.4 1-.5 1.5-.1l2.2 1.6c.6.4.6 1.2.1 1.7l-1.1 1.1c-.8.8-2 1.1-3.1.6-3.4-1.5-6.1-4.2-7.6-7.6-.5-1.1-.2-2.3.6-3.1z" fill="currentColor"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M4 10.5 8 14.5 16 5.5" stroke="#ADE63F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_XMARK = `<svg viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false"><path d="M5 5h5l13 18h-5z" fill="#4A4D4A"/><path d="M18 5h5L10 23H5z" fill="${G}"/></svg>`;
const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" fill="currentColor"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="9" width="4" height="12" fill="currentColor"/><circle cx="5" cy="5" r="2" fill="currentColor"/><path d="M10 9h4v2c.6-1.2 2-2.2 4-2.2 3 0 4 2 4 5V21h-4v-6.5c0-1.5-.5-2.5-2-2.5s-2 1.1-2 2.5V21h-4z" fill="currentColor"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M14 3c.5 2.8 2.4 4.6 5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
};
const SOCIAL_NAMES = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok' };

const SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="xg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0A7403"/><stop offset=".5" stop-color="#44A703"/><stop offset="1" stop-color="#ADE63F"/></linearGradient>
</defs></svg>`;

/* Grafismo do hero: inspirado no X do símbolo (não é o logotipo). */
const HERO_MARK = `<div class="hero-mark" aria-hidden="true"><svg viewBox="0 0 520 520" fill="none" focusable="false">
<defs>
  <linearGradient id="hg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0A7403"/><stop offset=".55" stop-color="#44A703"/><stop offset="1" stop-color="#ADE63F"/></linearGradient>
  <linearGradient id="hd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#454845"/><stop offset="1" stop-color="#1E201E"/></linearGradient>
  <linearGradient id="hs" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<g stroke="rgba(245,242,235,.12)" stroke-width="1"><path d="M0 0 520 520M520 0 0 520"/><rect x=".5" y=".5" width="519" height="519"/></g>
<path class="bar bar-a" d="M40 60h150l290 400H330z" fill="url(#hd)"/>
<g class="bar bar-b"><path d="M330 60h150L190 460H40z" fill="url(#hg)"/><path class="shine" d="M395 74h22L118 446H96z" fill="url(#hs)" opacity=".6"/></g>
</svg></div>`;

function picture(src, alt, w, h, { cls = '', eager = false, sizes } = {}) {
  return `<picture><source srcset="${src}.webp" type="image/webp"><img src="${src}.png" alt="${esc(alt)}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ''}${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></picture>`;
}
function imgSize(file) {
  // lê largura/altura de um PNG (cabeçalho IHDR)
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

/* ---------- partes da página ---------- */
function head(lang, sub, { title, description, isHome }) {
  const t = T[lang], L = cfg.locales[lang], r = relRoot(lang, sub);
  const alternates = LANGS.map((l) => `<link rel="alternate" hreflang="${cfg.locales[l].hreflang}" href="${esc(absUrl(l, sub === '' ? '' : cfg.locales[l].privacyPath))}">`).join('\n  ');
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${esc(absUrl(cfg.defaultLocale, sub === '' ? '' : cfg.locales[cfg.defaultLocale].privacyPath))}">`;
  const ogAlt = LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${cfg.locales[l].ogLocale}">`).join('\n  ');
  const url = absUrl(lang, sub);
  const sameAs = Object.values(cfg.social).filter(Boolean);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: 'XICA MARKETING', url: absUrl(lang), logo: absUrl(lang, 'assets/img/xica-logo.png'),
    slogan: t.footer.tagline, areaServed: ['BR', 'PY'],
    parentOrganization: { '@type': 'Organization', name: 'RACAM GROUP' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+' + cfg.whatsappNumber, availableLanguage: ['Portuguese', 'Spanish', 'English'] }
  };
  if (sameAs.length) ld.sameAs = sameAs;
  if (cfg.email) ld.email = cfg.email;
  const analyticsCfg = { lang, ga4Id: cfg.analytics.ga4Id || '', metaPixelId: cfg.analytics.metaPixelId || '' };

  return `<!DOCTYPE html>
<html lang="${L.hreflang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(url)}">
  ${alternates}
  ${xDefault}
  <meta name="theme-color" content="#292B29">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="XICA MARKETING">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(absUrl(lang, 'assets/img/og-image.jpg'))}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(t.meta.ogImageAlt)}">
  <meta property="og:locale" content="${L.ogLocale}">
  ${ogAlt}
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${r}assets/img/favicon.ico" sizes="any">
  <link rel="icon" href="${r}assets/img/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="${r}assets/img/favicon-180.png">
  <link rel="preload" href="${r}assets/fonts/archivo-latin-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${r}assets/fonts/manrope-latin-var.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${r}assets/css/styles.css">
  <script>document.documentElement.classList.add('js')</script>
  ${isHome ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
  <!-- Medição: GA4 e Meta Pixel carregam SOMENTE após o consentimento (assets/js/main.js).
       IDs em src/config.json → analytics.ga4Id / analytics.metaPixelId -->
  <script id="site-config" type="application/json">${JSON.stringify(analyticsCfg)}</script>
</head>`;
}

function header(lang, sub, isHome) {
  const t = T[lang], r = relRoot(lang, sub);
  const homeHref = r === './' ? './' : r + (localeTarget(lang).base.replace(/^\//, ''));
  const anchor = (id) => (isHome ? `#${id}` : `${homeHref}#${id}`);
  const langLinks = LANGS.map((l, i) => {
    const toSub = sub === '' ? '' : cfg.locales[l].privacyPath;
    const cur = l === lang ? ' aria-current="page"' : '';
    return `${i ? '<span class="sep" aria-hidden="true">|</span>' : ''}<a href="${esc(crossLink(lang, sub, l, toSub))}" hreflang="${cfg.locales[l].hreflang}" lang="${cfg.locales[l].hreflang}"${cur}>${l.toUpperCase()}</a>`;
  }).join('');
  const logo = imgSize(path.join(SRC, 'assets/img/xica-logo-420.png'));
  return `
<a class="skip-link" href="#conteudo">${esc(t.ui.skip)}</a>
${SVG_DEFS}
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="${isHome ? '#topo' : homeHref}" aria-label="${esc(t.ui.logoAlt)}">${picture(r + 'assets/img/xica-logo-420', t.ui.logoAlt, logo.w, logo.h, { eager: true })}</a>
    <nav class="main-nav" id="main-nav" aria-label="${esc(t.ui.menu)}">
      <ul>
        ${t.nav.map((n) => `<li><a href="${anchor(n.id)}">${esc(n.label)}</a></li>`).join('\n        ')}
      </ul>
      <a class="btn btn-primary nav-cta" ${waAttrs(lang, 'menu')}>${ICON_WA}${esc(t.ui.headerCta)}<span class="visually-hidden"> ${esc(t.ui.newTab)}</span></a>
    </nav>
    <div class="lang-switch" role="group" aria-label="${esc(t.ui.langLabel)}">${langLinks}</div>
    <a class="btn btn-primary btn-sm header-cta" ${waAttrs(lang, 'header')}>${ICON_WA}${esc(t.ui.headerCta)}<span class="visually-hidden"> ${esc(t.ui.newTab)}</span></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="${esc(t.ui.menuOpen)}" data-label-open="${esc(t.ui.menuOpen)}" data-label-close="${esc(t.ui.menuClose)}"><span></span></button>
  </div>
</header>`;
}

function footer(lang, sub, isHome) {
  const t = T[lang], f = t.footer, r = relRoot(lang, sub);
  const homeHref = r === './' ? './' : r + (localeTarget(lang).base.replace(/^\//, ''));
  const anchor = (id) => (isHome ? `#${id}` : `${homeHref}#${id}`);
  const ids = Object.fromEntries(t.nav.map((n, i) => [SECTION_KEYS[i], n.id]));
  const socials = Object.entries(cfg.social).filter(([, v]) => v);
  const logo = imgSize(path.join(SRC, 'assets/img/xica-logo-420.png'));
  const legal = cfg.company.showLegalInfo && (cfg.company.legalName || cfg.company.cnpj)
    ? `<li>${esc(cfg.company.legalName)}${cfg.company.cnpj ? ` · ${esc(f.cnpjLabel)} ${esc(cfg.company.cnpj)}` : ''}</li>` : '';
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        ${picture(r + 'assets/img/xica-logo-420', t.ui.logoAlt, logo.w, logo.h)}
        <p class="tagline">${esc(f.tagline)}</p>
        <p class="group">${esc(f.group)}</p>
      </div>
      <div class="footer-col">
        <h2>${esc(f.navTitle)}</h2>
        <ul>${t.nav.map((n) => `<li><a href="${anchor(n.id)}">${esc(n.label)}</a></li>`).join('')}</ul>
      </div>
      <div class="footer-col">
        <h2>${esc(f.servicesTitle)}</h2>
        <ul>${t.services.items.map((s) => `<li><a href="${anchor(ids.services)}">${esc(s.title)}</a></li>`).join('')}</ul>
      </div>
      <div class="footer-col">
        <h2>${esc(f.contactTitle)}</h2>
        <ul>
          <li><a ${waAttrs(lang, 'footer')}>${esc(f.whatsapp)}: +${cfg.whatsappNumber.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '$1 $2 $3-$4')}<span class="visually-hidden"> ${esc(t.ui.newTab)}</span></a></li>
          <li>${cfg.email ? `<a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>` : `<span class="pending">${esc(f.emailPending)}</span>`}</li>
        </ul>
        ${socials.length ? `<div class="social">${socials.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener" aria-label="${SOCIAL_NAMES[k] || k} ${esc(t.ui.newTab)}">${SOCIAL_ICONS[k] || ''}</a>`).join('')}</div>` : ''}
      </div>
    </div>
    <div class="footer-bottom">
      <p style="margin:0">© <span data-year>${new Date().getFullYear()}</span> XICA MARKETING · ${esc(f.group)}. ${esc(f.rights)}</p>
      <ul>
        <li><a href="${esc(crossLink(lang, sub, lang, cfg.locales[lang].privacyPath))}">${esc(f.privacy)}</a></li>
        <li><button type="button" data-consent="open">${esc(f.cookies)}</button></li>
        ${legal}
      </ul>
    </div>
  </div>
</footer>

<a class="wa-float is-hidden" ${waAttrs(lang, 'floating')} aria-label="${esc(t.ui.floatingLabel)} ${esc(t.ui.newTab)}">${ICON_WA}</a>

<div class="cookie-bar on-dark" id="cookie-bar" role="region" aria-label="Cookies" hidden>
  <div class="container cookie-inner">
    <p>${esc(t.cookies.text)} <a href="${esc(crossLink(lang, sub, lang, cfg.locales[lang].privacyPath))}">${esc(t.cookies.more)}</a></p>
    <div class="cookie-actions">
      <button class="btn btn-ghost btn-sm" type="button" data-consent="denied">${esc(t.cookies.reject)}</button>
      <button class="btn btn-primary btn-sm" type="button" data-consent="granted">${esc(t.cookies.accept)}</button>
    </div>
  </div>
</div>
<script src="${r}assets/js/main.js" defer></script>
</body>
</html>`;
}

function homePage(lang) {
  const t = T[lang], r = relRoot(lang, '');
  const ids = Object.fromEntries(t.nav.map((n, i) => [SECTION_KEYS[i], n.id]));
  const nl = t.ui.newTab;

  const hero = `
<section class="hero on-dark" id="topo" aria-labelledby="hero-title" data-hide-float>
  <div class="container hero-grid">
    <div>
      <p class="eyebrow">${esc(t.hero.eyebrow)}</p>
      <h1 id="hero-title">${esc(t.hero.titleA)} <span class="accent">${esc(t.hero.titleB)}</span></h1>
      <p class="hero-text">${esc(t.hero.text)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" ${waAttrs(lang, 'hero')}>${ICON_WA}${esc(t.hero.ctaPrimary)}<span class="visually-hidden"> ${esc(nl)}</span></a>
        <a class="btn btn-ghost" href="#${ids.services}">${esc(t.hero.ctaSecondary)}${ICON_RIGHT}</a>
      </div>
      <ul class="hero-tags">${t.hero.tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    ${HERO_MARK}
  </div>
</section>`;

  const about = `
<section class="section about" id="${ids.about}" aria-labelledby="about-title">
  <div class="container about-grid">
    <div class="reveal">
      <p class="eyebrow">${esc(t.about.eyebrow)}</p>
      <h2 id="about-title">${esc(t.about.title)}</h2>
    </div>
    <div class="about-body reveal" style="--d:.1s">
      ${t.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n      ')}
      <p class="group-note">${ICON_XMARK}<span>${esc(t.about.group)}</span></p>
    </div>
  </div>
</section>`;

  const dico = t.services.dico;
  const services = `
<section class="section services" id="${ids.services}" aria-labelledby="services-title">
  <div class="container services-layout">
    <div class="section-head reveal">
      <p class="eyebrow">${esc(t.services.eyebrow)}</p>
      <h2 id="services-title">${esc(t.services.title)}</h2>
      <p>${esc(t.services.text)}</p>
    </div>
    <ul class="services-grid">
      ${t.services.items.map((s, i) => `<li class="service-card reveal" style="--d:${(i % 2) * 0.08}s">
        ${ICONS[s.icon] || ''}
        <span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
        <a class="link-arrow" ${waAttrs(lang, 'service', s.title)}>${esc(t.services.cta)}${ICON_ARROW}<span class="visually-hidden">: ${esc(s.title)} ${esc(nl)}</span></a>
      </li>`).join('\n      ')}
      <li class="service-card dico reveal" style="--d:.08s">
        ${ICONS.code.replace('class="icon"', 'class="icon" style="color:#F5F2EB"')}
        <span class="tag">${esc(dico.eyebrow)}</span>
        <h3>${esc(dico.title)}</h3>
        <p>${esc(dico.text)}</p>
        ${cfg.dicoUrl
          ? `<a class="link-arrow" href="${esc(cfg.dicoUrl)}" target="_blank" rel="noopener">${esc(dico.cta)}${ICON_ARROW}<span class="visually-hidden"> ${esc(nl)}</span></a>`
          : `<span class="pending">Link DICO SISTEMAS [A DEFINIR]</span>`}
      </li>
    </ul>
  </div>
</section>`;

  const p = t.packages;
  const packages = `
<section class="section packages on-dark" id="${ids.packages}" aria-labelledby="packages-title">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">${esc(p.eyebrow)}</p>
      <h2 id="packages-title">${esc(p.title)}</h2>
      <p>${esc(p.text)}</p>
    </div>
    <div class="packages-grid">
      ${p.items.map((k, i) => {
        const isText = !/\d/.test(k.price);
        return `<article class="package${k.featured ? ' is-featured' : ''} reveal" style="--d:${i * 0.08}s" aria-labelledby="pkg-${k.id}">
        ${k.featured ? `<span class="badge">${esc(p.featuredBadge)}</span>` : ''}
        <span class="package-num">${esc(k.num)}</span>
        <h3 id="pkg-${k.id}">${esc(k.name)}</h3>
        <p class="summary">${esc(k.summary)}</p>
        <div class="price">
          <p class="price-main${isText ? ' is-text' : ''}" style="margin:0">${esc(k.price)}${k.priceSuffix ? `<span class="price-suffix">${esc(k.priceSuffix)}</span>` : ''}</p>
          ${k.priceDetails.length ? `<ul class="price-details">${k.priceDetails.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        </div>
        <p class="includes-label">${esc(p.includesLabel)}</p>
        <ul class="includes">${k.includes.map((x) => `<li>${ICON_CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
        ${k.note ? `<p class="note">${esc(k.note)}</p>` : ''}
        <a class="btn ${k.featured ? 'btn-primary' : ''}" ${waAttrs(lang, 'package', `${lang === 'pt' ? 'Pacote' : lang === 'es' ? 'Paquete' : 'Package'} ${k.name}`)}>${esc(p.cta)}<span class="visually-hidden">: ${esc(k.name)} ${esc(nl)}</span>${ICON_RIGHT}</a>
      </article>`;
      }).join('\n      ')}
    </div>
  </div>
</section>`;

  const b = t.brands, cl = b.caseLabels;
  const brandCards = brands.map((br, i) => {
    let logo;
    if (br.logo) {
      const sz = imgSize(path.join(SRC, `assets/img/brands/${br.logo}.png`));
      logo = `<div class="brand-logo" style="background:${esc(br.logoBg || '#FFFFFF')}">${picture(`${r}assets/img/brands/${br.logo}`, br.name, sz.w, sz.h)}</div>`;
    } else {
      logo = `<div class="brand-logo is-pending" role="img" aria-label="${esc(br.name)}"><strong>${esc(br.name)}</strong><span>${esc(t.ui.logoPending)}</span></div>`;
    }
    const c = br.case && br.case[lang];
    const caseHtml = c ? `<details class="brand-case"><summary>${esc(cl.open)}</summary><dl><dt>${esc(cl.challenge)}</dt><dd>${esc(c.challenge)}</dd><dt>${esc(cl.done)}</dt><dd>${esc(c.done)}</dd><dt>${esc(cl.result)}</dt><dd>${esc(c.result)}</dd></dl></details>` : '';
    return `<li class="brand-card reveal" style="--d:${(i % 4) * 0.06}s">${logo}${caseHtml}</li>`;
  }).join('\n      ');
  const brandsSec = `
<section class="section brands" id="${ids.brands}" aria-labelledby="brands-title">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">${esc(b.eyebrow)}</p>
      <h2 id="brands-title">${esc(b.title)}</h2>
      <p>${esc(b.text)}</p>
    </div>
    <ul class="brands-grid">
      ${brandCards}
      <li class="brand-card next reveal" style="--d:.18s"><h3>${esc(b.next.title)}</h3><a class="link-arrow" ${waAttrs(lang, 'brands')}>${esc(b.next.cta)}${ICON_ARROW}<span class="visually-hidden"> ${esc(nl)}</span></a></li>
    </ul>
    <p class="brands-note">${esc(b.note)}</p>
  </div>
</section>`;

  const method = `
<section class="section method" id="${ids.method}" aria-labelledby="method-title">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">${esc(t.method.eyebrow)}</p>
      <h2 id="method-title">${esc(t.method.title)}</h2>
    </div>
    <ol class="steps" style="list-style:none;margin:0;padding:0">
      ${t.method.steps.map((s, i) => `<li class="step reveal" style="--d:${i * 0.1}s"><span class="step-num" aria-hidden="true">${esc(s.num)}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>`;

  const diff = `
<section class="section diff on-dark" aria-labelledby="diff-title">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">${esc(t.diff.eyebrow)}</p>
      <h2 id="diff-title">${esc(t.diff.title)}</h2>
    </div>
    <ul class="diff-grid">
      ${t.diff.items.map((d, i) => `<li class="diff-item reveal" style="--d:${(i % 3) * 0.08}s">${ICON_XMARK}<h3>${esc(d.title)}</h3><p>${esc(d.text)}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>`;

  const cta = `
<section class="section cta on-dark" id="${ids.contact}" aria-labelledby="cta-title" data-hide-float>
  <div class="cta-x" aria-hidden="true"></div>
  <div class="container reveal">
    <h2 id="cta-title">${esc(t.cta.title)}</h2>
    <p>${esc(t.cta.text)}</p>
    <a class="btn btn-primary" ${waAttrs(lang, 'cta')}>${ICON_WA}${esc(t.cta.button)}<span class="visually-hidden"> ${esc(nl)}</span></a>
  </div>
</section>`;

  return head(lang, '', { title: t.meta.title, description: t.meta.description, isHome: true }) +
    `\n<body>${header(lang, '', true)}\n<main id="conteudo">${hero}${about}${services}${packages}${brandsSec}${method}${diff}${cta}\n</main>` +
    footer(lang, '', true);
}

function privacyPage(lang) {
  const t = T[lang], sub = cfg.locales[lang].privacyPath, pv = t.privacy;
  const r = relRoot(lang, sub);
  const homeHref = r + localeTarget(lang).base.replace(/^\//, '');
  return head(lang, sub, { title: t.meta.privacyTitle, description: t.meta.privacyDescription, isHome: false }) +
    `\n<body>${header(lang, sub, false)}
<main id="conteudo" class="legal">
  <div class="container">
    <p class="eyebrow">XICA MARKETING</p>
    <h1>${esc(pv.title)}</h1>
    <p class="draft">${esc(pv.draftNotice)}</p>
    <p class="updated">${esc(pv.updated)} ${BUILD_DATE}</p>
    ${pv.sections.map((s) => `<h2>${esc(s.h)}</h2>\n    ${s.p.map((x) => `<p>${esc(x)}</p>`).join('\n    ')}`).join('\n    ')}
    <p class="back"><a class="btn btn-ghost" href="${homeHref}">${esc(t.ui.backHome)}</a></p>
  </div>
</main>` + footer(lang, sub, false);
}

function notFoundPage(outLangs) {
  const blocks = outLangs.map((l) => {
    const href = localeTarget(l).base;
    return `<div lang="${cfg.locales[l].hreflang}" style="margin-bottom:2rem"><h2 style="font-size:1.6rem">${esc(T[l].notFound.title)}</h2><p>${esc(T[l].notFound.text)}</p><a class="btn btn-primary" href="${href}">${esc(T[l].ui.backHome)}</a></div>`;
  }).join('');
  const L0 = outLangs[0];
  return `<!DOCTYPE html><html lang="${cfg.locales[L0].hreflang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 | XICA MARKETING</title><meta name="robots" content="noindex"><link rel="icon" href="/assets/img/favicon.ico"><link rel="stylesheet" href="/assets/css/styles.css"></head>
<body><main class="legal"><div class="container"><p class="eyebrow">404</p>${blocks}</div></main></body></html>`;
}

function sitemap(outLangs) {
  const pages = [{ key: '', get: (l) => '' }, { key: 'privacy', get: (l) => cfg.locales[l].privacyPath }];
  const urls = [];
  for (const l of outLangs) {
    for (const p of pages) {
      const alts = LANGS.map((a) => `    <xhtml:link rel="alternate" hreflang="${cfg.locales[a].hreflang}" href="${esc(absUrl(a, p.get(a)))}"/>`).join('\n');
      urls.push(`  <url>\n    <loc>${esc(absUrl(l, p.get(l)))}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n${alts}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(absUrl(cfg.defaultLocale, p.get(cfg.defaultLocale)))}"/>\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

/* ---------- escrita ---------- */
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

// validações básicas
if (!/^\d{10,15}$/.test(cfg.whatsappNumber)) throw new Error('config.whatsappNumber deve conter só dígitos, com DDI (ex.: 5531975622412).');
for (const l of LANGS) for (const k of ['meta', 'hero', 'nav', 'whatsapp', 'packages', 'privacy']) {
  if (!T[l][k]) throw new Error(`locales/${l}.json: chave "${k}" ausente.`);
}

const outputs = {};
for (const l of LANGS) {
  const { outDir } = localeTarget(l);
  (outputs[outDir] = outputs[outDir] || []).push(l);
}
for (const [outDir, langs] of Object.entries(outputs)) {
  fs.rmSync(outDir, { recursive: true, force: true });
  copyDir(path.join(SRC, 'assets'), path.join(outDir, 'assets'));
  for (const l of langs) {
    const base = path.join(outDir, localeTarget(l).base);
    write(path.join(base, 'index.html'), homePage(l));
    write(path.join(base, cfg.locales[l].privacyPath, 'index.html'), privacyPage(l));
  }
  write(path.join(outDir, '404.html'), notFoundPage(langs));
  write(path.join(outDir, 'sitemap.xml'), sitemap(langs));
  const origin = localeTarget(langs[0]).origin;
  write(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
  console.log(`✓ ${path.relative(ROOT, outDir)}/  →  ${langs.join(', ')}`);
}
if (/A-DEFINIR/.test(cfg.siteUrl)) console.warn('! siteUrl ainda é provisório: atualize src/config.json antes de publicar (canonical, hreflang e sitemap usam esse valor).');
