# Hack the Cloud

A responsive, animated 24-hour hackathon frontend built with HTML, CSS, JavaScript, and Canvas.

Features include a cloud-themed loading screen, skip intro, cursor-following character, star field, 3D card tilt, scroll reveals, countdown, event timeline, tracks, prizes, FAQ, and registration modal.

## Run locally

From this repository's root:

```bash
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080. No package installation or build step is required.

## Files

- `dist/index.html`: page content and loading-screen markup.
- `dist/styles.css`: responsive layout and main animations.
- `dist/loader.css`: loading-screen theme and animations.
- `dist/app.js`: interactions, countdown, and loading lifecycle.
- `dist/assets/dream-coder.png`: cloud character artwork.

## Customization and launch

Edit event details in `dist/index.html` and the countdown date in `dist/app.js`.
Dates, venue, prizes, judges, contact details, and social links currently contain sample content.
The registration modal is a frontend demo: it does not save registrations or send emails, despite its current success copy. Connect a registration service and update that copy before accepting real applications.

Serve the contents of `dist/` from any static web host. Motion is reduced for visitors who request reduced motion in their system settings.
