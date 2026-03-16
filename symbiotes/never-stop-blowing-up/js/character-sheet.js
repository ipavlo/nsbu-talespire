// ============================================================
// NEVER STOP BLOWING UP - CHARACTER SHEET
// Tracks: skills (die types), injury level, turbo tokens, abilities
// ============================================================

import { SKILLS, INJURY_LEVELS, ABILITIES, GROUP_SUITES, DIE_TYPES, DIE_MAX, getNextDie, getHalfDie } from "./data.js";

// Default character state
function defaultState() {
  var skills = {};
  for (var i = 0; i < SKILLS.length; i++) {
    skills[SKILLS[i].key] = "d4";
  }
  return {
    name: "",
    catchphrase: "",
    skills: skills,
    injuryLevel: 0,
    turboTokens: 0,
    abilities: [],
    customAbilities: [],
    groupSuiteAbilities: [],
    autoBlowUp: true,
    notes: ""
  };
}

var state = defaultState();
var saveTimer = null;

// Debounced save -- waits 400ms after last call before saving
function debouncedSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function() {
    saveToStorage();
  }, 400);
}

function init() {
  buildSheetUI();
  loadFromStorage();
}

function buildSheetUI() {
  var container = document.getElementById("tab-sheet");
  container.innerHTML = "";

  // --- Character Info ---
  var infoCard = createCard("Action Hero");
  infoCard.innerHTML +=
    '<div class="form-row">' +
    '<label>Name</label>' +
    '<input type="text" id="char-name" placeholder="Action Hero Name">' +
    '</div>' +
    '<div class="form-row">' +
    '<label>Catchphrase</label>' +
    '<input type="text" id="char-catchphrase" placeholder="Your catchphrase">' +
    '</div>' +
    '<div class="form-row">' +
    '<label>Auto Blow Up</label>' +
    '<label class="toggle-switch">' +
    '<input type="checkbox" id="auto-blow-up" checked>' +
    '<span class="toggle-slider"></span>' +
    '</label>' +
    '<span id="auto-blow-up-label" style="font-size:0.8em;color:var(--ts-color-secondary);">ON — skill auto-upgrades on max roll</span>' +
    '</div>';
  container.appendChild(infoCard);

  // --- Skills (Die Types) ---
  var skillCard = createCard("Skills");
  skillCard.querySelector("h2").innerHTML = '<i class="ts-icon-d20 ts-icon-small"></i> Skills';
  var grid = document.createElement("div");
  grid.className = "skill-grid";

  for (var i = 0; i < SKILLS.length; i++) {
    var skill = SKILLS[i];
    var box = document.createElement("div");
    box.className = "skill-box";
    box.id = "skill-box-" + skill.key;
    box.title = skill.description;

    box.innerHTML =
      '<div class="skill-label">' + skill.name + '</div>' +
      '<div class="skill-die" id="skill-die-' + skill.key + '">d4</div>' +
      '<div class="die-selector" id="die-sel-' + skill.key + '"></div>';

    // Click the box to roll that skill
    box.addEventListener("click", (function(s) {
      return function(e) {
        // Don't roll if clicking die selector buttons
        if (e.target.tagName === "BUTTON") return;
        var dieType = state.skills[s.key];
        // DiceRoller is imported by app.js; use the globally-attached rollSkillCheck
        if (window._diceRoller) {
          window._diceRoller.rollSkillCheck(s.name, dieType);
        }
      };
    })(skill));

    grid.appendChild(box);
  }
  skillCard.appendChild(grid);

  // Small note about clicking
  var hint = document.createElement("p");
  hint.style.cssText = "font-size:0.75em;color:var(--ts-color-secondary);text-align:center;margin-top:0.5em;";
  hint.textContent = "Click a skill to roll it. Use the buttons below each skill to set its die type.";
  skillCard.appendChild(hint);
  container.appendChild(skillCard);

  // Build die selectors after DOM is ready
  for (var i = 0; i < SKILLS.length; i++) {
    buildDieSelector(SKILLS[i].key);
  }

  // --- Turbo Tokens ---
  var turboCard = createCard("Turbo Tokens");
  turboCard.querySelector("h2").innerHTML = '<i class="ts-icon-star ts-icon-small"></i> Turbo Tokens';
  turboCard.innerHTML +=
    '<div class="turbo-display">' +
    '<div class="turbo-controls">' +
    '<button id="turbo-minus" title="Spend 1 Turbo Token">-</button>' +
    '</div>' +
    '<div class="turbo-count" id="turbo-count">0</div>' +
    '<div class="turbo-controls">' +
    '<button id="turbo-plus" title="Gain 1 Turbo Token">+</button>' +
    '</div>' +
    '</div>' +
    '<div style="margin-top:0.5em;display:flex;gap:0.3em;">' +
    '<button class="roll-btn" id="turbo-fail" style="font-size:0.8em;">Failed Check (+1 TT)</button>' +
    '<button class="roll-btn" id="turbo-adrenalized" style="font-size:0.8em;">Adrenalized (+10 TT)</button>' +
    '</div>';
  container.appendChild(turboCard);

  // --- Injury Track ---
  var injuryCard = createCard("Injury Level");
  injuryCard.querySelector("h2").innerHTML = '<i class="ts-icon-heart ts-icon-small"></i> Injury Level';
  var track = document.createElement("div");
  track.className = "injury-track";
  for (var i = 0; i < INJURY_LEVELS.length; i++) {
    var inj = INJURY_LEVELS[i];
    var lvl = document.createElement("div");
    lvl.className = "injury-level " + inj.key;
    lvl.id = "injury-" + inj.key;
    lvl.textContent = inj.name;
    lvl.title = inj.effect;
    lvl.dataset.level = inj.level;
    lvl.addEventListener("click", (function(level) {
      return function() {
        state.injuryLevel = level;
        updateInjuryDisplay();
        saveToStorage();
      };
    })(inj.level));
    track.appendChild(lvl);
  }
  injuryCard.appendChild(track);

  var injuryNote = document.createElement("div");
  injuryNote.id = "injury-note";
  injuryNote.style.cssText = "font-size:0.8em;color:var(--ts-color-secondary);margin-top:0.4em;";
  injuryCard.appendChild(injuryNote);
  container.appendChild(injuryCard);

  // --- Abilities ---
  var abilityCard = createCard("Abilities");
  abilityCard.querySelector("h2").innerHTML = '<i class="ts-icon-star ts-icon-small"></i> Abilities';

  // -- My Abilities (collapsible, expanded by default) --
  var myHeader = document.createElement("div");
  myHeader.className = "collapsible-header";
  myHeader.innerHTML =
    '<span class="chevron">&#9660;</span>' +
    '<span class="section-title">My Abilities</span>' +
    '<span class="section-count" id="my-abilities-count"></span>';
  abilityCard.appendChild(myHeader);

  var myBody = document.createElement("div");
  myBody.className = "collapsible-body";
  myBody.id = "my-abilities-body";

  var myList = document.createElement("div");
  myList.className = "ability-list";
  myList.id = "my-abilities-list";
  myBody.appendChild(myList);

  // Custom ability form
  var customForm = document.createElement("div");
  customForm.className = "custom-ability-form";
  customForm.innerHTML =
    '<div class="form-row-inline">' +
    '<input type="text" id="custom-ability-name" placeholder="Ability name">' +
    '<button class="add-btn" id="custom-ability-add" title="Add custom ability">+ Add</button>' +
    '</div>' +
    '<input type="text" id="custom-ability-effect" placeholder="Effect description">';
  myBody.appendChild(customForm);
  abilityCard.appendChild(myBody);

  setupCollapsible(myHeader, myBody, false);

  // -- Divider --
  var divider = document.createElement("div");
  divider.className = "abilities-divider";
  abilityCard.appendChild(divider);

  // -- All Abilities (collapsible, collapsed by default) --
  var allHeader = document.createElement("div");
  allHeader.className = "collapsible-header";
  allHeader.innerHTML =
    '<span class="chevron collapsed">&#9660;</span>' +
    '<span class="section-title">All Abilities</span>' +
    '<span class="section-count" id="all-abilities-count">' + ABILITIES.length + ' available</span>';
  abilityCard.appendChild(allHeader);

  var allBody = document.createElement("div");
  allBody.className = "collapsible-body collapsed";
  allBody.id = "all-abilities-body";

  var abilityList = document.createElement("div");
  abilityList.className = "ability-list";
  abilityList.id = "ability-list";
  for (var i = 0; i < ABILITIES.length; i++) {
    var ab = ABILITIES[i];
    var tag = document.createElement("div");
    tag.className = "ability-tag";
    tag.id = "ability-" + ab.key;
    tag.innerHTML =
      '<input type="checkbox" class="ability-check" id="ab-check-' + ab.key + '" data-key="' + ab.key + '">' +
      '<div class="ability-text">' +
      '<div class="ability-name">' + ab.name + '</div>' +
      '<div class="ability-effect">' + ab.effect + '</div>' +
      '</div>';
    tag.querySelector(".ability-check").addEventListener("change", (function(key) {
      return function(e) {
        if (e.target.checked) {
          if (state.abilities.indexOf(key) === -1) state.abilities.push(key);
        } else {
          var idx = state.abilities.indexOf(key);
          if (idx > -1) state.abilities.splice(idx, 1);
        }
        updateAbilityDisplay();
        renderMyAbilities();
        saveToStorage();
      };
    })(ab.key));
    abilityList.appendChild(tag);
  }
  allBody.appendChild(abilityList);
  abilityCard.appendChild(allBody);

  setupCollapsible(allHeader, allBody, true);

  // Ability count display
  var abCount = document.createElement("div");
  abCount.id = "ability-count";
  abCount.style.cssText = "font-size:0.8em;color:var(--ts-color-secondary);margin-top:0.5em;";
  abilityCard.appendChild(abCount);
  container.appendChild(abilityCard);

  // --- Group Suites ---
  var groupCard = createCard("Group Suites");
  groupCard.querySelector("h2").innerHTML = '<i class="ts-icon-character ts-icon-small"></i> Group Suites';
  var groupContent = document.createElement("div");
  groupContent.style.cssText = "font-size:0.85em;";
  groupContent.id = "group-suites-content";
  for (var g = 0; g < GROUP_SUITES.length; g++) {
    var suite = GROUP_SUITES[g];
    var suiteDiv = document.createElement("div");
    suiteDiv.style.cssText = "margin-bottom:0.6em;";
    suiteDiv.innerHTML = '<strong>' + suite.name + '</strong> <span style="color:var(--ts-color-secondary);">(Unlocked at ' + suite.unlockDie + ')</span>';
    var suiteList = document.createElement("div");
    suiteList.className = "ability-list";
    suiteList.style.cssText = "margin:0.3em 0;padding-left:0.2em;";
    for (var a = 0; a < suite.abilities.length; a++) {
      var gsAb = suite.abilities[a];
      var gsTag = document.createElement("div");
      gsTag.className = "ability-tag";
      gsTag.id = "gs-ability-" + gsAb.key;
      gsTag.innerHTML =
        '<input type="checkbox" class="ability-check" id="gs-check-' + gsAb.key + '" data-key="' + gsAb.key + '">' +
        '<div class="ability-text">' +
        '<div class="ability-name">' + gsAb.name + '</div>' +
        '<div class="ability-effect">' + gsAb.effect + '</div>' +
        '</div>';
      gsTag.querySelector(".ability-check").addEventListener("change", (function(key) {
        return function(e) {
          if (e.target.checked) {
            if (state.groupSuiteAbilities.indexOf(key) === -1) state.groupSuiteAbilities.push(key);
          } else {
            var idx = state.groupSuiteAbilities.indexOf(key);
            if (idx > -1) state.groupSuiteAbilities.splice(idx, 1);
          }
          updateGroupSuiteDisplay();
          renderMyAbilities();
          saveToStorage();
        };
      })(gsAb.key));
      suiteList.appendChild(gsTag);
    }
    suiteDiv.appendChild(suiteList);
    groupContent.appendChild(suiteDiv);
  }
  groupCard.appendChild(groupContent);
  container.appendChild(groupCard);

  // --- Notes ---
  var notesCard = createCard("Notes");
  notesCard.innerHTML += '<textarea id="char-notes" style="width:100%;min-height:6em;box-sizing:border-box;" placeholder="Session notes, inventory, etc."></textarea>';
  container.appendChild(notesCard);

  // --- Save Button ---
  var saveCard = document.createElement("div");
  saveCard.className = "save-bar";
  saveCard.innerHTML =
    '<button class="roll-btn save-btn" id="btn-save"><i class="ts-icon-check ts-icon-small"></i> Save Character</button>' +
    '<span class="save-indicator" id="save-indicator"></span>';
  container.appendChild(saveCard);

  // --- Event Listeners ---
  // Text fields auto-save on every keystroke (debounced)
  document.getElementById("char-name").addEventListener("input", debouncedSave);
  document.getElementById("char-catchphrase").addEventListener("input", debouncedSave);
  document.getElementById("char-notes").addEventListener("input", debouncedSave);

  document.getElementById("auto-blow-up").addEventListener("change", function() {
    state.autoBlowUp = this.checked;
    var label = document.getElementById("auto-blow-up-label");
    if (label) {
      label.textContent = this.checked
        ? "ON \u2014 skill auto-upgrades on max roll"
        : "OFF \u2014 manual upgrade only";
    }
    saveToStorage();
  });

  document.getElementById("turbo-plus").addEventListener("click", function() {
    state.turboTokens++;
    updateTurboDisplay();
    saveToStorage();
  });
  document.getElementById("turbo-minus").addEventListener("click", function() {
    if (state.turboTokens > 0) state.turboTokens--;
    updateTurboDisplay();
    saveToStorage();
  });
  document.getElementById("turbo-fail").addEventListener("click", function() {
    // Check if player has Relentless ability
    var gain = (state.abilities.indexOf("relentless") > -1) ? 2 : 1;
    state.turboTokens += gain;
    updateTurboDisplay();
    saveToStorage();
  });
  document.getElementById("turbo-adrenalized").addEventListener("click", function() {
    state.turboTokens += 10;
    state.injuryLevel = 3;
    updateTurboDisplay();
    updateInjuryDisplay();
    saveToStorage();
  });

  document.getElementById("btn-save").addEventListener("click", function() {
    saveToStorage();
    showSaveIndicator();
  });

  // Custom ability add button
  document.getElementById("custom-ability-add").addEventListener("click", function() {
    addCustomAbility();
  });
  // Allow Enter key to add custom ability from name or effect fields
  document.getElementById("custom-ability-name").addEventListener("keydown", function(e) {
    if (e.key === "Enter") addCustomAbility();
  });
  document.getElementById("custom-ability-effect").addEventListener("keydown", function(e) {
    if (e.key === "Enter") addCustomAbility();
  });
}

