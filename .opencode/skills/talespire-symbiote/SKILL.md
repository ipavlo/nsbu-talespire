---
name: talespire-symbiote
description: Comprehensive guide for creating TaleSpire Symbiotes - web-based plugins that run inside TaleSpire's embedded browser and interact with the game via the Symbiote API.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: talespire-modding
---

## Purpose

Guide the creation of TaleSpire Symbiotes from scratch. A Symbiote is a local or remote web page (HTML/CSS/JS) that runs inside TaleSpire's embedded Chromium browser and can interact with the game through a JavaScript API. This skill covers everything: project structure, manifest configuration, API usage, theming, data sync, dice rolling, creature management, and deployment.

## When to Use

Use this skill when the user:
- Wants to create a new TaleSpire Symbiote
- Needs help with the TaleSpire Symbiote API
- Wants to modify or debug an existing Symbiote
- Asks about manifest.json configuration for TaleSpire
- Needs to understand TaleSpire event subscriptions, dice rolling, sync messaging, or creature/board APIs

---

## 1. Project Structure

Every Symbiote lives in its own folder under TaleSpire's Symbiotes directory:

```
%AppData%\..\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\
  My_Symbiote/
    manifest.json        # REQUIRED - the only mandatory file
    index.html           # Entry point HTML (local symbiotes)
    style.css            # Styles
    app.js               # Application logic
    readme.md            # Optional description file shown in UI
    icon_64x64.png       # Optional 64x64 PNG icon
    icon_notification.png # Optional 24x24 monochrome PNG for notifications
```

- The folder name does NOT need to match the Symbiote name in the manifest.
- All local file paths in the manifest use forward slashes starting with `/` (the Symbiote root). You cannot escape the root (`/../` is invalid).
- Remote URLs must be fully qualified with scheme (`https://example.com`).

---

## 2. Manifest (manifest.json) - Complete Reference

The manifest is the ONLY required file. It tells TaleSpire what to load and how to configure the environment.

### 2.1 Full Schema

```jsonc
{
  // REQUIRED FIELDS
  "manifestVersion": 1,                    // Always 1
  "name": "My Symbiote",                   // Display name. Max 80 chars
  "entryPoint": "/index.html",             // Local path or full remote URL

  // OPTIONAL - User-facing info
  "summary": "Short description",          // Max 250 chars
  "descriptionFilePath": "/readme.md",     // Path to markdown description
  "version": "1.0.0",                      // Free text version string
  "license": "MIT",                        // License identifier
  "about": {
    "website": "https://github.com/you/repo",
    "authors": ["Author Name"]
  },

  // OPTIONAL - API configuration
  "api": {
    "version": "0.1",                      // REQUIRED to inject the API. Currently only "0.1"
    "initializeEarly": false,              // If true, hasInitialized fires before DOM load
    "doNotUseNickname": false,             // If true, disables the "TS" alias (must use com.bouncyrock.talespire)
    "initTimeout": 10,                     // Seconds before hasInitialized fires even if API init incomplete
    "subscriptions": {                     // Event subscriptions (see Section 5)
      "<category>": {
        "<eventSource>": "handlerFunctionName"
      }
    },
    "interop": {
      "id": "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx"  // UUIDv4. REQUIRED for sync messaging
    }
  },

  // OPTIONAL - UI controls
  "controls": {
    "reload": true,                        // Show reload button
    "navigation": true                     // Show back/forward buttons
  },

  // OPTIONAL - Symbiote kind
  "kind": "webView",                       // Only "webView" currently

  // OPTIONAL - Icons (must be PNG)
  "icons": {
    "64x64": "/icon_64x64.png",            // 64x64px icon
    "notification": "/icon_notification.png" // 24x24px monochrome icon
  },

  // OPTIONAL - Environment
  "environment": {
    "webViewBackgroundColor": "#1a1a2e",   // Hex color to prevent white flash on load
    "loadTargetBehavior": "currentTab",    // "none" | "currentTab" | "popup"
    "capabilities": [
      "playAudio",                         // Allow audio playback
      "runInBackground"                    // Keep alive when not focused (uses more RAM)
    ],
    "extras": [
      "colorStyles",                       // Injects TaleSpire CSS color variables
      "fonts",                             // Injects TaleSpire fonts (OptimusPrinceps)
      "icons",                             // Injects TaleSpire icon font classes
      "/custom_inject.js",                 // Inject custom JS (loaded after API, in order)
      "/custom_inject.css"                 // Inject custom CSS
    ]
  }
}
```

### 2.2 Manifest Rules

