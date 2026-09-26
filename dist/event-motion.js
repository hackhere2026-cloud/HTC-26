// Original native-browser implementation inspired by Codrops ScrollTextMotion.
// See ../ANIMATION-NOTES.md for the reference and implementation choices.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const dock = document.getElementById('eventDock');
  const hero = document.querySelector('.hero');
  const footer = document.querySelector('.site-footer');
  const line = document.createElement('div');
  line.className = 'reading-line';
  line.setAttribute('aria-hidden', 'true');
  document.body.append(line);
  let scheduled = false;
  const scenes = [...document.querySelectorAll('main > section')];
  function updateScroll() {
    scheduled = false;
    const travel = document.documentElement.scrollHeight - innerHeight;
    document.documentElement.style.setProperty('--reading', travel > 0 ? Math.min(1, scrollY / travel) : 0);
    dock.hidden = hero.getBoundingClientRect().bottom > 90 || footer.getBoundingClientRect().top < innerHeight;
    if (!reduced.matches) {
      hero.style.setProperty('--hero-drift', `${Math.min(scrollY * .16, 100)}px`);
      scenes.forEach(scene => {
        const bounds = scene.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > innerHeight) return;
        scene.style.setProperty('--scene-progress', Math.min(1, Math.max(.2, (innerHeight - bounds.top) / (innerHeight * .6))));
      });
    }
  }
  addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  // Observe the existing reveal lifecycle so headings enter after the intro.
  const pending = new Set();
  document.querySelectorAll('main h1, main h2').forEach(heading => {
    if (reduced.matches) return;
    const textNodes = [];
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(word => {
        if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
        const mask = document.createElement('span');
        mask.className = 'word-mask';
        const inner = document.createElement('span');
        inner.className = 'motion-word';
        inner.textContent = word;
        mask.append(inner); fragment.append(mask);
      });
      node.replaceWith(fragment);
    });
    pending.add(heading);
  });
  const animations = new Set();
  function revealWords() {
    if (document.documentElement.classList.contains('booting')) return;
    pending.forEach(heading => {
      const reveal = heading.closest('.reveal');
      if (reveal && !reveal.classList.contains('in-view')) return;
      pending.delete(heading);
      if (reduced.matches) return;
      heading.querySelectorAll('.motion-word').forEach((word, i) => {
        const animation = word.animate([
          { transform: 'translateY(115%) skewY(8deg) scale(1.12)', opacity: 0 },
          { transform: 'translateY(0) skewY(0) scale(1)', opacity: 1 }
        ], { duration: 950, delay: i * 85, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    });
  }
  const observer = new MutationObserver(revealWords);
  observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['class'] });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { animations.forEach(animation => animation.cancel()); animations.clear(); }
  });
  revealWords();
})();