function buildDieSelector(skillKey) {
  var selContainer = document.getElementById("die-sel-" + skillKey);
  if (!selContainer) return;
  selContainer.innerHTML = "";
  for (var d = 0; d < DIE_TYPES.length; d++) {
    var btn = document.createElement("button");
    btn.textContent = DIE_TYPES[d];
    btn.dataset.die = DIE_TYPES[d];
    btn.dataset.skill = skillKey;
    if (DIE_TYPES[d] === state.skills[skillKey]) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      var sk = this.dataset.skill;
      var die = this.dataset.die;
      state.skills[sk] = die;
      updateSkillDisplay(sk);
      saveToStorage();
    });
    selContainer.appendChild(btn);
  }
}

function updateSkillDisplay(skillKey) {
  var dieEl = document.getElementById("skill-die-" + skillKey);
  if (dieEl) {
    dieEl.textContent = state.skills[skillKey];
    // Highlight if blown up beyond d4
    if (state.skills[skillKey] !== "d4") {
      dieEl.classList.add("blown-up");
    } else {
      dieEl.classList.remove("blown-up");
    }
  }
  // Update die selector buttons
  var selContainer = document.getElementById("die-sel-" + skillKey);
  if (selContainer) {
    var btns = selContainer.querySelectorAll("button");
    for (var b = 0; b < btns.length; b++) {
      if (btns[b].dataset.die === state.skills[skillKey]) {
        btns[b].classList.add("selected");
      } else {
        btns[b].classList.remove("selected");
      }
    }
  }
}

