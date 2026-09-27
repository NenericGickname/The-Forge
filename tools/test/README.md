# Tools

| File | What it does |
|---|---|
| `../build.py` | Builds the game from `game/` into `index.html`, `sw.js` and `dist/The_Forge_standalone.html`. |
| `regress.sh` | Regression test. Runs the original game and the current build through the same scripted sessions with fixed dice rolls, then compares state, text and screenshots. About 10 minutes. |
| `harness.js` | The scripted sessions (fresh start, mid game, late game, super late, save export and import). |
| `compare.js` | Compares two harness outputs. |
| `analyze.js` | Finds dead code: replaced functions that never run, unused captures, unreferenced functions. |
| `colocate.js` | Moves the layers of one function next to each other (only where that is provably safe). |
| `merge.js` | Merges "call the old version, then add more" layers into one function. |
| `codemap.js` | Writes `docs/CODE_MAP.md`. |
| `split.py` | One-time tool that cut the single HTML file into `game/`. |

Intentional gameplay changes will show up as differences in `regress.sh`. That is expected. Check that only the things you meant to change moved.