- **Local paths**: Must start with `/`. Subdirectories allowed. Cannot escape root.
- **Remote URLs**: Must include scheme (`https://`). `example.com` alone is invalid.
- **API injection**: Without `api.version`, no API is available. Without `api.interop.id`, `sync` calls fail.
- **Subscriptions**: Events are organized by `category > eventSource > handlerFunction`. The handler must be a globally-scoped function (not `let`/`const` scoped).
- **Extras**: `"colorStyles"`, `"fonts"`, `"icons"` are built-in. Local `.js`/`.css` paths are also accepted and injected in order. JS extras load after the API but before API initialization completes.
- **Capabilities**: Use as few as necessary. `runInBackground` increases memory. Without it, switching to another Symbiote shuts this one down.

### 2.3 Minimal Manifest Examples

**Remote website (no API):**
```json
{
  "manifestVersion": 1,
  "name": "Website Viewer",
  "entryPoint": "https://example.com"
}
```

**Local page with API and dice subscription:**
```json
{
  "manifestVersion": 1,
  "name": "Dice Tool",
  "entryPoint": "/index.html",
  "api": {
    "version": "0.1",
    "subscriptions": {
      "dice": { "onRollResults": "handleRollResult" },
      "symbiote": { "onStateChangeEvent": "handleStateChange" }
    }
  },
  "environment": {
    "webViewBackgroundColor": "#000000",
    "extras": ["colorStyles", "fonts"]
  }
}
```

---

## 3. Symbiote Lifecycle

### 3.1 Startup Sequence

1. TaleSpire reads `manifest.json`
2. The web view is created with `webViewBackgroundColor` (or white default)
3. The entry point HTML is loaded
4. API and extras are injected (if configured)
5. DOM finishes loading (unless `initializeEarly: true`)
6. The `onStateChangeEvent` handler fires with `kind: "hasInitialized"` -- **this is your init entry point**

### 3.2 State Events

Subscribe via `symbiote > onStateChangeEvent`:

| Event Kind | When |
|---|---|
| `hasInitialized` | API is ready. Start your setup here. |
| `willEnterBackground` | Symbiote is about to be backgrounded (another Symbiote focused). |
| `hasEnteredForeground` | Symbiote has come back to foreground. |
| `willShutdown` | Symbiote is about to be destroyed. Best-effort only -- not guaranteed. |

Subscribe via `symbiote > onVisibilityEvent`:

| Event Kind | When |
|---|---|
| `hasBecomeVisible` | Side panel opened showing this Symbiote. |
| `hasBecomeHidden` | Side panel closed (not switching Symbiotes -- that triggers background). |

### 3.3 Init Pattern (Standard)

```javascript
// This function name must match the manifest subscription
function handleStateChange(msg) {
  if (msg.kind === "hasInitialized") {
    // Safe to call TS.* APIs from here
    initializeMySymbiote();
  }
}
```

**IMPORTANT**: The handler function MUST be declared in the global scope. Arrow functions or `let`/`const` scoped functions are invisible to the API and event delivery will fail.

```javascript
// CORRECT - global function declaration
function handleStateChange(msg) { ... }

// CORRECT - global var
var handleStateChange = function(msg) { ... }

// WRONG - scoped, invisible to API
let handleStateChange = function(msg) { ... }
const handleStateChange = (msg) => { ... }
```

---

## 4. API Overview (v0.1)

The API is accessed via the `TS` global object (alias for `com.bouncyrock.talespire`). If `doNotUseNickname` is true, only the full path works.

All API calls return **Promises**. Use `.then()` / `.catch()` or `async/await`. Failed calls resolve with an object containing a `.cause` property.

### 4.1 API Namespaces

| Namespace | Purpose |
|---|---|
| `TS.boards` | Board queries (list, info, current board) |
| `TS.bookmarks` | Board bookmarks |
| `TS.campaigns` | Campaign info |
| `TS.chat` | Send chat messages |
| `TS.clients` | Client presence and identity |
| `TS.contentPacks` | Content pack metadata, thumbnails, icons |
| `TS.creatures` | Creature queries, state, blueprints, selection |
| `TS.debug` | Debug logging |
| `TS.dice` | Dice rolling, tray, result evaluation |
| `TS.initiative` | Initiative queue |
| `TS.localStorage` | Persistent blob storage (campaign or global scoped) |
| `TS.parties` | Party queries |
| `TS.picking` | Let user pick a board object |
| `TS.players` | Player info and permissions |
| `TS.rulers` | Ruler creation and queries |
| `TS.slabs` | Slab pasting and clipboard events |
| `TS.symbiote` | Symbiote visibility, notifications |
| `TS.sync` | Send/receive messages between clients |
| `TS.units` | Distance unit queries |

### 4.2 Key API Calls - Quick Reference

#### Dice

