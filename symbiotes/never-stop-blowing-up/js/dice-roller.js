// ============================================================
// NEVER STOP BLOWING UP - DICE ROLLER
// Implements the Blow Up mechanic via TaleSpire dice tray.
// ============================================================

import { SKILLS, DIE_MAX, ROLL_TEMPLATES, getHalfDie } from "./data.js";
import { CharacterSheet } from "./character-sheet.js";

var trackedRolls = {};
var rollLog = [];

function init() {
  buildDiceUI();
}

function buildDiceUI() {
  var container = document.getElementById("tab-dice");
  container.innerHTML = "";

  // --- Blow Up Banner (hidden by default) ---
  var banner = document.createElement("div");
  banner.className = "blow-up-banner";
  banner.id = "blow-up-banner";
  banner.textContent = "BLOW UP!";
  container.appendChild(banner);

  // --- Skill Roll Section ---
  var skillCard = createCard("Skill Check");
  skillCard.querySelector("h2").innerHTML = '<i class="ts-icon-d20 ts-icon-small"></i> Roll a Skill Check';

  var skillBtns = document.createElement("div");
  skillBtns.style.cssText = "display:flex;flex-wrap:wrap;gap:0.3em;";
  for (var i = 0; i < SKILLS.length; i++) {
    var skill = SKILLS[i];
    var btn = document.createElement("button");
    btn.className = "roll-btn";
    btn.dataset.skill = skill.key;
    btn.innerHTML = '<i class="ts-icon-d20 ts-icon-small"></i> ' + skill.name;
    btn.addEventListener("click", (function(s) {
      return function() {
        var dieType = CharacterSheet.getSkillDie(s.key);
        rollSkillCheck(s.name, dieType);
      };
    })(skill));
    skillBtns.appendChild(btn);
  }
  skillCard.appendChild(skillBtns);
  container.appendChild(skillCard);

  // --- Quick Roll Section ---
  var quickCard = createCard("Quick Roll");
  quickCard.querySelector("h2").innerHTML = '<i class="ts-icon-d20 ts-icon-small"></i> Quick Roll';
  quickCard.innerHTML +=
    '<div style="display:flex;gap:0.5em;margin-bottom:0.5em;">' +
    '<input type="text" id="quick-roll-label" placeholder="Roll name" style="flex:1;">' +
    '</div>' +
    '<div style="display:flex;gap:0.5em;margin-bottom:0.5em;">' +
    '<input type="text" id="quick-roll-expr" placeholder="e.g. 1d8" style="flex:1;">' +
    '<button class="roll-btn" id="btn-quick-roll"><i class="ts-icon-d20 ts-icon-small"></i>Roll</button>' +
    '</div>';
  container.appendChild(quickCard);

  document.getElementById("btn-quick-roll").addEventListener("click", function() {
    var label = document.getElementById("quick-roll-label").value || "Roll";
    var expr = document.getElementById("quick-roll-expr").value || "1d20";
    rollDice(label, expr);
  });

  // --- Common Dice ---
  var commonCard = createCard("Common Dice");
  var commonRolls = [
    { name: "d4", roll: "1d4" },
    { name: "d6", roll: "1d6" },
    { name: "d8", roll: "1d8" },
    { name: "d10", roll: "1d10" },
    { name: "d12", roll: "1d12" },
    { name: "d20", roll: "1d20" }
  ];
  var commonBtns = document.createElement("div");
  commonBtns.style.cssText = "display:flex;gap:0.3em;flex-wrap:wrap;";
  for (var i = 0; i < commonRolls.length; i++) {
    var cr = commonRolls[i];
    var btn = document.createElement("button");
    btn.className = "roll-btn";
    btn.innerHTML = '<i class="ts-icon-' + cr.name + ' ts-icon-small"></i> ' + cr.name;
    btn.addEventListener("click", (function(r) {
      return function() { rollDice(r.name, r.roll); };
    })(cr));
    commonBtns.appendChild(btn);
  }
  commonCard.appendChild(commonBtns);
  container.appendChild(commonCard);

  // --- Prepared Actions ---
  var prepCard = createCard("Prepared Actions");
  prepCard.querySelector("h2").innerHTML = '<i class="ts-icon-hourglass ts-icon-small"></i> Prepared Actions (Half Die Value)';
  var prepInfo = document.createElement("div");
  prepInfo.style.cssText = "font-size:0.85em;color:var(--ts-color-secondary);margin-bottom:0.5em;";
  prepInfo.textContent = "When not under stress: take half the die value instead of rolling.";
  prepCard.appendChild(prepInfo);

  var prepGrid = document.createElement("div");
  prepGrid.style.cssText = "display:flex;flex-wrap:wrap;gap:0.3em;";
  for (var i = 0; i < SKILLS.length; i++) {
    var skill = SKILLS[i];
    var btn = document.createElement("button");
    btn.className = "roll-btn";
    btn.style.cssText = "font-size:0.85em;";
    btn.dataset.skill = skill.key;
    btn.id = "prep-" + skill.key;
    var dieType = CharacterSheet.getSkillDie(skill.key);
    btn.textContent = skill.name + " = " + getHalfDie(dieType);
    btn.title = "Prepared " + skill.name + ": automatic " + getHalfDie(dieType);
    btn.addEventListener("click", (function(s) {
      return function() {
        var dt = CharacterSheet.getSkillDie(s.key);
        var half = getHalfDie(dt);
        addToLog(s.name + " (Prepared): " + half + " (half of " + dt + ")", false);
      };
    })(skill));
    prepGrid.appendChild(btn);
  }
  prepCard.appendChild(prepGrid);
  container.appendChild(prepCard);

  // --- Roll Log ---
  var logCard = createCard("Roll Log");
  logCard.innerHTML += '<div class="roll-log" id="roll-log"><em style="color:var(--ts-color-secondary);">No rolls yet.</em></div>';
  container.appendChild(logCard);
}

