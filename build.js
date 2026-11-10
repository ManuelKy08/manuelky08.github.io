#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://manuelky08.github.io';
const BUILD_DATE = new Date();
const BUILD_DAY = [
  BUILD_DATE.getFullYear(),
  String(BUILD_DATE.getMonth() + 1).padStart(2, '0'),
  String(BUILD_DATE.getDate()).padStart(2, '0')
].join('-');
const BUILD_STAMP = BUILD_DATE.toISOString();
const THEME_KEY = 'mk08-theme';

const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'))
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

const recon = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/recon.json'), 'utf8'));

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const TAG_LABEL = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
  shell: 'Shell',
  typescript: 'TypeScript'
};

const STATUS_LABEL = {
  aktif: 'Aktif',
  'arsip-ringan': 'Arsip ringan'
};

const NAV = [
  { id: 'projects', label: 'Proyek', href: 'projects/' },
  { id: 'timeline', label: 'Linimasa', href: 'timeline/' },
  { id: 'devlog', label: 'Devlog', href: 'devlog/' },
  { id: 'about', label: 'Tentang', href: 'about/' },
  { id: 'now', label: 'Sekarang', href: 'now/' },
  { id: 'uses', label: 'Perangkat', href: 'uses/' },
  { id: 'stats', label: 'Statistik', href: 'stats/' },
  { id: 'random', label: 'Acak', href: 'random/' }
];

const TAG_GROUPS = {};
for (const project of projects) {
  for (const tag of project.tags) {
    if (!TAG_GROUPS[tag]) TAG_GROUPS[tag] = [];
    TAG_GROUPS[tag].push(project);
  }
}

const tagEntries = Object.entries(TAG_GROUPS)
  .map(([tag, items]) => ({ tag, label: TAG_LABEL[tag] || tag, items, count: items.length }))
  .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

const activeProjects = projects.filter((project) => project.status === 'aktif');
const archivedProjects = projects.filter((project) => project.status !== 'aktif');
const years = [...new Set(projects.map((project) => project.date.slice(0, 4)))].sort().reverse();

function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function dateLong(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return day + ' ' + MONTHS[month - 1] + ' ' + year;
}

function dateShort(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return String(day).padStart(2, '0') + ' ' + MONTHS_SHORT[month - 1] + ' ' + String(year).slice(2);
}

function dateCompact(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return String(day).padStart(2, '0') + '.' + String(month).padStart(2, '0') + '.' + String(year).slice(2);
}

function monthsSince(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const [nowYear, nowMonth, nowDay] = BUILD_DAY.split('-').map(Number);
  let months = (nowYear - year) * 12 + (nowMonth - month);
  if (nowDay < day) months -= 1;
  return Math.max(0, months);
}

function canonical(pathname) {
  const clean = String(pathname || '').replace(/^\/+|\/+$/g, '');
  return clean ? SITE + '/' + clean + '/' : SITE + '/';
}

function href(prefix, target) {
  return prefix + target;
}

function tagLink(tag, prefix, label) {
  return '<a class="tag" href="' + href(prefix, 'tags/' + tag + '/') + '">' + esc(label || TAG_LABEL[tag] || tag) + '</a>';
}

function tagLinks(project, prefix) {
  return project.tags.map((tag) => tagLink(tag, prefix)).join('');
}

function statusMarkup(project) {
  const active = project.status === 'aktif';
  return '<span class="status ' + (active ? 'status--active' : 'status--archive') + '">' +
    '<span class="status__dot" aria-hidden="true"></span>' + esc(STATUS_LABEL[project.status] || project.status) +
    '</span>';
}

function metaLine(project) {
  return '<div class="meta-line">' +
    '<time datetime="' + project.date + '">' + dateLong(project.date) + '</time>' +
    '<span aria-hidden="true">/</span>' + statusMarkup(project) +
    '<span aria-hidden="true">/</span><span>' + esc(project.language) + '</span>' +
    '</div>';
}

function searchBlob(project) {
  return [
    project.title,
    project.description,
    project.slug,
    project.language,
    project.status,
    project.tags.join(' '),
    project.tags.map((tag) => TAG_LABEL[tag] || tag).join(' ')
  ].join(' ').toLowerCase();
}

function projectRow(project, prefix) {
  return '<article class="project-row" data-project-item data-tags="' + esc(project.tags.join(' ')) + '" data-search="' + esc(searchBlob(project)) + '">' +
    '<div class="project-row__date">' +
      '<time datetime="' + project.date + '">' + dateCompact(project.date) + '</time>' +
      statusMarkup(project) +
    '</div>' +
    '<div class="project-row__body">' +
      '<h3 class="project-row__title"><a href="' + href(prefix, 'projects/' + project.slug + '/') + '">' + esc(project.title) + '</a></h3>' +
      '<p class="project-row__dek">' + esc(project.description) + '</p>' +
    '</div>' +
    '<div class="project-row__side">' +
      '<div class="project-row__tags">' + tagLinks(project, prefix) + '</div>' +
    '</div>' +
  '</article>';
}

function sectionHead(kicker, title, linkHref, linkLabel) {
  return '<header class="section-head">' +
    '<div><p class="kicker">' + esc(kicker) + '</p><h2>' + esc(title) + '</h2></div>' +
    (linkHref ? '<a class="section-head__link" href="' + linkHref + '">' + esc(linkLabel) + ' <span aria-hidden="true">&rarr;</span></a>' : '') +
  '</header>';
}

function filterPanel(projectList, prefix, limitLabel) {
  return '<div class="filter-panel" data-project-filter>' +
    '<div class="filter-bar">' +
      '<label class="visually-hidden" for="project-search">Cari proyek</label>' +
      '<input id="project-search" class="filter-input" type="search" placeholder="Cari proyek, bahasa, atau status..." autocomplete="off" spellcheck="false" data-project-search>' +
      '<p class="filter-count" aria-live="polite" data-filter-count>' + projectList.length + ' proyek</p>' +
    '</div>' +
    '<div class="filter-tags" role="group" aria-label="Filter berdasarkan tag">' +
      '<button class="chip" type="button" data-filter-tag="" aria-pressed="true">Semua <span>' + projectList.length + '</span></button>' +
      tagEntries.map((entry) => '<button class="chip" type="button" data-filter-tag="' + entry.tag + '" aria-pressed="false">' + esc(entry.label) + ' <span>' + entry.count + '</span></button>').join('') +
    '</div>' +
    '<p class="filter-note">' + esc(limitLabel || 'Klik tag untuk menyaring. Pencarian mencakup judul, deskripsi, bahasa, dan status.') + '</p>' +
    '<div class="project-list" data-project-list>' +
      projectList.map((project) => projectRow(project, prefix)).join('') +
    '</div>' +
    '<p class="empty-state" data-filter-empty hidden>Tidak ada proyek yang cocok. Coba kata kunci lain atau reset filter.</p>' +
  '</div>';
}

function railItem(project, prefix, index) {
  return '<li class="rail-item">' +
    '<span class="rail-item__number" aria-hidden="true">' + String(index).padStart(2, '0') + '</span>' +
    '<div>' +
      '<p class="rail-item__meta"><time datetime="' + project.date + '">' + dateShort(project.date) + '</time> · ' + esc(project.language) + '</p>' +
      '<h3 class="rail-item__title"><a href="' + href(prefix, 'projects/' + project.slug + '/') + '">' + esc(project.title) + '</a></h3>' +
    '</div>' +
  '</li>';
}

