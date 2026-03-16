---
name: ttrpg-symbiote-builder
description: Parse TTRPG rulebook PDFs and build a fully functional TaleSpire Symbiote that implements the game's mechanics as an interactive in-game companion tool.
license: MIT
compatibility: opencode
metadata:
  audience: developers-and-game-masters
  domain: talespire-modding
dependencies:
  - .opencode/skills/ttrpg-rules-parser/SKILL.md
  - .opencode/skills/talespire-symbiote/SKILL.md
---

## Purpose

Take one or more TTRPG rulebook PDFs as input, extract and understand the game mechanics, then generate a complete TaleSpire Symbiote that serves as an interactive rules companion and play-aid tool inside TaleSpire. The Symbiote should let players look up rules, roll dice using the system's mechanics, track character stats, and manage combat -- all within TaleSpire's side panel.

## When to Use

Use this skill when the user:
- Provides TTRPG rulebook PDFs and wants a TaleSpire Symbiote built from them
- Wants an in-game companion tool for a specific TTRPG system running in TaleSpire
- Asks to turn game rules into an interactive TaleSpire plugin
- Needs a character sheet, dice roller, or combat tracker Symbiote tailored to a specific rule system

## Prerequisites

This skill depends on two other skills. Load and follow their guidelines:
- **ttrpg-rules-parser** (`.opencode/skills/ttrpg-rules-parser/SKILL.md`) -- for extracting and organizing rules from PDFs
- **talespire-symbiote** (`.opencode/skills/talespire-symbiote/SKILL.md`) -- for all Symbiote API, manifest, theming, and architecture details

---

## Workflow

### Phase 1: Gather Requirements

1. **Collect PDFs.** Ask the user which PDF file(s) to parse. Accept via `@` file picker or path.
2. **Identify the system.** Ask or infer the TTRPG system name (D&D 5e, Pathfinder 2e, FATE, OSR, homebrew, etc.).
3. **Determine scope.** Ask the user which features the Symbiote should include. Present these options:

| Feature Module | Description | Recommended? |
|---|---|---|
| **Rules Reference** | Searchable/browsable rules lookup organized by category | Yes (core) |
| **Character Sheet** | Editable fields for stats, HP, abilities, skills, etc. | Yes |
| **Dice Roller** | System-specific rolls (attack, save, skill check, damage) wired to TaleSpire dice tray | Yes |
| **Combat Tracker** | Initiative, turn order, conditions, HP tracking | Optional |
| **Spell/Ability Browser** | Filterable spell or ability lists with roll buttons | Optional |
| **Equipment Manager** | Inventory, encumbrance, currency tracking | Optional |
| **GM Tools** | Encounter builder, DC reference, random tables, GM-only sync | Optional |
| **Sync/Handouts** | Share data between GM and players via sync messaging | Optional |

4. **Confirm output location.** Default to a new folder in the workspace (e.g., `./symbiotes/<system-name>/`). Confirm with the user.

### Phase 2: Parse and Analyze Rules

Follow the **ttrpg-rules-parser** skill workflow:

1. Read each PDF and extract all textual content.
2. Identify and categorize mechanics into the canonical categories:
   - Core Resolution Mechanic
   - Character Creation
   - Attributes & Derived Stats
   - Skills & Proficiencies
   - Combat & Tactical Rules
   - Movement & Exploration
   - Magic & Spellcasting (if applicable)
   - Equipment & Economy
   - Health, Healing & Resting
   - Conditions & Status Effects
   - Advancement & Leveling
   - Any system-specific categories
3. Produce an intermediate mechanics reference document. Write it to `<output-dir>/rules-reference.md` for the user to review.
4. **Extract structured data** needed for the Symbiote. This goes beyond the reference doc -- build JavaScript-ready data structures:

```javascript
// Example: Extract these as JS objects/arrays to embed or reference
const SYSTEM = {
  name: "System Name",
  coreMechanic: "d20 + modifier vs DC", // or "dice pool", "percentile", etc.
  dice: ["d4", "d6", "d8", "d10", "d12", "d20"], // dice types used
};

const ATTRIBUTES = [
  { key: "str", name: "Strength", abbreviation: "STR" },
  { key: "dex", name: "Dexterity", abbreviation: "DEX" },
  // ...
];

const SKILLS = [
  { key: "athletics", name: "Athletics", attribute: "str" },
  { key: "acrobatics", name: "Acrobatics", attribute: "dex" },
  // ...
];

const CONDITIONS = [
  { name: "Blinded", effect: "Can't see. Auto-fail sight checks. Attacks have disadvantage. Attacks against have advantage." },
  // ...
];

// Spell lists, equipment tables, class features, etc.
```

5. **Map rules to Symbiote features.** For each selected feature module, identify exactly which rules data feeds into it:
   - Character Sheet <-- Attributes, derived stats, HP formula, skills, class features
   - Dice Roller <-- Core resolution mechanic, attack formulas, save formulas, damage dice
   - Combat Tracker <-- Initiative rules, action economy, conditions, death/dying rules
   - Spell Browser <-- Spell lists, spell slots, casting mechanics

### Phase 3: Architect the Symbiote

Design the file structure based on the selected feature modules. Follow the **talespire-symbiote** skill for all technical decisions.