```javascript
// Put dice in the tray (user must click to roll)
// rollDescriptors: Array of { name: string, roll: string }
// hideResults: boolean (optional, GM-only rolls)
TS.dice.putDiceInTray([{ name: "Attack", roll: "1d20+5" }], false)
  .then((rollId) => { /* track this rollId */ })
  .catch(console.error);

// Parse a roll string into a descriptor (rate-limited)
TS.dice.makeRollDescriptors("2d6+3")
  .then((descriptors) => { /* Array of rollDescriptor */ });

// Evaluate a results group to a single number
TS.dice.evaluateDiceResultsGroup(resultsGroup)
  .then((sum) => { /* number */ });

// Send processed result back to TaleSpire dice log
TS.dice.sendDiceResult([resultsGroup], rollId)
  .catch(console.error);
```

#### Local Storage

```javascript
// Campaign-scoped storage (per-campaign, per-symbiote)
TS.localStorage.campaign.getBlob()
  .then((data) => { /* string or falsy if empty */ });

TS.localStorage.campaign.setBlob(JSON.stringify(myData))
  .then(() => { /* success */ })
  .catch((err) => { /* err.cause */ });

TS.localStorage.campaign.deleteBlob()
  .then(() => { /* cleared */ });

// Global storage (across campaigns, per-symbiote)
TS.localStorage.global.getBlob();
TS.localStorage.global.setBlob(str);
TS.localStorage.global.deleteBlob();
```

#### Sync Messaging (requires `interop.id` in manifest)

```javascript
// Send to a specific client
TS.sync.send(JSON.stringify(payload), targetClientId);

// Send to multiple clients
TS.sync.multiSend(JSON.stringify(payload), [clientId1, clientId2]);

// Send to all on current board
// Use target "board" with sync.send

// Get connected clients
TS.sync.getClientsConnected()
  .then((clients) => { /* Array of clientFragment */ });
```

#### Clients

```javascript
TS.clients.getClientsInThisBoard()
  .then((clients) => { /* Array of clientFragment { id, player } */ });

TS.clients.whoAmI()
  .then((me) => { /* clientFragment */ });

TS.clients.isMe(clientId)
  .then((isMe) => { /* boolean */ });

TS.clients.getMoreInfo([clientId1, clientId2])
  .then((infos) => { /* Array of clientInfo { id, clientMode, player } */ });
// clientMode: "spectator" | "player" | "gm"
```

#### Players

```javascript
TS.players.whoAmI()
  .then((me) => { /* playerFragment { id, name } */ });

TS.players.getPlayersInThisBoard()
  .then((players) => { /* Array of playerFragment */ });

TS.players.getPlayersInThisCampaign()
  .then((players) => { /* Array of playerFragment */ });

TS.players.getMoreInfo([playerId])
  .then((infos) => { /* Array of playerInfo { id, name, clientsIds, rights } */ });
// rights: { isOwner, canPlay, canGm }
```

#### Creatures

```javascript
TS.creatures.getSelectedCreatures()
  .then((creatures) => { /* Array of creatureFragment { id } */ });

TS.creatures.getMoreInfo([creatureId1, creatureId2])
  .then((infos) => { /* Array of creatureInfo (see Types section) */ });

TS.creatures.getCreaturesOwnedByPlayer(playerId)
  .then((creatures) => { /* Array of creatureFragment */ });

TS.creatures.getUniqueCreaturesInThisCampaign()
  .then((creatures) => { /* Array of creatureFragment */ });

TS.creatures.createBlueprint(creatureInfoObject)
  .then(() => { /* success */ });
```

#### Boards

```javascript
TS.boards.whereAmI()
  .then((board) => { /* boardFragment { id, name } */ });

TS.boards.getBoardsInThisCampaign()
  .then((boards) => { /* Array of boardFragment */ });

TS.boards.getMoreInfo([boardId])
  .then((infos) => { /* Array of boardInfo { id, campaignId, name, description } */ });
```

#### Campaigns

```javascript
TS.campaigns.whereAmI()
  .then((campaign) => { /* campaignFragment { id, name } */ });

TS.campaigns.getMoreInfoAboutCurrentCampaign()
  .then((info) => { /* campaignInfo { id, name, description, defaultBoardId } */ });
```

#### Initiative

```javascript
TS.initiative.getQueue()
  .then((queue) => { /* initiativeQueue { items, activeItemIndex } */ });
// items: Array of { id, name, kind }
// kind is currently always "creature"
```

#### Chat

```javascript
TS.chat.send(message, creatureIdOrNull)
  // Sends chat as a creature (if id provided) or as player
```

#### Content Packs

```javascript
TS.contentPacks.getContentPacks()
  .then((packs) => { /* Array of contentPackFragment { id, optionalName } */ });

TS.contentPacks.getMoreInfo([packId])
  .then((infos) => { /* Array of contentPackInfo */ });

TS.contentPacks.findBoardObjectInPacks(boardAssetId)
  .then((result) => { /* boardObjectFindResult or error */ });
```

