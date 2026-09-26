(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.getElementById('cloudLoader');
  const started = performance.now();
  let bootFinished = false;
  let bootProgress = 0;
  let assetsReady = document.readyState === 'complete';
  window.addEventListener('load', () => { assetsReady = true; }, { once: true });
  function finishBoot() {
    if (bootFinished) return;
    bootFinished = true;
    clearTimeout(window.cloudBootFallback);
    document.documentElement.classList.remove('booting');
    document.getElementById('loaderBar').style.width = '100%';
    document.getElementById('loaderPercent').textContent = '100%';
    document.getElementById('loaderStatus').textContent = 'Ready to build';
    loader.classList.add('loader-out');
    setupReveals();
    const restoreFocus = loader.contains(document.activeElement);
    setTimeout(() => {
      loader.remove();
      if (restoreFocus) document.querySelector('.site-header .logo').focus();
    }, reduceMotion ? 0 : 700);
  }
  document.getElementById('loaderSkip').addEventListener('click', finishBoot);
  function bootFrame(now) {
    if (bootFinished) return;
    const elapsed = now - started;
    bootProgress = Math.max(bootProgress, Math.min(92, elapsed / 26));
    document.getElementById('loaderBar').style.width = bootProgress + '%';
    document.getElementById('loaderPercent').textContent = String(Math.floor(bootProgress)).padStart(2, '0') + '%';
    const status = bootProgress < 35 ? 'Gathering the clouds' : bootProgress < 72 ? 'Connecting the dreamers' : 'Preparing for takeoff';
    const label = document.getElementById('loaderStatus');
    if (label.textContent !== status) label.textContent = status;
    if ((assetsReady && elapsed > (reduceMotion ? 0 : 2600)) || elapsed > 5000) finishBoot();
    else requestAnimationFrame(bootFrame);
  }
  requestAnimationFrame(bootFrame);
  const finePointer = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const heroStage = document.getElementById('heroStage');
  const heroCharacter = document.getElementById('heroCharacter');
  const canvas = document.getElementById('sky');
  const ctx = canvas.getContext('2d');
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  let follower = { ...pointer };
  let stars = [];
  let width = innerWidth;
  let height = innerHeight;
  let dpr = Math.min(devicePixelRatio || 1, 2);

  function resizeSky() {
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(125, Math.round((width * height) / 12000));
    stars = Array.from({ length: count }, (_, i) => ({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.45 + .25, a: Math.random() * .7 + .15, pulse: Math.random() * Math.PI * 2, depth: .15 + Math.random() * .8, cyan: i % 7 === 0 }));
  }

  function drawSky(time = 0) {
    ctx.clearRect(0, 0, width, height);
    const dx = (pointer.x / width - .5) * 20;
    const dy = (pointer.y / height - .5) * 12;
    stars.forEach(star => {
      const alpha = star.a * (.72 + Math.sin(time * .001 + star.pulse) * .28);
      ctx.fillStyle = star.cyan ? `rgba(110,231,255,${alpha})` : `rgba(255,253,245,${alpha})`;
      ctx.shadowBlur = star.cyan ? 8 : 4;
      ctx.shadowColor = star.cyan ? '#6ee7ff' : '#fffdf5';
      ctx.beginPath();
      ctx.arc(star.x + dx * star.depth, star.y + dy * star.depth, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    requestAnimationFrame(drawSky);
  }

  function onPointerMove(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    document.body.classList.add('cursor-live');
    root.style.setProperty('--mx', ((event.clientX / innerWidth) - .5).toFixed(3));
    root.style.setProperty('--my', ((event.clientY / innerHeight) - .5).toFixed(3));
    const box = heroStage.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / (box.width / 2)));
    const ny = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / (box.height / 2)));
    heroCharacter.style.setProperty('--char-x', `${nx * 42}px`);
    heroCharacter.style.setProperty('--char-y', `${ny * 28}px`);
    heroCharacter.style.setProperty('--char-rx', `${-ny * 4}deg`);
    heroCharacter.style.setProperty('--char-ry', `${nx * 7}deg`);
    heroStage.querySelectorAll('[data-depth]').forEach(el => {
      const depth = Number(el.dataset.depth);
      el.style.translate = `${nx * depth * 12}px ${ny * depth * 10}px`;
    });
  }

  function animateCursor() {
    follower.x += (pointer.x - follower.x) * .18;
    follower.y += (pointer.y - follower.y) * .18;
    root.style.setProperty('--cursor-x', `${follower.x}px`);
    root.style.setProperty('--cursor-y', `${follower.y}px`);
    requestAnimationFrame(animateCursor);
  }

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
        card.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
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
  document.querySelectorAll('[data-open-register]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  document.querySelector('[data-close-register]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    form.hidden = true;
    dialog.querySelector('.dialog-copy').hidden = true;
    dialog.querySelector('.form-success').hidden = false;
  });

  document.querySelectorAll('a, button, summary, input, select').forEach(item => {
    item.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    item.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 24), { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerMove, { passive: true });
  window.addEventListener('resize', resizeSky, { passive: true });
  resizeSky(); drawSky(); animateCursor(); setupTilt(); setupMagnetic(); updateCountdown(); setInterval(updateCountdown, 1000);
})();