#### 3.1 Standard File Structure

```
<output-dir>/
  manifest.json           # Symbiote manifest (see talespire-symbiote skill Section 2)
  index.html              # Main entry point with tabbed UI
  css/
    style.css             # Main styles using TaleSpire theme variables
  js/
    app.js                # Init, state management, tab navigation
    data.js               # Extracted game data (attributes, skills, spells, conditions, etc.)
    character-sheet.js    # Character sheet logic & storage
    dice-roller.js        # Dice rolling logic wired to TS.dice API
    rules-reference.js    # Rules search and display
    combat-tracker.js     # (if selected) Initiative & combat management
    spell-browser.js      # (if selected) Spell filtering & display
    gm-tools.js           # (if selected) GM-only features
  readme.md               # Description file for TaleSpire UI
  rules-reference.md      # Generated rules reference (for user, not loaded by Symbiote)
```

#### 3.2 Manifest Configuration

Determine subscriptions and capabilities based on selected features:

| Feature | Required Subscriptions | Required Capabilities | Requires interop.id? |
|---|---|---|---|
| Rules Reference | `symbiote > onStateChangeEvent` | -- | No |
| Character Sheet | `symbiote > onStateChangeEvent` | -- | No |
| Dice Roller | `dice > onRollResults`, `symbiote > onStateChangeEvent` | -- | No |
| Combat Tracker | `initiative > onInitiativeEvent`, `creatures > onCreatureStateChange`, `symbiote > onStateChangeEvent` | `runInBackground` | No |
| Sync/Handouts | `sync > onSyncMessage`, `clients > onClientEvent`, `symbiote > onStateChangeEvent` | `runInBackground` | **Yes** |
| GM Tools | `clients > onClientEvent`, `players > onCampaignPlayerEvent` | -- | Only if sync |

Always include these extras: `["colorStyles", "fonts", "icons"]`

Always set `webViewBackgroundColor` to match `--ts-background-primary` (typically `"#1a1a2e"` or `"#000000"`).

#### 3.3 Generate a UUIDv4

If sync features are selected, generate a UUIDv4 for `api.interop.id`. Use this pattern:

```javascript
// For generating during build (not runtime)
crypto.randomUUID() // or equivalent
```

### Phase 4: Build the Symbiote

Implement each file following the patterns below. Refer to the **talespire-symbiote** skill for all API details.

#### 4.1 manifest.json

Build the manifest from the architecture decisions in Phase 3. Example for a full-featured symbiote:

```json
{
  "manifestVersion": 1,
  "name": "<System Name> Companion",
  "summary": "Interactive rules companion for <System Name> in TaleSpire",
  "descriptionFilePath": "/readme.md",
  "entryPoint": "/index.html",
  "version": "1.0.0",
  "api": {
    "version": "0.1",
    "initTimeout": 10,
    "subscriptions": {
      "symbiote": {
        "onStateChangeEvent": "onStateChangeEvent"
      },
      "dice": {
        "onRollResults": "handleRollResult"
      },
      "creatures": {
        "onCreatureStateChange": "handleCreatureUpdate",
        "onCreatureSelectionChange": "handleSelectionChange"
      },
      "initiative": {
        "onInitiativeEvent": "handleInitiativeUpdate"
      },
      "clients": {
        "onClientEvent": "handleClientEvent"
      },
      "sync": {
        "onSyncMessage": "handleSyncMessage"
      }
    },
    "interop": {
      "id": "<generated-uuidv4>"
    }
  },
  "environment": {
    "webViewBackgroundColor": "#1a1a2e",
    "capabilities": ["runInBackground"],
    "extras": ["colorStyles", "fonts", "icons"]
  }
}
```

Remove subscriptions, capabilities, and interop that are not needed for the selected features.

#### 4.2 index.html

Build a tabbed single-page app. Each feature module gets its own tab panel.

```html
<!DOCTYPE html>
<html>
<head>
  <title><System Name> Companion</title>
  <link rel="stylesheet" href="/css/style.css">
  <!-- Load data first, then feature modules, then app init last -->
  <script src="/js/data.js"></script>
  <script src="/js/rules-reference.js"></script>
  <script src="/js/character-sheet.js"></script>
  <script src="/js/dice-roller.js"></script>
  <!-- Include only selected modules -->
  <script src="/js/combat-tracker.js"></script>
  <script src="/js/app.js"></script>
</head>
<body>
  <nav class="tab-bar" role="tablist">
    <button class="tab active" role="tab" aria-selected="true" data-tab="sheet">
      <i class="ts-icon-character ts-icon-small"></i> Sheet
    </button>
    <button class="tab" role="tab" aria-selected="false" data-tab="dice">
      <i class="ts-icon-d20 ts-icon-small"></i> Dice
    </button>
    <button class="tab" role="tab" aria-selected="false" data-tab="rules">
      <i class="ts-icon-book ts-icon-small"></i> Rules
    </button>
    <button class="tab" role="tab" aria-selected="false" data-tab="combat">
      <i class="ts-icon-sword-crossed ts-icon-small"></i> Combat
    </button>
  </nav>

  <main>
    <section id="tab-sheet" class="tab-panel active" role="tabpanel">
      <!-- Character sheet fields generated by character-sheet.js -->
    </section>
    <section id="tab-dice" class="tab-panel" role="tabpanel">
      <!-- Dice roller UI generated by dice-roller.js -->
    </section>
    <section id="tab-rules" class="tab-panel" role="tabpanel">
      <!-- Rules reference generated by rules-reference.js -->
    </section>
    <section id="tab-combat" class="tab-panel" role="tabpanel">
      <!-- Combat tracker generated by combat-tracker.js -->
    </section>
  </main>
</body>
</html>
```