#### Bookmarks

```javascript
TS.bookmarks.getBookmarksInThisBoard()
  .then((bookmarks) => { /* Array of bookmark { id, name, position, boardId } */ });

TS.bookmarks.getBookmarksInThisCampaign()
  .then((bookmarks) => { /* Array of bookmark */ });
```

#### Rulers

```javascript
TS.rulers.startRuler(rulerKind)  // "sphere" | "cone" | "line"
  .then((rulerId) => { });

TS.rulers.getRulers()
  .then((rulers) => { /* Array of rulerFragment { id, client } */ });

TS.rulers.getLocalRuler()
  .then((ruler) => { /* rulerFragment or null */ });

TS.rulers.getMoreInfo([rulerId])
  .then((infos) => { /* Array of lineRulerInfo | sphereRulerInfo | coneRulerInfo */ });
```

#### Picking

```javascript
TS.picking.startPicking()
  .then((pickingId) => { /* use pickingId to correlate with onPickingEvent */ });
```

#### Parties

```javascript
TS.parties.getParties()
  .then((parties) => { /* Array of partyFragment { id } */ });
```

#### Units

```javascript
TS.units.getDistanceUnitsForThisCampaign()
  .then((units) => { /* distanceUnit { name, numberPerTile } */ });
```

#### Symbiote

```javascript
TS.symbiote.getIfThisSymbioteIsVisible()
  .then((isVisible) => { /* boolean */ });

// Show a notification (useful when running in background)
TS.symbiote.sendNotification("Title", "Body text");
```

#### Debug

```javascript
TS.debug.log("message"); // Writes to the Symbiote debug log in TaleSpire
```

---

## 5. Subscriptions - Complete Reference

Subscriptions are declared in `manifest.json` under `api.subscriptions`. All event handlers receive:
```javascript
{ kind: "<eventKind>", payload: <data> }
```

### 5.1 Subscription Categories and Event Sources

#### Category: `symbiote`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onStateChangeEvent` | `hasInitialized`, `willEnterBackground`, `hasEnteredForeground`, `willShutdown` | (none) |
| `onVisibilityEvent` | `hasBecomeVisible`, `hasBecomeHidden` | (none) |
| `onNotificationEvent` | `notificationActivated` | `{ data: string }` |

#### Category: `dice`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onRollResults` | `rollResults` | `{ rollId, clientId, resultsGroups, gmOnly, quiet }` |
| | `rollRemoved` | `{ rollId }` |

#### Category: `sync`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onSyncMessage` | `syncMessage` | `{ str, fromClient: { id, player } }` |
| `onUrlMessage` | `urlMessage` | `{ str }` |

#### Category: `clients`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onClientEvent` | `clientJoinedBoard` | `{ client: clientFragment }` |
| | `clientLeftBoard` | `{ client: clientFragment }` |
| | `clientModeChanged` | `{ client: clientFragment, clientMode }` |
| | `clientConnected` | `{ client: clientFragment }` |
| | `clientDisconnected` | `{ clientId }` |

#### Category: `players`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onCampaignPlayerEvent` | `playerJoinedCampaign` | `{ player: playerFragment }` |
| | `playerLeftCampaign` | `{ playerId }` |
| | `playerRightsChanged` | `{ player, rights: { isOwner, canPlay, canGm } }` |
| `onBoardPlayerEvent` | `playerJoinedBoard` | `{ player: playerFragment }` |
| | `playerLeftBoard` | `{ player: playerFragment }` |

#### Category: `creatures`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onCreatureStateChange` | `creatureAdded` | `{ creature: creatureFragment }` |
| | `creatureRemoved` | `{ id }` |
| | `creatureIsUniqueChanged` | `{ id, isUnique }` |
| | `creatureNameChanged` | `{ id, name, nameSet }` |
| | `creatureLinkChanged` | `{ id, link }` |
| | `creatureLocationChanged` | `{ id, boardId, position, rotation }` |
| | `creatureMorphsChanged` | `{ id, morphs }` |
| | `creatureActiveMorphChanged` | `{ id, activeMorphIndex }` |
| | `creatureHpChanged` | `{ id, hp: { name, value, max } }` |
| | `creatureStatsChanged` | `{ id, stats: Array[creatureStat] }` |
| | `creatureTorchStateChanged` | `{ id, torchIsOn }` |
| | `creatureExplicitlyHiddenStateChanged` | `{ id, isExplicitlyHidden }` |
| | `creatureFlyingStateChanged` | `{ id, isFlying }` |
| | `creatureActivePersistentEmotesChanged` | `{ id, idsOfActivePersistentEmotes }` |
| | `creatureOwnersChanged` | `{ id, ownerIds }` |
| `onCreatureSelectionChange` | `creatureSelectionChanged` | `{ creatures: Array[creatureFragment] }` |

