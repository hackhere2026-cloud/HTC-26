# Layout and motion references

The layout references the centered event presentation, overview cards, event-details dock, two-column domain/phase grids, and section hierarchy in [Quantexa](https://github.com/hackhere2026-cloud/Quantexa). Hack the Cloud retains its original palette, typography, artwork, and event content. No Quantexa source or assets are copied.

[Codrops ScrollTextMotion](https://github.com/codrops/ScrollTextMotion) informed the restrained scroll-triggered typography treatment. Its example uses GSAP, Flip and ScrambleTextPlugin; this site implements its own word-mask entrance with the browser's Web Animations API and the existing reveal lifecycle. No Codrops source or bundled GSAP plugins are redistributed.

Existing card tilt, magnetic controls, stars, loader, and orbit animations are retained. The event dock has a short entrance and a top-of-page progress line follows scrolling. No scroll hijacking or extra animation dependency is introduced.

New animation effects respect reduced motion, including a preference change during playback. Text remains available without the motion script.

## Cinematic opening

The cloud-drive scene fills the viewport. The car approaches from a dark cloud opening over 3.8 seconds and the event name reveals directly on the windshield near the end. Event information follows beneath the scene. Reduced-motion users see the settled scene and title immediately.

The hero and eye-tracking playground are now one opening section. The visual direction borrows cinematic title timing and layered composition from game trailers, without copying GTA artwork, logos, or code. The original purple, teal, cream, and cyan tokens remain unchanged.

Title masks, a code-symbol backdrop, staggered cards, hover light sweeps, timeline accents, and accordion entrances extend across the event sections. The character has been removed. The illustrated car approaches through parting cloud mist with a CSS perspective/scale entrance, then stays fixed. Two canvas headlight cones follow mouse movement, captured touch dragging, or arrow-key input inside the scene. Reset lights and replay controls are provided. Mobile scrolling remains available outside the bounded interaction area. Reduced motion skips the approach and cloud animation. This is layered 2.5D artwork, not a WebGL car model.
