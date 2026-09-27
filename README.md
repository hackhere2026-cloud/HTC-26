# Hack the Cloud

Includes a themed animated loading intro, skip control, reduced-motion support, and an automatic timeout fallback.

An interactive 24-hour hackathon website with a real-time 3D cloud-drive opening, pointer-controlled headlights, canvas star field, card tilt, scroll reveals, countdown, schedule, tracks, prizes, FAQ, and a demo registration flow.

## Run locally

The built site is included in `dist`. To preview it without installing anything:

```bash
python3 -m http.server 8080 --directory dist
```

Then open `http://localhost:8080`.

To edit the 3D scene, use Node.js 20 or newer:

```bash
npm ci
npm run build
npm start
```

Open `http://localhost:4173`. The editable scene is `src/drive3d.js`; the build bundles Three.js into `dist/drive3d.js`. The car model and Draco decoder are served locally, so rendering does not depend on a third-party CDN.

## Opening controls

- **Replay drive** restarts the 12-second approach and windshield takeover.
- **Explore car** pauses on the car. Move a mouse, drag on the scene, or focus the scene and use arrow keys to aim the headlights.
- **Enter windshield** starts the final camera push. **Explore event** skips directly to event information.
- Reduced-motion preferences skip to the event title. If WebGL fails, the same title and event links remain available. Mobile scrolling works outside the interactive scene.

The event details and people are sample content. Registration is a front-end demo and does not submit applications. Connect a real registration service and replace the placeholder facts/social links before promoting the event. Third-party 3D credits and license notices are linked from the scene.