#### 4.3 css/style.css

Use TaleSpire theme variables exclusively. Follow the base CSS from the talespire-symbiote skill Section 6.4, then add:

```css
/* Tab navigation */
.tab-bar {
  display: flex;
  gap: 2px;
  border-bottom: 2px solid var(--ts-accent-primary);
  margin-bottom: 1em;
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--ts-background-primary);
  padding: 4px 0;
}

.tab {
  flex: 1;
  padding: 0.5em;
  text-align: center;
  cursor: pointer;
  background-color: var(--ts-background-secondary);
  border: 1px solid var(--ts-accessibility-border);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  color: var(--ts-color-secondary);
  font-family: 'OptimusPrinceps', sans-serif;
  font-size: 1em;
  transition: all 0.15s ease-in-out;
}

.tab:hover {
  background-color: var(--ts-button-hover);
  color: var(--ts-color-primary);
}

.tab.active {
  background-color: var(--ts-accent-primary);
  color: var(--ts-color-primary);
  font-weight: bold;
}

.tab:focus-visible {
  outline: 3px solid var(--ts-accessibility-focus);
  outline-offset: -1px;
}

.tab-panel { display: none; }
.tab-panel.active { display: block; }

/* Sections & cards */
.card {
  background-color: var(--ts-background-secondary);
  border: 1px solid var(--ts-accessibility-border);
  border-radius: 4px;
  padding: 0.8em;
  margin-bottom: 0.8em;
}

.card h2 {
  margin: 0 0 0.5em 0;
  font-size: 1.3em;
  color: var(--ts-accent-primary);
}

/* Stat grid for character sheet */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5em;
}

.stat-box {
  text-align: center;
  padding: 0.5em;
  background-color: var(--ts-background-tertiary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.stat-box:hover {
  background-color: var(--ts-button-hover);
}

.stat-box .stat-label {
  font-size: 0.8em;
  color: var(--ts-color-secondary);
}

.stat-box .stat-value {
  font-size: 1.6em;
}

.stat-box .stat-mod {
  font-size: 1em;
  color: var(--ts-accent-primary);
}

/* Roll buttons */
.roll-btn {
  background-color: var(--ts-button-background);
  color: var(--ts-color-primary);
  border: 1px solid var(--ts-accessibility-border);
  border-radius: 4px;
  padding: 0.4em 0.8em;
  cursor: pointer;
  font-family: 'OptimusPrinceps', sans-serif;
  transition: all 0.15s ease-in-out;
}

.roll-btn:hover {
  background-color: var(--ts-button-hover);
}

.roll-btn i { margin-right: 0.3em; }

/* Search */
.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5em;
  margin-bottom: 1em;
}

/* Conditions list */
.condition-tag {
  display: inline-block;
  padding: 0.2em 0.6em;
  margin: 0.2em;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: var(--ts-background-tertiary);
  color: var(--ts-color-secondary);
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.condition-tag.active {
  background-color: var(--ts-accent-primary);
  color: var(--ts-color-primary);
}

/* GM-only sections */
.gm-only { display: none; }
.gm-only.visible { display: block; }

/* Hidden utility */
.hidden { display: none; }
```

#### 4.4 js/data.js -- Game Data

This file contains ALL extracted game data as JavaScript objects. It is the bridge between the parsed rules and the Symbiote UI. Structure it as global constants:

```javascript
// ============================================================
// SYSTEM METADATA
// ============================================================
var SYSTEM_NAME = "System Name";
var CORE_MECHANIC = "d20 + modifier vs DC"; // Adapt to actual system

// ============================================================
// ATTRIBUTES
// ============================================================
// Adapt fields to the actual system. These are examples for d20 systems.
var ATTRIBUTES = [
  // { key, name, abbreviation }
];

// ============================================================
// ATTRIBUTE MODIFIER FORMULA
// ============================================================
// Return the modifier for an attribute score. Adapt to system.
function getAttributeModifier(score) {
  // D&D/d20: Math.floor((score - 10) / 2)
  // Other systems: adapt accordingly
  return Math.floor((score - 10) / 2);
}

// ============================================================
// SKILLS
// ============================================================
var SKILLS = [
  // { key, name, attribute (key), description }
];

// ============================================================
// CONDITIONS
// ============================================================
var CONDITIONS = [
  // { name, effect (string describing mechanical effect) }
];

// ============================================================
// DICE ROLL TEMPLATES
// ============================================================
// Pre-built roll descriptors for common actions in this system.
var ROLL_TEMPLATES = {
  abilityCheck:  function(attrName, modifier) {
    return { name: attrName + " Check", roll: "1d20" + formatMod(modifier) };
  },
  savingThrow: function(attrName, modifier) {
    return { name: attrName + " Save", roll: "1d20" + formatMod(modifier) };
  },
  skillCheck: function(skillName, modifier) {
    return { name: skillName, roll: "1d20" + formatMod(modifier) };
  },
  attack: function(label, modifier) {
    return { name: label, roll: "1d20" + formatMod(modifier) };
  },
  damage: function(label, diceExpr) {
    return { name: label + " Damage", roll: diceExpr };
  },
  // Add system-specific roll types (e.g., initiative, spell attack, etc.)
};

function formatMod(mod) {
  if (mod === 0 || mod === undefined || mod === null) return "";
  return mod >= 0 ? "+" + mod : "" + mod;
}

// ============================================================
// SPELLS (if applicable)
// ============================================================
var SPELLS = [
  // { name, level, school, castingTime, range, components, duration, description, damage (dice expr or null), classes }
];

// ============================================================
// EQUIPMENT (if applicable)
// ============================================================
var WEAPONS = [
  // { name, type, damage, properties, weight, cost }
];

var ARMOR = [
  // { name, type, ac, modifier, stealthDisadvantage, weight, cost }
];

// ============================================================
// CLASS FEATURES / ABILITIES (if applicable)
// ============================================================
var CLASS_FEATURES = {
  // "className": [ { level, name, description } ]
};

// ============================================================
// RULES REFERENCE DATA
// ============================================================
// Organized by category for the rules browser tab.
var RULES_SECTIONS = [
  {
    title: "Core Resolution",
    id: "core-resolution",
    content: "..." // Markdown or HTML string with the rules text
  },
  {
    title: "Combat",
    id: "combat",
    content: "..."
  },
  // ... one entry per rules category from Phase 2
];

// ============================================================
// LEVEL PROGRESSION (if applicable)
// ============================================================
var LEVEL_TABLE = [
  // { level, xpRequired, proficiencyBonus, features }
];
```

**CRITICAL**: Adapt every data structure to the actual TTRPG system. The examples above use d20-system conventions. For a PbtA game, replace attributes/skills with Moves. For FATE, use Aspects/Stunts/Skills ladder. For dice pool systems, change `ROLL_TEMPLATES` to build pool expressions.

#### 4.5 js/app.js -- Init & Navigation

```javascript
// ============================================================
// GLOBAL STATE
// ============================================================
var isGM = false;
var myClientId = null;

// ============================================================
// TALESPIRE EVENT HANDLERS (must be global scope!)
// ============================================================

function onStateChangeEvent(msg) {
  if (msg.kind === "hasInitialized") {
    initApp();
  }
}

// Only include handlers for subscriptions declared in manifest.
// Remove unused handlers.

function handleRollResult(event) {
  // Delegate to dice-roller module
  if (typeof DiceRoller !== "undefined") {
    DiceRoller.onRollResult(event);
  }
}

function handleCreatureUpdate(event) {
  if (typeof CombatTracker !== "undefined") {
    CombatTracker.onCreatureUpdate(event);
  }
}

function handleSelectionChange(event) {
  if (typeof CombatTracker !== "undefined") {
    CombatTracker.onSelectionChange(event);
  }
}

function handleInitiativeUpdate(event) {
  if (typeof CombatTracker !== "undefined") {
    CombatTracker.onInitiativeUpdate(event);
  }
}

function handleClientEvent(event) {
  if (event.kind === "clientModeChanged") {
    TS.clients.isMe(event.payload.client.id).then(function(isMe) {
      if (isMe) {
        isGM = (event.payload.clientMode === "gm");
        updateGMVisibility();
      }
    });
  }
}

function handleSyncMessage(event) {
  // Delegate to appropriate module
}

// ============================================================
// APP INITIALIZATION
// ============================================================

async function initApp() {
  // Identify self
  var me = await TS.clients.whoAmI();
  myClientId = me.id;

  // Check if GM
  var info = await TS.clients.getMoreInfo([me.id]);
  if (!info.cause && info.length > 0) {
    isGM = (info[0].clientMode === "gm");
  }

  // Initialize tab navigation
  initTabs();

  // Initialize feature modules
  if (typeof CharacterSheet !== "undefined") CharacterSheet.init();
  if (typeof DiceRoller !== "undefined") DiceRoller.init();
  if (typeof RulesReference !== "undefined") RulesReference.init();
  if (typeof CombatTracker !== "undefined") CombatTracker.init();

  // Show GM sections if applicable
  updateGMVisibility();

  TS.debug.log(SYSTEM_NAME + " Companion initialized");
}

// ============================================================
// TAB NAVIGATION
// ============================================================

function initTabs() {
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener("click", function() {
      switchTab(this.dataset.tab);
    });
  }
}

function switchTab(tabId) {
  // Deactivate all
  var tabs = document.querySelectorAll(".tab");
  var panels = document.querySelectorAll(".tab-panel");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
    tabs[i].setAttribute("aria-selected", "false");
  }
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove("active");
  }
  // Activate selected
  var selectedTab = document.querySelector('.tab[data-tab="' + tabId + '"]');
  var selectedPanel = document.getElementById("tab-" + tabId);
  if (selectedTab) {
    selectedTab.classList.add("active");
    selectedTab.setAttribute("aria-selected", "true");
  }
  if (selectedPanel) selectedPanel.classList.add("active");
}

// ============================================================
// GM VISIBILITY
// ============================================================

function updateGMVisibility() {
  var gmSections = document.querySelectorAll(".gm-only");
  for (var i = 0; i < gmSections.length; i++) {
    if (isGM) {
      gmSections[i].classList.add("visible");
    } else {
      gmSections[i].classList.remove("visible");
    }
  }
}
```

