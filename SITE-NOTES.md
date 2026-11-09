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

Same-origin verification follow-up: visual inspection caught an in-game Connection Error despite the first canvas check. Added the seven StreamingAssets configuration files from the same pinned revision, preserving the Unity runtime's sibling-directory layout. A fresh Chrome test with the raw host blocked loaded 18 runtime/config files and screenshot inspection confirmed the actual Feathery Hills level map. Zero raw-host requests or page JavaScript errors. Unity telemetry endpoints remain unreachable in the test environment but did not prevent the map. This supersedes the incomplete 11-file test as the acceptance check.

## 2026-11-05: shared online counter prepared
Implemented a compact live online badge for the arcade header and hosted game pages using the existing Firebase project, an isolated anonymous-auth app and per-tab onDisconnect cleanup. Count groups active connections by browser auth UID, so extra tabs do not increase the total. Nested game frames are excluded. No visitor names or game/save data are recorded. Disconnected/blocked service shows Online unavailable rather than a false zero. Separate browsers/devices/incognito sessions count separately; disconnect cleanup may lag briefly. External games such as official Krillion cannot be counted after visitors leave our site.
Arcade workflow now injects the shared module into curated HTML. OpenFront's Pages workflow is prepared to inject it into static/index.html. Canonical agamer21/hlm2-web workflow draft is saved in the current chat's work/presence/hlm2-pages-planned.yml; the legacy local HLM2 checkout was not modified. Added only arcadePresence rules to the owning frontier-command/database.rules.json after verifying the existing source matched live rules. Other assistants' existing friends-command.css changes were preserved.
Verification: isolated Firebase Auth/Realtime Database emulators plus real Chrome passed shared counts across two browser contexts, tab deduplication, nested iframe exclusion, removal after close, navigation into a game, 390px mobile width and blocked-service fallback. Database rules allowed own connection creation/deletion, rejected other-user writes, rejected non-boolean data, and rejected unauthenticated reads. Build injection passed on homepage/wrappers/nested entry and was idempotent. Desktop/mobile screenshots were inspected. Emulator-only Chrome disabled LocalNetworkAccessChecks to allow the synthetic test origin to reach loopback emulators; no normal browser configuration was changed.
Pending authorization: publish root site/OpenFront/canonical HLM2 integrations and deploy the added Firebase presence rule; then test real production clients. No new feature push or backend rule deployment performed. Prior approval covered the Angry Birds loader correction, not this new feature.

Publication authorized: user approved publishing the shared online counter and retiring the old AGames21 homepage. Production rules were backed up, merged additively and read back; all existing namespaces were preserved. Removed the now-obsolete old-origin save-transfer button/module reference from the new homepage; file backup/restore stays available. Counter frontend and linked-game integrations are being published to canonical agamer21 repositories. Old Pages configuration/workflow state backed up before retirement; source repository will remain as backup.

## 2026-11-05: online counter published; old homepage retired
Completed with user authorization. Root counter/navigation changes are in 6dee16b (Pages run 42116155065 succeeded). OpenFront integration and source presence rules are in b4b107c (run 42116160084 succeeded). Canonical HLM2 workflow integration is in c3af95f (run 42116220762 succeeded using its existing publish_only option; this did not change the game engine). The push-triggered HLM2 run was superseded/cancelled by the manual run. Production Firebase rules were backed up and changed only by adding arcadePresence; read-back confirmed all existing rules unchanged.
Live Chrome with normal browser security passed shared presence across two isolated browsers, same-browser tab deduplication, removal after closing tabs/browser pages, and persistence of the browser identity on /2048.html, /openfront-friends/ and /hlm2-web/. File backup controls remain and the dead old-origin transfer button is removed. No page JavaScript errors. Test-only presence records and anonymous accounts were cleaned up. Screenshot: C:\Users\speci\Documents\Codex\2026-11-05\total-war-medieval-2-do-you\outputs\arcade-counter-live-header.png.
Old https://agames21.github.io/ was unpublished using GitHub's Pages UI after REST deletion returned HTTP 422 for the user-site. Success UI said GitHub Pages unpublished; public HTTP check confirmed 404. The old Publish AG Arcade workflow (239172736) is disabled_manually to prevent automatic rebuilding. Its source repository is retained as backup; no repository or old game-save data was deleted. Existing legacy project repositories were preserved. New canonical arcade remains https://agamer21.github.io/.
Backups: current chat work/presence/backups (production rules, old Pages configuration and workflow state). Arcade source clean before this final documentation update. Unrelated OpenFront src/client/components/friends-command.css work remains untouched and uncommitted. Earlier pending publication entries are superseded.


