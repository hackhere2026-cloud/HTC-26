# Layout and motion references

The layout references the centered event presentation, overview cards, event-details dock, two-column domain/phase grids, and section hierarchy in [Quantexa](https://github.com/hackhere2026-cloud/Quantexa). Hack the Cloud retains its original palette, typography, artwork, and event content. No Quantexa source or assets are copied.

[Codrops ScrollTextMotion](https://github.com/codrops/ScrollTextMotion) informed the restrained scroll-triggered typography treatment. Its example uses GSAP, Flip and ScrambleTextPlugin; this site implements its own word-mask entrance with the browser's Web Animations API and the existing reveal lifecycle. No Codrops source or bundled GSAP plugins are redistributed.

Existing card tilt, magnetic controls, stars, loader, and orbit animations are retained. The event dock has a short entrance and a top-of-page progress line follows scrolling. No scroll hijacking or extra animation dependency is introduced.

New animation effects respect reduced motion, including a preference change during playback. Text remains available without the motion script.

## Cinematic opening

The ambient background now uses three drifting star depths with slow twinkling and gently eased pointer parallax. The same field appears behind the final windshield title. Particle count and pixel density are capped on phones; drawing is limited to 30 fps, pauses in hidden tabs and becomes a still field for reduced motion. Gloss comes from low-opacity panel reflections, pointer-positioned card highlights and restrained button/title highlights, preserving contrast and the original palette.

The windshield now carries the supplied transparent HackHere PNG, kept unmodified. Two modeled metal arms and rubber blades sweep in the windshield's local plane. Wipers can be toggled in Explore car, and park for reduced-motion users. The full-screen event title and header/footer wordmark use angular Chakra Petch lettering; technical grid framing and cyan edge accents extend across the existing event sections without changing the established palette. The original logo's own red/cyan colors are preserved.

The cloud-drive scene fills the viewport as a 17-second skippable loading intro. It moves a three-dimensional car through layered mist, turns all four wheels, moves the road grid, pivots the camera to the front, and pushes into the windshield. A painted title reveals on the glass before a slow, staggered HTML letter reveal takes over the screen. Loading controls release keyboard focus when complete. Reduced-motion users see the final title immediately; Escape and Skip intro bypass playback.

The hero and eye-tracking playground are now one opening section. The visual direction borrows cinematic title timing and layered composition from game trailers, without copying GTA artwork, logos, or code. The original purple, teal, cream, and cyan tokens remain unchanged.

Title masks, a code-symbol backdrop, staggered cards, hover light sweeps, timeline accents, and accordion entrances extend across the event sections. The interactive character has been replaced by the car. Two 3D headlight cones and road glows follow mouse movement, captured touch dragging, or arrow-key input inside the scene. Explore car pauses the timeline; Replay drive and Enter windshield control playback. Mobile scrolling remains available outside the bounded interaction area. The render loop pauses scene work when offscreen or the tab is hidden, and mobile pixel density is capped. A static event-title fallback handles unavailable WebGL.

Three.js is bundled locally. The Ferrari model is attributed to vicent091036 as in the official Three.js car example; attribution and rendering/decoder license notices are available at `public/credits.html`. The purple paint, lighting, cloud scene, camera path, and title treatment are custom to this event. This is a stylized real-time 3D render, not recorded footage or a photorealistic driving simulation.