#### 4.6 js/character-sheet.js

```javascript
var CharacterSheet = (function() {
  var STORAGE_KEY_PREFIX = "charsheet_";

  function init() {
    buildSheetUI();
    loadFromStorage();
  }

  function buildSheetUI() {
    var container = document.getElementById("tab-sheet");
    // --- Adapt this entire function to the actual system ---

    // Character info section
    var infoCard = createCard("Character Info");
    infoCard.innerHTML += createTextField("char-name", "Character Name");
    // Add class, level, race/ancestry, background, etc. based on the system
    container.appendChild(infoCard);

    // Attributes section
    var attrCard = createCard("Attributes");
    var grid = document.createElement("div");
    grid.className = "stat-grid";
    for (var i = 0; i < ATTRIBUTES.length; i++) {
      var attr = ATTRIBUTES[i];
      var box = document.createElement("div");
      box.className = "stat-box";
      box.dataset.attrKey = attr.key;
      box.innerHTML =
        '<div class="stat-label">' + attr.abbreviation + '</div>' +
        '<input type="number" class="stat-value" id="attr-' + attr.key + '" style="width:2.5em;text-align:center;font-size:1.4em;">' +
        '<div class="stat-mod" id="mod-' + attr.key + '">+0</div>';
      // Click stat box to roll ability check
      box.addEventListener("click", (function(a) {
        return function(e) {
          if (e.target.tagName === "INPUT") return; // don't roll when editing
          var score = parseInt(document.getElementById("attr-" + a.key).value) || 10;
          var mod = getAttributeModifier(score);
          var roll = ROLL_TEMPLATES.abilityCheck(a.name, mod);
          TS.dice.putDiceInTray([roll]).catch(console.error);
        };
      })(attr));
      grid.appendChild(box);
    }
    attrCard.appendChild(grid);
    container.appendChild(attrCard);

    // Skills section (if system has skills)
    if (SKILLS.length > 0) {
      var skillCard = createCard("Skills");
      for (var i = 0; i < SKILLS.length; i++) {
        var skill = SKILLS[i];
        var row = document.createElement("div");
        row.className = "content-row";
        row.style.cssText = "display:flex;align-items:center;gap:0.5em;margin-bottom:0.3em;";
        row.innerHTML =
          '<button class="roll-btn" data-skill="' + skill.key + '">' +
          '<i class="ts-icon-d20 ts-icon-small"></i>' + skill.name +
          '</button>' +
          '<input type="number" id="skill-' + skill.key + '" style="width:3em;text-align:center;" value="0">' +
          '<span style="color:var(--ts-color-secondary);font-size:0.8em;">(' + skill.attribute.toUpperCase() + ')</span>';
        row.querySelector(".roll-btn").addEventListener("click", (function(s) {
          return function() {
            var mod = parseInt(document.getElementById("skill-" + s.key).value) || 0;
            var roll = ROLL_TEMPLATES.skillCheck(s.name, mod);
            TS.dice.putDiceInTray([roll]).catch(console.error);
          };
        })(skill));
        skillCard.appendChild(row);
      }
      container.appendChild(skillCard);
    }

    // HP section
    var hpCard = createCard("Health");
    hpCard.innerHTML +=
      '<div style="display:flex;align-items:center;gap:0.5em;">' +
      '<label>HP</label>' +
      '<input type="number" id="hp-current" style="width:4em;text-align:center;">' +
      '<span>/</span>' +
      '<input type="number" id="hp-max" style="width:4em;text-align:center;">' +
      '</div>';
    // Add temp HP, hit dice, death saves, etc. based on system
    container.appendChild(hpCard);

    // Notes section
    var notesCard = createCard("Notes");
    notesCard.innerHTML += '<textarea id="char-notes" style="width:100%;min-height:6em;box-sizing:border-box;"></textarea>';
    container.appendChild(notesCard);

    // Add change listeners for auto-save
    var inputs = container.querySelectorAll("input, textarea");
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener("change", saveToStorage);
    }
  }

  function createCard(title) {
    var card = document.createElement("div");
    card.className = "card";
    var h2 = document.createElement("h2");
    h2.textContent = title;
    card.appendChild(h2);
    return card;
  }

  function createTextField(id, label) {
    return '<div style="display:flex;align-items:center;gap:0.5em;margin-bottom:0.4em;">' +
      '<label style="color:var(--ts-color-secondary);width:6em;text-align:right;">' + label + '</label>' +
      '<input type="text" id="' + id + '" style="flex:1;">' +
      '</div>';
  }

  function saveToStorage() {
    var data = {};
    var inputs = document.getElementById("tab-sheet").querySelectorAll("input, textarea");
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].id) {
        data[inputs[i].id] = inputs[i].type === "checkbox" ? inputs[i].checked : inputs[i].value;
      }
    }
    TS.localStorage.campaign.setBlob(JSON.stringify(data))
      .catch(function(err) { TS.debug.log("Save failed: " + err.cause); });

    // Update modifier displays
    for (var i = 0; i < ATTRIBUTES.length; i++) {
      var key = ATTRIBUTES[i].key;
      var score = parseInt(document.getElementById("attr-" + key).value) || 10;
      var mod = getAttributeModifier(score);
      var modEl = document.getElementById("mod-" + key);
      if (modEl) modEl.textContent = (mod >= 0 ? "+" : "") + mod;
    }
  }

  function loadFromStorage() {
    TS.localStorage.campaign.getBlob().then(function(raw) {
      var data = JSON.parse(raw || "{}");
      for (var key in data) {
        var el = document.getElementById(key);
        if (el) {
          if (el.type === "checkbox") {
            el.checked = data[key];
          } else {
            el.value = data[key];
          }
        }
      }
      // Update modifier displays after loading
      for (var i = 0; i < ATTRIBUTES.length; i++) {
        var attrKey = ATTRIBUTES[i].key;
        var score = parseInt(document.getElementById("attr-" + attrKey).value) || 10;
        var mod = getAttributeModifier(score);
        var modEl = document.getElementById("mod-" + attrKey);
        if (modEl) modEl.textContent = (mod >= 0 ? "+" : "") + mod;
      }
      TS.debug.log("Character sheet loaded");
    }).catch(function(err) {
      TS.debug.log("Load failed: " + (err.cause || err));
    });
  }

  return { init: init };
})();
```