function updateTurboDisplay() {
  var countEl = document.getElementById("turbo-count");
  if (countEl) countEl.textContent = state.turboTokens;
}

function updateInjuryDisplay() {
  for (var i = 0; i < INJURY_LEVELS.length; i++) {
    var el = document.getElementById("injury-" + INJURY_LEVELS[i].key);
    if (el) {
      if (INJURY_LEVELS[i].level === state.injuryLevel) {
        el.classList.add("active-injury");
      } else {
        el.classList.remove("active-injury");
      }
    }
  }
  var noteEl = document.getElementById("injury-note");
  if (noteEl) {
    var current = INJURY_LEVELS[state.injuryLevel];
    noteEl.textContent = current ? current.effect : "";
  }
}

function updateAbilityDisplay() {
  for (var i = 0; i < ABILITIES.length; i++) {
    var checkbox = document.getElementById("ab-check-" + ABILITIES[i].key);
    var tag = document.getElementById("ability-" + ABILITIES[i].key);
    if (checkbox && tag) {
      var owned = state.abilities.indexOf(ABILITIES[i].key) > -1;
      checkbox.checked = owned;
      if (owned) {
        tag.classList.add("owned");
      } else {
        tag.classList.remove("owned");
      }
    }
  }
  var totalOwned = state.abilities.length + state.customAbilities.length + state.groupSuiteAbilities.length;
  var countEl = document.getElementById("ability-count");
  if (countEl) {
    countEl.textContent = totalOwned + " abilities owned";
  }
}

