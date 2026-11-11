# Native parity audit

The target is the installed Steam build, Unity 6000.3.23. This checklist distinguishes recovered game content from behavior that has been verified against a running native reference. Completing the web tutorial alone does not establish native parity.

| Area | Current evidence and implementation | Required before an exact-match claim |
| --- | --- | --- |
| Welcome text and tutorial prompts | English localization extracted from the installed bundle | Compare timing, camera cuts, and input blocking against a native first launch |
| Tutorial checkpoints | Cpp2IL recovered InGameTutorial methods for rounds 1, 2, 3, 9, and 10 | Reproduce every branch, failure, delay, and callback |
| Map appearance | Original Monkey Meadow terrain texture | Restore native camera projection, terrain geometry, foreground objects, materials, and lighting |
| Route and placement | Hand-traced route and manually chosen guide circles | Decode MapModel path points, placement areas, collisions, guide coordinates, and obstacle checks |
| Monkeys | Original Dart Monkey and Quincy models and idle/attack/placement clips rendered in Unity | Match the native camera and materials, all upgrade models, blink logic, and animation event timing |
| Ground contact | Every sampled pose stores its projected prefab origin and aligns that origin to the board position | Compare terrain height, footprint, shadow scale, and ground contact with native video |
| Animation smoothness | 32 samples per action, 16 headings | Compare playback transitions and target tracking with the native renderer |
| Music | Original MusicTitle and MusicUpbeat1A, decoded and looped in the browser | Verify tutorial track selection, transition, native volume, pause behavior, and playlist rules |
| Bloon pops | Original Pop01–Pop04, played on each simulated hit | Decode native sound variation, pitch, volume, grouping, and voice limits |
| UI, placement, and victory audio | Original click, popup, placement, Quincy voice, upgrade, and victory clips | Verify event-to-clip selection and timing against native callbacks |
| Ambience | No separate ambient loop was established from the inspected tutorial scene or audio names | Inspect the native audio routing and map configuration before adding a loop |
| Upgrades screen | Three horizontal paths with all 15 native Dart icons and native descriptions; selected details and first-tier XP unlock | Match native typography, exact layout, tooltips, confirmation, XP costs, locked states, and navigation |
| In-game upgrade panel | First-tier cash purchases are implemented | Recreate all native targeting, path panels, crosspath rules, portraits, sell controls, and model swaps |
| Upgrade behavior | Three first-tier effects in a custom simulation | Decode UpgradeModel, TowerModel, attacks, weapons, projectiles, and all behavior models |
| Economy and XP | Cash and XP values include provisional tutorial choices | Decode native starting conditions, XP distribution, unlock costs, rewards, refunds, and save writes |
| Bloons and rounds | Tutorial completes using a custom round list and collision loop | Decode native RoundSetModel, spawn times, BloonModel properties, damage, pierce, immunity, movement, and RNG |
| Quincy | Native animation/voice with simplified attacks and leveling | Decode HeroModel XP curve, attack behavior, upgrades, targeting, and abilities |
| HUD and settings | Browser HUD, pause, restart, and audio controls | Rebuild native layout, buttons, settings persistence, and shortcuts |
| Victory and handoff | Tutorial victory and replay work | Recreate the native reward sequence, Patch conversation, home scene, and progress persistence |
| Saving | Local completion flag | Match native offline progression and save compatibility with an explicit migration design |
| Input and devices | Mouse click/drag and narrow layout have browser checks | Compare keyboard, touch, controller, cancel input, resizing, and pause across supported devices |
| Other game content | Raw assets and native code inventory are available | Implement and verify remaining maps, towers, heroes, modes, events, achievements, powers, and knowledge |
| Online services | Native server behavior has not been reconstructed | Establish supported server contracts for accounts, co-op, challenges, matchmaking, and live events |

## Next implementation order