## 2026-11-06: Medieval II Asset Lab publication
User authorized a public code-only GitHub repository and arcade entry. Added /medieval2-web/ card labelled Prototype, an original shield SVG, and a description requiring the player's own installed files. No original game assets or binary files are published. The prototype adds the shared presence module only on the canonical host and has a return link to AG Arcade. New source: https://github.com/agamer21/medieval2-web . Deployment/live validation pending.

Publication verified 2026-11-06: root Pages run 42232458968 succeeded, serving commit 0d64e04. Real Chrome loaded the new public homepage card and clicked through to the prototype. The latest prototype loaded the actual installed folder, displayed five original unit-definition fields, rendered original walk animation, showed the shared online count and fit 390px mobile width with no page errors, original-asset network fetches or game-data uploads. raw.githubusercontent.com was deliberately blocked during verification. Test-only presence and anonymous identity were cleaned up. Evidence in current chat outputs: medieval2-hosted-prototype.png, medieval2-hosted-mobile.png, arcade-medieval2-card.png. This supersedes the pending deployment entries above. Existing source working trees were clean before this documentation follow-up. Full combat/campaign and native-runtime parity remain unimplemented/unverified.

## 2026-11-06: immediately playable medieval battle
User requested no game-folder/mesh selection and a playable first milestone toward the full web port. The existing /medieval2-web/ entry now opens an original procedural 72-vs-72 battle with regiment orders, archers/melee, AI, morale/routing/rally, running/stamina, pause/speed/challenge, synthesized sound and victory/defeat/restart. Original-asset viewer preserved at /medieval2-web/lab.html as optional research tooling. The battle fetches no native data and needs no installation. Updated homepage name/description to Medieval Battle. Functional prototype commit 6a06318. Local 41 tests passed and real Chrome completed a UI-driven victory/restart, plus desktop/touch/mobile checks. Native combat/campaign parity is not established. Deployment and public verification pending.

## Geometry Dash browser preview

The arcade card opens the original Stereo Madness level from a user-selected Steam Resources folder. The browser reads the level, sprite atlases and track locally. The site ships only the JavaScript engine, UI and original catalog icon.

REA identified the installed x86-64 Windows executable. The native deep-analysis calls did not return usable movement pseudocode during development. The player uses a fixed 240 Hz simulation with approximate cube, ship and collision behavior informed by the public web runtime reference. This preview covers one level. Native physics, visual timing and coin routes still need comparison. No account, editor or other levels are available.

Verified in Chrome with original Steam resources. The catalog link, folder validation, music, pause and resume, death and retry, mute, and mobile layout worked. An accelerated touch-input replay completed the level at 100%.

