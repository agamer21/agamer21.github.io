# AG Arcade site notes

Updated November 2, 2026.

The collection has eight entries: OpenFront Friends, HLM2 Web, Drive Mad, an NFL Retro Bowl '27 fan season, Moto X3M, Tiny Fishing, Retro Bowl College, and a Super Mario 64 player page. The NFL fan-season page updates the existing playable browser game with the 2026 schedule and has a reference panel for real 2026 players, coaches and stats. Moto X3M and Tiny Fishing have local imported runtimes and player pages.

Local browser checks cover game-card navigation, mobile overflow, game canvases, start-menu input and fullscreen. Fresh Retro Bowl profiles probe nonexistent save/settings files and then correctly show empty save slots. The Moto X3M build emits a nonfatal Promise rejection with an undefined reason during startup; its menu, level selection, and runtime are checked separately. No additional error suppression was added.

The legacy repository and licenses remain intact. Game engine behavior and publisher SDKs are retained; optional portal/analytics loaders were removed from entry pages. The hub itself uses no third-party UI scripts or frameworks. Source snapshots are listed in THIRD-PARTY-GAMES.md.

Tiny Fishing uses an Expand/Exit expanded view control because browser-native fullscreen was unavailable in the tested player. Other player pages retain browser-native fullscreen.

Tiny Fishing's imported ad adapter waited indefinitely for an unrelated external ad-loader. The self-hosted integration now reports unavailable ad inventory through its existing failure path, resumes play, and does not fabricate rewarded-ad completions.


## 2026-11-02: Retro Bowl College

Added the seventh game, Retro Bowl College, using the existing local `files/load/rbcollege` engine. The new wrapper and all game assets deploy on AGames21.github.io; no Poki destination link. Added a matching cover and balanced the desktop grid. Browser checks passed: seven cards, mobile overflow check, College canvas, career setup, and fullscreen. The engine optionally probes for `rb_save_-1.json` on a fresh profile; that missing save is expected. Game rights remain with New Star Games.

## 2026-11-02: Super Mario 64 browser player

Added a card and same-origin WebRetro player using the included Mupen64Plus-Next core. The site supplies the emulator only; players select a game file from their device, and no Super Mario 64 ROM is included or fetched. The page also links to the direct-play reference provided by the user. The Pages workflow copies only the required WebRetro UI, license, and Nintendo 64 core files. A matching original castle/star illustration is used for the card.

Chrome smoke checks passed for all eight cards, 390px mobile width, the NFL Retro Bowl wrapper, and the Super Mario 64 player. WebRetro loaded the Nintendo 64 upload prompt and both Mupen64Plus-Next JS/WASM files with no page errors or missing local resources. A game ROM was not supplied, so in-game Mario gameplay has not been tested.

## 2026-11-02: NFL Retro Bowl '27 fan season

Updated the existing playable browser Retro Bowl card to “NFL Retro Bowl '27 Fan Season”. During Pages packaging, the workflow patches Year 1 in the deployed schedule with official 2026 NFL regular-season matchups; the repository's original `Schedule17.txt` remains unchanged. Start a new career to use the new schedule. Added an expandable reference panel with 2026 roster records, season-to-date player box-score stats, and each team's HC/OC/DC. The classic engine still creates its own in-game roster; Apple Arcade's Gauntlet mode and licensed '27 roster are not included.

Local Chrome checks passed for the eight-card homepage, 390px mobile width, the fan-season page/canvas, 272 updated schedule games, Buffalo's roster/coach panel (including Josh Allen's stats), and Super Mario 64's uploader and direct-play link. No JavaScript errors or missing local files appeared; the only 404s were the game's expected first-run save/settings probes. Actual Mario gameplay requires the player to select their own game file.


## 2026-11-03: same-tab games and accurate Retro Bowl labeling

