
## Update: Galactic Empires, 3D, corporations, smarter AI
- **Phase 3 Galactic Empires** (🌌 button / Galaxy tab): 26-system procedural galaxy, FTL fleets, rival empires (incl. the four races, Void Sovereignty, Iron Syndicate), trade routes, galactic structures, Royal Host sector governors, missions G01–G12.
- **True 3D Elysia view** (WebGL, three.js r158 vendored in `js/vendor/`, MIT licence in `js/vendor/three-LICENSE.txt`; only its deprecation console warning line was removed). Drag = rotate, right-drag/two fingers = pan, wheel/pinch = zoom. Menu → Settings → 3D view: Auto/On/Off. Auto uses 3D on high quality only; otherwise the 2.5D canvas view.
- **Corps tab**: your corporation (shares, divisions, dividends, contracts), AI corporations and a stock exchange, alliances with races/empires and alliance missions.
- **AI tab**: offline advisor with forecasts, build planner, typed Q&A and a downloadable Chronicle book.
- **Payments prep**: still OFF. See `SETUP-PAYMENTS.md` and `server/cloudflare-worker/`.

## Update: construction timers, street view, playable avatar
- New buildings take time to construct, based on their size: about 2 to 40 in-game days (roads are instant). You see scaffolding, a crane and a countdown bar in both 2.5D and 3D. Speed up with Celestial Light (Build tab, or tap the site). A future paid speed-up hook is in `js/store.js` (`PAID_SPEEDUP:false`).
- 🚶 **Street view** (`js/street.js`): ground-level 3D at real scale (1 tile ≈ 40 m) with an Angelic avatar (halo and wings, colours customisable). WASD/arrows, mouse look (click to lock), Shift to run, hold Space to jump/fly, E to interact, V for first/third person, Esc to exit. Phones get a joystick, drag-to-look and Run/Fly/E buttons. Named districts show a banner when you enter them. There is a minimap, and you can interact with buildings (Market, Council, Labs, Mission Control, Cosmetics Shop, Cathedral blessing). Player position is saved.