function updateGroupSuiteDisplay() {
  for (var g = 0; g < GROUP_SUITES.length; g++) {
    var suite = GROUP_SUITES[g];
    for (var a = 0; a < suite.abilities.length; a++) {
      var gsKey = suite.abilities[a].key;
      var checkbox = document.getElementById("gs-check-" + gsKey);
      var tag = document.getElementById("gs-ability-" + gsKey);
      if (checkbox && tag) {
        var owned = state.groupSuiteAbilities.indexOf(gsKey) > -1;
        checkbox.checked = owned;
        if (owned) {
          tag.classList.add("owned");
        } else {
          tag.classList.remove("owned");
        }
      }
    }
  }
}

// Build a lookup map from group suite ability key to { name, effect, suiteName }
function getGroupSuiteAbilityMap() {
  var map = {};
  for (var g = 0; g < GROUP_SUITES.length; g++) {
    var suite = GROUP_SUITES[g];
    for (var a = 0; a < suite.abilities.length; a++) {
      var ab = suite.abilities[a];
      map[ab.key] = { name: ab.name, effect: ab.effect, suiteName: suite.name };
    }
  }
  return map;
}

function renderMyAbilities() {
  var list = document.getElementById("my-abilities-list");
  if (!list) return;
  list.innerHTML = "";

  var totalCount = 0;

  // 1. Owned built-in abilities
  for (var i = 0; i < state.abilities.length; i++) {
    var key = state.abilities[i];
    var abData = null;
    for (var j = 0; j < ABILITIES.length; j++) {
      if (ABILITIES[j].key === key) { abData = ABILITIES[j]; break; }
    }
    if (!abData) continue;
    var tag = document.createElement("div");
    tag.className = "ability-tag owned";
    tag.innerHTML =
      '<div class="ability-text">' +
      '<div class="ability-name">' + abData.name + '</div>' +
      '<div class="ability-effect">' + abData.effect + '</div>' +
      '</div>' +
      '<button class="ability-remove-btn" data-key="' + key + '" title="Remove ability">&times;</button>';
    tag.querySelector(".ability-remove-btn").addEventListener("click", (function(k) {
      return function() {
        var idx = state.abilities.indexOf(k);
        if (idx > -1) state.abilities.splice(idx, 1);
        updateAbilityDisplay();
        renderMyAbilities();
        saveToStorage();
      };
    })(key));
    list.appendChild(tag);
    totalCount++;
  }

  // 2. Owned group suite abilities
  var gsMap = getGroupSuiteAbilityMap();
  for (var i = 0; i < state.groupSuiteAbilities.length; i++) {
    var gsKey = state.groupSuiteAbilities[i];
    var gsData = gsMap[gsKey];
    if (!gsData) continue;
    var gsTag = document.createElement("div");
    gsTag.className = "ability-tag owned group-suite";
    gsTag.innerHTML =
      '<div class="ability-text">' +
      '<div class="ability-name">' + gsData.name + '<span class="suite-badge">' + gsData.suiteName + '</span></div>' +
      '<div class="ability-effect">' + gsData.effect + '</div>' +
      '</div>' +
      '<button class="ability-remove-btn" data-gs-key="' + gsKey + '" title="Remove ability">&times;</button>';
    gsTag.querySelector(".ability-remove-btn").addEventListener("click", (function(k) {
      return function() {
        var idx = state.groupSuiteAbilities.indexOf(k);
        if (idx > -1) state.groupSuiteAbilities.splice(idx, 1);
        updateGroupSuiteDisplay();
        renderMyAbilities();
        saveToStorage();
      };
    })(gsKey));
    list.appendChild(gsTag);
    totalCount++;
  }

  // 3. Custom abilities
  for (var i = 0; i < state.customAbilities.length; i++) {
    var custom = state.customAbilities[i];
    var cTag = document.createElement("div");
    cTag.className = "ability-tag owned custom";
    cTag.innerHTML =
      '<div class="ability-text">' +
      '<div class="ability-name">' + escapeHtml(custom.name) + '<span class="custom-badge">Custom</span></div>' +
      '<div class="ability-effect">' + escapeHtml(custom.effect) + '</div>' +
      '</div>' +
      '<button class="ability-remove-btn" data-custom-key="' + custom.key + '" title="Delete custom ability">&times;</button>';
    cTag.querySelector(".ability-remove-btn").addEventListener("click", (function(k) {
      return function() {
        removeCustomAbility(k);
      };
    })(custom.key));
    list.appendChild(cTag);
    totalCount++;
  }

  // Empty state message
  if (totalCount === 0) {
    var emptyMsg = document.createElement("div");
    emptyMsg.className = "my-abilities-empty";
    emptyMsg.textContent = "No abilities chosen yet. Check abilities below or add custom ones.";
    list.appendChild(emptyMsg);
  }

  // Update count in header
  var countEl = document.getElementById("my-abilities-count");
  if (countEl) {
    countEl.textContent = totalCount > 0 ? totalCount + " chosen" : "";
  }

  // Update total owned count
  updateAbilityDisplay();
}