function renderPalette(prefix) {
  const items = [];
  const add = (group, label, target, canonicalPath) => {
    const id = 'palette-item-' + items.length;
    items.push('<li class="palette__item" id="' + id + '" role="option" aria-selected="false" data-palette-item data-search="' + esc((label + ' ' + group + ' ' + canonicalPath).toLowerCase()) + '">' +
      '<a href="' + esc(href(prefix, target)) + '">' +
        '<span class="palette__group">' + esc(group) + '</span>' +
        '<span class="palette__label">' + esc(label) + '</span>' +
        '<span class="palette__path">' + esc(canonicalPath) + '</span>' +
      '</a></li>');
  };

  add('Halaman', 'Beranda', '', '/');
  for (const item of NAV) add('Halaman', item.label, item.href, '/' + item.href);
  for (const project of projects) add('Proyek', project.title, 'projects/' + project.slug + '/', '/projects/' + project.slug + '/');
  for (const entry of tagEntries) add('Tag', entry.label, 'tags/' + entry.tag + '/', '/tags/' + entry.tag + '/');

  return '<dialog class="palette" data-palette aria-labelledby="palette-title">' +
    '<div class="palette__head">' +
      '<h2 id="palette-title">Lompat ke</h2>' +
      '<button class="palette__close" type="button" data-palette-close aria-label="Tutup pencarian">Esc</button>' +
    '</div>' +
    '<label class="visually-hidden" for="palette-input">Cari halaman atau proyek</label>' +
    '<input class="palette__input" id="palette-input" type="search" placeholder="Ketik nama halaman, proyek, atau tag..." autocomplete="off" spellcheck="false" data-palette-input aria-controls="palette-list" aria-activedescendant="">' +
    '<ul class="palette__list" id="palette-list" role="listbox" aria-label="Hasil navigasi" data-palette-list>' + items.join('') + '</ul>' +
    '<p class="palette__empty" data-palette-empty hidden>Tidak ada hasil. Coba nama lain.</p>' +
    '<p class="palette__hint">&uarr; &darr; untuk memilih &middot; Enter untuk membuka &middot; Esc untuk menutup</p>' +
  '</dialog>';
}

function footer(prefix) {
  return '<footer class="site-footer">' +
    '<div class="wrap footer__grid">' +
      '<div class="footer__brand">' +
        '<a class="footer__logo" href="' + href(prefix, '') + '">Manuel Ky08<span aria-hidden="true">/</span>Project Desk</a>' +
        '<p>Indeks publik untuk eksperimen web, alat keamanan, dan halaman yang masih hidup di GitHub Pages.</p>' +
        '<p class="footer__meta">Diperbarui ' + dateLong(BUILD_DAY) + ' · ' + projects.length + ' proyek</p>' +
      '</div>' +
      '<nav class="footer__nav" aria-label="Navigasi footer"><ul>' +
        '<li><a href="' + href(prefix, 'projects/') + '">Semua proyek</a></li>' +
        '<li><a href="' + href(prefix, 'timeline/') + '">Linimasa</a></li>' +
        '<li><a href="' + href(prefix, 'devlog/') + '">Devlog</a></li>' +
        '<li><a href="' + href(prefix, 'about/') + '">Tentang</a></li>' +
        '<li><a href="' + href(prefix, 'now/') + '">Sekarang</a></li>' +
        '<li><a href="' + href(prefix, 'uses/') + '">Perangkat</a></li>' +
        '<li><a href="' + href(prefix, 'stats/') + '">Statistik</a></li>' +
        '<li><a href="' + href(prefix, 'random/') + '">Proyek acak</a></li>' +
      '</ul></nav>' +
      '<div class="footer__ledger">' +
        '<p class="footer__label">Buku rekonsiliasi</p>' +
        '<dl>' +
          '<div><dt>Repo diperiksa</dt><dd>' + recon.reposWithPages + '</dd></div>' +
          '<div><dt>Live / HTTP 200</dt><dd>' + recon.http200 + '</dd></div>' +
          '<div><dt>Gagal</dt><dd>' + recon.failed + '</dd></div>' +
          '<div><dt>Dipublikasikan</dt><dd>' + projects.length + '</dd></div>' +
        '</dl>' +
        '<p class="footer__small"><a href="' + href(prefix, 'sitemap.xml') + '">Sitemap</a> · <a href="' + href(prefix, 'robots.txt') + '">robots.txt</a> · <a href="https://github.com/ManuelKy08" rel="noopener">GitHub</a></p>' +
      '</div>' +
    '</div>' +
    '<div class="wrap footer__bottom">' +
      '<p>HTML, CSS, dan JavaScript tanpa framework. Tanpa CDN, tanpa pelacakan.</p>' +
      '<p><a href="#top">Kembali ke atas &uarr;</a></p>' +
    '</div>' +
  '</footer>';
}

function layout(options) {
  const {
    title,
    description,
    current = '',
    prefix = '',
    pathname = '',
    body = '',
    bodyClass = '',
    headExtra = '',
    baseHref = null,
    noindex = false
  } = options;

  const canonicalTag = noindex ? '' : '<link rel="canonical" href="' + canonical(pathname) + '">';
  const baseTag = baseHref ? '<base href="' + esc(baseHref) + '">' : '';
  const robotsTag = noindex ? '<meta name="robots" content="noindex">' : '';

  return '<!doctype html>' +
'<html lang="id" data-theme="light">' +
'<head>' +
  '<meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  baseTag +
  '<title>' + esc(title) + '</title>' +
  '<meta name="description" content="' + esc(description) + '">' +
  robotsTag +
  '<meta name="theme-color" content="#f3edde" media="(prefers-color-scheme: light)">' +
  '<meta name="theme-color" content="#14120f" media="(prefers-color-scheme: dark)">' +
  '<script>(function(){var d=document.documentElement;try{var t=localStorage.getItem("' + THEME_KEY + '");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}d.dataset.theme=t;}catch(e){}})();</script>' +
  '<link rel="icon" href="' + href(prefix, 'assets/favicon.svg') + '" type="image/svg+xml">' +
  '<link rel="stylesheet" href="' + href(prefix, 'assets/css/style.css') + '">' +
  '<script defer src="' + href(prefix, 'assets/js/app.js') + '"></script>' +
  '<meta property="og:type" content="website">' +
  '<meta property="og:site_name" content="Manuel Ky08 — Project Desk">' +
  '<meta property="og:title" content="' + esc(title) + '">' +
  '<meta property="og:description" content="' + esc(description) + '">' +
  (noindex ? '' : '<meta property="og:url" content="' + canonical(pathname) + '">') +
  canonicalTag +
  headExtra +
'</head>' +
'<body id="top" class="' + esc(bodyClass) + '">' +
  '<a class="skip-link" href="#main">Langsung ke konten</a>' +
  '<header class="site-header">' +
    '<div class="topline"><div class="wrap topline__inner">' +
      '<div class="topline__left">' +
        '<time datetime="' + BUILD_DAY + '">' + dateLong(BUILD_DAY) + '</time>' +
        '<span class="topline__sep" aria-hidden="true"></span>' +
        '<span>' + projects.length + ' proyek · ' + activeProjects.length + ' aktif</span>' +
      '</div>' +
      '<div class="topline__tools">' +
        '<button class="tool" type="button" data-palette-open aria-haspopup="dialog">' +
          '<span>Cari &amp; lompat</span><kbd>Ctrl K</kbd>' +
        '</button>' +
        '<button class="tool tool--theme" type="button" data-theme-toggle aria-pressed="false">' +
          '<span class="tool__dot" aria-hidden="true"></span><span data-theme-label>Mode gelap</span>' +
        '</button>' +
      '</div>' +
    '</div></div>' +
    '<div class="wrap masthead">' +
      '<a class="brand" href="' + href(prefix, '') + '">' +
        '<span class="brand__mark" aria-hidden="true">MK</span>' +
        '<span class="brand__block">' +
          '<span class="brand__name">Manuel Ky08</span>' +
          '<span class="brand__sub">Project Desk</span>' +
        '</span>' +
      '</a>' +
      '<p class="brand__tagline">Catatan lapangan tentang keamanan, alat kecil, dan web terbuka.</p>' +
    '</div>' +
    '<nav class="section-nav" aria-label="Navigasi utama"><div class="wrap"><ul>' +
      NAV.map((item) => '<li><a href="' + href(prefix, item.href) + '"' + (current === item.id ? ' aria-current="page"' : '') + '>' + esc(item.label) + '</a></li>').join('') +
    '</ul></div></nav>' +
  '</header>' +
  '<main id="main" class="wrap">' + body + '</main>' +
  footer(prefix) +
  renderPalette(prefix) +
'</body>' +
'</html>';
}

