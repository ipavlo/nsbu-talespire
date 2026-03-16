// ============================================================
// NEVER STOP BLOWING UP - APP INIT & NAVIGATION
// ============================================================

import { SYSTEM_NAME } from "./data.js";
import { CharacterSheet } from "./character-sheet.js";
import { DiceRoller } from "./dice-roller.js";
import { RulesReference } from "./rules-reference.js";

// ============================================================
// GLOBAL STATE
// ============================================================
var isGM = false;
var myClientId = null;
var appInitialized = false;

// Expose DiceRoller so character-sheet.js skill boxes can trigger rolls
window._diceRoller = DiceRoller;

// ============================================================
// TALESPIRE EVENT HANDLERS
// Assigned to window so TaleSpire can find them at global scope.
// ============================================================

window.onStateChangeEvent = function onStateChangeEvent(msg) {
  if (msg.kind === "hasInitialized") {
    initApp();
  }
};

window.handleRollResult = function handleRollResult(event) {
  DiceRoller.onRollResult(event);
};

// ============================================================
// APP INITIALIZATION
// ============================================================

async function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  try {
    var me = await TS.clients.whoAmI();
    myClientId = me.id;

    var info = await TS.clients.getMoreInfo([me.id]);
    if (!info.cause && info.length > 0) {
      isGM = (info[0].clientMode === "gm");
    }
  } catch (e) {
    // Non-critical -- continue without client info
  }

  // Initialize feature modules
  CharacterSheet.init();
  DiceRoller.init();
  RulesReference.init();

  if (typeof TS !== "undefined") {
    TS.debug.log(SYSTEM_NAME + " Companion initialized");
  }
}

// ============================================================
// TAB NAVIGATION
// Wire up tabs immediately -- module scripts are deferred by
// default so the DOM is fully parsed when this executes.
// ============================================================

(function initTabs() {
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener("click", function() {
      switchTab(this.dataset.tab);
    });
  }
})();

function switchTab(tabId) {
  var tabs = document.querySelectorAll(".tab");
  var panels = document.querySelectorAll(".tab-panel");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove("active");
    tabs[i].setAttribute("aria-selected", "false");
  }
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove("active");
  }
  var selectedTab = document.querySelector('.tab[data-tab="' + tabId + '"]');
  var selectedPanel = document.getElementById("tab-" + tabId);
  if (selectedTab) {
    selectedTab.classList.add("active");
    selectedTab.setAttribute("aria-selected", "true");
  }
  if (selectedPanel) selectedPanel.classList.add("active");
}
