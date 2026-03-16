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
  abilityCard.querySelector("h2").innerHTML = '<i class="ts-icon-star ts-icon-small"></i> Abilities (check to own)';
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
      '<div>' +
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
        saveToStorage();
      };
    })(ab.key));
    abilityList.appendChild(tag);
  }
  abilityCard.appendChild(abilityList);

  // Ability count display
  var abCount = document.createElement("div");
  abCount.id = "ability-count";
  abCount.style.cssText = "font-size:0.8em;color:var(--ts-color-secondary);margin-top:0.5em;";
  abilityCard.appendChild(abCount);
  container.appendChild(abilityCard);

  // --- Group Suites Reference ---
  var groupCard = createCard("Group Suites (Reference)");
  groupCard.querySelector("h2").innerHTML = '<i class="ts-icon-character ts-icon-small"></i> Group Suites';
  var groupContent = document.createElement("div");
  groupContent.style.cssText = "font-size:0.85em;";
  for (var g = 0; g < GROUP_SUITES.length; g++) {
    var suite = GROUP_SUITES[g];
    var suiteDiv = document.createElement("div");
    suiteDiv.style.cssText = "margin-bottom:0.6em;";
    suiteDiv.innerHTML = '<strong>' + suite.name + '</strong> <span style="color:var(--ts-color-secondary);">(Unlocked at ' + suite.unlockDie + ')</span>';
    var suiteList = document.createElement("ul");
    suiteList.style.cssText = "margin:0.2em 0;padding-left:1.2em;";
    for (var a = 0; a < suite.abilities.length; a++) {
      var li = document.createElement("li");
      li.innerHTML = '<strong>' + suite.abilities[a].name + ':</strong> <span style="color:var(--ts-color-secondary);">' + suite.abilities[a].effect + '</span>';
      suiteList.appendChild(li);
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
  var countEl = document.getElementById("ability-count");
  if (countEl) {
    countEl.textContent = state.abilities.length + " abilities owned";
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