#### Category: `initiative`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onInitiativeEvent` | `initiativeUpdated` | `{ queue: { items, activeItemIndex } }` |

#### Category: `boards`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onBoardEvent` | `boardAdded` | `{ board: boardFragment }` |
| | `boardRemoved` | `{ boardId }` |
| | `boardInfoChanged` | `{ info: boardInfo }` |

#### Category: `campaigns`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onInfoChanged` | `campaignInfoChanged` | `{ info: campaignInfo }` |

#### Category: `contentPacks`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onContentPackChange` | `contentPackAdded` | `{ contentPackId, optionalName }` |
| | `contentPackRemoved` | `{ contentPackId }` |

#### Category: `slabs`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onSlabCopied` | `slabCopied` | `{ slab, status, dataSize }` |

#### Category: `rulers`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onRulerEvent` | `rulerAdded` | `{ rulerId }` |
| | `rulerRemoved` | `{ rulerId }` |
| | `rulerResult` | `{ ruler: lineRulerInfo \| sphereRulerInfo \| coneRulerInfo }` |

#### Category: `settings`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onSettingsChanged` | `distanceUnitsChanged` | `{ units: distanceUnit }` |
| | `statNamesChanged` | `{ statNames: Array[string] }` |

#### Category: `picking`

| Event Source | Events (kind) | Payload |
|---|---|---|
| `onPickingEvent` | `pickingCompleted` | `{ id, kindOfPicked, idOfPicked }` |
| | `pickingCanceled` | `{ id }` |

### 5.2 Manifest Subscription Example

```json
"subscriptions": {
  "dice": {
    "onRollResults": "handleRollResult"
  },
  "symbiote": {
    "onStateChangeEvent": "handleStateChange"
  },
  "creatures": {
    "onCreatureStateChange": "handleCreatureUpdate",
    "onCreatureSelectionChange": "handleSelectionChange"
  },
  "initiative": {
    "onInitiativeEvent": "handleInitiativeUpdate"
  },
  "sync": {
    "onSyncMessage": "handleSyncMessage"
  },
  "clients": {
    "onClientEvent": "handleClientEvent"
  }
}
```

---

## 6. Theming and Styling

### 6.1 Color Variables (extra: `colorStyles`)

When `"colorStyles"` is in the extras array, TaleSpire injects CSS custom properties matching its UI theme:

```css
/* Background tiers */
var(--ts-background-primary)     /* Darkest background */
var(--ts-background-secondary)   /* Input/card backgrounds */
var(--ts-background-tertiary)    /* Slightly lighter */

/* Text colors */
var(--ts-color-primary)          /* Main text */
var(--ts-color-secondary)        /* Muted/label text */
var(--ts-color-danger)           /* Error/danger */

/* Accent */
var(--ts-accent-primary)         /* Accent highlight */
var(--ts-accent-background)      /* Accent background */

/* Interactive elements */
var(--ts-button-background)      /* Default button bg */
var(--ts-button-hover)           /* Button hover bg */

/* Accessibility */
var(--ts-accessibility-border)   /* Border color for inputs */
var(--ts-accessibility-focus)    /* Focus ring color */
```

### 6.2 Fonts (extra: `fonts`)

Injects the `OptimusPrinceps` font family used by TaleSpire.

```css
body {
  font-family: 'OptimusPrinceps', sans-serif;
}
```

### 6.3 Icons (extra: `icons`)

Injects TaleSpire's icon font. Use via `<i>` tags with classes:

```html
<i class="ts-icon-d20 ts-icon-small"></i>
<i class="ts-icon-sword-crossed"></i>
<i class="ts-icon-heart"></i>
```

Size modifiers: `ts-icon-small`

