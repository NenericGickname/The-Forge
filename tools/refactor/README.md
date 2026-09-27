# Refactor tools (one-time)

These scripts turned the 116-patch single file into the current `game/` layout. They are kept for reference; normal development does not need them.

`pipeline.sh` runs them in order. Every step was checked with the regression test (identical game state, screen text and screenshots in fresh, mid, late and super-late sessions).

| Step | Tool | What it does |
|---|---|---|
| 1 | `unify.js` | Opens the 45 sealed patch scopes and joins all scripts into one strict script (clashing names renamed). |
| 2 | `presplit.js`, `hoistdata.js` | Splits combined statements; moves pure constant data to the top. |
| 3 | `colocate2.js`, `merge2.js` | Gathers the layers of each function and merges "call the old version, then add more" layers into one function. |
| 4 | `normalize.js` | Removes `try{}` / `if(typeof X==="function")` wrappers around patches so more layers can merge. |
| 5 | `flatten.js` | Removes leftover empty blocks and unused labels. |
| 6 | `declify.js` | Turns the remaining layer chains into named functions (`renderTownBase()` → `renderTown()`). |
| 7 | `renames.js` | Drops version tags from names (`defaultStateV5` → `defaultState`) where safe. |
| 8 | `reorg.js` | Sorts functions into system files and formats everything with Prettier. |

The only behaviour difference found: two save fields (`dummyKillsV78`, `flags.seenEfxV100`) are now created as 0 and `{}` at start-up instead of on first use. That has no effect on play.