#### 4.7 js/dice-roller.js

```javascript
var DiceRoller = (function() {
  var trackedRolls = {};

  function init() {
    buildDiceUI();
  }

  function buildDiceUI() {
    var container = document.getElementById("tab-dice");

    // Quick roll section
    var quickCard = document.createElement("div");
    quickCard.className = "card";
    quickCard.innerHTML =
      '<h2><i class="ts-icon-d20 ts-icon-small"></i> Quick Roll</h2>' +
      '<div style="display:flex;gap:0.5em;margin-bottom:0.5em;">' +
      '<input type="text" id="quick-roll-label" placeholder="Roll name" style="flex:1;">' +
      '</div>' +
      '<div style="display:flex;gap:0.5em;margin-bottom:0.5em;">' +
      '<input type="text" id="quick-roll-expr" placeholder="e.g. 1d20+5" style="flex:1;">' +
      '<button class="roll-btn" id="btn-quick-roll"><i class="ts-icon-d20 ts-icon-small"></i>Roll</button>' +
      '</div>';
    container.appendChild(quickCard);

    document.getElementById("btn-quick-roll").addEventListener("click", function() {
      var label = document.getElementById("quick-roll-label").value || "Roll";
      var expr = document.getElementById("quick-roll-expr").value || "1d20";
      rollDice(label, expr);
    });

    // Common rolls section -- adapt to system
    var commonCard = document.createElement("div");
    commonCard.className = "card";
    commonCard.innerHTML = '<h2>Common Rolls</h2>';
    var commonRolls = getCommonRollsForSystem();
    for (var i = 0; i < commonRolls.length; i++) {
      var cr = commonRolls[i];
      var btn = document.createElement("button");
      btn.className = "roll-btn";
      btn.style.cssText = "display:block;width:100%;margin-bottom:0.3em;text-align:left;";
      btn.innerHTML = '<i class="ts-icon-d20 ts-icon-small"></i> ' + cr.name + ' <span style="color:var(--ts-color-secondary);float:right;">' + cr.roll + '</span>';
      btn.addEventListener("click", (function(r) {
        return function() { rollDice(r.name, r.roll); };
      })(cr));
      commonCard.appendChild(btn);
    }
    container.appendChild(commonCard);
  }

  function getCommonRollsForSystem() {
    // Adapt to the actual TTRPG system.
    // Return array of { name, roll } for common rolls.
    // Examples for d20 system:
    return [
      { name: "d20", roll: "1d20" },
      { name: "d20 + Ability", roll: "1d20" },
      // Add system-specific common rolls
    ];
  }

  function rollDice(label, expr) {
    TS.dice.putDiceInTray([{ name: label, roll: expr }])
      .then(function(rollId) {
        trackedRolls[rollId] = label;
      })
      .catch(console.error);
  }

  function onRollResult(event) {
    if (!trackedRolls[event.payload.rollId]) return;

    if (event.kind === "rollResults") {
      // Result received -- could display in UI or just let TaleSpire show it
      delete trackedRolls[event.payload.rollId];
    } else if (event.kind === "rollRemoved") {
      delete trackedRolls[event.payload.rollId];
    }
  }

  return {
    init: init,
    onRollResult: onRollResult,
    rollDice: rollDice
  };
})();
```

#### 4.8 js/rules-reference.js

