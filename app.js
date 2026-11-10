(() => {
  'use strict';

  const API_URL = 'https://limitx-server-production-c7b1.up.railway.app/api/version';
  const SITE_URL = 'https://dawoodalaa.github.io/LimitX-site/';
  const FALLBACK = {
    version: '1.0.68',
    android: 'https://github.com/DawoodAlaa/limitx-releases/releases/download/v1.0.68/LimitX-App-1.0.68.apk',
    windows: 'https://github.com/DawoodAlaa/limitx-releases/releases/download/v1.0.68/LimitX-Setup.exe',
  };
  const LABELS = {
    android: { main: 'حمّل للأندرويد مجانًا', alt: 'أو حمّل نسخة الأندرويد', short: 'تحميل للأندرويد', meta: 'ملف APK · حوالي 62 ميجا · Android 8 أو أحدث' },
    windows: { main: 'حمّل للويندوز مجانًا', alt: 'أو حمّل نسخة الويندوز', short: 'تحميل للويندوز', meta: 'ملف Setup · حوالي 13 ميجا · Windows 10 أو أحدث' },
  };

  const byId = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const ua = navigator.userAgent || '';
  const urls = { android: FALLBACK.android, windows: FALLBACK.windows };

  function detectPlatform() {
    const forced = params.get('platform');
    if (forced === 'android' || forced === 'windows') return forced;
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (/windows/i.test(ua)) return 'windows';
    return '';
  }
  const platform = detectPlatform();
  const device = platform === 'android' || platform === 'windows' ? platform : '';
  // متصفح فيسبوك/إنستجرام/تيك توك الداخلي غالبًا مبيحمّلش ملفات
  const inAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|Snapchat/i.test(ua);

  function setText(el, text) {
    const label = el.querySelector('[data-label]');
    (label || el).textContent = text;
  }

  // كل رابط تحميل عليه data-dl: android أو windows أو auto (حسب جهاز الزائر)
  function applyLinks() {
    document.querySelectorAll('[data-dl]').forEach((link) => {
      const target = link.dataset.dl === 'auto' ? device : link.dataset.dl;
      if (!target) {
        link.href = '#download';
        return;
      }
      link.href = urls[target];
      link.dataset.resolved = target;
      link.classList.remove('is-loading');
      link.removeAttribute('aria-disabled');
      if (link.dataset.dl === 'auto') setText(link, link.dataset.short ? LABELS[target].short : LABELS[target].main);
    });
  }

  function setupHero() {
    const android = byId('hero-android');
    const windows = byId('hero-windows');
    const meta = byId('hero-meta');
    if (!android || !windows) return;
    if (device) {
      const main = device === 'android' ? android : windows;
      const alt = device === 'android' ? windows : android;
      const altKey = device === 'android' ? 'windows' : 'android';
      main.className = 'button button-primary button-big';
      setText(main, LABELS[device].main);
      alt.className = 'cta-alt-link';
      alt.textContent = LABELS[altKey].alt;
      main.parentNode.insertBefore(main, alt);
      if (meta) meta.dataset.platformMeta = LABELS[device].meta;
    }
    if (platform === 'ios') byId('ios-note').hidden = false;
    if (platform === 'android' && inAppBrowser) {
      const note = byId('inapp-note');
      const open = byId('open-in-chrome');
      const fallback = encodeURIComponent(`${SITE_URL}?platform=android`);
      open.href = `intent://dawoodalaa.github.io/LimitX-site/?platform=android#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
      note.hidden = false;
    }
    const share = byId('share-whatsapp');
    if (share) share.href = `https://wa.me/?text=${encodeURIComponent(`برنامج LimitX لإدارة محل الكاش — حمّله من هنا: ${SITE_URL}`)}`;
  }

  function highlightPlatform() {
    if (!device) return;
    document.querySelectorAll('[data-platform-card]').forEach((card) => {
      const match = card.dataset.platformCard === device;
      card.classList.toggle('is-recommended', match);
      const tag = card.querySelector('.platform-tag');
      if (match && tag) tag.textContent = 'مناسب لجهازك';
    });
  }

  function showAppContext() {
    const context = byId('app-update-context');
    if (!context || params.get('from') !== 'app') return;
    context.hidden = false;
    const name = device === 'android' ? 'Android' : device === 'windows' ? 'Windows' : 'جهازك';
    context.querySelector('strong').textContent = `جاي من داخل التطبيق — تحديث ${name}`;
    context.querySelector('span').textContent = device === 'android'
      ? 'احفظ نسخة احتياطية قبل التحديث، ثم ثبّت ملف APK الجديد.'
      : 'نزّل المثبّت الجديد وشغّله فوق النسخة الحالية للحفاظ على بياناتك.';
  }

  let toastTimer;
  function toast(text) {
    const el = byId('toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('is-visible'), 6000);
  }

  // بعد ما التحميل يبدأ نودّي العميل على خطوات التثبيت بتاعة جهازه
  function afterDownloadClick(target) {
    toast('التحميل بدأ. بعد ما يخلص افتح الملف واتبع الخطوات دي.');
    window.setTimeout(() => {
      const card = byId(`install-${target}`);
      if (!card) return;
      document.querySelectorAll('.install-card').forEach((c) => c.classList.remove('is-active'));
      card.classList.add('is-active');
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 900);
  }

  function watchClicks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-dl]');
      if (link && link.dataset.resolved) afterDownloadClick(link.dataset.resolved);
    });
  }

  // شريط التحميل الثابت يظهر على الموبايل لما زرار الهيرو يختفي من الشاشة
  function setupStickyBar() {
    const bar = byId('sticky-cta');
    const hero = byId('hero-cta');
    if (!bar || !hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([entry]) => {
      bar.classList.toggle('is-visible', !entry.isIntersecting);
    }).observe(hero);
  }

  function renderVersion(version) {
    document.querySelectorAll('[data-version]').forEach((el) => { el.textContent = version; });
    const meta = byId('hero-meta');
    if (meta) meta.textContent = `الإصدار ${version}${meta.dataset.platformMeta ? ` · ${meta.dataset.platformMeta}` : ' · Android وWindows'}`;
  }

  async function loadVersion() {
    try {
      const response = await fetch(`${API_URL}?site=limitx`, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const okUrl = (u) => typeof u === 'string' && u.startsWith('https://github.com/DawoodAlaa/limitx-releases/');
      if (okUrl(payload.apk_url)) urls.android = payload.apk_url;
      if (okUrl(payload.windows_url)) urls.windows = payload.windows_url;
      applyLinks();
      if (typeof payload.version === 'string' && /^\d+\.\d+\.\d+$/.test(payload.version)) renderVersion(payload.version);
    } catch (error) {
      // روابط آخر إصدار معروف بتفضل شغالة لو السيرفر مردش
      console.warn('LimitX version check failed:', error);
    }
  }

  function start() {
    setupHero();
    applyLinks();
    renderVersion(FALLBACK.version);
    highlightPlatform();
    showAppContext();
    watchClicks();
    setupStickyBar();
    loadVersion();
    if (params.get('from') === 'app') {
      window.setTimeout(() => byId('download')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