Available icons (partial list): `ts-icon-d4`, `ts-icon-d6`, `ts-icon-d8`, `ts-icon-d10`, `ts-icon-d12`, `ts-icon-d20`, `ts-icon-d100`, `ts-icon-sword`, `ts-icon-sword-crossed`, `ts-icon-shield`, `ts-icon-heart`, `ts-icon-star`, `ts-icon-eye`, `ts-icon-eye-hidden`, `ts-icon-lock`, `ts-icon-gear`, `ts-icon-search`, `ts-icon-plus`, `ts-icon-minus`, `ts-icon-trash`, `ts-icon-pencil`, `ts-icon-book`, `ts-icon-character`, `ts-icon-character-gamemaster`, `ts-icon-character-hidden`, `ts-icon-character-flying`, `ts-icon-torch`, `ts-icon-sun`, `ts-icon-compass`, `ts-icon-ruler-line`, `ts-icon-ruler-sphere`, `ts-icon-ruler-cone`, `ts-icon-camera`, `ts-icon-copy`, `ts-icon-paste`, `ts-icon-refresh`, `ts-icon-warning`, `ts-icon-check`, `ts-icon-world`, `ts-icon-broadcast`, `ts-icon-footsteps`, `ts-icon-hourglass`, `ts-icon-filter`, `ts-icon-link`, `ts-icon-link-broken`, `ts-icon-play`, `ts-icon-film`, `ts-icon-waves`, `ts-icon-flashlight`, `ts-icon-marker`, `ts-icon-tower`, `ts-icon-three-dots`, `ts-icon-tab`, `ts-icon-grid`, `ts-icon-selection`, `ts-icon-selection-hand`, `ts-icon-hammer`, `ts-icon-base-hammer`, `ts-icon-base-paintbrush`, `ts-icon-eyedropper`, `ts-icon-chevron-up`, `ts-icon-chevron-double-up`, `ts-icon-return`, `ts-icon-cut`, `ts-icon-clear`, `ts-icon-circle-dotted`, `ts-icon-dice-hidden`, `ts-icon-size-1x1`, `ts-icon-size-2x2`, `ts-icon-size-3x3`, `ts-icon-size-4x4`, `ts-icon-size-05x05`

### 6.4 Recommended Base CSS

```css
body {
  background-color: var(--ts-background-primary);
  color: var(--ts-color-primary);
  font-family: 'OptimusPrinceps', sans-serif;
  max-width: 1000px;
  margin: 0 auto;
  padding: 10px;
}

button, input, select {
  background-color: var(--ts-background-secondary);
  color: var(--ts-color-primary);
  font-family: 'OptimusPrinceps', sans-serif;
  border: 1px solid var(--ts-accessibility-border);
  border-radius: 4px;
  font-size: 1.2em;
  transition: ease-in-out 0.1s;
}

button:hover, input:hover {
  background-color: var(--ts-background-primary);
  transition: ease-in-out 0.2s;
}

button:focus-visible, input:focus-visible {
  outline: 3px solid var(--ts-accessibility-focus);
  outline-offset: -1px;
}

button {
  background-color: var(--ts-button-background);
}

button:hover {
  background-color: var(--ts-button-hover);
}

textarea {
  flex-grow: 1;
  min-height: 5em;
  background-color: var(--ts-background-secondary);
  color: var(--ts-color-primary);
  font-family: 'OptimusPrinceps', sans-serif;
  border: 1px solid var(--ts-accessibility-border);
  border-radius: 4px;
  transition: ease-in-out 0.1s;
}

/* TaleSpire-style scrollbars */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--ts-background-primary); }
::-webkit-scrollbar-thumb { background: var(--ts-background-secondary); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--ts-color-secondary); }

/* Dark-mode number inputs */
input[type=number]::-webkit-inner-spin-button { color-scheme: dark; }
```

### 6.5 Preventing White Flash

Set `environment.webViewBackgroundColor` in the manifest to match your body background. This prevents a white flash before CSS loads.

---

## 7. Common Patterns

### 7.1 Dice Rolling with Result Tracking

```javascript
var trackedRolls = {};

function rollDice(label, diceExpr) {
  TS.dice.putDiceInTray([{ name: label, roll: diceExpr }])
    .then((rollId) => { trackedRolls[rollId] = label; })
    .catch(console.error);
}

function handleRollResult(event) {
  if (!trackedRolls[event.payload.rollId]) return; // Not our roll

  if (event.kind === "rollResults") {
    let roll = event.payload;
    for (let group of roll.resultsGroups) {
      TS.dice.evaluateDiceResultsGroup(group).then((sum) => {
        console.log(`${trackedRolls[roll.rollId]}: ${sum}`);
      });
    }
  } else if (event.kind === "rollRemoved") {
    delete trackedRolls[event.payload.rollId];
  }
}
```

### 7.2 Advantage/Disadvantage Rolling

```javascript
function rollWithAdvantage(label, dice) {
  let tag = label + " (Adv)";
  TS.dice.putDiceInTray(
    [{ name: tag, roll: dice }, { name: tag, roll: dice }],
    true
  ).then((rollId) => { trackedRolls[rollId] = "advantage"; });
}

async function handleRollResult(event) {
  if (event.kind === "rollResults" && trackedRolls[event.payload.rollId]) {
    let roll = event.payload;
    let best = { sum: -Infinity, group: null };
    for (let group of roll.resultsGroups) {
      let sum = await TS.dice.evaluateDiceResultsGroup(group);
      if (sum > best.sum) { best = { sum, group }; }
    }
    // Send only the best result to the dice log
    TS.dice.sendDiceResult([best.group], roll.rollId);
  }
}
```

### 7.3 Persistent Storage with Local Storage

