(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.getElementById('cloudLoader');
  let bootFinished = false;
  let loaderExit;
  const introSurfaces = [...document.querySelectorAll('.site-header, main, .site-footer, #eventDock')];
  function finishBoot(skipped = false) {
    if (bootFinished) return;
    bootFinished = true;
    clearTimeout(window.cloudBootFallback);
    document.documentElement.classList.remove('booting');
    document.getElementById('loaderBar').style.width = '100%';
    document.getElementById('loaderPercent').textContent = '100%';
    document.getElementById('loaderStatus').textContent = 'WELCOME TO HACK THE CLOUD';
    introSurfaces.forEach(element => element.inert = false);
    loader.classList.add('loader-out');
    setupReveals();
    const restoreFocus = loader.contains(document.activeElement);
    loaderExit = setTimeout(() => {
      loader.hidden = true;
      if (restoreFocus) document.querySelector('.site-header .logo').focus();
    }, reduceMotion ? 0 : 650);
    if (skipped) document.dispatchEvent(new CustomEvent('cloud:skip-intro'));
  }
  function beginBoot() {
    clearTimeout(loaderExit);bootFinished = false;loader.hidden = false;loader.classList.remove('loader-out');
    document.documentElement.classList.add('booting');
    introSurfaces.forEach(element => {element.inert = true;element.dataset.introInert = '';});
    document.getElementById('loaderBar').style.width = '0%';
    document.getElementById('loaderPercent').textContent = '00%';
    clearTimeout(window.cloudBootFallback);
    window.cloudBootFallback = setTimeout(() => finishBoot(true),35000);
    document.getElementById('loaderSkip').focus({preventScroll:true});
    if (reduceMotion) queueMicrotask(() => finishBoot(true));
  }
  document.getElementById('loaderSkip').addEventListener('click', () => finishBoot(true));
  document.addEventListener('cloud:intro-complete', () => finishBoot());
  document.addEventListener('cloud:intro-failed', () => finishBoot(true));
  document.addEventListener('cloud:replay-intro', beginBoot);
  document.addEventListener('cloud:intro-progress', event => {
    if(bootFinished)return;
    const percent=Math.floor(event.detail.progress*100);
    document.getElementById('loaderBar').style.width = `${percent}%`;
    document.getElementById('loaderPercent').textContent = `${String(percent).padStart(2,'0')}%`;
    const label = document.getElementById('loaderStatus');
    if(label.textContent!==event.detail.label)label.textContent=event.detail.label;
  });
  loader.addEventListener('keydown',event=>{if(event.key==='Escape')finishBoot(true);});
  beginBoot();
  const finePointer = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  const header = document.querySelector('.site-header');

  function onPointerMove(event) {
    document.body.classList.add('cursor-live');
    root.style.setProperty('--mx', ((event.clientX / innerWidth) - .5).toFixed(3));
    root.style.setProperty('--my', ((event.clientY / innerHeight) - .5).toFixed(3));
  }

  // The driving scene and its input lifecycle live in src/drive3d.js.

  function setupReveals() {
    if (reduceMotion) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), { threshold: .14, rootMargin: '0px 0px -45px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  function setupTilt() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - .5;
        const y = (event.clientY - box.top) / box.height - .5;
        card.style.setProperty('--shine-x', `${(x+.5)*100}%`);
        card.style.setProperty('--shine-y', `${(y+.5)*100}%`);
        card.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => {card.style.transform = '';card.style.removeProperty('--shine-x');card.style.removeProperty('--shine-y');});
    });
  }

  function setupMagnetic() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.magnetic').forEach(item => {
      item.addEventListener('pointermove', event => {
        const box = item.getBoundingClientRect();
        item.style.transform = `translate(${(event.clientX - box.left - box.width / 2) * .12}px, ${(event.clientY - box.top - box.height / 2) * .16}px)`;
      });
      item.addEventListener('pointerleave', () => item.style.transform = '');
    });
  }

  function updateCountdown() {
    const launch = new Date('2026-10-24T09:00:00+05:30').getTime();
    const distance = Math.max(0, launch - Date.now());
    const units = { days: Math.floor(distance / 86400000), hours: Math.floor((distance % 86400000) / 3600000), minutes: Math.floor((distance % 3600000) / 60000), seconds: Math.floor((distance % 60000) / 1000) };
    Object.entries(units).forEach(([unit, value]) => {
      const el = document.querySelector(`[data-time="${unit}"]`);
      if (el) el.textContent = String(value).padStart(2, '0');
    });
  }

  const dialog = document.getElementById('registerDialog');
  const form = document.getElementById('registerForm');
  document.querySelectorAll('[data-open-register]').forEach(button => button.addEventListener('click', () => {
    form.hidden = false;dialog.querySelector('.dialog-copy').hidden = false;dialog.querySelector('.form-success').hidden = true;
    dialog.showModal();
  }));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  document.querySelector('[data-close-register]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  // Registration is submitted to the site's server by interactions.js.

  document.querySelectorAll('a, button, summary, input, select').forEach(item => {
    item.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    item.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 24), { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerMove, { passive: true });
  setupTilt(); setupMagnetic(); updateCountdown(); setInterval(updateCountdown, 1000);
})();
