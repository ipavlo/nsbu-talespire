# Never Stop Blowing Up - TaleSpire Symbiote

A TaleSpire Symbiote (in-game companion tool) for the **Never Stop Blowing Up** TTRPG by Brennan Lee Mulligan & Carlos Luna (Dropout). Built on the Kids on Bikes/Kids on Brooms engine, NSBU uses die-type skill progression (d4 through d20) instead of numeric modifiers, with a signature "Blow Up" mechanic where rolling the max value on a skill die permanently upgrades that skill.

## Features

- **Character Sheet** -- Track 9 skills (Stunts, Brawl, Tech, Weapons, Sneak, Wits, Tough, Drive, Hot) as die types. Manage Turbo Tokens, Injury Levels (Healthy/Superficial/Severe/Adrenalized), and 37 individual abilities plus 9 group suites. All changes auto-save immediately to TaleSpire campaign storage.
- **Dice Roller** -- Roll skill checks through TaleSpire's native dice tray. Detects Blow Ups (rolling the exact max on a skill die) and optionally auto-upgrades the skill die to the next tier. Supports Prepared Actions (half die value for non-stress situations). Includes a roll log with Blow Up highlighting.
- **Rules Reference** -- Searchable, collapsible reference covering all core mechanics: Blowing Up, Turbo Tokens, Injury Levels, Abilities, Group Suites, and more.

## Project Structure

```
nsbu-talespire/
  symbiotes/never-stop-blowing-up/   # The Symbiote (copy this folder into TaleSpire)
    manifest.json                     # TaleSpire Symbiote manifest (v1)
    index.html                        # Entry point - tabbed SPA (Sheet, Dice, Rules)
    css/style.css                     # TaleSpire-themed styles
    js/data.js                        # Game data constants (skills, abilities, rules text)
    js/app.js                         # Global event handlers and tab navigation
    js/character-sheet.js             # Character sheet logic with auto-save
    js/dice-roller.js                 # Dice rolling with Blow Up detection
    js/rules-reference.js             # Searchable rules sections
    readme.md                         # Description shown in TaleSpire's Symbiote panel
    rules-reference.md                # Full mechanics reference (standalone, not loaded by Symbiote)
  nsbu-extracted.txt                  # Extracted text from the source PDF
  .opencode/skills/                   # Build skills used to generate this Symbiote
```

## Development

### Prerequisites

- **TaleSpire** (Steam) with Symbiotes enabled in Settings
- A web browser for local testing (optional, but the TaleSpire API calls will only work inside TaleSpire)

### Installing the Symbiote into TaleSpire

1. Locate TaleSpire's Symbiotes directory:
   ```
   %AppData%\..\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\
   ```
   On a typical Windows install this resolves to:
   ```
   C:\Users\<YourName>\AppData\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\
   ```

2. Copy (or symlink) the `symbiotes/never-stop-blowing-up/` folder into that directory so the structure looks like:
   ```
   .../TaleSpire/Symbiotes/never-stop-blowing-up/
     manifest.json
     index.html
     css/
     js/
     ...
   ```

3. Launch TaleSpire, open a campaign, and click the Symbiotes icon in the side panel. "Never Stop Blowing Up Companion" should appear in the list.

### Using a Symlink for Development

To avoid copying files after every edit, create a symbolic link from TaleSpire's Symbiotes directory to this repo:

**Windows (run as Administrator):**
```cmd
mklink /D "C:\Users\<YourName>\AppData\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\never-stop-blowing-up" "E:\Code\nsbu-talespire\symbiotes\never-stop-blowing-up"
```

**WSL:**
```bash
ln -s /mnt/e/Code/nsbu-talespire/symbiotes/never-stop-blowing-up "/mnt/c/Users/<YourName>/AppData/LocalLow/BouncyRock Entertainment/TaleSpire/Symbiotes/never-stop-blowing-up"
```

After symlinking, any file changes are immediately reflected when you reload the Symbiote in TaleSpire.

### Debugging with TaleSpire Developer Tools

1. In TaleSpire, go to **Settings > Symbiotes** and enable **Development Mode**.
2. Open the Symbiote in the side panel.
3. Right-click inside the Symbiote panel and select **Inspect** to open Chromium DevTools.
4. Use the Console, Network, and Elements tabs as you would in any browser.
5. The Symbiote also writes debug messages via `TS.debug.log()` which appear in TaleSpire's Symbiote debug log.

### Reloading Changes

- With Development Mode enabled, a **Reload** button appears in the Symbiote panel (the manifest has `"controls": { "reload": true }` is not set, but Development Mode provides one automatically).
- Alternatively, right-click inside the panel and select **Reload**.
- Manifest changes (e.g. adding new subscriptions) require closing and reopening the Symbiote.

### Key Technical Notes

- **Global scope required**: All TaleSpire event handlers (`onStateChangeEvent`, `handleRollResult`) must be declared with `function` or `var` at the global scope. `let`/`const` scoped handlers are invisible to the API.
- **Auto-save**: Every UI interaction (skill changes, ability toggles, injury clicks, token adjustments, text input) triggers an immediate save to `TS.localStorage.campaign.setBlob()`. Text fields use a 400ms debounce.
- **Blow Up detection**: Uses exact match (`total === maxVal`) because NSBU skill checks always roll exactly `1dX`.
- **No external dependencies**: The Symbiote is pure HTML/CSS/JS with no build step or bundler required.