References: [level fields](https://github.com/gd-programming/gd.docs/blob/main/docs/resources/client/level-components/level-object.md), [frame mapping](https://gist.github.com/frqubit/39bf5e3c6a072096424d93055991d7f8), and [browser physics reference](https://github.com/padale323/gd-web-decompiled/blob/main/src/player.js).

### 2026-11-08 Geometry Dash library update

The public arcade page now restores the selected Steam resource files from IndexedDB after reload. The browser caches only the files recognized by the game loader. Level results, secret coins from completed attempts, and the selected cube icon are saved per browser. The six-icon kit uses web unlock points earned through level clears and unique secret coins.

The catalog lists all 27 maps present in the Steam install. Stereo Madness, Back on Track, Polargeist, Dry Out, Base After Base, and Jumper are playable. The remaining entries are labeled Port pending. Yellow pads, yellow orbs and gravity portals support the expanded selection. Browser replays reached 100% in all six, and cache restore, progress and icon persistence passed. Native progression rules, physics parity, remaining modes, and later levels are still open.

## 2026-11-08: Experimental category

Geometry Dash, Medieval II Asset Lab, Moon Sweepers 2D and HLM2 Web now use the Experimental genre on the homepage, so the genre filter lists them together as their own category. Card destinations, icons, order and game code are unchanged. Catalog is still 21 cards.

## 2026-11-08: Experimental tab and warning

The library row now has a red Experimental tab. First open shows a warning dialog that must be accepted; the acceptance flag (agArcade.experimentalAck.v1) keeps future opens direct. The tab lists only Geometry Dash, Medieval II Asset Lab, Moon Sweepers 2D and HLM2 Web, their genre chips are red in every view, and the status line repeats the files/unfinished notice. Commit ca534ef; Pages run 42570230930 succeeded. Local and live Chrome checks passed: dialog blocks until accept, close-X keeps All games, accept shows the four cards, red tab/genre styling in midnight and daylight, no page errors. Live verification used a cache-refreshed fetch because GitHub Pages assets can stay cached around ten minutes; visitors may need a refresh during that window.

## 2026-11-09: Super Mario 64 PC port player

/super-mario-64.html now defaults to the SM64 PC port WebGL, served from /files/load/sm64webgl/index.html (launcher-only, based on the user's Stash launcher clmario64webgl.html). Engine/art loads from jsDelivr at the pinned gh-pages commit 16642fb00ca0be7e47e838caa7b29f81259e68b7; a "Nintendo 64 version" button falls back to the existing WebRetro own-file flow (still deployed). Commits c012901, 2f7b84c and 3af6dca; Pages runs succeeded for each. Chrome checks passed: local and live wrappers reach the game frame, WebGL context created, toggle between PC port and N64 mode works, no uncaught page errors from the wrapper.

Automated caveat, shared with the upstream page it was copied from: in my automated browser the emscripten canvas never settles to a rendered image (pixels stay fully black while Module.calledRun is true). The official https://notan127.github.io/SM64-PC-Port-WebGL/ behaves the same in this environment, so a real desktop browser with manual input is the reference check; automated headless verification of pixels is not claimed here. Saves persist in browser storage on the arcade origin.

### 2026-11-09 Geometry Dash main menu

The main menu now follows the original Icon Kit, Play and Creator layout and has separate achievements, settings and stats screens. When imported resources contain the menu atlases and music, the player uses those original files locally. Creator shows the current coverage of the editor and online features. The playable set remains six levels.

REA asset inventory evidence: ev_5c0945accd763a2b46c7dbca787980656e1d266b5fcaaaecc9b73d5b2b7aa791. It inventories the original menu atlas metadata and fonts, with sprite names corroborated against the installed plist files. The recreated layout does not establish native menu parity.

### Official Stereo Madness demo

The Geometry Dash player links to /geometry-dash/official.html, where RobTop's official browser demo runs in a frame. It uses RobTop's hosted build and requires no Steam file selection. The browser preview remains available separately with local Steam resources.

### Experimental visibility and Geometry Dash controls

Experimental games appear only inside the Experimental tab after the existing confirmation. The regular views and genre selector exclude them.

Both Geometry Dash pages have fullscreen and an editable side link saved in browser storage. The Steam-file preview adds restart and level selection to the pause menu, next-level navigation on completion, and a trail plus crash and clear effects. The effects setting honors reduced-motion preferences. The official demo's menus and effects are provided by RobTop.

### Geometry Dash ZIP import

The preview accepts a local ZIP of the Steam Resources folder as well as the folder itself. It reads the ZIP directory, validates and extracts only the expected game files, and reuses the existing browser cache. The ZIP stays on the user's device.

### Geometry Dash release link

The preview has a permanent Download Resources control beside the fullscreen button. It opens the existing arcade-downloads GitHub release page. The player accepts ZIPs selected locally by the visitor.

### Geometry Dash menu, input, and practice

The preview uses the original logo from GJ_LaunchSheet when available. The main menu includes Newgrounds, Geometry Dash news, and RobTop links. Jump taps are preserved across physics steps, and visual effects now follow recent positions and emit particles at landings, portals, and coins. Practice mode supports manual checkpoints and restores the attempt and song position on retry. Practice attempts are excluded from normal scores and unlocks.

REA recorded the installed executable under evidence ev_de4453a3fa45be6ea1ece7c0514a04381b99f7c287869a3e323df4146a7a0b18. Bounded PE disassembly examined MenuLayer::init at RVA 0x4720c0 and PlayerObject::updateJump at RVA 0x4e9b80. The original title asset was identified by reference. A gravity-factor change affected two existing input replays, so the preview retains its previous coefficients pending native timing and collision comparisons. Native gameplay parity, unported menus and the other maps remain open.