OpenFront and HLM2 now navigate in the current tab. OpenFront has an AG Arcade return link. Removed the separate NFL reference-data chart from the Retro Bowl player. The card/page now says Retro Bowl 2026 fan season: this remains the classic browser engine with a 2026 schedule and generated players. It does not contain the licensed NFL Retro Bowl 27 app, real-player roster, official coach database, or imported live NFL stats. The official app is Apple Arcade exclusive (https://www.newstargames.com/nfl-retro-bowl-27). Existing career storage paths and keys are preserved. A fresh career wrote a 232 KB native savedata.ini and survived a full page reload unchanged in browser verification.


## 2026-11-03 arcade expansion

Added HexGL, Hextris and an original Tank Arena (practice AI, two-player private codes/invites, sound, keyboard/mouse/touch controls, local win counts). The library now has eleven cards, favorites, recently played, search and genre filters. Save backups export allowed game keys and the current guest/account OpenFront snapshot; Firebase credentials and ROMs are excluded. Restore validates the backup format and supported keys before replacing matching saves. See MULTIPLAYER-AND-SAVES.md. Standard Retro Bowl replaces the fan schedule entry; no 2026 schedule patch is deployed and existing careers keep their storage path.

Browser checks passed: eleven cards, favorite persistence, search/genre filtering, recent games, 390px catalog, actual tank movement, real two-browser private room movement/firing, guest state-write rejection, and host-departure continuation against AI. Backup export/restore passed and excluded a credential canary. HexGL rendered a moving WebGL race and Hextris entered active gameplay without page errors. Full races, long online tank matches and native Retro Bowl mobile multiplayer are not verified.


Final focused checks: held mobile touch input moved the tank; malformed/credential-bearing backup restoration was rejected before replacing saves. OpenFront quit returned to its own menu. A real world was exported, removed from IndexedDB, restored and resumed via the public UI. Guest arena win-count UI was tested with a controlled winning-state fixture; this does not prove full-match gameplay balance. All temporary network test rooms and anonymous accounts were cleaned up.

## 2026-11-03: simpler arcade homepage

Replaced the large banner, ticket and numbered cards with a compact header, search/filter row and consistent rounded game tiles. The homepage-only home.css keeps player layouts separate. All eleven launch destinations, favorite/recent storage keys and backup controls remain intact. Four game icons reuse existing local artwork; seven are original SVG remakes.

Focused Chrome checks passed at 1440px, 390px and 320px: all eleven icons loaded, no horizontal overflow or page errors, favorite persistence, search, genre/recent filters, backup dialog and same-tab launch links. Desktop and mobile screenshots reviewed. This is a catalog presentation change; game engines and save formats are unchanged.

## 2026-11-03: Krillion and puzzle games

Added Krillion as an explicitly approved same-tab link to https://krillion.io/ (it blocks embedding). Added self-hosted original 2048 by Gabriele Cirulli (MIT, https://github.com/gabrielecirulli/2048 at 478b6ec346e3787f589e4af751378d06ded4cbbc) and Wordle+ by MikhaD (GPL-3.0, https://github.com/MikhaD/wordle at 199122be1f3ed71f5cf4abd5748debd91ee540a0). Licenses and modified Wordle+ build source are included. Wordle+ is an unofficial clone; it is not the NYT game. Analytics removed and local save keys namespaced under agArcade.* for isolation and backup inclusion. New catalog icons are original unofficial illustrations.

The user-provided Drive HTML was a Super Mario 64 launcher. The existing Mario card/player now uses its external game URL with the already-hosted WebRetro emulator. No ROM was added to this repository. The unrelated cloak script and Google-parent dependency were not imported. External game availability is outside AG Arcade control; own-file mode remains available.

## 2026-11-03: dark themes and interactive backdrop

Removed the introductory slogans at the user request. Midnight is the default, with Forest, Dusk and Daylight selections saved under agArcade.theme.v1. A lightweight canvas particle field repels the pointer and settles back; it pauses when hidden and respects reduced-motion settings. Small footer credit reads made by Aiden. User requested skipping longer gameplay tests; final pass is limited to source/syntax and the existing bounded checks already run.

Validation scope: 14 catalog cards/icons and mobile width checked before theme changes; 2048 accepted actual moves and persisted identical game state across reload. Wordle+ rendered its tutorial and keyboard without page errors; gameplay persistence was not confirmed. Mario fetched into the emulator Start screen; actual gameplay was not verified. Theme JavaScript syntax and git diff whitespace checks pass. No extended gameplay testing was run after the user requested faster turnaround.

Follow-up: brighter high-contrast text, translucent cards/controls, and denser/brighter background particles (65-220 based on viewport). Syntax checked; no extended browser testing requested.

Follow-up: default theme renamed Black & White, with near-black surfaces and pure white text including secondary labels, placeholders and controls. Other selectable themes retained.

Particle follow-up: increased to 100-320 particles by viewport, larger points at 85% opacity and brighter connecting lines. Pointer repulsion/reduced-motion handling retained.

2026-11-04: refined catalog with compact game-first tiles, calmer spacing, reduced corner radii and smaller icons; retained black/white themes, transparent cards, pointer particles and Aiden credit. Existing game links/storage unchanged.


## November 5, 2026 — Moon Sweepers 2D

Added the fifteenth catalog entry: an original unofficial single-player 2D adaptation with conveyors, solar power, dust/sand/stone processing, cargo drones, tools and vehicles. Runtime is self-hosted at /moon-sweepers/ and included in the curated Pages workflow. Source: https://github.com/AGames21/moon-sweepers-web . Original Canvas art/audio/code are MIT licensed; no original Steam assets/code are distributed. Native-game parity and multiplayer are not claimed. Game saves use their own keys and JSON export/import; the arcade's generic backup format was not expanded.

## 2026-11-05: three requested games

Added Five Nights at Epstein's from https://github.com/n1yshi/Five-Nights-at-Epstein at fde3a47aece9332d6658ad3430672e3fb9650fa9, retaining N1yshi/Jannes credits. Basket Bros is by Blue Wizard Digital, imported from https://github.com/ShadowDevLabs/files/tree/main/basketbros-io; publisher rights remain with their owners. These public repositories do not establish an open-source license for publisher artwork. Both players run same-origin on GitHub Pages. Removed Basket Bros analytics/portal bootstrap and unsupported session-recording calls; online matchmaking in this copy is not promised. FNAE save keys are isolated under agArcade.fnae.* and included by existing save backups. No FNAE/BB backend is added. Agar.io opens the official https://agar.io/ in the current tab because real online play uses its service; it is not represented as self-hosted. Added original camera/cell icons and reused Basket Bros thumbnail. Catalog now has 18 entries, preserving the already-added Moon Sweepers 2D.

2026-11-05: replaced the official Agar.io outbound link with original Agar Arcade, a same-origin Agar-style solo cell game. Features AI opponents, mouse/touch movement, splitting/remerging, ejected pellets, leaderboard, pause, mass decay and saved best score/name under agArcade.agar.* (covered by existing backups). It is not the official Agar.io client and does not connect to its multiplayer service. No official game assets or backend copied.

2026-11-05: canonical arcade moves to https://agamer21.github.io/ under a new free organization, preserving AGames21 account and old site. Existing OpenFront/HLM2 game origins stay in place to retain saves and multiplayer URLs. Supported static-game localStorage can be transferred by Save backups / Bring saves from old site. Transfer checks exact sender/receiver origins, popup identity and a random nonce; only the existing backup allowlist is used and auth credentials/world snapshots are excluded. Restore still validates size/keys and asks before overwriting matching new-origin saves. WebRetro IndexedDB saves and other unsupported storage are not copied automatically; the old site stays available.

2026-11-05 correction: OpenFront and HLM2 game pages are being mirrored under agamer21/openfront-friends and agamer21/hlm2-web. Arcade links now use same-origin /openfront-friends/ and /hlm2-web/ paths. Save-transfer helper now includes the current old-origin OpenFront world; new-origin import uses the currently signed-in profile (sign in before transferring account worlds). No auth sessions or game/WAD files are transferred. Old sites and source saves remain available.


## 2026-11-05: Angry Birds 2 and Half-Life
Added two same-tab game cards, original SVG icons and local player wrappers: /angry-birds-2.html and /half-life.html. Catalog now has 20 games. Supplied Drive launchers: 18Jsyq2YJKZ4y9YQ_3Z34znkS546UUOpS (Angry Birds 2) and 1MbFUvPpqkm1TIus0o_qRzYIkwmWg_0uN (Half-Life). No game-data archives were committed. Rovio/Valve retain game rights; Angry Birds browser port credits Reeyuki; Half-Life uses Xash3D and BrowserFS.
Angry Birds external runtime is pinned to naotomori1/angrybirds2 at 6ba66b34c4505754d8b6b30582939a72e8d04243 on raw.githubusercontent.com. Original jsDelivr path returned HTTP 403 (package over 50MB); loader now fetches the JS into a Blob, checks responses and shows a useful failure message. Browser smoke reached the rendered level-selection map with no page errors.
Half-Life retains the supplied pinned bubbls/UGS-Assets revision 354e3c6939a08e472482653567d566ba3a2aa527 and server ZIP / own ZIP options. Engine and first data part returned HTTP 200; browser reached Scripts downloaded / Launch Xash with no page errors. Full Half-Life gameplay remains untested. Removed obsolete external websocket proxy and browser shortcut interception; default engine memory is 256MB (128-512 clamp). Added periodic and pagehide save-filesystem flushing; use the engine Save menu and IndexedDB for persistence. RAM mode does not persist. Arcade localStorage backups do not include these engines' IndexedDB saves. External game files can become unavailable and initial downloads are large (Half-Life 214MB). Both wrappers are included in the curated Pages workflow.

## 2026-11-05: Angry Birds file-download recovery
User reported "Game files could not load. Reload to try again." Live page reached the rendered game in an isolated Chrome check; the exact original cause was not reproduced. Patched the local player loader with up to three attempts per download, a 90-second timeout covering response bodies, at most three simultaneous file-part downloads, and a filename/HTTP-specific terminal error mentioning the required raw.githubusercontent.com host. Pinned source and game files unchanged.
Verification: real Chrome normal load and simulated first-part HTTP 503 both reached the game canvas; transient failure recovered on attempt two. Persistent simulated HTTP 503 stopped after three attempts with the correct filename and status. No page JavaScript errors in these checks. git diff --check passed. No extended gameplay validation.
Local source: C:\Users\speci\Documents\Codex\2026-11-01\remake-this-game-and-make-it\outputs\arcade-hub\assets\arcade\players\angry-birds-2.html. Tests/evidence: C:\Users\speci\Documents\Codex\2026-11-05\total-war-medieval-2-do-you\work\angry-recovery-test.cjs and outputs\angry-transient-verified.png.
User authorized pushing and publishing this fix. Deployment and live verification pending.

## 2026-11-05: Angry Birds same-origin runtime
User confirmed raw.githubusercontent.com is blocked on their PC, explaining why retries could not recover. Player now requests /files/games/angry-birds-2/Build/ from the arcade origin. Pages prepares all 11 required files from the unchanged pinned upstream revision during deployment, validates their expected byte sizes and fails deployment on download failure. Runtime binaries stay out of Git. Port credit remains intact. Browser no longer needs the raw host for this game's runtime.
Verification: real Chrome test with raw.githubusercontent.com blocked loaded all 11 runtime files from same-origin routes, reached the game canvas, made zero raw-host requests and reported zero page JavaScript errors. git diff --check passed. User's actual PC remains to verify. Publication authorized by the user's prior approval of this ongoing loader fix; deployment/live verification pending.
