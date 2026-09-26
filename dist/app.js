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
  }

  const destination = { x: 0, y: 0 };
  const position = { x: 0, y: 0 };
  let skyFrame = 0;
  const beamCanvas = document.getElementById('headlightCanvas');
  const beamContext = beamCanvas.getContext('2d');
  function drawBeams() {
    const box = heroStage.getBoundingClientRect();
    const car = heroCharacter.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    if (beamCanvas.width !== Math.round(box.width * ratio) || beamCanvas.height !== Math.round(box.height * ratio)) {
      beamCanvas.width = Math.round(box.width * ratio); beamCanvas.height = Math.round(box.height * ratio);
    }
    beamContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    beamContext.clearRect(0, 0, box.width, box.height);
    if (heroStage.classList.contains('arriving')) return;
    const tx = box.width / 2 + position.x, ty = box.height / 2 + position.y;
    [[.043,.52],[.318,.54]].forEach(([x,y]) => {
      const ox=car.left-box.left+car.width*x, oy=car.top-box.top+car.height*y;
      const angle=Math.atan2(ty-oy,tx-ox), spread=24;
      const px=-Math.sin(angle)*spread, py=Math.cos(angle)*spread;
      const gradient=beamContext.createLinearGradient(ox,oy,tx,ty);
      gradient.addColorStop(0,'rgba(110,231,255,.48)'); gradient.addColorStop(1,'rgba(110,231,255,0)');
      beamContext.fillStyle=gradient; beamContext.beginPath(); beamContext.moveTo(ox,oy); beamContext.lineTo(tx+px,ty+py); beamContext.lineTo(tx-px,ty-py); beamContext.closePath(); beamContext.fill();
      beamContext.fillStyle='#baf5ff'; beamContext.shadowColor='#6ee7ff'; beamContext.shadowBlur=14; beamContext.beginPath(); beamContext.arc(ox,oy,2.5,0,Math.PI*2); beamContext.fill(); beamContext.shadowBlur=0;
    });
  }
  function renderDreamer() {
    position.x += (destination.x - position.x) * (reduceMotion ? 1 : .12);
    position.y += (destination.y - position.y) * (reduceMotion ? 1 : .12);
    drawBeams();
    if (Math.abs(destination.x - position.x) + Math.abs(destination.y - position.y) > .1) skyFrame = requestAnimationFrame(renderDreamer);
    else skyFrame = 0;
  }
  function guideDreamer(x, y) {
    const maxX = heroStage.clientWidth / 2 - 12;
    const maxY = heroStage.clientHeight / 2 - 12;
    destination.x = Math.max(-maxX, Math.min(maxX, x));
    destination.y = Math.max(-maxY, Math.min(maxY, y));
    if (!skyFrame) skyFrame = requestAnimationFrame(renderDreamer);
  }
  function moveInSky(event) {
    if (event.pointerType === 'touch' && !heroStage.hasPointerCapture(event.pointerId)) return;
    const box = heroStage.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / (box.width / 2)));
    const ny = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / (box.height / 2)));
    guideDreamer(nx * box.width / 2, ny * box.height / 2);
    heroStage.classList.add('is-exploring');
    document.getElementById('dreamerStatus').textContent = 'TARGET LOCKED';
  }
  function resetDreamer() {
    guideDreamer(-heroStage.clientWidth * .22, heroStage.clientHeight * .26);
    heroStage.classList.remove('is-exploring');
    document.getElementById('dreamerStatus').textContent = 'SYSTEM READY';
  }
  heroStage.addEventListener('pointermove', moveInSky);
  heroStage.addEventListener('pointerdown', event => { if (event.target.closest('a,button')) return; heroStage.setPointerCapture(event.pointerId); moveInSky(event); });
  heroStage.addEventListener('pointerleave', resetDreamer);
  heroStage.addEventListener('pointerup', resetDreamer);
  heroStage.addEventListener('pointercancel', resetDreamer);
  heroStage.addEventListener('blur', resetDreamer);
  heroStage.addEventListener('keydown', event => {
    const moves = { ArrowLeft: [-25, 0], ArrowRight: [25, 0], ArrowUp: [0, -25], ArrowDown: [0, 25] };
    if (event.key === 'Escape') resetDreamer();
    if (!moves[event.key]) return;
    event.preventDefault();
    guideDreamer(destination.x + moves[event.key][0], destination.y + moves[event.key][1]);
  });
  document.getElementById('resetDreamer').addEventListener('click', resetDreamer);
  window.addEventListener('resize', resetDreamer, { passive: true });
  let arrivalTimer;
  function replayArrival() {
    clearTimeout(arrivalTimer);
    heroStage.classList.remove('arriving');
    void heroStage.offsetWidth;
    if (!reduceMotion) heroStage.classList.add('arriving');
    drawBeams();
    arrivalTimer = setTimeout(() => { heroStage.classList.remove('arriving'); resetDreamer(); }, reduceMotion ? 0 : 3800);
  }
  document.getElementById('replayDrive').addEventListener('click', replayArrival);
  const arrivalObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && !document.documentElement.classList.contains('booting')) { replayArrival(); arrivalObserver.disconnect(); }
  }, {threshold:.25});
  const bootObserver = new MutationObserver(() => {
    if (!document.documentElement.classList.contains('booting')) { arrivalObserver.observe(heroStage); bootObserver.disconnect(); }
  });
  bootObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  if (!document.documentElement.classList.contains('booting')) arrivalObserver.observe(heroStage);
  resetDreamer();

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
  resizeSky(); drawSky(); setupTilt(); setupMagnetic(); updateCountdown(); setInterval(updateCountdown, 1000);
})();
