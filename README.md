
## Update: Galactic Empires, 3D, corporations, smarter AI
- **Phase 3 Galactic Empires** (🌌 button / Galaxy tab): 26-system procedural galaxy, FTL fleets, rival empires (incl. the four races, Void Sovereignty, Iron Syndicate), trade routes, galactic structures, Royal Host sector governors, missions G01–G12.
- **True 3D Elysia view** (WebGL, three.js r158 vendored in `js/vendor/`, MIT licence in `js/vendor/three-LICENSE.txt`; only its deprecation console warning line was removed). Drag = rotate, right-drag/two fingers = pan, wheel/pinch = zoom. Menu → Settings → 3D view: Auto/On/Off. Auto uses 3D on high quality only; otherwise the 2.5D canvas view.
- **Corps tab**: your corporation (shares, divisions, dividends, contracts), AI corporations and a stock exchange, alliances with races/empires and alliance missions.
- **AI tab**: offline advisor with forecasts, build planner, typed Q&A and a downloadable Chronicle book.
- **Payments prep**: still OFF. See `SETUP-PAYMENTS.md` and `server/cloudflare-worker/`.

## Update: construction timers, street view, playable avatar
- New buildings take time to construct, based on their size: about 2 to 40 in-game days (roads are instant). You see scaffolding, a crane and a countdown bar in both 2.5D and 3D. Speed up with Celestial Light (Build tab, or tap the site). A future paid speed-up hook is in `js/store.js` (`PAID_SPEEDUP:false`).
- 🚶 **Street view** (`js/street.js`): ground-level 3D at real scale (1 tile ≈ 40 m) with an Angelic avatar (halo and wings, colours customisable). WASD/arrows, mouse look (click to lock), Shift to run, hold Space to jump/fly, E to interact, V for first/third person, Esc to exit. Phones get a joystick, drag-to-look and Run/Fly/E buttons. Named districts show a banner when you enter them. There is a minimap, and you can interact with buildings (Market, Council, Labs, Mission Control, Cosmetics Shop, Cathedral blessing). Player position is saved.

## Update: Phase 4 Universe Architect and Phase 5 Archangel Cosmos (all 5 phases playable)
- **Universe Architect** (`js/architect.js`, Architect tab, 🌠 3D creation view): unlocks when you hold 6 star systems and have gathered 10 Core Fragments. The creation tool sets star type, size, atmosphere, terrain, life, race, moons and rings. You can terraform worlds, watch life evolve, bind worlds into star systems and weave systems into galaxies. New resources: Creation Energy, Aether Weave. Missions U01 to U08.
- **Archangel Cosmos** (Cosmos tab): unlocks after you weave a galaxy and raise 3 sapient worlds. Kindle universes and tune their gravity, light, entropy and harmony, then complete the 6-stage Celestial Ascension with the Royal Heavenly Host to become Archangel Prime. That plays the ending and credits, then an endless sandbox. New resource: Omniversal Light. Missions X01 to X07.
- Store expansion flags `architect` and `cosmos` (unlocked while payments are off).
- Testing shortcut: open `index.html?dev=1`, then Menu → "Jump to phase 2–5". It is hidden without `?dev=1`.

## Saving (v9)
- Saves go to IndexedDB (primary) with a compressed localStorage mirror (vendored lz-string, MIT). The browser is asked to keep storage persistent.
- Autosave runs every 2 minutes of real time and whenever the tab is hidden or closed. A "Saved ✓" indicator sits bottom-right, and a red toast appears if a save fails.
- Each slot keeps 3 rotating backups. If the main save is corrupt, loading falls back to a backup automatically (Menu → Backups).
- Menu → Export save / Import save moves a save file between devices, or between the browser and the installed app.
- Tests: `python3 test_save.py` checks a reload, an SW update, a large state, backup fallback, export/import, legacy import and slot persistence.

## Forces & transport (v9)
- New structures: Harbour, Naval Shipyard, Airport, Rail Station, Bus Depot, Police, Fire, School, Barracks, War Factory, Watchtower and Wall.
- New units (training timers + upkeep): fishing boats, cargo ships, ferries, warships, soldiers, Angelic Legions, tanks, planes, helicopters, angelic flyers, buses, trains, police cars, fire engines, shuttles, fighters, star cruisers and carriers.
- Raids (sea, land, air, space) test your defence. Trade units earn income and flyers explore for relics.
- Traffic, trains, boats, aircraft, power lines and rails are animated in 2.5D and 3D. The amount scales with the Quality setting.
