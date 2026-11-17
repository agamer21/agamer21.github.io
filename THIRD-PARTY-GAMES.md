# Self-hosted game builds

Retro Bowl uses the existing archived build from this repository. Moto X3M and Tiny Fishing runtime files were imported from these public source snapshots:

- https://github.com/tbg69/MotoX3M at `a46976e2b91a65af1d09537f320e76f5b7b83ac1`
- https://github.com/ubg98/TinyFishing at `0d12e52af4d244e333f2f3177b9e6075f2725232`

Game engines, artwork, music, and developer credits remain the property of their respective creators and are not relicensed as the arcade UI. Original runtime files are retained apart from portal/analytics loader removal and page metadata. AG Arcade wraps them in same-origin pages; no Poki launch links are used. Tiny Fishing ad inventory is explicitly unavailable on this host; its existing failure callback resumes the game and denies rewarded bonuses. The imported external ad loader is not executed.

Super Mario 64 opens the existing WebRetro 6.5 browser emulator (MIT; https://github.com/BinBashBanana/webretro) with its Mupen64Plus-Next Nintendo 64 core. The site does not include or fetch a Super Mario 64 ROM; the player selects a game file from their own device, which WebRetro reads in the browser. Nintendo game content and trademarks remain Nintendo's property.

The Super Mario 64 page also links to the user's requested direct-play reference at https://supermario64.io/. This is an external site, not a game build copied into AG Arcade.

`/super-mario-64.html` now defaults to the Super Mario 64 PC port (WebGL). The local page `/files/load/sm64webgl/index.html` is an adapted launcher for https://github.com/NotAn127/SM64-PC-Port-WebGL pinned to its `gh-pages` commit `16642fb00ca0be7e47e838caa7b29f81259e68b7` and served through jsDelivr. Only the launcher HTML is committed here; the emscripten JS/WASM engine and game assets load from that external CDN and are not included in this repository. Nintendo game content, character assets and trademarks remain Nintendo's property. Saves live in the browser (IndexedDB/localStorage under the arcade origin); the classic WebRetro loader and its own-file flow remain reachable via the "Nintendo 64 version" button. External host availability is outside AG Arcade control. The original Stash launcher (clmario64webgl.html) shipped the instructions overlay in a broken-HTML head; those elements were rebuilt in the body and the layout/colors matched the arcade.

NFL Retro Bowl '27 is an Apple Arcade-exclusive game, according to New Star Games. AG Arcade's playable “NFL Retro Bowl '27 Fan Season” updates the existing classic browser build with the official 2026 NFL regular-season matchups (https://www.nfl.com/schedules/2026/), applied to Year 1 in the deployment artifact. It does not include New Star's Gauntlet mode or licensed '27 player rosters and is not the official Apple Arcade game. The original `Schedule17.txt` in the repository is preserved.

The fan-season page includes a separate 2026 roster/stats reference panel. Player/roster data comes from `roster_2026.csv.gz` and weekly stats from `stats_player_week_2026.csv.gz`, published by `nflverse/nflverse-data` under CC BY 4.0. Stats are aggregated by player through the Week 8 snapshot, and the dataset's `LA` code is mapped to the Rams. The panel lists HC/OC/DC staff from Edgehalla (Nov 1, 2026) and HC records from ESPN. These reference records are separate from the classic game engine's generated player roster.


## 2026-11-02: Retro Bowl College

Added the seventh game, Retro Bowl College, using the existing local `files/load/rbcollege` engine. The new wrapper and all game assets deploy on AGames21.github.io; no Poki destination link. Added a matching cover and balanced the desktop grid. Browser checks passed: seven cards, mobile overflow check, College canvas, career setup, and fullscreen. The engine optionally probes for `rb_save_-1.json` on a fresh profile; that missing save is expected. Game rights remain with New Star Games.


## 2026-11-03: same-tab games and accurate Retro Bowl labeling

OpenFront and HLM2 now navigate in the current tab. OpenFront has an AG Arcade return link. Removed the separate NFL reference-data chart from the Retro Bowl player. The card/page now says Retro Bowl 2026 fan season: this remains the classic browser engine with a 2026 schedule and generated players. It does not contain the licensed NFL Retro Bowl 27 app, real-player roster, official coach database, or imported live NFL stats. The official app is Apple Arcade exclusive (https://www.newstargames.com/nfl-retro-bowl-27). Existing career storage paths and keys are preserved. A fresh career wrote a 232 KB native savedata.ini and survived a full page reload unchanged in browser verification.


## HexGL and Hextris (2026-11-03)

- HexGL: https://github.com/BKcore/HexGL at 6addc95a2fce3bf05f4d751823cc054c61a16d68. MIT unless a resource specifies otherwise; LICENSE and audio-specific notices/credits retained.
- Hextris: https://github.com/Hextris/hextris at 3f4847dc8fd7dab3d1c87e6324b9159d92fbd396. GPL-3.0-or-later; complete imported source and LICENSE.md retained in files/games/hextris.

Both run from same-origin GitHub Pages assets. Removed analytics bootstrap scripts and repaired insecure font/favicon references; developer credits remain. Tank Arena is original code, not a copied game. Firebase SDK 13.1.0 is Apache licensed; linked legal notices accompany its esbuild bundle.

Standard Retro Bowl is restored: deployment no longer patches Schedule17.txt and the page/card no longer advertises a 2026 fan season or NFL Retro Bowl 27. Existing engine/storage paths are unchanged so careers retain their save keys. The installed browser engine has generated players and single-player gameplay. New Star documents pass-and-play Exhibition for the mobile game: https://www.newstargames.com/post/09-feb-2023-exhibition-mode-for-retro-bowl . This is not online multiplayer for the browser copy.

## Homepage icon artwork (2026-11-03)

The following local game artwork is reused in assets/arcade/icons: Drive Mad webapp/cover.jpg, Retro Bowl img/icon.jpg, HexGL icon_256.png and Hextris images/icons/apple-touch-512.png. The creator and license notices above continue to apply; HexGL and Hextris source/licenses remain in files/games.

OpenFront, HLM2 Web, Moto X3M, Tiny Fishing, Retro Bowl College, Super Mario 64 and Tank Arena use original SVG illustrations created for this arcade. These are unofficial visual remakes, not official publisher logos. Game names and recognizable characters remain the property of their respective owners. No private game assets or ROMs were added for these illustrations.

## 2026-11-03: Krillion and puzzle games

Added Krillion as an explicitly approved same-tab link to https://krillion.io/ (it blocks embedding). Added self-hosted original 2048 by Gabriele Cirulli (MIT, https://github.com/gabrielecirulli/2048 at 478b6ec346e3787f589e4af751378d06ded4cbbc) and Wordle+ by MikhaD (GPL-3.0, https://github.com/MikhaD/wordle at 199122be1f3ed71f5cf4abd5748debd91ee540a0). Licenses and modified Wordle+ build source are included. Wordle+ is an unofficial clone; it is not the NYT game. Analytics removed and local save keys namespaced under agArcade.* for isolation and backup inclusion. New catalog icons are original unofficial illustrations.

The user-provided Drive HTML was a Super Mario 64 launcher. The existing Mario card/player now uses its external game URL with the already-hosted WebRetro emulator. No ROM was added to this repository. The unrelated cloak script and Google-parent dependency were not imported. External game availability is outside AG Arcade control; own-file mode remains available.


## November 5, 2026 — Moon Sweepers 2D

Added the fifteenth catalog entry: an original unofficial single-player 2D adaptation with conveyors, solar power, dust/sand/stone processing, cargo drones, tools and vehicles. Runtime is self-hosted at /moon-sweepers/ and included in the curated Pages workflow. Source: https://github.com/AGames21/moon-sweepers-web . Original Canvas art/audio/code are MIT licensed; no original Steam assets/code are distributed. Native-game parity and multiplayer are not claimed. Game saves use their own keys and JSON export/import; the arcade's generic backup format was not expanded.

## 2026-11-05: three requested games

Added Five Nights at Epstein's from https://github.com/n1yshi/Five-Nights-at-Epstein at fde3a47aece9332d6658ad3430672e3fb9650fa9, retaining N1yshi/Jannes credits. Basket Bros is by Blue Wizard Digital, imported from https://github.com/ShadowDevLabs/files/tree/main/basketbros-io; publisher rights remain with their owners. These public repositories do not establish an open-source license for publisher artwork. Both players run same-origin on GitHub Pages. Removed Basket Bros analytics/portal bootstrap and unsupported session-recording calls; online matchmaking in this copy is not promised. FNAE save keys are isolated under agArcade.fnae.* and included by existing save backups. No FNAE/BB backend is added. Agar.io opens the official https://agar.io/ in the current tab because real online play uses its service; it is not represented as self-hosted. Added original camera/cell icons and reused Basket Bros thumbnail. Catalog now has 18 entries, preserving the already-added Moon Sweepers 2D.

2026-11-05: replaced the official Agar.io outbound link with original Agar Arcade, a same-origin Agar-style solo cell game. Features AI opponents, mouse/touch movement, splitting/remerging, ejected pellets, leaderboard, pause, mass decay and saved best score/name under agArcade.agar.* (covered by existing backups). It is not the official Agar.io client and does not connect to its multiplayer service. No official game assets or backend copied.

2026-11-05: canonical arcade moves to https://agamer21.github.io/ under a new free organization, preserving AGames21 account and old site. Existing OpenFront/HLM2 game origins stay in place to retain saves and multiplayer URLs. Supported static-game localStorage can be transferred by Save backups / Bring saves from old site. Transfer checks exact sender/receiver origins, popup identity and a random nonce; only the existing backup allowlist is used and auth credentials/world snapshots are excluded. Restore still validates size/keys and asks before overwriting matching new-origin saves. WebRetro IndexedDB saves and other unsupported storage are not copied automatically; the old site stays available.


## 2026-11-05: Angry Birds 2 and Half-Life
Added two same-tab game cards, original SVG icons and local player wrappers: /angry-birds-2.html and /half-life.html. Catalog now has 20 games. Supplied Drive launchers: 18Jsyq2YJKZ4y9YQ_3Z34znkS546UUOpS (Angry Birds 2) and 1MbFUvPpqkm1TIus0o_qRzYIkwmWg_0uN (Half-Life). No game-data archives were committed. Rovio/Valve retain game rights; Angry Birds browser port credits Reeyuki; Half-Life uses Xash3D and BrowserFS.
Angry Birds external runtime is pinned to naotomori1/angrybirds2 at 6ba66b34c4505754d8b6b30582939a72e8d04243 on raw.githubusercontent.com. Original jsDelivr path returned HTTP 403 (package over 50MB); loader now fetches the JS into a Blob, checks responses and shows a useful failure message. Browser smoke reached the rendered level-selection map with no page errors.
Half-Life retains the supplied pinned bubbls/UGS-Assets revision 354e3c6939a08e472482653567d566ba3a2aa527 and server ZIP / own ZIP options. Engine and first data part returned HTTP 200; browser reached Scripts downloaded / Launch Xash with no page errors. Full Half-Life gameplay remains untested. Removed obsolete external websocket proxy and browser shortcut interception; default engine memory is 256MB (128-512 clamp). Added periodic and pagehide save-filesystem flushing; use the engine Save menu and IndexedDB for persistence. RAM mode does not persist. Arcade localStorage backups do not include these engines' IndexedDB saves. External game files can become unavailable and initial downloads are large (Half-Life 214MB). Both wrappers are included in the curated Pages workflow.
## Nintendo 3DS browser player

The Pokémon launch pages use EmulatorJS's experimental threaded Azahar core from its nightly CDN. Users select a decrypted cartridge dump, CXI executable, or compressed ZCXI executable. The player reads large files in chunks and disables ROM caching. The deployment includes the player code and original icons only.

## Arcade card artwork

- Official app icons from the App Store for [Geometry Dash](https://apps.apple.com/us/app/geometry-dash/id625334537), [Granny](https://apps.apple.com/us/app/granny/id1323957120), and [Angry Birds 2](https://apps.apple.com/us/app/angry-birds-2/id880047117).
- Steam library artwork for [Half-Life](https://store.steampowered.com/app/70/), [Medieval II](https://store.steampowered.com/app/4700/), and [Hotline Miami 2](https://store.steampowered.com/app/274170/).
- Retro Bowl College uses the icon bundled with its browser build. Krillion uses the touch icon from [its own site](https://krillion.io/).
- Nintendo box covers for all three Pokemon games and Super Mario 64 come from the [Libretro thumbnail archive](https://thumbnails.libretro.com/).
- Wordle+ and 2048 use artwork bundled with their builds.
- OpenFront uses its [press-kit icon](https://github.com/openfrontio/OpenFrontIO/tree/main/resources/public/press/images/logos).
- Five Nights at Epstein's uses artwork from its title screen.
- Agar Arcade uses the [official Agar.io icon](https://apps.apple.com/us/app/agar-io/id995999703) for its fan version.

## 2026-11-12: Original arcade additions

Added original in-house browser games (self-hosted): Snake, Minesweeper, Block Drop (tetris-style), Breakout, and Pong 2P, with original SVG icons. Game code and icons for these additions were created for AG Arcade.

## 2026-11-12: Additional arcade games

Added wrappers/cards for bundled browser builds already present in the repository: Slope (`/files/slope/game.html`), Run 3 (`/files/run3/index.html`), Cookie Clicker (`/files/cookieclicker/index.html`), and Flappy Bird (`/files/load/flappy-bird/index.html`). Added original game Crossy Hop as a road-crossing/hopper alternative. Renamed the in-house block-stacking game card/title to "Tetris". Game names, assets, and rights for third-party titles remain with their respective owners; include and credit original sources/licenses where required.

## 2026-11-12: Deployment fix and Idle Breakout

Updated GitHub Pages workflow to include newly added game pages/assets so they deploy (previous 404s). Added original Idle Breakout (incremental brick-breaker) and wrapped bundled Slope/Run 3/Cookie Clicker/Flappy Bird builds. Crossy Hop remains an original alternative to Crossy Road.

## 2026-11-12: Plants vs. Zombies (Flash)

Added Plants vs. Zombies wrapper using Ruffle; SWF loaded from jsDelivr (\sasa24s/Sphere-compile@95d1d98dc38a920d02e6bbcf61620501b2bacfcb/tables/pvz_9_15.swf\) as provided via Ultimate Game Stash/Drive link. Icon sourced from Wikimedia Commons (cover art thumbnail).


## 2026-11-12: Remove browser 3DS Pokémon, prep Pokémon Emerald

Removed Pokémon Ultra Sun/Omega Ruby/Alpha Sapphire browser pages/cards and stopped deploying \pokemon-3ds/\ from the site repo (3DS performance was poor in browser). Added Pokémon Emerald (GBA) player page ready for a user-provided ROM via EmulatorJS (CDN). ROMs previously hosted on the separate home server origin must be removed there separately if desired. PVZ icon replaced with a working cover-art image.


## 2026-11-17: Local game entry pages

Angry Birds Star Wars II and Aground now launch on the arcade origin, with runtime files bundled under `assets/arcade/ports/`. Neither game navigates to nawsif.github.io or reeyuki.github.io. Aground full-version music loads from its pinned raw.githubusercontent.com source to keep the Pages deployment below its size limit; entry pages and other runtime assets are local. The existing Pages workflow copies all of `assets/arcade/`.

- Angry Birds Star Wars II: snapshot of `nawsif/absw2` at `c96d5b5e61f3d1e4963c813b5cd377a29d9db561`. Includes the upstream player, LÖVE runtime, asset manifest and hash-verified game parts; existing runtime license notices retained.
- Aground: snapshot of `reeyuki/AgroundWebport` at `a62d1468ebbb708c3cb4b653f8c717f26ebda1a9`, including entry HTML, runtime and game data.

Game names, assets and publisher rights remain with their respective owners. Public source availability does not imply an open-source license for publisher assets.

Hill Climb Racing's old CDN link serves HTML as text. Its pinned `NotRexed/HillClimbRacingPort@7467bb544dff9871a1a6dfd15407ecd48bd06bb9` source also returns 404 for the required `hcr.wasm` and the upstream repository is unavailable. Replaced that dead source with `CoreScripts/hill-climb-racing@f8168d645cfe67ffaa996a829073d05200cc6949`: local entry HTML, scripts and Asyncify adapter, with split game data loaded from pinned raw.githubusercontent.com URLs. The loader verifies each assembled file size. No gcore.jsdelivr.net navigation or asset requests remain.

## 2026-11-17: Embedded launchers

Aground, Angry Birds Star Wars II, Cat Goes Fishing, Hotline Miami 2 and Minecraft: Story Mode now use same-tab iframe players with an arcade return link and fullscreen control. Aground and Star Wars use the local runtime snapshots described above. Cat Goes Fishing includes `reeyuki/CatFish@6f8d9f78a4a98387d29ec6386afe7a3ade9e8e09`; runtime URLs resolve locally and the external advertising loader is omitted. Upstream runtime credits are retained. Hotline Miami 2 uses the existing same-origin `/hlm2-web/` deployment. Minecraft uses local player files from `linkawaken1979-alt/mcsm-web-port@92ea4bab239286af747c00626cf3d31bf360c65f`; its roughly 6 GiB game data streams in 20 MiB parts from the pinned cdn.jsdelivr.net GitHub snapshot, not mcsm-web.pages.dev or raw.githubusercontent.com. Current Chrome/Edge with WebAssembly JSPI is required; threaded mode is unavailable on standard Pages hosting. Upstream license notices are retained.

Validation: local iframe startup checks passed for Aground, Angry Birds Star Wars II and Cat Goes Fishing with no page errors, failed asset responses, external runtime requests or new tabs. Hill Climb reached its vehicle menu and Minecraft reached its Telltale/Mojang opening screen using the pinned raw.githubusercontent.com assets through the environment's trusted network client; no blocked hostname requests, page errors or failed asset responses were observed. Full playthroughs were not run. Aground's replacement remote music URL returned valid Ogg audio.

## 2026-11-17: Same-origin Hill Climb assets and Aground music

Removed the remaining runtime-file dependency on raw.githubusercontent.com for Hill Climb and Aground. Hill Climb now downloads local `hcr.data.gz`, `hcr.wasm.gz` and `image.bin.gz` and decompresses them with the browser's Gzip DecompressionStream. These files reproduce the pinned CoreScripts snapshot byte for byte; uncompressed SHA-256 checksums are recorded in `asset-checksums.json`. The loader checks compressed and decompressed sizes.

Aground's 35 music tracks (core and full-version) are now bundled locally as Ogg Vorbis, re-encoded with `ffmpeg -c:a libvorbis -q:a 0` from the pinned source snapshot to reduce download and deployment size. Track names and content are preserved. Its asset map and preload list use local paths. Cloud saves still require the publisher's optional service, but loading music does not.

Fresh embedded player URLs and versioned runtime references avoid cached launchers. The complete deployment is estimated at 961.3 MiB including the existing generated Angry Birds and Geometry Dash resources, below 1 GiB.

Validation for this fix: both embedded players reached their main menus while Playwright aborted every off-origin request. No off-origin requests, page errors or failed asset responses were recorded. Aground proceeded past music loading. Full gameplay sessions were not run.

## 2026-11-17: Minecraft data host fix

Minecraft's main-thread loader, filesystem, background reader and synchronous reader now request game parts from `cdn.jsdelivr.net/gh/linkawaken1979-alt/mcsm-web-port@92ea4bab239286af747c00626cf3d31bf360c65f/game-files/`. The prior raw.githubusercontent.com host could fail on restricted client networks. Runtime HTML/scripts and catalog links have new cache versions. The first CDN data part was checked against the original pinned file and has the same SHA-256 (`5872720395b36e74efb8002e913813a11e6d37fd1942f72431962b3f9e6cc1dc`).

The player remains embedded on AG Arcade, but the approximately 6 GiB dataset still requires external streaming because it exceeds this Pages site's capacity. Client networks must allow cdn.jsdelivr.net. Network failures now identify that host rather than showing only “Failed to fetch.”

Validation: Minecraft reached its opening screen embedded on the arcade page while the browser test blocked raw.githubusercontent.com, mcsm-web.pages.dev and gcore.jsdelivr.net. CDN data requests returned 200, with no page errors or failed responses. This validates startup, not a full playthrough or the client network’s own CDN policy.