function addCustomAbility() {
  var nameEl = document.getElementById("custom-ability-name");
  var effectEl = document.getElementById("custom-ability-effect");
  var name = nameEl ? nameEl.value.trim() : "";
  var effect = effectEl ? effectEl.value.trim() : "";
  if (!name) return; // require at least a name

  var custom = {
    key: "custom_" + Date.now(),
    name: name,
    effect: effect
  };
  state.customAbilities.push(custom);

  // Clear form
  if (nameEl) nameEl.value = "";
  if (effectEl) effectEl.value = "";

  renderMyAbilities();
  saveToStorage();
}

function removeCustomAbility(key) {
  for (var i = 0; i < state.customAbilities.length; i++) {
    if (state.customAbilities[i].key === key) {
      state.customAbilities.splice(i, 1);
      break;
    }
  }
  renderMyAbilities();
  saveToStorage();
}

function setupCollapsible(header, body, startCollapsed) {
  var chevron = header.querySelector(".chevron");
  if (startCollapsed) {
    body.classList.add("collapsed");
    if (chevron) chevron.classList.add("collapsed");
  } else {
    body.classList.remove("collapsed");
    if (chevron) chevron.classList.remove("collapsed");
  }
  header.addEventListener("click", function() {
    var isCollapsed = body.classList.contains("collapsed");
    if (isCollapsed) {
      body.classList.remove("collapsed");
      if (chevron) chevron.classList.remove("collapsed");
    } else {
      body.classList.add("collapsed");
      if (chevron) chevron.classList.add("collapsed");
    }
  });
}