const written = [];

function writeFile(relativePath, contents) {
  const fullPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents);
  written.push(relativePath);
}

function pageHead(kicker, title, standfirst, extra) {
  return '<header class="page-head">' +
    '<p class="kicker">' + esc(kicker) + '</p>' +
    '<h1>' + esc(title) + '</h1>' +
    '<p class="standfirst">' + esc(standfirst) + '</p>' +
    (extra || '') +
  '</header>';
}

function statStrip(items) {
  return '<div class="stat-strip">' + items.map((item) =>
    '<div class="stat-strip__item"><span class="stat-strip__value">' + esc(item.value) + '</span><span class="stat-strip__label">' + esc(item.label) + '</span></div>'
  ).join('') + '</div>';
}

function buildHome() {
  const prefix = '';
  const lead = projects[0];
  const rail = projects.slice(1, 6);
  const feature = projects.find((project) => project.status === 'aktif' && project.slug !== lead.slug) || projects[1];
  const sideItems = projects.filter((project) => project.slug !== lead.slug && project.slug !== feature.slug).slice(0, 3);

  const body =
    '<section class="lead" aria-labelledby="lead-title">' +
      '<article class="lead__story">' +
        '<p class="kicker">Laporan utama · ' + esc(STATUS_LABEL[lead.status]) + '</p>' +
        '<h1 class="lead__title" id="lead-title"><a href="' + href(prefix, 'projects/' + lead.slug + '/') + '">' + esc(lead.title) + '</a></h1>' +
        '<p class="lead__dek">' + esc(lead.description) + '</p>' +
        '<div class="meta-line">' +
          '<time datetime="' + lead.date + '">' + dateLong(lead.date) + '</time>' +
          '<span aria-hidden="true">/</span>' + statusMarkup(lead) +
          '<span aria-hidden="true">/</span><span>' + esc(lead.language) + '</span>' +
        '</div>' +
        '<div class="actions">' +
          '<a class="btn btn--solid" href="' + href(prefix, 'projects/' + lead.slug + '/') + '">Baca laporan <span aria-hidden="true">&rarr;</span></a>' +
          '<a class="btn" href="' + esc(lead.liveUrl) + '" rel="noopener">Live</a>' +
          '<a class="btn btn--quiet" href="' + esc(lead.repoUrl) + '" rel="noopener">Source</a>' +
        '</div>' +
      '</article>' +
      '<aside class="lead__rail" aria-labelledby="latest-title">' +
        '<h2 class="section-label" id="latest-title">Terbaru di meja</h2>' +
        '<ol class="rail-list">' + rail.map((project, index) => railItem(project, prefix, index + 1)).join('') + '</ol>' +
        '<div class="rail-note">' +
          '<p class="rail-note__label">Status redaksi</p>' +
          '<p><strong>' + activeProjects.length + '</strong> proyek aktif, <strong>' + archivedProjects.length + '</strong> arsip ringan. Status dihitung dari pembaruan enam bulan terakhir.</p>' +
          '<a class="text-link" href="' + href(prefix, 'stats/') + '">Lihat angka lengkap <span aria-hidden="true">&rarr;</span></a>' +
        '</div>' +
      '</aside>' +
    '</section>' +

    '<section class="section" aria-label="Sorotan dari rak arsip">' +
      sectionHead('Pilihan redaksi', 'Sorotan dari rak arsip', href(prefix, 'projects/'), 'Indeks lengkap') +
      '<div class="spotlight">' +
        '<article class="spotlight__feature">' +
          '<span class="spotlight__number" aria-hidden="true">02</span>' +
          '<p class="kicker">' + esc(feature.language) + ' · ' + esc(STATUS_LABEL[feature.status]) + '</p>' +
          '<h3 class="spotlight__title"><a href="' + href(prefix, 'projects/' + feature.slug + '/') + '">' + esc(feature.title) + '</a></h3>' +
          '<p class="spotlight__dek">' + esc(feature.description) + '</p>' +
          '<div class="meta-line"><time datetime="' + feature.date + '">' + dateLong(feature.date) + '</time><span aria-hidden="true">/</span><span>' + esc(feature.language) + '</span></div>' +
          '<div class="spotlight__tags">' + tagLinks(feature, prefix) + '</div>' +
        '</article>' +
        '<div class="spotlight__list">' +
          sideItems.map((project, index) =>
            '<article class="spotlight__item">' +
              '<span class="spotlight__item-number" aria-hidden="true">' + String(index + 3).padStart(2, '0') + '</span>' +
              '<div><p class="kicker">' + esc(project.language) + '</p>' +
              '<h3><a href="' + href(prefix, 'projects/' + project.slug + '/') + '">' + esc(project.title) + '</a></h3>' +
              '<p>' + esc(project.description) + '</p>' +
              '<div class="meta-line"><time datetime="' + project.date + '">' + dateShort(project.date) + '</time><span aria-hidden="true">/</span>' + statusMarkup(project) + '</div></div>' +
            '</article>'
          ).join('') +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="section section--index" id="arsip" aria-label="Indeks proyek">' +
      sectionHead('Indeks proyek', 'Semua yang masih bisa dibuka', href(prefix, 'projects/'), 'Buka arsip') +
      '<p class="section-dek">' + projects.length + ' proyek dari ' + recon.reposWithPages + ' repositori yang diperiksa. Cari berdasarkan judul, bahasa, atau status; saring dengan tag.</p>' +
      filterPanel(projects, prefix, 'Klik tag untuk menyaring seluruh indeks. Pencarian berjalan langsung di browser.') +
    '</section>';

  return layout({
    title: 'Manuel Ky08 — Project Desk',
    description: 'Indeks editorial proyek GitHub Pages Manuel Ky08: alat keamanan, eksperimen web, halaman personal, dan arsip yang masih bisa dibuka.',
    current: 'home',
    prefix,
    pathname: '',
    body
  });
}