```javascript
var RulesReference = (function() {

  function init() {
    buildRulesUI();
  }

  function buildRulesUI() {
    var container = document.getElementById("tab-rules");

    // Search bar
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "search-input";
    searchInput.placeholder = "Search rules...";
    searchInput.id = "rules-search";
    searchInput.addEventListener("input", filterRules);
    container.appendChild(searchInput);

    // Rules sections from data.js
    for (var i = 0; i < RULES_SECTIONS.length; i++) {
      var section = RULES_SECTIONS[i];
      var card = document.createElement("div");
      card.className = "card rules-card";
      card.dataset.sectionId = section.id;

      var header = document.createElement("h2");
      header.textContent = section.title;
      header.style.cursor = "pointer";
      header.addEventListener("click", (function(cardEl) {
        return function() {
          var body = cardEl.querySelector(".rules-body");
          body.classList.toggle("hidden");
        };
      })(card));

      var body = document.createElement("div");
      body.className = "rules-body";
      body.innerHTML = section.content; // Pre-formatted HTML from data extraction

      card.appendChild(header);
      card.appendChild(body);
      container.appendChild(card);
    }

    // Conditions quick reference
    if (CONDITIONS.length > 0) {
      var condCard = document.createElement("div");
      condCard.className = "card";
      condCard.innerHTML = '<h2>Conditions</h2>';
      var condContainer = document.createElement("div");
      condContainer.id = "conditions-list";
      for (var i = 0; i < CONDITIONS.length; i++) {
        var tag = document.createElement("span");
        tag.className = "condition-tag";
        tag.textContent = CONDITIONS[i].name;
        tag.title = CONDITIONS[i].effect;
        tag.addEventListener("click", (function(cond) {
          return function() {
            alert(cond.name + "\n\n" + cond.effect);
            // Could replace alert with an in-UI popup
          };
        })(CONDITIONS[i]));
        condContainer.appendChild(tag);
      }
      condCard.appendChild(condContainer);
      container.appendChild(condCard);
    }
  }

  function filterRules() {
    var query = document.getElementById("rules-search").value.toLowerCase();
    var cards = document.querySelectorAll(".rules-card");
    for (var i = 0; i < cards.length; i++) {
      var text = cards[i].textContent.toLowerCase();
      cards[i].style.display = text.includes(query) ? "" : "none";
    }
  }

  return { init: init };
})();
```

#### 4.9 js/combat-tracker.js (Optional Module)

```javascript
var CombatTracker = (function() {
  var initiativeQueue = null;

  function init() {
    buildCombatUI();
  }

  function buildCombatUI() {
    var container = document.getElementById("tab-combat");

    // Initiative display
    var initCard = document.createElement("div");
    initCard.className = "card";
    initCard.innerHTML = '<h2><i class="ts-icon-sword-crossed ts-icon-small"></i> Initiative Order</h2>' +
      '<div id="initiative-list"><em style="color:var(--ts-color-secondary)">No active combat</em></div>';
    container.appendChild(initCard);

    // Selected creature info
    var selCard = document.createElement("div");
    selCard.className = "card";
    selCard.innerHTML = '<h2>Selected Creature</h2>' +
      '<div id="selected-creature-info"><em style="color:var(--ts-color-secondary)">Select a creature on the board</em></div>';
    container.appendChild(selCard);

    // Conditions tracker
    if (CONDITIONS.length > 0) {
      var condCard = document.createElement("div");
      condCard.className = "card";
      condCard.innerHTML = '<h2>Apply Conditions</h2><div id="combat-conditions"></div>';
      var condContainer = condCard.querySelector("#combat-conditions");
      for (var i = 0; i < CONDITIONS.length; i++) {
        var tag = document.createElement("span");
        tag.className = "condition-tag";
        tag.textContent = CONDITIONS[i].name;
        tag.title = CONDITIONS[i].effect;
        condContainer.appendChild(tag);
      }
      container.appendChild(condCard);
    }
  }

  function onInitiativeUpdate(event) {
    if (event.kind === "initiativeUpdated") {
      initiativeQueue = event.payload.queue;
      renderInitiative();
    }
  }

  function renderInitiative() {
    var listEl = document.getElementById("initiative-list");
    if (!initiativeQueue || !initiativeQueue.items || initiativeQueue.items.length === 0) {
      listEl.innerHTML = '<em style="color:var(--ts-color-secondary)">No active combat</em>';
      return;
    }
    var html = "";
    for (var i = 0; i < initiativeQueue.items.length; i++) {
      var item = initiativeQueue.items[i];
      var isActive = (i === initiativeQueue.activeItemIndex);
      html += '<div style="padding:0.3em 0.5em;margin-bottom:0.2em;border-radius:4px;' +
        (isActive ? 'background-color:var(--ts-accent-primary);font-weight:bold;' : '') +
        '">' + item.name + '</div>';
    }
    listEl.innerHTML = html;
  }

  async function onSelectionChange(event) {
    var creatures = event.payload.creatures;
    var infoEl = document.getElementById("selected-creature-info");
    if (!creatures || creatures.length === 0) {
      infoEl.innerHTML = '<em style="color:var(--ts-color-secondary)">Select a creature on the board</em>';
      return;
    }
    var ids = creatures.map(function(c) { return c.id; });
    var infos = await TS.creatures.getMoreInfo(ids);
    if (infos.cause) return;

    var html = "";
    for (var i = 0; i < infos.length; i++) {
      var c = infos[i];
      html += '<div class="card" style="margin-bottom:0.5em;">' +
        '<strong>' + (c.name || "Unnamed") + '</strong><br>' +
        '<i class="ts-icon-heart ts-icon-small"></i> HP: ' + c.hp.value + ' / ' + c.hp.max +
        '</div>';
    }
    infoEl.innerHTML = html;
  }

  function onCreatureUpdate(event) {
    // React to creature HP changes, state changes, etc.
    // Could update combat tracker display
  }

  return {
    init: init,
    onInitiativeUpdate: onInitiativeUpdate,
    onSelectionChange: onSelectionChange,
    onCreatureUpdate: onCreatureUpdate
  };
})();
```