```javascript
function saveData(data) {
  TS.localStorage.campaign.setBlob(JSON.stringify(data))
    .then(() => TS.debug.log("Saved"))
    .catch((err) => TS.debug.log("Save failed: " + err.cause));
}

function loadData() {
  return TS.localStorage.campaign.getBlob().then((raw) => {
    return JSON.parse(raw || "{}");
  });
}
```

### 7.4 Sync Messaging Between Clients

**Manifest requirement:** `api.interop.id` must be set to a UUIDv4.

```javascript
// Sender
function broadcast(payload) {
  TS.clients.getClientsInThisBoard().then((clients) => {
    let ids = clients.map(c => c.id);
    TS.sync.multiSend(JSON.stringify(payload), ids);
  });
}

// Receiver (subscription handler)
function handleSyncMessage(event) {
  let data = JSON.parse(event.payload.str);
  let senderId = event.payload.fromClient.id;
  TS.clients.isMe(senderId).then((isMe) => {
    if (!isMe) {
      // Process incoming message
      applyReceivedData(data);
    }
  });
}
```

### 7.5 GM-Only UI

```javascript
async function setupGMUI() {
  let me = await TS.clients.whoAmI();
  let info = await TS.clients.getMoreInfo([me.id]);
  if (info[0].clientMode === "gm") {
    document.getElementById("gm-panel").classList.remove("hidden");
  }
}

// Also handle dynamic mode changes via onClientEvent
function handleClientEvent(event) {
  if (event.kind === "clientModeChanged") {
    TS.clients.isMe(event.payload.client.id).then((isMe) => {
      if (isMe) {
        let panel = document.getElementById("gm-panel");
        if (event.payload.clientMode === "gm") {
          panel.classList.remove("hidden");
        } else {
          panel.classList.add("hidden");
        }
      }
    });
  }
}
```

### 7.6 Notifications (Background Symbiotes)

Requires `"runInBackground"` capability.

```javascript
TS.symbiote.getIfThisSymbioteIsVisible().then((isVisible) => {
  if (!isVisible) {
    TS.symbiote.sendNotification("Alert", "Something happened!");
  }
});
```

### 7.7 Creature Info Display

```javascript
async function showSelectedCreatures() {
  let selected = await TS.creatures.getSelectedCreatures();
  if (selected.cause) return; // error

  let ids = selected.map(c => c.id);
  let infos = await TS.creatures.getMoreInfo(ids);

  for (let creature of infos) {
    console.log(`${creature.name} - HP: ${creature.hp.value}/${creature.hp.max}`);
    console.log(`Position: (${creature.position.x}, ${creature.position.y}, ${creature.position.z})`);
    console.log(`Flying: ${creature.isFlying}, Hidden: ${creature.isExplicitlyHidden}`);
    // Get the asset ID for thumbnail via morphs
    let assetId = creature.morphs[creature.activeMorphIndex].boardAssetId;
  }
}
```

### 7.8 Board Switch Handling

```javascript
function handleStateChange(msg) {
  if (msg.kind === "hasInitialized") {
    loadBoardData();
  }
}

// Subscribe to boards > onBoardEvent to detect board changes
// and reload relevant data
```

---

## 8. Key Types Reference

### Core Fragment Types

| Type | Fields |
|---|---|
| `clientFragment` | `{ id, player: playerFragment }` |
| `playerFragment` | `{ id, name }` |
| `boardFragment` | `{ id, name }` |
| `campaignFragment` | `{ id, name }` |
| `creatureFragment` | `{ id }` |
| `contentPackFragment` | `{ id, optionalName }` |

### Detailed Info Types

| Type | Key Fields |
|---|---|
| `clientInfo` | `{ id, clientMode, player }` -- clientMode: `"spectator"` / `"player"` / `"gm"` |
| `playerInfo` | `{ id, name, clientsIds, rights: { isOwner, canPlay, canGm } }` |
| `boardInfo` | `{ id, campaignId, name, description }` |
| `campaignInfo` | `{ id, name, description, defaultBoardId }` |
| `creatureInfo` | `{ id, isUnique, name, nameSet, link, position, rotation, boardId, morphs, activeMorphIndex, hp, stats, torchIsOn, isExplicitlyHidden, isFlying, idsOfActivePersistentEmotes, ownerIds }` |
| `creatureStat` | `{ name, value, max }` |
| `morph` | `{ boardAssetId, scale }` |
| `position` | `{ locId, x, y, z }` -- locId is the sub-board ID |

### Dice Types

