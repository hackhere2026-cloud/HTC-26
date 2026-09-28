# Hack the Cloud

Includes a 17-second 3D car loading intro, slow title reveal, skip control, reduced-motion support, and an automatic timeout fallback.

An interactive 24-hour hackathon website with pointer-controlled headlights, canvas stars, card tilt, scroll reveals, countdown, schedule filters, track exploration, searchable FAQ, mobile navigation and database-backed registration.

## Run locally

Use Node.js 22.13 or newer (Node 25 was used for verification):

```bash
npm ci
npm run build
```

Initialize the local database **once**, before the first run:

```bash
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_ordinary_morg.sql
```

Then start the website:

```bash
npm start
```

Open `http://127.0.0.1:4173`. Rebuild and restart after source changes. Run `npm test` for registration API checks. Local records stay in ignored `.wrangler/state` and are never uploaded. The car model and decoder are served locally.

## Project structure

- `public/`: HTML, styles, interactions and assets.
- `src/drive3d.js`: editable Three.js scene.
- `server/index.js`: registration API and asset routing.
- `db/schema.ts`, `drizzle/`: database schema and versioned migrations.
- `scripts/build.mjs`: creates generated `dist/client` and `dist/server`.
- `.openai/hosting.json`: existing Sites project and logical database binding.

## Opening controls

- **Replay intro** restarts the 17-second approach and windshield takeover. Skip or Escape exits the loading sequence.
- **Explore car** pauses on the car. Move a mouse, drag on the scene, or focus the scene and use arrow keys to aim the headlights.
- The supplied transparent HackHere logo appears on the glass. **Wipers on/off** controls the two animated windshield blades; reduced-motion users get parked wipers.
- **Enter windshield** starts the final camera push. **Explore event** skips directly to event information.
- Reduced-motion preferences skip to the event title. If WebGL fails, the same title and event links remain available. Mobile scrolling works outside the interactive scene.

## Registration and hosting

Applications are saved in the site's database with validation, duplicate prevention, safe retries and throttling. The form collects name, email, role, track, optional team name and contact consent. A reference acknowledges receipt, not a confirmed pass. No automatic emails are sent, and no public applicant-list endpoint exists.

Owners can inspect applications in the Sites Settings database viewer (`registrations` table). See `/privacy.html` for the user-facing explanation. Deployment preserves the site's private audience; intentionally change access before inviting public applicants.

This is a full-stack site: a static server or GitHub Pages alone cannot run registration. Sites publishes the Worker, assets and migrations together. Never edit an already-applied migration; generate a new migration after future schema changes.

Confirm or replace the sample event dates, venue, prizes, people, capacity and deadline before promoting the event. Update the calendar file and countdown alongside them. Third-party 3D credits and license notices are linked from the scene.
