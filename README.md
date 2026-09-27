# The Forge

Incremental roguelike forging game. Play it in a phone browser and install it to the home screen.

## Install on a phone
**iPhone:** open the game link in **Safari** → Share button → **Add to Home Screen**.
**Android:** open the link in **Chrome** → menu ⋮ → **Install app** (or "Add to Home screen").

The installed app runs full screen and works offline. Hold the phone sideways for the full layout; upright still works.

## Saves
* Autosaves on every change, every 15 s, and whenever you leave the app.
* A second copy is kept on the device, and three rolling backups (Options → Restore backup).
* Options → **Save file** opens the phone's share menu, so you can keep the save in Files, Google Drive, or a chat with yourself. **Load file** reads it back, on any device.
* On iPhone, Safari and the home-screen app keep **separate** saves. If you played in Safari first, use Save file there and Load file in the app.

## Where the code lives
* `game/` holds the game source: one file per system (combat, items, forge, skills, quests, guild, mine, shop, save, audio, interface) plus ordered start-up files. See `docs/CODE_MAP.md`.
* `mobile.*` and `landscape.*` hold the phone layers.
* `python3 tools/build.py` builds `index.html` (the web app) and `dist/The_Forge_standalone.html` (one file with music, which opens straight from disk).
* `bash tools/test/regress.sh` plays the original and the current game side by side and reports any difference.
* `archive/The_Forge_reference.html` is the reference for the regression test. Refresh it with `python3 tools/build.py --reference` after an intentional change.

## Releasing a new version
1. Change files in `game/`, following the rules in `docs/CODE_MAP.md`.
2. Run `python3 tools/build.py`, then `bash tools/test/regress.sh`.
3. Commit and push. GitHub Pages redeploys in about a minute.