| Type | Fields |
|---|---|
| `rollDescriptor` | `{ name, roll }` -- e.g. `{ name: "Attack", roll: "1d20+5" }` |
| `rollResults` | `{ rollId, clientId, resultsGroups, gmOnly, quiet }` |
| `rollResultsGroup` | `{ name, result }` -- result is `rollResultsOperation` or `rollResult` or `rollValue` |
| `rollResultsOperation` | `{ operator, operands }` -- operator: `"+"` or `"-"`, operands: array |
| `rollResult` | `{ kind, results }` -- kind: `"d4"`/`"d6"`/`"d8"`/`"d10"`/`"d12"`/`"d20"`/`"d100"`, results: array of ints |
| `rollValue` | `{ value }` -- a constant integer |

### Ruler Types

| Type | Fields |
|---|---|
| `rulerFragment` | `{ id, client: clientFragment }` |
| `lineRulerInfo` | `{ id, beingEdited, positions: Array[position] }` |
| `sphereRulerInfo` | `{ id, beingEdited, startPosition, endPosition }` |
| `coneRulerInfo` | `{ id, beingEdited, startPosition, endPosition, angle }` |

---

## 9. Workflow: Creating a New Symbiote

### Step 1: Scaffold

1. Create a new folder in the Symbiotes directory.
2. Create `manifest.json` with at minimum the required fields.
3. Create your entry HTML file.
4. Add `api.version: "0.1"` and a `symbiote > onStateChangeEvent` subscription.
5. Add extras: `["colorStyles", "fonts"]` for TaleSpire theming.
6. Set `webViewBackgroundColor` to your body background color.

### Step 2: Implement Init

1. Declare a globally-scoped handler function matching the subscription name.
2. Check for `msg.kind === "hasInitialized"` to start your logic.
3. Load any stored data from `TS.localStorage`.

### Step 3: Add Features

- **Dice**: Subscribe to `dice > onRollResults`. Use `TS.dice.putDiceInTray()` to queue rolls.
- **Sync**: Set `api.interop.id` (UUIDv4). Subscribe to `sync > onSyncMessage`. Use `TS.sync.send()` / `TS.sync.multiSend()`.
- **Creatures**: Subscribe to `creatures > onCreatureStateChange`. Use `TS.creatures.getMoreInfo()` for details.
- **Clients**: Subscribe to `clients > onClientEvent`. Use `TS.clients.getMoreInfo()` to check GM status.

### Step 4: Polish

1. Add `summary`, `descriptionFilePath`, `version`, `about` to manifest.
2. Create icons (64x64 PNG for panel, 24x24 monochrome PNG for notifications).
3. Style with TaleSpire CSS variables for a native look.
4. Add accessibility: `aria-labelledby`, `aria-describedby`, focus-visible outlines.

### Step 5: Test

1. Enable Symbiotes in TaleSpire settings.
2. Enable Development Mode to use Chromium DevTools for debugging.
3. Use `TS.debug.log()` to write to the Symbiote debug log.
4. Test with multiple clients for sync features.

---

## 10. Important Gotchas

1. **Global scope for handlers.** Event handler functions MUST be in global scope. `let`/`const` scoped or module-scoped functions are invisible to the API.

2. **Promises, not callbacks.** All API calls return Promises. Error responses have a `.cause` property. Always add `.catch()` or use try/catch with async/await.

3. **Rate limiting.** Some calls (like `TS.dice.makeRollDescriptors`) may be rate limited. Prefer constructing `rollDescriptor` objects manually when possible.

4. **interop.id required for sync.** Without a `UUIDv4` in `api.interop.id`, all `TS.sync.*` calls will fail.

5. **runInBackground uses RAM.** Each background Symbiote keeps an embedded browser alive. Only use this capability when genuinely needed (background event processing, sync listening).

6. **willShutdown is best-effort.** Do not rely on it for critical save operations. Save data incrementally as changes happen.

7. **Position locId matters.** Positions on different sub-boards have different coordinate origins. Compare positions only if `locId` matches.

8. **No filesystem access.** Symbiotes run in a sandboxed Chromium browser. They cannot read/write files outside their folder. Use `TS.localStorage` for persistence.

9. **Dropdown styling.** TaleSpire uses a custom `<vuplex-dropdown>` for `<select>` elements. Style with `vuplex-dropdown` and `vuplex-dropdown-option` CSS selectors.

10. **Error checking pattern.** Check for `.cause` property on API responses to detect errors:
    ```javascript
    let result = await TS.someCall();
    if (result.cause) {
      // Error occurred
      TS.debug.log("Error: " + result.cause);
      return;
    }
    ```

---

## 11. Reference Links

- **Full documentation**: https://symbiote-docs.talespire.com
- **API v0.1 reference**: https://symbiote-docs.talespire.com/api_doc_v0_1.md.html
- **Manifest v1 docs**: https://symbiote-docs.talespire.com/manifest_doc_v1.html
- **Example symbiotes**: https://github.com/Bouncyrock/symbiotes-examples
- **Icon list**: https://symbiote-docs.talespire.com/icons.html