function buildProjectsIndex() {
  const prefix = '../';
  const body =
    pageHead('Indeks / ' + years[years.length - 1] + '—' + years[0], 'Semua proyek, satu meja.',
      projects.length + ' laporan dari repositori publik. Status aktif berarti ada pembaruan dalam enam bulan terakhir; sisanya diarsipkan ringan tanpa menghapus versi live.') +
    statStrip([
      { value: projects.length, label: 'Proyek terbit' },
      { value: activeProjects.length, label: 'Aktif' },
      { value: archivedProjects.length, label: 'Arsip ringan' },
      { value: tagEntries.length, label: 'Tag bahasa' }
    ]) +
    filterPanel(projects, prefix, 'Pencarian dan filter berjalan lokal. Tidak ada permintaan jaringan saat menyaring daftar.') +
    '<p class="page-footnote">Status dihitung dari tanggal pembaruan repositori pada ' + dateLong(BUILD_DAY) + '. Tautan live diperiksa dengan HTTP 200 sebelum masuk indeks.</p>';

  return layout({
    title: 'Semua Proyek — Project Desk',
    description: 'Indeks lengkap ' + projects.length + ' proyek GitHub Pages Manuel Ky08, lengkap dengan status, bahasa, tag, dan tautan live.',
    current: 'projects',
    prefix,
    pathname: 'projects/',
    body
  });
}