#### 4.10 readme.md

Generate a user-facing description:

```markdown
# <System Name> Companion

An interactive rules companion for <System Name> inside TaleSpire.

## Features
- **Character Sheet**: Track your character's stats, skills, HP, and notes. Auto-saved per campaign.
- **Dice Roller**: Roll any dice expression, plus system-specific quick-roll buttons wired to TaleSpire's dice tray.
- **Rules Reference**: Searchable reference for all game mechanics, conditions, and rules.
- **Combat Tracker**: View initiative order and selected creature info in real-time.

## Usage
1. Open the Symbiote from TaleSpire's side panel.
2. Use the tabs at the top to switch between features.
3. Click any stat, skill, or roll button to put dice in the tray.
4. Your character sheet data is saved automatically per campaign.

## Source
Rules extracted from: <list of source PDFs>
```

### Phase 5: System-Specific Adaptation

This is the most critical phase. The skeleton code above is generic. You MUST adapt every piece to the actual TTRPG system:

1. **Core mechanic mapping.** If the system uses:
   - **d20 + modifier** (D&D, Pathfinder, OSR): The templates above work with minor changes.
   - **Dice pools** (WoD, Shadowrun): Change `ROLL_TEMPLATES` to build pool expressions like `6d10` and potentially process results differently (count successes vs sum).
   - **PbtA / Moves**: Replace the skill list with Moves. Each Move becomes a roll button that rolls `2d6+modifier`.
   - **FATE / Fudge dice**: Use `4dF` syntax if supported, or simulate with `4d3-8`.
   - **Percentile / BRP**: Roll `1d100`, compare against skill value.

2. **Character sheet fields.** Must exactly match the system's character record:
   - D&D 5e: 6 ability scores, proficiency bonus, skills with proficiency checkboxes, spell slots, class features
   - Pathfinder 2e: Ability boosts, proficiency tiers (Trained/Expert/Master/Legendary)
   - OSR: Often simpler (6 stats, THAC0 or ascending AC, saving throws by category)
   - PbtA: Stats (usually -1 to +3), Moves, Bonds/Strings, harm track
   - FATE: Aspects, Skills ladder, Stunts, Stress boxes, Consequences

3. **Dice roll formulas.** Extract exact formulas from the rules:
   - Attack roll: what dice + what modifiers
   - Damage roll: per weapon/spell
   - Saving throws: formula per type
   - Skill checks: formula per skill
   - Initiative: what dice + what modifiers

4. **Conditions list.** Extract the complete conditions list with exact mechanical effects.

5. **Level/advancement data.** If the system has leveling, extract the full progression table.

### Phase 6: Review and Deliver

1. **Self-review.** Check every file for:
   - Correct manifest subscriptions matching the declared handler functions
   - All handler functions in global scope (not inside modules unless exposed via `var`)
   - TaleSpire API calls using `.then()/.catch()` or proper `async/await`
   - No `let`/`const` for event handler declarations
   - Consistent use of TaleSpire CSS variables
   - `webViewBackgroundColor` matching body background

2. **Cross-check rules accuracy.** Verify that:
   - Attribute modifiers use the correct formula for the system
   - Dice expressions match the source material exactly
   - All conditions are listed with correct effects
   - Skill lists are complete
   - Spell/ability data matches the source

3. **Present to user.** Summarize:
   - Files created and their purposes
   - Features implemented
   - Which rules sections were mapped to which Symbiote features
   - Any rules that could not be automated (e.g., complex conditional effects)
   - Installation instructions (copy folder to Symbiotes directory)

4. **Installation instructions.**
   ```
   1. Copy the entire <output-folder> to:
      %AppData%\..\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\
   2. Enable Symbiotes in TaleSpire Settings
   3. Open the Symbiotes panel and select "<System Name> Companion"
   ```

---

## Important Guidelines

- **Do NOT invent rules.** Every dice formula, modifier, condition, and mechanic must come directly from the source PDFs. If something is ambiguous, flag it with a comment in the code and a note to the user.
- **Adapt, don't force-fit.** The code templates above are starting points for d20-style systems. Radically different systems (PbtA, FATE, Year Zero Engine, etc.) need fundamentally different UI layouts and data structures. Do not shoehorn a non-d20 system into d20 patterns.
- **Respect copyright.** Include only mechanical data (numbers, formulas, condition effects). Do not reproduce flavor text, lore, or narrative content from the rulebooks.
- **All event handlers must be global.** This is the single most common Symbiote bug. Use `function name() {}` or `var name = function() {}` at the top level. Never `let`/`const`.
- **Save incrementally.** Use `TS.localStorage.campaign.setBlob()` on every input change. Do not rely on `willShutdown` for saving.
- **Test guidance.** Remind the user to enable Development Mode in TaleSpire settings to access Chromium DevTools for debugging.
