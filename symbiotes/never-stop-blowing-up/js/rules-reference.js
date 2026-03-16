// ============================================================
// NEVER STOP BLOWING UP - RULES REFERENCE
// Searchable, collapsible rules sections.
// ============================================================

import { RULES_SECTIONS } from "./data.js";

function init() {
  buildRulesUI();
}

function buildRulesUI() {
  var container = document.getElementById("tab-rules");
  container.innerHTML = "";

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

    var header = document.createElement("div");
    header.className = "rules-header";
    header.innerHTML = '<span class="collapse-icon"><i class="ts-icon-chevron-up ts-icon-small"></i></span>';
    var headerText = document.createElement("h2");
    headerText.textContent = section.title;
    headerText.style.margin = "0";
    header.appendChild(headerText);

    header.addEventListener("click", (function(cardEl) {
      return function() {
        var body = cardEl.querySelector(".rules-body");
        var icon = cardEl.querySelector(".collapse-icon");
        body.classList.toggle("hidden");
        icon.classList.toggle("collapsed");
      };
    })(card));

    var body = document.createElement("div");
    body.className = "rules-body";
    body.innerHTML = section.content;

    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
  }

  // --- Die Progression Quick Ref ---
  var dieCard = document.createElement("div");
  dieCard.className = "card rules-card";
  dieCard.dataset.sectionId = "die-progression";
  dieCard.innerHTML =
    '<h2 style="color:var(--ts-accent-primary);">Die Progression</h2>' +
    '<div class="rules-body">' +
    '<p style="text-align:center;font-size:1.3em;letter-spacing:0.1em;">' +
    '<strong>d4 &rarr; d6 &rarr; d8 &rarr; d10 &rarr; d12 &rarr; d20</strong>' +
    '</p>' +
    '<table>' +
    '<tr><th>Die</th><th>Max (Blow Up at)</th><th>Prepared Value (Half)</th></tr>' +
    '<tr><td>d4</td><td>4</td><td>2</td></tr>' +
    '<tr><td>d6</td><td>6</td><td>3</td></tr>' +
    '<tr><td>d8</td><td>8</td><td>4</td></tr>' +
    '<tr><td>d10</td><td>10</td><td>5</td></tr>' +
    '<tr><td>d12</td><td>12</td><td>6</td></tr>' +
    '<tr><td>d20</td><td>20</td><td>10</td></tr>' +
    '</table>' +
    '</div>';
  container.appendChild(dieCard);
}

function filterRules() {
  var query = document.getElementById("rules-search").value.toLowerCase();
  var cards = document.querySelectorAll(".rules-card");
  for (var i = 0; i < cards.length; i++) {
    var text = cards[i].textContent.toLowerCase();
    cards[i].style.display = text.indexOf(query) > -1 ? "" : "none";
  }
}

export var RulesReference = { init: init };
