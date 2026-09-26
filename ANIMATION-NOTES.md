# Layout and motion references

The layout references the centered event presentation, overview cards, event-details dock, two-column domain/phase grids, and section hierarchy in [Quantexa](https://github.com/hackhere2026-cloud/Quantexa). Hack the Cloud retains its original palette, typography, artwork, and event content. No Quantexa source or assets are copied.

[Codrops ScrollTextMotion](https://github.com/codrops/ScrollTextMotion) informed the restrained scroll-triggered typography treatment. Its example uses GSAP, Flip and ScrambleTextPlugin; this site implements its own word-mask entrance with the browser's Web Animations API and the existing reveal lifecycle. No Codrops source or bundled GSAP plugins are redistributed.

Existing card tilt, magnetic controls, stars, loader, and orbit animations are retained. The event dock has a short entrance and a top-of-page progress line follows scrolling. No scroll hijacking or extra animation dependency is introduced.

New animation effects respect reduced motion, including a preference change during playback. Text remains available without the motion script.