function escapeHtml(text) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function createCard(title) {
  var card = document.createElement("div");
  card.className = "card";
  var h2 = document.createElement("h2");
  h2.textContent = title;
  card.appendChild(h2);
  return card;
}

function saveToStorage() {
  // Gather state from inputs
  var nameEl = document.getElementById("char-name");
  var catchEl = document.getElementById("char-catchphrase");
  var notesEl = document.getElementById("char-notes");
  if (nameEl) state.name = nameEl.value;
  if (catchEl) state.catchphrase = catchEl.value;
  if (notesEl) state.notes = notesEl.value;

  TS.localStorage.campaign.setBlob(JSON.stringify(state))
    .catch(function(err) { TS.debug.log("Save failed: " + (err.cause || err)); });
}

function showSaveIndicator() {
  var el = document.getElementById("save-indicator");
  if (!el) return;
  el.textContent = "Saved!";
  el.classList.remove("flash");
  void el.offsetWidth; // force reflow to restart animation
  el.classList.add("flash");
  setTimeout(function() {
    el.classList.remove("flash");
    el.textContent = "";
  }, 1500);
}

function loadFromStorage() {
  TS.localStorage.campaign.getBlob().then(function(raw) {
    if (raw) {
      try {
        var loaded = JSON.parse(raw);
        // Merge with defaults for any missing fields
        var def = defaultState();
        state.name = loaded.name || def.name;
        state.catchphrase = loaded.catchphrase || def.catchphrase;
        state.notes = loaded.notes || def.notes;
        state.turboTokens = (typeof loaded.turboTokens === "number") ? loaded.turboTokens : def.turboTokens;
        state.injuryLevel = (typeof loaded.injuryLevel === "number") ? loaded.injuryLevel : def.injuryLevel;
        state.abilities = Array.isArray(loaded.abilities) ? loaded.abilities : def.abilities;
        state.customAbilities = Array.isArray(loaded.customAbilities) ? loaded.customAbilities : def.customAbilities;
        state.groupSuiteAbilities = Array.isArray(loaded.groupSuiteAbilities) ? loaded.groupSuiteAbilities : def.groupSuiteAbilities;
        state.autoBlowUp = (typeof loaded.autoBlowUp === "boolean") ? loaded.autoBlowUp : def.autoBlowUp;

        // Load skills
        if (loaded.skills) {
          for (var i = 0; i < SKILLS.length; i++) {
            var key = SKILLS[i].key;
            if (loaded.skills[key] && DIE_TYPES.indexOf(loaded.skills[key]) > -1) {
              state.skills[key] = loaded.skills[key];
            }
          }
        }
      } catch (e) {
        TS.debug.log("Parse error loading character: " + e);
      }
    }

    // Apply state to UI
    var nameEl = document.getElementById("char-name");
    var catchEl = document.getElementById("char-catchphrase");
    var notesEl = document.getElementById("char-notes");
    if (nameEl) nameEl.value = state.name;
    if (catchEl) catchEl.value = state.catchphrase;
    if (notesEl) notesEl.value = state.notes;

    var autoEl = document.getElementById("auto-blow-up");
    var autoLabel = document.getElementById("auto-blow-up-label");
    if (autoEl) autoEl.checked = state.autoBlowUp;
    if (autoLabel) {
      autoLabel.textContent = state.autoBlowUp
        ? "ON \u2014 skill auto-upgrades on max roll"
        : "OFF \u2014 manual upgrade only";
    }

    for (var i = 0; i < SKILLS.length; i++) {
      updateSkillDisplay(SKILLS[i].key);
    }
    updateTurboDisplay();
    updateInjuryDisplay();
    updateAbilityDisplay();
    updateGroupSuiteDisplay();
    renderMyAbilities();

    TS.debug.log("Character sheet loaded");
  }).catch(function(err) {
    TS.debug.log("Load failed: " + (err.cause || err));
  });
}

// Public API -- used by DiceRoller to upgrade skills on Blow Up
function upgradeSkill(skillKey) {
  var currentDie = state.skills[skillKey];
  var nextDie = getNextDie(currentDie);
  if (nextDie) {
    state.skills[skillKey] = nextDie;
    updateSkillDisplay(skillKey);
    saveToStorage();
    return nextDie;
  }
  return null;
}

function getSkillDie(skillKey) {
  return state.skills[skillKey] || "d4";
}

function getState() {
  return state;
}

function isAutoBlowUp() {
  return state.autoBlowUp;
}

export var CharacterSheet = {
  init: init,
  upgradeSkill: upgradeSkill,
  getSkillDie: getSkillDie,
  getState: getState,
  isAutoBlowUp: isAutoBlowUp
};
