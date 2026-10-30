# Fart Runner — Build Plan

> Browser-based 3D endless runner. Farts are the engine. X username is only for face personalization.

## 0. Project Setup
- [x] Scaffold Vite + React + TypeScript
- [x] Configure path aliases, strict tsconfig, env typing
- [x] Add base CSS reset, fonts, color tokens
- [x] Create Express server that serves the app + `/api` routes
- [x] Wire Vite middleware mode for dev, static `dist` for production

## 1. Landing Page
- [x] Full-screen hero with title "Fart Runner"
- [x] X username input + "LET IT RIP" button
- [x] Validation + loading state
- [x] Animated fart cloud background (CSS/canvas)
- [x] Responsive layout + keyboard submit

## 2. X Profile Personalization (server-side)
- [x] `GET /api/x-profile?username=` route using `X_BEARER_TOKEN`
- [x] Fetch display name + `profile_image_url` from X API v2
- [x] Proxy avatar image through server to avoid CORS in WebGL
- [x] Sanitize username, rate-limit, cache responses
- [x] Graceful fallback to default character when API/token unavailable
- [x] Never expose credentials client-side

## 3. Game State & Loop
- [x] Zustand store: phase, profile, distance, score, beans, gas, power-ups, headlines
- [x] Central tuning config (speeds, gravity, spawn rates, scoring)
- [x] Pause / resume / restart flow
- [x] Persist best score in localStorage

## 4. 3D Scene
- [x] React Three Fiber canvas + camera rig
- [x] Infinite scrolling ground, lane markings, side walls/props
- [x] Fog, lighting, gradient sky
- [x] Player character: body + profile-photo head + username label
- [x] Seed default character (no X profile)

## 5. Physics & Controls
- [x] Rapier dynamic player body (locked rotation, CCD)
- [x] Lane switching (A/D, arrows, swipe)
- [x] Charge/release fart jump (hold Space, release to leap)
- [x] Midair fart dash for air control (gas-limited)
- [x] Grounded detection via raycast
- [x] Desktop keyboard + mobile touch controls + swipe gestures

## 6. Runner Mechanics
- [x] World-scroll obstacle + collectible spawning
- [x] Obstacles: hurdle (jump), crate (jump/switch), barrier (switch)
- [x] Safe-lane spawn patterns, avoid impossible walls
- [x] Beans: collection, score, gas refill, pickup FX
- [x] Difficulty ramp: speed + spawn density over distance
- [x] Collision → game over (unless invincible)

## 7. Power-ups
- [x] Fart Rocket: speed burst + invincibility + trail
- [x] Nuclear Burrito: clears obstacles ahead, screen shake/flash
- [x] Anti-Gravity Gas: low gravity, floaty control
- [x] Spawn logic, timers, HUD indicators

## 8. Juice
- [x] Fart particle trail + charge smoke
- [x] Web Audio synthesized fart/boost/pickup/hit SFX (no assets)
- [x] Camera shake, hit flash, speed lines
- [x] HUD: distance, score, beans, gas meter, power-up timers
- [x] Mute toggle

## 9. Game Over
- [x] Results panel: distance, score, beans
- [x] Procedurally selected funny headline
- [x] Restart button
- [x] Share button (X intent / Web Share API)
- [x] Best score callout

## 10. Polish & Ship
- [x] Landing ↔ game ↔ game-over transitions
- [x] Mobile viewport/safe-area handling
- [x] Accessibility: focus states, reduced motion, aria labels
- [x] Typecheck + production build
- [x] Smoke test dev + prod server
- [x] `.env.example` + run/deploy notes


---

## Status

Built and verified end-to-end (typecheck, production build, desktop + mobile browser smoke tests).

### Run it

```bash
pnpm dev      # http://localhost:8787
pnpm build    # typecheck + production bundle
pnpm start    # serve dist from Express on :8787
```

### Notes

- X API is tried first using `X_BEARER_TOKEN` (or consumer key/secret app-only auth).
- If X API access fails (e.g. depleted credits/rate limit), the server falls back to a public
  read-only profile mirror (`PROFILE_FALLBACK=1`, set `0` to disable).
- Profile images are proxied through `/api/avatar` to keep WebGL textures same-origin.
- With no profile available, the game starts with a generated mystery-farter avatar.
- All audio is synthesized in-browser via the Web Audio API; no audio asset files.

## v1.1 additions

- [x] Generate a shareable 1080×1350 score-card PNG
- [x] Share image via native share sheet (touch) or clipboard copy (desktop)
- [x] Copy image button with download fallback
- [x] Persist X profile/username across home, restart, and reload
- [x] Quick-start replay with the saved profile (no username re-entry)
- [x] Faster base run speed and faster character run animation
- [x] Profile photo mapped onto the character's whole head (no flat mask)
- [x] Nuclear Fart ultimate: clears obstacles, shockwave, green flash, invincibility, 500 points

## v1.2 additions

- [x] Replace the procedural body with `public/3d_model/low_poly_stickman.glb`
- [x] Auto-pose the model's arms down and tint the low-poly body
- [x] Map the X profile photo onto the model's actual head sphere
- [x] Add CC BY 4.0 model attribution to the landing footer
- [x] Use `dry-fart.mp3` for normal farts, jumps, air farts, and boost pulses
- [x] Use `fart-with-reverb.mp3` for charged jumps and the Nuclear Fart
- [x] Preload and decode both MP3s through Web Audio, with synth fallback

## v1.3 additions

- [x] Persist the fetched profile photo as a local data URL
- [x] Skip X profile/avatar requests on reload and replay (verified 0 network calls)
- [x] Rebuild the map as a low-poly dusk city
- [x] Add gradient sky, low-poly mountains, clouds, moon, and stars
- [x] Add lit windows, neon building signs, awnings, rooftops, and antennas
- [x] Add lamps, trees, bushes, barrels, cones, billboards, and overhead FART FUEL gantries
- [x] Add low-poly bean spectators with eyes, hats, and idle bobbing
- [x] Apply flat shading and chunky geometry throughout the world

## v1.4 additions

- [x] Add a shader-driven procedural run cycle to the static GLB (legs and arms swing, no rig required)
- [x] Trigger a 360-degree backflip on every mid-air fart, with a stable username tag outside the flip
- [x] Pick day or night from the player's local time (6am–6pm = day), with `?tod=day` / `?tod=night` overrides
- [x] Add a daytime sky, faceted sun, white clouds, green mountains, lighter buildings, and daylight lighting
- [x] Keep the nighttime sunset city, neon windows, moon, clouds, and stars
- [x] Make Nuclear Fart less rare: 36% of power-ups, first drop after 10m, 200–340m spawn gaps