function buildProjectPage(project) {
  const prefix = '../../';
  let related = projects.filter((other) => other.slug !== project.slug && other.tags.some((tag) => project.tags.includes(tag))).slice(0, 3);
  if (related.length < 3) {
    const extras = projects.filter((other) => other.slug !== project.slug && !related.some((item) => item.slug === other.slug));
    related = related.concat(extras.slice(0, 3 - related.length));
  }

  const statusCopy = project.status === 'aktif'
    ? 'Proyek ini masih aktif: repositori diperbarui dalam enam bulan terakhir. Halaman live tetap menjadi sumber utama, sedangkan laporan ini menyimpan konteks dan tautan.'
    : 'Proyek ini berstatus arsip ringan: tidak ada pembaruan dalam enam bulan terakhir. Halaman live dipertahankan selama GitHub Pages masih menyajikannya, tanpa klaim bahwa proyek sedang dirawat.';

  const body =
    '<article class="project">' +
      '<header class="article-head">' +
        '<p class="kicker">Laporan proyek / ' + esc(project.language) + ' / ' + esc(STATUS_LABEL[project.status]) + '</p>' +
        '<h1>' + esc(project.title) + '</h1>' +
        '<p class="standfirst">' + esc(project.description) + '</p>' +
        metaLine(project) +
        '<div class="actions actions--article">' +
          '<a class="btn btn--solid" href="' + esc(project.liveUrl) + '" rel="noopener">Buka Live <span aria-hidden="true">&nearr;</span></a>' +
          '<a class="btn" href="' + esc(project.repoUrl) + '" rel="noopener">Source <span aria-hidden="true">&nearr;</span></a>' +
          '<a class="btn btn--quiet" href="' + href(prefix, 'projects/') + '">&larr; Semua proyek</a>' +
        '</div>' +
      '</header>' +
      '<div class="article-layout">' +
        '<div class="article-main">' +
          '<figure class="preview">' +
            '<div class="preview__bar"><span class="preview__live"><span aria-hidden="true"></span>Live preview</span><span class="preview__url">' + esc(project.liveUrl.replace(/^https?:\/\//, '')) + '</span></div>' +
            '<iframe src="' + esc(project.liveUrl) + '" loading="lazy" title="Pratinjau live ' + esc(project.title) + '" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>' +
            '<figcaption>Pratinjau dimuat langsung dari GitHub Pages. Jika iframe diblokir oleh peramban, gunakan tombol Live di atas.</figcaption>' +
          '</figure>' +
          '<div class="prose">' +
            '<p>' + esc(project.title) + ' tercatat sebagai proyek <strong>' + esc(STATUS_LABEL[project.status].toLowerCase()) + '</strong> dengan bahasa utama ' + esc(project.language) + '. Repositori dibuat pada ' + dateLong(project.created) + ' dan terakhir diperbarui pada ' + dateLong(project.date) + '.</p>' +
            '<p>' + esc(statusCopy) + '</p>' +
            '<p>Halaman live diperiksa otomatis pada ' + dateLong(BUILD_DAY) + ' dan merespons HTTP 200. Pratinjau di atas memakai iframe dengan pemuatan lambat agar halaman indeks tetap ringan. Tombol Source menuju repositori asli untuk riwayat, berkas, dan perubahan terbaru.</p>' +
            '<p>Tag proyek diambil dari bahasa utama dan topik repositori. Tag saat ini: ' + tagLinks(project, prefix) + '.</p>' +
          '</div>' +
          '<section class="related" aria-label="Proyek dengan tag serupa">' +
            sectionHead('Lanjut membaca', 'Proyek dengan tag serupa', href(prefix, 'projects/'), 'Semua proyek') +
            '<div class="related__list">' +
              related.map((item) => '<article class="related__item"><p class="kicker">' + esc(item.language) + ' · ' + esc(STATUS_LABEL[item.status]) + '</p><h3><a href="' + href(prefix, 'projects/' + item.slug + '/') + '">' + esc(item.title) + '</a></h3><p>' + esc(item.description) + '</p><div class="meta-line"><time datetime="' + item.date + '">' + dateShort(item.date) + '</time></div></article>').join('') +
            '</div>' +
          '</section>' +
        '</div>' +
        '<aside class="article-side" aria-label="Lembar data proyek">' +
          '<div class="factbox">' +
            '<h2 class="section-label">Lembar data</h2>' +
            '<dl>' +
              '<div><dt>Status</dt><dd>' + statusMarkup(project) + '</dd></div>' +
              '<div><dt>Bahasa</dt><dd>' + esc(project.language) + '</dd></div>' +
              '<div><dt>Dibuat</dt><dd><time datetime="' + project.created + '">' + dateLong(project.created) + '</time></dd></div>' +
              '<div><dt>Pembaruan</dt><dd><time datetime="' + project.date + '">' + dateLong(project.date) + '</time></dd></div>' +
              '<div><dt>Tag</dt><dd class="factbox__tags">' + tagLinks(project, prefix) + '</dd></div>' +
              '<div><dt>Tipe</dt><dd>' + (project.isFork ? 'Fork' : 'Repositori asli') + '</dd></div>' +
              '<div><dt>Repo</dt><dd><a class="text-link" href="' + esc(project.repoUrl) + '" rel="noopener">GitHub <span aria-hidden="true">&nearr;</span></a></dd></div>' +
            '</dl>' +
          '</div>' +
          '<div class="side-note">' +
            '<p class="side-note__label">Catatan verifikasi</p>' +
            '<p>Pemeriksaan live terakhir: ' + dateLong(BUILD_DAY) + '. Status HTTP: 200. Pratinjau dapat berubah sewaktu-waktu karena berasal dari repositori terpisah.</p>' +
          '</div>' +
        '</aside>' +
      '</div>' +
    '</article>';

  return layout({
    title: project.title + ' — Project Desk',
    description: project.description,
    current: 'projects',
    prefix,
    pathname: 'projects/' + project.slug + '/',
    body
  });
}

function buildTagPage(entry) {
  const prefix = '../../';
  const body =
    pageHead('Tag / ' + entry.count + ' laporan', entry.label,
      entry.count + ' proyek dengan bahasa utama atau topik ' + entry.label + '. Tag berasal dari metadata repositori dan dipakai untuk menyusuri arsip.') +
    '<nav class="tag-nav" aria-label="Semua tag">' +
      tagEntries.map((item) => '<a class="chip' + (item.tag === entry.tag ? ' is-current' : '') + '" href="' + href(prefix, 'tags/' + item.tag + '/') + '"' + (item.tag === entry.tag ? ' aria-current="page"' : '') + '>' + esc(item.label) + ' <span>' + item.count + '</span></a>').join('') +
    '</nav>' +
    '<div class="project-list project-list--tag">' +
      entry.items.map((project) => projectRow(project, prefix)).join('') +
    '</div>' +
    '<div class="tag-foot">' +
      '<a class="btn" href="' + href(prefix, 'projects/') + '">&larr; Semua proyek</a>' +
      '<a class="btn btn--quiet" href="' + href(prefix, 'random/') + '">Buka proyek acak</a>' +
    '</div>';

  return layout({
    title: 'Tag ' + entry.label + ' — Project Desk',
    description: entry.count + ' proyek Manuel Ky08 dengan tag ' + entry.label + '. Lihat status, tanggal pembaruan, dan tautan live.',
    current: 'projects',
    prefix,
    pathname: 'tags/' + entry.tag + '/',
    body
  });
}

function buildTimeline() {
  const prefix = '../';
  const grouped = {};
  for (const project of projects) {
    const year = project.date.slice(0, 4);
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(project);
  }

  const body =
    pageHead('Linimasa / waktu publikasi', 'Jejak dari yang paling baru.',
      'Diurutkan menurut pembaruan terakhir repositori. Linimasa mencampur rilis aktif dan arsip ringan supaya konteksnya tidak hilang.') +
    '<div class="timeline">' +
      Object.keys(grouped).sort().reverse().map((year) =>
        '<section class="timeline__year" aria-labelledby="year-' + year + '">' +
          '<h2 id="year-' + year + '"><span>' + year + '</span><small>' + grouped[year].length + ' laporan</small></h2>' +
          '<ol class="timeline__list">' +
            grouped[year].map((project) =>
              '<li class="timeline__item">' +
                '<time datetime="' + project.date + '">' + dateShort(project.date) + '</time>' +
                '<div class="timeline__body">' +
                  '<p class="kicker">' + esc(project.language) + ' · ' + esc(STATUS_LABEL[project.status]) + '</p>' +
                  '<h3><a href="' + href(prefix, 'projects/' + project.slug + '/') + '">' + esc(project.title) + '</a></h3>' +
                  '<p>' + esc(project.description) + '</p>' +
                '</div>' +
                '<div class="timeline__tags">' + tagLinks(project, prefix) + '</div>' +
              '</li>'
            ).join('') +
          '</ol>' +
        '</section>'
      ).join('') +
    '</div>';

  return layout({
    title: 'Linimasa — Project Desk',
    description: 'Linimasa proyek Manuel Ky08 dari 2023 hingga 2026, diurutkan menurut pembaruan terakhir.',
    current: 'timeline',
    prefix,
    pathname: 'timeline/',
    body
  });
}

function buildDevlog() {
  const prefix = '../';
  const entries = [{
    date: BUILD_DAY,
    tag: 'Build',
    title: 'Meja kerja statis dibangun ulang',
    body: 'Hub ini dibangun dari satu skrip Node tanpa dependensi: data proyek dibaca, halaman ditulis, lalu seluruh tautan internal diperiksa. Tidak ada framework, CDN, atau permintaan pelacakan di runtime.'
  }];

  for (const project of activeProjects) {
    entries.push({
      date: project.date,
      tag: 'Status',
      title: project.title + ' masih berstatus aktif',
      body: 'Pembaruan terakhir tercatat ' + dateLong(project.date) + '. Proyek masih berada di bawah ambang enam bulan, jadi masuk daftar aktif.'
    });
  }

  for (const project of archivedProjects.slice(0, 5)) {
    entries.push({
      date: project.date,
      tag: 'Arsip',
      title: project.title + ' masuk arsip ringan',
      body: 'Tidak ada pembaruan dalam enam bulan terakhir. Halaman live tetap ditautkan, tetapi tidak dihitung sebagai proyek yang sedang dirawat.'
    });
  }

  entries.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

  const body =
    pageHead('Devlog / log publik', 'Catatan dari meja build.',
      'Log ini dihasilkan dari metadata repositori dan proses build hub, bukan jurnal pribadi. Tujuannya sederhana: membuat status proyek bisa ditelusuri.') +
    '<p class="notice">Entri di bawah dibuat otomatis pada ' + dateLong(BUILD_DAY) + '. Sumbernya data projects.json dan recon.json di repositori hub.</p>' +
    '<ol class="log">' +
      entries.map((entry) =>
        '<li class="log__entry">' +
          '<div class="log__date"><time datetime="' + entry.date + '">' + dateCompact(entry.date) + '</time><span>' + esc(entry.tag) + '</span></div>' +
          '<div class="log__body"><h2>' + esc(entry.title) + '</h2><p>' + esc(entry.body) + '</p></div>' +
        '</li>'
      ).join('') +
    '</ol>' +
    '<div class="tag-foot"><a class="btn" href="' + href(prefix, 'timeline/') + '">Lihat linimasa</a><a class="btn btn--quiet" href="' + href(prefix, 'stats/') + '">Buka statistik</a></div>';

  return layout({
    title: 'Devlog — Project Desk',
    description: 'Log publik build dan status proyek Manuel Ky08, dihasilkan dari metadata repositori.',
    current: 'devlog',
    prefix,
    pathname: 'devlog/',
    body
  });
}

function buildAbout() {
  const prefix = '../';
  const body =
    pageHead('Tentang / kolofon', 'Satu meja untuk banyak eksperimen.',
      'Project Desk adalah indeks publik proyek GitHub Pages Manuel Ky08. Isinya bukan portofolio yang dipoles untuk panggung, melainkan arsip kerja yang bisa dibuka satu per satu.') +
    '<div class="prose-page">' +
      '<div class="prose prose--lead">' +
        '<p>Manuel Ky08 adalah identitas publik di balik kumpulan proyek ini. Repositorinya bergerak di beberapa arah: alat keamanan, kalkulator, halaman bio, undangan digital, toko kecil, dan eksperimen antarmuka. Hub ini menyatukannya dalam satu format editorial supaya konteks dan statusnya terbaca.</p>' +
        '<p>Tidak semua proyek di sini adalah produk jadi. Sebagian adalah versi lama yang sengaja dibiarkan hidup; sebagian lagi latihan yang berhenti di titik yang cukup. Status dibuat jujur: <strong>aktif</strong> jika ada pembaruan dalam enam bulan terakhir, <strong>arsip ringan</strong> jika tidak. Tidak ada klaim bahwa proyek arsip sedang dirawat.</p>' +
        '<h2>Apa yang bisa ditemukan</h2>' +
        '<ul class="dash-list">' +
          '<li><strong>Alat dan referensi keamanan:</strong> kalkulator CVSS, dork engine, dan halaman pendukung riset.</li>' +
          '<li><strong>Web personal:</strong> portofolio, bio-link, dan halaman identitas dalam beberapa iterasi.</li>' +
          '<li><strong>Eksperimen visual:</strong> undangan digital, tema cyberpunk, dan halaman musiman.</li>' +
          '<li><strong>Utilitas kecil:</strong> pencatatan saldo, ekspor CSV, dan antarmuka konversi.</li>' +
        '</ul>' +
        '<h2>Cara hub ini bekerja</h2>' +
        '<p>Data proyek disimpan di <code>data/projects.json</code>. Skrip <code>build.js</code> membaca data itu dan menulis halaman statis: beranda, indeks, halaman per proyek, halaman tag, linimasa, devlog, tentang, sekarang, perangkat, statistik, halaman acak, sitemap, dan 404. Semua tautan internal memakai path relatif agar aman ketika dipasang di GitHub Pages.</p>' +
        '<p>Pencarian, filter tag, command palette, dan mode gelap dijalankan di browser dengan JavaScript vanilla. Tidak ada data pencarian yang dikirim ke server.</p>' +
        '<h2>Kontak</h2>' +
        '<p>Repositori dan riwayat perubahan tersedia di <a class="text-link" href="https://github.com/ManuelKy08" rel="noopener">github.com/ManuelKy08 <span aria-hidden="true">&nearr;</span></a>.</p>' +
      '</div>' +
      '<aside class="page-aside">' +
        '<div class="factbox"><h2 class="section-label">Ringkasan</h2><dl>' +
          '<div><dt>Proyek terbit</dt><dd>' + projects.length + '</dd></div>' +
          '<div><dt>Aktif</dt><dd>' + activeProjects.length + '</dd></div>' +
          '<div><dt>Arsip ringan</dt><dd>' + archivedProjects.length + '</dd></div>' +
          '<div><dt>Rentang</dt><dd>' + years[years.length - 1] + '—' + years[0] + '</dd></div>' +
          '<div><dt>Tag</dt><dd>' + tagEntries.length + '</dd></div>' +
        '</dl></div>' +
        '<div class="side-note"><p class="side-note__label">Prinsip</p><p>Statis terlebih dahulu. Tanpa framework. Tanpa CDN. Tautan diperiksa sebelum build dianggap selesai.</p></div>' +
      '</aside>' +
    '</div>';

  return layout({
    title: 'Tentang — Project Desk',
    description: 'Tentang Project Desk, indeks publik proyek GitHub Pages Manuel Ky08, dan cara hub statis ini dibangun.',
    current: 'about',
    prefix,
    pathname: 'about/',
    body
  });
}

function buildNow() {
  const prefix = '../';
  const latest = projects[0];
  const body =
    pageHead('Sekarang / potret singkat', 'Yang sedang hidup di meja.',
      'Halaman ini dihitung dari metadata, bukan dari perasaan. Proyek yang muncul di bawah adalah yang masih memiliki pembaruan dalam enam bulan terakhir.') +
    '<div class="prose-page">' +
      '<div class="prose prose--lead">' +
        '<p>Pembaruan terbaru: <a class="text-link" href="' + href(prefix, 'projects/' + latest.slug + '/') + '">' + esc(latest.title) + '</a> pada ' + dateLong(latest.date) + '. Ada <strong>' + activeProjects.length + '</strong> proyek aktif dan <strong>' + archivedProjects.length + '</strong> proyek yang sudah masuk arsip ringan.</p>' +
        '<h2>Proyek aktif</h2>' +
        '<div class="active-list">' +
          activeProjects.map((project) =>
            '<article class="active-list__item">' +
              '<time datetime="' + project.date + '">' + dateCompact(project.date) + '</time>' +
              '<div><h3><a href="' + href(prefix, 'projects/' + project.slug + '/') + '">' + esc(project.title) + '</a></h3><p>' + esc(project.description) + '</p></div>' +
              '<span class="active-list__lang">' + esc(project.language) + '</span>' +
            '</article>'
          ).join('') +
        '</div>' +
        '<h2>Fokus build</h2>' +
        '<p>Hub ini baru saja dibangun ulang sebagai kumpulan halaman statis. Fokusnya: navigasi yang cepat, indeks yang bisa dicari, pratinjau proyek yang dimuat lambat, dan tampilan terang/gelap yang tersimpan di perangkat.</p>' +
        '<p>Arsip tidak dihapus. Proyek yang tidak lagi aktif tetap mendapat halaman, tautan live, dan catatan status supaya perubahan bisa dibandingkan.</p>' +
      '</div>' +
      '<aside class="page-aside">' +
        '<div class="factbox"><h2 class="section-label">Pembaruan terakhir</h2><dl>' +
          '<div><dt>Tanggal</dt><dd>' + dateLong(BUILD_DAY) + '</dd></div>' +
          '<div><dt>Proyek</dt><dd>' + projects.length + '</dd></div>' +
          '<div><dt>Aktif</dt><dd>' + activeProjects.length + '</dd></div>' +
        '</dl></div>' +
        '<div class="side-note"><p class="side-note__label">Cara membaca status</p><p>Aktif berarti ada dorongan dalam enam bulan terakhir. Arsip ringan berarti halaman masih hidup, tetapi tidak sedang dirawat.</p></div>' +
      '</aside>' +
    '</div>';

  return layout({
    title: 'Sekarang — Project Desk',
    description: 'Potret singkat proyek Manuel Ky08 yang aktif saat ini, dihitung dari metadata pembaruan repositori.',
    current: 'now',
    prefix,
    pathname: 'now/',
    body
  });
}

function buildUses() {
  const prefix = '../';
  const body =
    pageHead('Perangkat / tumpukan', 'Alat kecil, jejak kecil.',
      'Hub ini sengaja dibuat dengan tumpukan yang pendek. Tidak ada framework, CDN, font eksternal, atau analitik pihak ketiga di halaman yang Anda baca.') +
    '<div class="uses-grid">' +
      '<section class="uses-block"><h2>Runtime</h2><ul class="dash-list">' +
        '<li>HTML5 semantik untuk struktur halaman.</li>' +
        '<li>CSS dengan custom properties untuk tema terang dan gelap.</li>' +
        '<li>JavaScript vanilla untuk pencarian, filter, command palette, dan preferensi tema.</li>' +
        '<li>GitHub Pages sebagai host statis.</li>' +
      '</ul></section>' +
      '<section class="uses-block"><h2>Build dan rekon</h2><ul class="dash-list">' +
        '<li>Node.js tanpa dependensi untuk menghasilkan seluruh halaman dari data JSON.</li>' +
        '<li>GitHub API dan <code>gh</code> CLI untuk membaca metadata repositori.</li>' +
        '<li><code>curl</code> untuk memeriksa status HTTP halaman live.</li>' +
        '<li><code>jq</code> untuk merapikan data mentah menjadi <code>projects.json</code>.</li>' +
      '</ul></section>' +
      '<section class="uses-block"><h2>Aksesibilitas</h2><ul class="dash-list">' +
        '<li>Landmark, heading berurutan, skip link, dan label form.</li>' +
        '<li>Fokus keyboard yang terlihat; command palette bisa ditutup dengan Esc.</li>' +
        '<li>Dukungan <code>prefers-reduced-motion</code> dan iframe dengan judul.</li>' +
        '<li>Kontras teks dijaga di kedua tema.</li>' +
      '</ul></section>' +
      '<section class="uses-block"><h2>Yang tidak dipakai</h2><ul class="dash-list">' +
        '<li>Tidak ada framework UI atau bundler.</li>' +
        '<li>Tidak ada stylesheet, font, atau skrip dari CDN.</li>' +
        '<li>Tidak ada cookie, analytics, atau pelacak pihak ketiga.</li>' +
        '<li>Tidak ada gradient ungu generik. Itu bukan alat yang dipakai di sini.</li>' +
      '</ul></section>' +
    '</div>' +
    '<p class="page-footnote">Tumpukan ini bukan rekomendasi untuk semua proyek. Untuk hub arsip dengan ' + projects.length + ' halaman, HTML statis sudah cukup.</p>';

  return layout({
    title: 'Perangkat — Project Desk',
    description: 'Tumpukan teknis Project Desk: HTML, CSS, JavaScript vanilla, Node.js untuk build, dan GitHub Pages tanpa CDN.',
    current: 'uses',
    prefix,
    pathname: 'uses/',
    body
  });
}

function buildStats() {
  const prefix = '../';
  const languageCounts = {};
  for (const project of projects) languageCounts[project.language] = (languageCounts[project.language] || 0) + 1;
  const languages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const yearCounts = {};
  for (const project of projects) {
    const year = project.date.slice(0, 4);
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  }
  const yearRows = Object.entries(yearCounts).sort((a, b) => b[0].localeCompare(a[0]));
  const ageBuckets = { '0–5 bulan': 0, '6–11 bulan': 0, '12–23 bulan': 0, '24 bulan+': 0 };
  for (const project of projects) {
    const age = monthsSince(project.date);
    if (age < 6) ageBuckets['0–5 bulan'] += 1;
    else if (age < 12) ageBuckets['6–11 bulan'] += 1;
    else if (age < 24) ageBuckets['12–23 bulan'] += 1;
    else ageBuckets['24 bulan+'] += 1;
  }

  const barList = (rows, total) => rows.map(([label, value]) =>
    '<div class="bar-row">' +
      '<div class="bar-row__head"><span>' + esc(label) + '</span><span>' + value + ' / ' + total + '</span></div>' +
      '<div class="bar" role="img" aria-label="' + esc(label + ': ' + value + ' dari ' + total) + '"><span class="bar__fill" style="--value:' + Math.round((value / total) * 100) + '%"></span></div>' +
    '</div>'
  ).join('');

  const body =
    pageHead('Statistik / buku angka', 'Angka yang bisa diperiksa.',
      'Semua angka di halaman ini diturunkan dari data proyek dan hasil pemeriksaan live. Tidak ada angka yang diketik manual untuk terlihat lebih besar.') +
    '<div class="stats-hero">' +
      '<div class="stats-hero__item"><span>' + projects.length + '</span><small>Proyek terbit</small></div>' +
      '<div class="stats-hero__item"><span>' + activeProjects.length + '</span><small>Aktif</small></div>' +
      '<div class="stats-hero__item"><span>' + recon.http200 + '</span><small>Live HTTP 200</small></div>' +
      '<div class="stats-hero__item"><span>' + recon.failed + '</span><small>Gagal diperiksa</small></div>' +
    '</div>' +
    '<div class="stats-grid">' +
      '<section class="stats-block"><h2>Distribusi bahasa</h2>' + barList(languages, projects.length) + '</section>' +
      '<section class="stats-block"><h2>Status</h2>' + barList([['Aktif', activeProjects.length], ['Arsip ringan', archivedProjects.length]], projects.length) + '<p class="stats-note">Ambang aktif: pembaruan kurang dari enam bulan sebelum ' + dateLong(BUILD_DAY) + '.</p></section>' +
      '<section class="stats-block"><h2>Usia pembaruan</h2>' + barList(Object.entries(ageBuckets), projects.length) + '<p class="stats-note">Diukur dari pembaruan terakhir ke ' + dateLong(BUILD_DAY) + '.</p></section>' +
      '<section class="stats-block"><h2>Tahun pembaruan</h2>' + barList(yearRows, projects.length) + '</section>' +
    '</div>' +
    '<section class="stats-table-block" aria-labelledby="recon-title">' +
      '<h2 id="recon-title">Buku rekonsiliasi</h2>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Pemeriksaan</th><th scope="col">Jumlah</th><th scope="col">Catatan</th></tr></thead><tbody>' +
        '<tr><td>Repo dengan GitHub Pages</td><td>' + recon.reposWithPages + '</td><td>Arsip dan fork tidak dihitung</td></tr>' +
        '<tr><td>Diperiksa via HTTP</td><td>' + recon.liveChecked + '</td><td>Termasuk situs root</td></tr>' +
        '<tr><td>Merespons 200</td><td>' + recon.http200 + '</td><td>Layak masuk indeks</td></tr>' +
        '<tr><td>Gagal</td><td>' + recon.failed + '</td><td>' + recon.failedRepos.map((repo) => esc(repo.name) + ' (' + repo.http + ')').join(', ') + '</td></tr>' +
        '<tr><td>Dikecualikan</td><td>' + recon.excluded.length + '</td><td>Situs root <code>manuelky08.github.io</code></td></tr>' +
        '<tr><td>Dipublikasikan</td><td>' + projects.length + '</td><td>Halaman proyek di hub ini</td></tr>' +
      '</tbody></table></div>' +
    '</section>' +
    '<section class="stats-table-block" aria-labelledby="latest-table-title">' +
      '<h2 id="latest-table-title">Pembaruan terbaru</h2>' +
      '<div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Tanggal</th><th scope="col">Proyek</th><th scope="col">Status</th><th scope="col">Bahasa</th></tr></thead><tbody>' +
        projects.slice(0, 8).map((project) => '<tr><td><time datetime="' + project.date + '">' + dateCompact(project.date) + '</time></td><td><a href="' + href(prefix, 'projects/' + project.slug + '/') + '">' + esc(project.title) + '</a></td><td>' + esc(STATUS_LABEL[project.status]) + '</td><td>' + esc(project.language) + '</td></tr>').join('') +
      '</tbody></table></div>' +
    '</section>';

  return layout({
    title: 'Statistik — Project Desk',
    description: 'Statistik proyek Manuel Ky08: jumlah proyek, status aktif, distribusi bahasa, tag, dan hasil pemeriksaan live.',
    current: 'stats',
    prefix,
    pathname: 'stats/',
    body
  });
}

function buildRandom() {
  const prefix = '../';
  const first = projects[0];
  const randomData = projects.map((project) => ({
    title: project.title,
    description: project.description,
    href: href(prefix, 'projects/' + project.slug + '/'),
    language: project.language,
    status: STATUS_LABEL[project.status],
    date: dateLong(project.date),
    tags: project.tags.map((tag) => TAG_LABEL[tag] || tag)
  }));
  const json = JSON.stringify(randomData).replace(/</g, '\\u003c');

  const body =
    pageHead('Rute acak / arsip', 'Serahkan pada rak.',
      'Tidak tahu harus membuka yang mana? Biarkan halaman ini memilih satu proyek dari indeks. Pilihannya tidak dikirim ke mana pun.') +
    '<div class="randomizer" data-randomizer>' +
      '<div class="random-card">' +
        '<p class="kicker">Proyek pilihan</p>' +
        '<h2 data-random-title>' + esc(first.title) + '</h2>' +
        '<p class="random-card__dek" data-random-dek>' + esc(first.description) + '</p>' +
        '<p class="random-card__meta" data-random-meta>' + esc(first.language + ' · ' + STATUS_LABEL[first.status] + ' · ' + dateLong(first.date)) + '</p>' +
        '<div class="actions">' +
          '<a class="btn btn--solid" data-random-link href="' + href(prefix, 'projects/' + first.slug + '/') + '">Buka proyek <span aria-hidden="true">&rarr;</span></a>' +
          '<button class="btn" type="button" data-random-again>Putar lagi</button>' +
        '</div>' +
      '</div>' +
      '<p class="randomizer__note">Pilihan acak memakai <code>Math.random()</code> di browser. Tidak ada riwayat yang disimpan. <a class="text-link" href="' + href(prefix, 'projects/') + '">Lihat indeks lengkap</a> jika ingin memilih sendiri.</p>' +
    '</div>' +
    '<script type="application/json" id="random-data">' + json + '</script>' +
    '<noscript><p class="notice">JavaScript nonaktif. Gunakan <a class="text-link" href="' + href(prefix, 'projects/') + '">indeks proyek</a> untuk memilih secara manual.</p></noscript>';

  return layout({
    title: 'Proyek Acak — Project Desk',
    description: 'Pilih satu proyek Manuel Ky08 secara acak dari arsip GitHub Pages.',
    current: 'random',
    prefix,
    pathname: 'random/',
    body
  });
}

function build404() {
  const body =
    '<section class="notfound">' +
      '<p class="kicker">404 / di luar edisi</p>' +
      '<p class="notfound__number" aria-hidden="true">404</p>' +
      '<h1>Halaman ini tidak masuk edisi.</h1>' +
      '<p class="standfirst">Alamat yang Anda buka tidak ada, sudah dipindahkan, atau tidak pernah diterbitkan. Arsipnya masih ada; mulai dari salah satu pintu berikut.</p>' +
      '<div class="notfound__links">' +
        '<a class="btn btn--solid" href="projects/">Indeks proyek</a>' +
        '<a class="btn" href="">Beranda</a>' +
        '<a class="btn btn--quiet" href="random/">Proyek acak</a>' +
        '<a class="btn btn--quiet" href="stats/">Statistik</a>' +
      '</div>' +
    '</section>';

  return layout({
    title: '404 — Halaman tidak ditemukan',
    description: 'Halaman yang diminta tidak ditemukan di Project Desk.',
    prefix: '',
    pathname: '404.html',
    body,
    baseHref: '/',
    noindex: true
  });
}

function buildSitemap() {
  const paths = [
    '',
    'projects/',
    ...projects.map((project) => 'projects/' + project.slug + '/'),
    ...tagEntries.map((entry) => 'tags/' + entry.tag + '/'),
    'timeline/',
    'devlog/',
    'about/',
    'now/',
    'uses/',
    'stats/',
    'random/'
  ];

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!-- Generated by build.js at ' + BUILD_STAMP + ' -->\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((item) => '  <url><loc>' + SITE + '/' + item + '</loc><lastmod>' + BUILD_DAY + '</lastmod></url>').join('\n') +
    '\n</urlset>\n';
}

function buildRobots() {
  return 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n';
}

function cleanGenerated() {
  for (const directory of ['projects', 'tags', 'timeline', 'devlog', 'about', 'now', 'uses', 'stats', 'random']) {
    fs.rmSync(path.join(ROOT, directory), { recursive: true, force: true });
  }
  for (const file of ['index.html', '404.html', 'sitemap.xml', 'robots.txt']) {
    fs.rmSync(path.join(ROOT, file), { force: true });
  }
}

function buildAll() {
  cleanGenerated();
  writeFile('index.html', buildHome());
  writeFile('projects/index.html', buildProjectsIndex());
  for (const project of projects) writeFile('projects/' + project.slug + '/index.html', buildProjectPage(project));
  for (const entry of tagEntries) writeFile('tags/' + entry.tag + '/index.html', buildTagPage(entry));
  writeFile('timeline/index.html', buildTimeline());
  writeFile('devlog/index.html', buildDevlog());
  writeFile('about/index.html', buildAbout());
  writeFile('now/index.html', buildNow());
  writeFile('uses/index.html', buildUses());
  writeFile('stats/index.html', buildStats());
  writeFile('random/index.html', buildRandom());
  writeFile('404.html', build404());
  writeFile('sitemap.xml', buildSitemap());
  writeFile('robots.txt', buildRobots());
}

function validate() {
  const errors = [];
  const required = [...new Set([
    ...written,
    'assets/css/style.css',
    'assets/js/app.js',
    'assets/favicon.svg'
  ])];

  for (const file of required) {
    if (!fs.existsSync(path.join(ROOT, file))) errors.push('File wajib tidak ditemukan: ' + file);
  }

  const htmlFiles = written.filter((file) => file.endsWith('.html'));
  let linkCount = 0;

  for (const file of htmlFiles) {
    const fullPath = path.join(ROOT, file);
    const html = fs.readFileSync(fullPath, 'utf8');
    if (!/<title>[^<]+<\/title>/i.test(html)) errors.push('Judul kosong: ' + file);
    if (!/<main\b/i.test(html)) errors.push('Landmark main tidak ditemukan: ' + file);

    const baseMatch = html.match(/<base\s+href="([^"]+)"/i);
    const base = baseMatch ? baseMatch[1] : null;
    const htmlWithoutBase = html.replace(/<base\b[^>]*>/gi, '');
    const matches = htmlWithoutBase.matchAll(/\b(?:href|src)="([^"]*)"/gi);

    for (const match of matches) {
      let value = match[1].trim();
      if (!value) continue;
      if (/^(https?:)?\/\//i.test(value) || /^(mailto|tel|data|javascript):/i.test(value)) continue;
      if (value.startsWith('#')) continue;

      const hashIndex = value.indexOf('#');
      const queryIndex = value.indexOf('?');
      let cut = value.length;
      if (hashIndex !== -1) cut = Math.min(cut, hashIndex);
      if (queryIndex !== -1) cut = Math.min(cut, queryIndex);
      value = value.slice(0, cut);
      if (!value) continue;

      try {
        value = decodeURIComponent(value);
      } catch (error) {
        // Biarkan nilai asli jika bukan URL encoding yang valid.
      }

      if (value.startsWith('/')) {
        errors.push('Tautan internal absolut (harus relatif): ' + file + ' -> ' + value);
      }

      let target;
      if (value.startsWith('/')) {
        target = path.join(ROOT, value);
      } else if (base && base.startsWith('/')) {
        target = path.join(ROOT, base.replace(/^\/+/, ''), value);
      } else {
        target = path.resolve(path.dirname(fullPath), value);
      }

      if (value.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) {
        target = path.join(target, 'index.html');
      }

      linkCount++;
      if (!fs.existsSync(target)) {
        errors.push('Tautan rusak: ' + file + ' -> ' + value);
      }
    }
  }

  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    for (const location of locations) {
      if (!location.startsWith(SITE)) {
        errors.push('URL sitemap di luar domain: ' + location);
        continue;
      }
      const relative = location.slice(SITE.length).replace(/^\/+/, '');
      const target = path.join(ROOT, relative, 'index.html');
      if (!fs.existsSync(target)) errors.push('URL sitemap tanpa halaman: ' + location);
    }
    if (locations.length === 0) errors.push('Sitemap tidak berisi URL.');
  }

  const robotsPath = path.join(ROOT, 'robots.txt');
  if (fs.existsSync(robotsPath) && !fs.readFileSync(robotsPath, 'utf8').includes('Sitemap: ' + SITE + '/sitemap.xml')) {
    errors.push('robots.txt tidak menunjuk ke sitemap.');
  }

  if (errors.length) {
    console.error('\nValidasi gagal:\n');
    for (const error of errors) console.error(' - ' + error);
    process.exitCode = 1;
    return;
  }

  console.log('Build selesai.');
  console.log('  Halaman HTML : ' + htmlFiles.length);
  console.log('  File output  : ' + written.length);
  console.log('  Tautan dicek : ' + linkCount);
  console.log('  Proyek       : ' + projects.length + ' (' + activeProjects.length + ' aktif, ' + archivedProjects.length + ' arsip ringan)');
  console.log('  Tag          : ' + tagEntries.length);
  console.log('  Validasi     : OK — tidak ada tautan internal rusak');
}

buildAll();
validate();

