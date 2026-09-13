(() => {
  'use strict';

  const API_URL = 'https://limitx-server-production-c7b1.up.railway.app/api/version';
  const RELEASE_ROOT = 'https://github.com/DawoodAlaa/limitx-releases/releases/download/v';
const FALLBACK_VERSION = '1.0.42';
  const FALLBACK_NOTES = 'آخر نسخة رسمية من LimitX متاحة للتحميل الآن.';

  const byId = (id) => document.getElementById(id);
  const params = new URLSearchParams(window.location.search);

  function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'android';
    if (/windows/.test(userAgent)) return 'windows';
    return '';
  }

  function assetUrl(version, fileName) {
    return `${RELEASE_ROOT}${encodeURIComponent(version)}/${fileName}`;
  }

  function setDownloadLink(id, url, label) {
    const link = byId(id);
    if (!link) return;
    link.href = url;
    link.setAttribute('aria-label', `${label} - LimitX`);
    link.removeAttribute('aria-disabled');
    link.classList.remove('is-loading');
  }

  function highlightPlatform(platform) {
    if (!platform) return;
    document.querySelectorAll('[data-platform-card]').forEach((card) => {
      card.classList.toggle('is-recommended', card.dataset.platformCard === platform);
    });
  }

  function showAppContext(platform) {
    const context = byId('app-update-context');
    if (!context || params.get('from') !== 'app') return;
    context.hidden = false;
    const platformName = platform === 'android' ? 'Android' : platform === 'windows' ? 'Windows' : 'جهازك';
    context.querySelector('strong').textContent = `جاي من داخل التطبيق — تحديث ${platformName}`;
    context.querySelector('span').textContent = platform === 'android'
      ? 'احفظ نسخة احتياطية قبل التحديث، ثم ثبّت ملف APK الجديد.'
      : 'نزّل المثبّت الجديد وشغّله فوق النسخة الحالية للحفاظ على بياناتك.';
    window.setTimeout(() => {
      const download = byId('download');
      if (download) download.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function renderVersion(version, notes, sourceOk) {
    const versionLabel = byId('latest-version');
    const releaseNotes = byId('release-notes');
    if (versionLabel) versionLabel.textContent = `LimitX ${version}`;
    if (releaseNotes) {
      releaseNotes.textContent = sourceOk ? (notes || FALLBACK_NOTES) : `آخر نسخة معروفة: ${version}. جرّب التحديث مرة أخرى لاحقًا.`;
    }

    setDownloadLink('download-android', assetUrl(version, 'LimitX-App.apk'), 'تحميل APK');
    setDownloadLink('download-windows', assetUrl(version, 'LimitX-Setup.exe'), 'تحميل Setup');
  }

  async function loadVersion() {
    const platform = params.get('platform') || detectPlatform();
    highlightPlatform(platform);
    showAppContext(platform);

    try {
      const response = await fetch(`${API_URL}?site=limitx`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const version = typeof payload.version === 'string' && /^\d+\.\d+\.\d+$/.test(payload.version)
        ? payload.version
        : FALLBACK_VERSION;
      renderVersion(version, typeof payload.notes === 'string' ? payload.notes : '', true);
    } catch (error) {
      // The download links remain useful during a short API outage.
      console.warn('LimitX version check failed:', error);
      renderVersion(FALLBACK_VERSION, FALLBACK_NOTES, false);
    }
  }

  document.addEventListener('DOMContentLoaded', loadVersion, { once: true });
})();