function createCard(title) {
  var card = document.createElement("div");
  card.className = "card";
  var h2 = document.createElement("h2");
  h2.textContent = title;
  card.appendChild(h2);
  return card;
}

// Roll a skill check using TaleSpire dice tray
function rollSkillCheck(skillName, dieType) {
  var descriptor = ROLL_TEMPLATES.skillCheck(skillName, dieType);
  TS.dice.putDiceInTray([descriptor])
    .then(function(rollId) {
      trackedRolls[rollId] = {
        skillName: skillName,
        dieType: dieType,
        isSkillCheck: true
      };
    })
    .catch(function(err) {
      TS.debug.log("Dice roll failed: " + (err.cause || err));
    });
}

// Roll arbitrary dice
function rollDice(label, expr) {
  TS.dice.putDiceInTray([{ name: label, roll: expr }])
    .then(function(rollId) {
      trackedRolls[rollId] = {
        skillName: label,
        dieType: null,
        isSkillCheck: false
      };
    })
    .catch(function(err) {
      TS.debug.log("Dice roll failed: " + (err.cause || err));
    });
}

// Handle roll results from TaleSpire
function onRollResult(event) {
  var rollId = event.payload.rollId;
  if (!trackedRolls[rollId]) return;

  if (event.kind === "rollResults") {
    var tracked = trackedRolls[rollId];
    var results = event.payload.resultsGroups;

    // Evaluate the total
    if (results && results.length > 0) {
      TS.dice.evaluateDiceResultsGroup(results[0]).then(function(total) {
        var blownUp = false;

        // Check if this was a skill check and if it Blew Up
        if (tracked.isSkillCheck && tracked.dieType) {
          var maxVal = DIE_MAX[tracked.dieType];
          // Check if the roll hit max value for a Blow Up.
          // For NSBU skill checks we always roll exactly "1dX" so the total
          // from evaluateDiceResultsGroup equals the raw die value.
          // We use === to ensure we detect only an exact max roll.
          if (total === maxVal && tracked.dieType !== "d20") {
            blownUp = true;
            showBlowUpBanner();

            // Announce the Blow Up in chat so all players can see it
            var heroName = CharacterSheet.getState().name || "Someone";
            TS.chat.send(heroName + "'s " + tracked.skillName + " Blows Up on a " + tracked.dieType + "!");

            // Find the skill key
            var skillKey = null;
            for (var i = 0; i < SKILLS.length; i++) {
              if (SKILLS[i].name === tracked.skillName) {
                skillKey = SKILLS[i].key;
                break;
              }
            }

            // NOTE: The actual Blow Up (upgrade + chain roll) is handled manually
            // by the player. TaleSpire doesn't support chained conditional rolls.
            // The Symbiote upgrades the skill die and logs the event.
            // The player should then roll the new die and add results manually,
            // or use the skill check button again for the chain roll.
            if (skillKey) {
              // Trigger flame effect on the skill box (persists 5 seconds)
              CharacterSheet.triggerFlames(skillKey);

              var autoBlowUp = CharacterSheet.isAutoBlowUp();
              if (autoBlowUp) {
                var newDie = CharacterSheet.upgradeSkill(skillKey);
                if (newDie) {
                  addToLog(tracked.skillName + " Check: " + total +
                    " -- BLOW UP! Skill upgraded to " + newDie +
                    ". Roll " + newDie + " and add to total!", true);
                  // Update prepared action button
                  updatePreparedButton(skillKey, newDie);
                } else {
                  addToLog(tracked.skillName + " Check: " + total +
                    " -- MAX on d20! Already at maximum die.", true);
                }
              } else {
                addToLog(tracked.skillName + " Check: " + total +
                  " -- BLOW UP! (Auto-upgrade OFF) Upgrade " +
                  tracked.dieType + " manually on the Sheet tab.", true);
              }
            }
          } else {
            addToLog(tracked.skillName + " Check: " + total, false);
          }
        } else {
          addToLog(tracked.skillName + ": " + total, false);
        }

        delete trackedRolls[rollId];
      }).catch(function(err) {
        TS.debug.log("Evaluate failed: " + (err.cause || err));
        delete trackedRolls[rollId];
      });
    } else {
      delete trackedRolls[rollId];
    }
  } else if (event.kind === "rollRemoved") {
    delete trackedRolls[rollId];
  }
}