1. Reconstruct GameModelLoader's record tables and primitive readers, then decode sim_model.bytes. Export the tutorial's actual models, upgrades, round set, and starting rules with source offsets.
2. Decode MapModel geometry and the native scene's camera. Replace the traced path, guide markers, ranges, and ground scale together.
3. Rebuild the two native upgrade interfaces using the serialized screen hierarchy, sprites, font metrics, and decoded progression rules.
4. Capture a native first launch and the browser at matching checkpoints. Compare the welcome flow, every tutorial instruction, upgrades, Quincy, loss/retry, and victory.
5. Expand to additional content only after the tutorial differences have been resolved and recorded.

## Verification for this revision

The standalone page was played through all ten rounds in Chrome with ordinary UI clicks and the game's speed controls. Both audio buses produced nonzero PCM samples. Both towers were inspected after placement and during attacks. The screen exposed all three paths and 15 upgrade icons, and the first-tier unlock and cash purchase completed. These checks establish working browser behavior. The remaining comparison work is listed above.

## First standard match

Monkey Meadow Easy Standard runs from round 1 through the round-40 MOAB. Four towers are available, with original Ninja Monkey and Bomb Shooter models, idle and placement clips. The browser implements cash, lives, placement, camo detection, lead and explosion immunities, Bloon children, basic regrowth, and the first Dart upgrades. Quincy uses the installed game description's level-8 and level-14 MOAB damage multipliers. Hero XP, most tower stats, upgrade paths, and attack behavior still need native decoding. The remaining tower and hero roster is unimplemented.

Recovered 529 Bloon group records from the installed simulation model. The published round table supplies grouping and start offsets. The installed data confirmed type, count, and duration for 103 of the 115 groups across rounds 1–40. Twelve groups retain published values pending exact native mapping. [Exported standard round table](https://wiki.biligame.com/btd6/Module:Rounds/DefaultRoundSet.json)

The welcome screen uses shipped logo, sky and button art. The town briefing uses the original projected image and Major Monkey art. The native 3D title and home scenes remain open. A persistent Back to AG Arcade link is available across the game.

Chrome completed the full normal match with 34 lives after real-time opening shots, UI purchases and placements, and accelerated simulation for most of the round time. The round-40 MOAB and final board were visually inspected.

## Roster and firing motion

Standard now offers ten characters. Boomerang Monkey uses curving projectiles. Tack Shooter fires eight tacks. Sniper Monkey hits a visible target across the map and can pop two ordinary layers at once. Wizard Monkey fires energy bolts with Purple immunity. Super Monkey fires rapid darts. Sauda uses short-range camo-detecting sword attacks and shares the one-hero limit with Quincy. Base values were taken from the exported version 56 game data. [Boomerang](https://teemo.dev/game-design/bloons-td-6/wiki/towers/boomerang-monkey/) · [Tack](https://teemo.dev/game-design/bloons-td-6/wiki/towers/tack-shooter/) · [Sniper](https://teemo.dev/game-design/bloons-td-6/wiki/towers/sniper-monkey/) · [Wizard](https://teemo.dev/game-design/bloons-td-6/wiki/towers/wizard-monkey/) · [Super Monkey](https://teemo.dev/game-design/bloons-td-6/wiki/towers/super-monkey/) · [Sauda](https://teemo.dev/game-design/bloons-td-6/wiki/heroes/sauda/)

Original shelf models and their idle and placement clips are used for the six additions and for Ninja Monkey and Bomb Shooter. The shelf controllers lack gameplay firing clips. The browser adds ground-anchored recoil and attack effects for those eight characters. Dart Monkey and Quincy continue to use their recovered attack clips. Exact attack trajectories, hero abilities, the remaining roster, and complete upgrades remain open.

Browser fixtures bought and placed each character, confirmed a visible body and firing-frame changes with idle motion disabled, and confirmed Bloon damage. The tests covered eight Tack Shooter projectiles, Sniper's two-layer hit, Bomb's lead damage, Ninja and Sauda camo hits, and the one-hero rule. The tutorial and standard victory regression checks also passed. The shop scrolls independently to preserve the board and Arcade return at short viewport heights.