function showBlowUpBanner() {
  var banner = document.getElementById("blow-up-banner");
  if (banner) {
    banner.classList.remove("visible");
    // Force reflow to restart animation
    void banner.offsetWidth;
    banner.classList.add("visible");
    setTimeout(function() {
      banner.classList.remove("visible");
    }, 3000);
  }
}

function updatePreparedButton(skillKey, newDie) {
  var btn = document.getElementById("prep-" + skillKey);
  if (btn) {
    var skillName = "";
    for (var i = 0; i < SKILLS.length; i++) {
      if (SKILLS[i].key === skillKey) {
        skillName = SKILLS[i].name;
        break;
      }
    }
    var half = getHalfDie(newDie);
    btn.textContent = skillName + " = " + half;
    btn.title = "Prepared " + skillName + ": automatic " + half;
  }
}

function addToLog(text, isBlowUp) {
  rollLog.unshift({ text: text, blowUp: isBlowUp, time: new Date() });
  if (rollLog.length > 50) rollLog.pop();
  renderLog();
}

function renderLog() {
  var logEl = document.getElementById("roll-log");
  if (!logEl) return;
  if (rollLog.length === 0) {
    logEl.innerHTML = '<em style="color:var(--ts-color-secondary);">No rolls yet.</em>';
    return;
  }
  var html = "";
  for (var i = 0; i < rollLog.length; i++) {
    var entry = rollLog[i];
    html += '<div class="roll-log-entry">';
    if (entry.blowUp) {
      html += '<span class="blow-up-text">' + entry.text + '</span>';
    } else {
      html += '<span class="roll-result">' + entry.text + '</span>';
    }
    html += '</div>';
  }
  logEl.innerHTML = html;
}

export var DiceRoller = {
  init: init,
  onRollResult: onRollResult,
  rollDice: rollDice,
  rollSkillCheck: rollSkillCheck
};
