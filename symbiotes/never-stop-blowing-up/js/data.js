// ============================================================
// NEVER STOP BLOWING UP - GAME DATA
// All data extracted from the NSBU rulebook.
// ============================================================

export var SYSTEM_NAME = "Never Stop Blowing Up";

// ============================================================
// DIE PROGRESSION
// The core of NSBU: skills are tracked as die types, not numbers.
// ============================================================
export var DIE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20"];
export var DIE_MAX = { "d4": 4, "d6": 6, "d8": 8, "d10": 10, "d12": 12, "d20": 20 };

// Get the next die type in the Blow Up chain
export function getNextDie(currentDie) {
  var idx = DIE_TYPES.indexOf(currentDie);
  if (idx < 0 || idx >= DIE_TYPES.length - 1) return null; // d20 is max
  return DIE_TYPES[idx + 1];
}

// Get half the die value (for Prepared Actions)
export function getHalfDie(dieType) {
  return Math.floor(DIE_MAX[dieType] / 2);
}

// ============================================================
// SKILLS (9 total)
// ============================================================
export var SKILLS = [
  { key: "stunts",  name: "Stunts",  description: "Parkour, acrobatics, daring physical feats" },
  { key: "brawl",   name: "Brawl",   description: "Hand-to-hand combat, grappling, melee fighting" },
  { key: "tech",    name: "Tech",    description: "Hacking, electronics, technical knowledge" },
  { key: "weapons", name: "Weapons", description: "Ranged weapons, armed combat" },
  { key: "sneak",   name: "Sneak",   description: "Stealth, infiltration, hiding" },
  { key: "wits",    name: "Wits",    description: "Perception, investigation, deduction, memory" },
  { key: "tough",   name: "Tough",   description: "Endurance, resisting damage, physical resilience" },
  { key: "drive",   name: "Drive",   description: "Vehicles, piloting, chases" },
  { key: "hot",     name: "Hot",     description: "Charisma, persuasion, intimidation, social interaction" }
];

// ============================================================
// INJURY LEVELS
// ============================================================
export var INJURY_LEVELS = [
  { key: "none",         name: "Healthy",      level: 0, effect: "No penalties." },
  { key: "superficial",  name: "Superficial",  level: 1, effect: "No additional mechanical penalty." },
  { key: "severe",       name: "Severe",       level: 2, effect: "Turbo Tokens cost double (2 TT per +1 to a roll). Blowing Up via TT also costs double." },
  { key: "adrenalized",  name: "Adrenalized",  level: 3, effect: "Gain 10 Turbo Tokens. Next failed Tough Check = incapacitated or dead (attacker's intention)." }
];

// ============================================================
// ABILITIES (Individual)
// Cost: 2 Turbo Tokens each. Characters start with 3.
// ============================================================
export var ABILITIES = [
  { key: "smokin",        name: "Smokin'",        effect: "Lower the DC of a Hot Check by 3 when making a first impression." },
  { key: "burglar",       name: "Burglar",        effect: "Lower the DC of a Sneak Check by 3 when entering a protected location." },
  { key: "connected",     name: "Connected",      effect: "Lower the DC of a Hot Check by 3 when searching for a helpful ally." },
  { key: "relentless",    name: "Relentless",     effect: "Gain 2 Turbo Tokens when you fail a check (instead of 1)." },
  { key: "escape_artist", name: "Escape Artist",  effect: "Lower the DC of a Sneak Check by 3 when escaping restraints or imprisonment." },
  { key: "flashy",        name: "Flashy",         effect: "Lower the DC of a Hot Check by 5 if it's the first roll after you've Blown Up." },
  { key: "transporter",   name: "Transporter",    effect: "Lower the DC of a Drive Check by 3 to avoid pursuers." },
  { key: "inspiring",     name: "Inspiring",      effect: "Each time you succeed at a check, an ally of your choice receives 1 Turbo Token." },
  { key: "loyal",         name: "Loyal",          effect: "Your Turbo Tokens give friends +1 at a one-to-one rate (instead of 2:1)." },
  { key: "lucky",         name: "Lucky",          effect: "Once per episode: Spend 2 Turbo Tokens to reroll any check." },
  { key: "trained",       name: "Trained",        effect: "-1 to DCs for a Stat of your choice." },
  { key: "studied",       name: "Studied",        effect: "Replaces Trained. -3 to DCs for Stat of your choice." },
  { key: "mastery",       name: "Mastery",        effect: "Replaces Studied. -5 to DCs for a Stat of your choice." },
  { key: "menacing",      name: "Menacing",       effect: "Use Brawl instead of Hot when intimidating an NPC." },
  { key: "nerves_steel",  name: "Nerves of Steel", effect: "Spend a Turbo Token to treat a snap decision as a Prepared Action." },
  { key: "by_the_book",   name: "By the Book",    effect: "Lower the DC of a Hot Check by 3 when interacting with authority figures." },
  { key: "poker_face",    name: "Poker Face",     effect: "When attempting to conceal the truth, use Tough instead of Hot." },
  { key: "prepared",      name: "Prepared",       effect: "GM's Discretion. Spend 2 Turbo Tokens to happen to have one commonplace item with you." },
  { key: "protector",     name: "Protector",      effect: "Lower the DC of a check by 3 when defending your friends." },
  { key: "quick_healing", name: "Quick Healing",  effect: "Recover one injury level at the end of an encounter." },
  { key: "resilient",     name: "Resilient",      effect: "Turbo Tokens are worth double when used to boost against an attack that targets you." },
  { key: "skilled",       name: "Skilled",        effect: "Increase your die type for one skill by 1 for the purposes of halving (prepared actions)." },
  { key: "trainer",       name: "Trainer",        effect: "Describe a pep talk to spend Turbo Tokens for a friend, even when you are not present." },
  { key: "stealthy",      name: "Stealthy",       effect: "Lower the DC of a Sneak Check by 3 when trying to avoid being seen." },
  { key: "suspicious",    name: "Suspicious",     effect: "Lower the DC of a Wits Check by 3 when trying to determine if someone is lying." },
  { key: "grit",          name: "Grit",           effect: "Lower the DC of a Tough Check by 3 when resisting a Brawl Check." },
  { key: "martial_artist",name: "Martial Artist",  effect: "Spend a Turbo Token to force an enemy to resist your Brawl with Wits instead of Tough." },
  { key: "leap_of_faith", name: "Leap of Faith",  effect: "Lower the DC of a Stunts Check by 3 when making a jump that could injure you." },
  { key: "neck_snapper",  name: "Neck Snapper",   effect: "Roll a Brawl Check to harmlessly incapacitate any opponent." },
  { key: "hacker",        name: "Hacker",         effect: "Lower the DC of a Tech Check by 3 when breaking into a computer database." },
  { key: "duelist",       name: "Duelist",        effect: "Lower the DC of a Weapons Check by 3 against someone wielding the same weapon." },
  { key: "interrogator",  name: "Interrogator",   effect: "Lower the DC of a Wits Check by 3 to draw information out of an opponent." },
  { key: "demolitions",   name: "Demolitions",    effect: "Lower the DC of a Tech Check by 3 when explosives are involved." },
  { key: "hotwire",       name: "Hotwire",        effect: "When interacting with vehicles, use Drive instead of Tech." },
  { key: "wild_card",     name: "Wild Card",      effect: "You are a Wild Card." },
  { key: "trouble_maker", name: "Trouble Maker",  effect: "GM's Discretion. Spend a Turbo Token to locate and receive help from a criminal network." },
  { key: "wealthy",       name: "Wealthy",        effect: "Spend a Turbo Token to ease a bad situation with cash." }
];

// ============================================================
// GROUP SUITES
// Unlocked when all players reach a certain die type.
// Cost: 10 TT per individual or 18 TT for the entire group.
// ============================================================
export var GROUP_SUITES = [
  {
    name: "La Familia",
    unlockDie: "d6",
    abilities: [
      { key: "gs_la_familia_tough", name: "Tough", effect: "Once per episode: Roll Tough on someone else's behalf." },
      { key: "gs_la_familia_tokens", name: "Tokens", effect: "Spend tokens for other people at a 1:1 exchange rate." },
      { key: "gs_la_familia_skill_die", name: "Skill Die", effect: "Once per episode: Lend a teammate a skill die." }
    ]
  },
  {
    name: "Criminal Conspiracy",
    unlockDie: "d6",
    abilities: [
      { key: "gs_criminal_conspiracy_item", name: "Item", effect: "When in a new location, produce a single useful item." },
      { key: "gs_criminal_conspiracy_tech", name: "Tech", effect: "Once per episode: Add your Tech Die to a Sneak Die." },
      { key: "gs_criminal_conspiracy_hot", name: "Hot", effect: "Roll Hot in response to the first attack of an encounter to dissuade an opponent." }
    ]
  },
  {
    name: "Diesel Circus",
    unlockDie: "d8",
    abilities: [
      { key: "gs_diesel_circus_injury_advantage", name: "Injury Advantage", effect: "Roll twice on the first roll after an injury." },
      { key: "gs_diesel_circus_double_explosion", name: "Double Explosion", effect: "Doubles your amount of tokens." },
      { key: "gs_diesel_circus_drive_check", name: "Drive Check", effect: "On a successful Drive Check, make another skill check." }
    ]
  },
  {
    name: "The Continentals",
    unlockDie: "d8",
    abilities: [
      { key: "gs_continentals_wits", name: "Wits", effect: "Turbo Tokens for Wits help increase the die type." },
      { key: "gs_continentals_hot_checks", name: "Hot Checks", effect: "Two successful Hot Checks auto-succeeds on stealing from an opponent." },
      { key: "gs_continentals_melee", name: "Melee", effect: "Lower the DC of Weapons Checks using melee weapons." }
    ]
  },
  {
    name: "Alpha Squad",
    unlockDie: "d10",
    abilities: [
      { key: "gs_alpha_squad_group_explosion", name: "Group Explosion", effect: "Min 3 people. In a scene where everyone uses a different skill, reduce the range to Blow Up by 1." },
      { key: "gs_alpha_squad_skill_add", name: "Skill Add", effect: "Once per episode: Two people roll the same skill and add the totals together." },
      { key: "gs_alpha_squad_suit_up", name: "Suit Up", effect: "Once per episode: The group may 'suit up' and each take 2 Turbo Tokens." }
    ]
  },
  {
    name: "Marauders",
    unlockDie: "d10",
    abilities: [
      { key: "gs_marauders_plus_10", name: "+10", effect: "Beating an opponent by more than 10 means you defeat an additional opponent." },
      { key: "gs_marauders_destroyer", name: "Destroyer", effect: "Gain a Turbo Token on any turn where you destroy an object." },
      { key: "gs_marauders_firestarter", name: "Firestarter", effect: "Start a fire, short circuit electronics, or dissolve a structure as part of any action." }
    ]
  },
  {
    name: "The Ones",
    unlockDie: "d12",
    abilities: [
      { key: "gs_the_ones_max_roll", name: "Max Roll", effect: "Once per episode: Treat a Nat 1 as a max die roll." },
      { key: "gs_the_ones_reroll", name: "Reroll", effect: "Once per episode: Reroll a failure with a different skill." },
      { key: "gs_the_ones_turbo_tokens", name: "Turbo Tokens", effect: "Once per episode: Accept a Nat 1 to gain half the Turbo Tokens of the die value." }
    ]
  },
  {
    name: "Tactical Command",
    unlockDie: "d12",
    abilities: [
      { key: "gs_tactical_command_shared_tokens", name: "Shared Tokens", effect: "Once per episode: Spend Turbo Tokens across scenes." },
      { key: "gs_tactical_command_reroll", name: "Reroll", effect: "Once per episode: Reroll on a failure." },
      { key: "gs_tactical_command_token_gain", name: "Token Gain", effect: "Characters gain a Turbo Token at the end of a scene where they have zero." }
    ]
  },
  {
    name: "Bustin' Makes Me Feel Good",
    unlockDie: "d20",
    abilities: [
      { key: "gs_bustin_track_restart", name: "Track Restart", effect: "On a Nat 20: Restart that skill track, now rolling a second die and taking the better result." },
      { key: "gs_bustin_group_explosion", name: "Group Explosion", effect: "On a Nat 20: Everybody else at the table graduates all of their lowest die type up by one." },
      { key: "gs_bustin_gm", name: "GM", effect: "On a Nat 20: Become the GM for 60 seconds." }
    ]
  }
];

// ============================================================
// DICE ROLL TEMPLATES
// Adapted for NSBU's "roll die type vs DC" system.
// ============================================================
export var ROLL_TEMPLATES = {
  skillCheck: function(skillName, dieType) {
    return { name: skillName + " Check", roll: "1" + dieType };
  },
  preparedAction: function(skillName, dieType) {
    var half = getHalfDie(dieType);
    return { name: skillName + " (Prepared)", roll: "" + half };
  }
};

// ============================================================
// RULES REFERENCE DATA
// Organized by category for the rules browser tab.
// ============================================================
export var RULES_SECTIONS = [
  {
    title: "Core Resolution",
    id: "core-resolution",
    content: '<p><strong>Roll your skill die vs a DC set by the GM.</strong></p>' +
      '<ul>' +
      '<li>GM sets a <strong>Difficulty Check (DC)</strong> and names which skill to roll.</li>' +
      '<li>Roll the die type you currently have for that skill (d4 through d20).</li>' +
      '<li><strong>Meet or beat the DC</strong> = success.</li>' +
      '<li>If you roll the <strong>maximum value</strong> on your die, it <strong>Blows Up</strong>.</li>' +
      '</ul>'
  },
  {
    title: "Blowing Up",
    id: "blowing-up",
    content: '<p>When you roll the <strong>highest value</strong> on your die:</p>' +
      '<ol>' +
      '<li><strong>Keep</strong> the current result.</li>' +
      '<li>Your skill <strong>permanently upgrades</strong> to the next die type.</li>' +
      '<li><strong>Roll the new die</strong> and add the result to your total.</li>' +
      '<li>If the new roll is ALSO the max, <strong>continue Blowing Up</strong>.</li>' +
      '<li>Repeat until you reach d20 or roll below maximum.</li>' +
      '</ol>' +
      '<p><strong>Die Progression:</strong> d4 &rarr; d6 &rarr; d8 &rarr; d10 &rarr; d12 &rarr; d20</p>' +
      '<p>The skill upgrade is <strong>permanent</strong> &mdash; all future checks use the new die.</p>'
  },
  {
    title: "Prepared Actions",
    id: "prepared-actions",
    content: '<p>When not under stress and with time to prepare:</p>' +
      '<ul>' +
      '<li>Instead of rolling, take <strong>half the die value</strong> for that skill.</li>' +
      '<li>d4 = 2, d6 = 3, d8 = 4, d10 = 5, d12 = 6, d20 = 10</li>' +
      '</ul>'
  },
  {
    title: "Turbo Tokens",
    id: "turbo-tokens",
    content: '<p><strong>Earning:</strong></p>' +
      '<ul>' +
      '<li>Fail a check &rarr; gain <strong>1 Turbo Token</strong>.</li>' +
      '<li>Reaching <strong>Adrenalized</strong> injury &rarr; gain <strong>10 Turbo Tokens</strong>.</li>' +
      '</ul>' +
      '<p><strong>Spending (for yourself):</strong></p>' +
      '<ul>' +
      '<li>Spend <strong>1 TT</strong> = <strong>+1</strong> to a die roll.</li>' +
      '<li>If this brings the roll to its max value, it triggers a <strong>Blow Up</strong>.</li>' +
      '</ul>' +
      '<p><strong>Spending (for friends):</strong></p>' +
      '<ul>' +
      '<li>Both characters must be <strong>in the same scene</strong>.</li>' +
      '<li>Costs <strong>2x</strong> (2 TT = +1 to friend\'s roll).</li>' +
      '</ul>' +
      '<p><strong>At Severe Injury:</strong> All Turbo Token costs are <strong>doubled</strong>.</p>' +
      '<p><strong>Purchasing Abilities:</strong> At end of session, spend 2 TT per individual ability. Group suite abilities cost 10 TT per individual or 18 TT for the entire group.</p>'
  },
  {
    title: "Injury & Tough Checks",
    id: "injury",
    content: '<p>When an Action Hero <strong>fails a Tough Check by 5 or more</strong>, they take an Injury Level.</p>' +
      '<table>' +
      '<tr><th>Level</th><th>Name</th><th>Effect</th></tr>' +
      '<tr><td>1</td><td><strong>Superficial</strong></td><td>No additional mechanical penalty.</td></tr>' +
      '<tr><td>2</td><td><strong>Severe</strong></td><td>Turbo Tokens cost double (2 TT per +1). Blowing Up via TT also costs double.</td></tr>' +
      '<tr><td>3</td><td><strong>Adrenalized</strong></td><td>Gain 10 Turbo Tokens. Next failed Tough Check = incapacitated or dead (attacker\'s intention).</td></tr>' +
      '</table>'
  },
  {
    title: "Character Creation",
    id: "character-creation",
    content: '<p>Build your character by choosing:</p>' +
      '<ol>' +
      '<li>An <strong>Action Hero Name</strong></li>' +
      '<li>A <strong>Catchphrase</strong></li>' +
      '<li><strong>3 Abilities</strong> from the abilities list</li>' +
      '</ol>' +
      '<p>All 9 skills start at <strong>d4</strong>.</p>'
  },
  {
    title: "Skills",
    id: "skills",
    content: '<table>' +
      '<tr><th>Skill</th><th>Typical Use</th></tr>' +
      '<tr><td><strong>Stunts</strong></td><td>Parkour, acrobatics, daring physical feats</td></tr>' +
      '<tr><td><strong>Brawl</strong></td><td>Hand-to-hand combat, grappling, melee fighting</td></tr>' +
      '<tr><td><strong>Tech</strong></td><td>Hacking, electronics, technical knowledge</td></tr>' +
      '<tr><td><strong>Weapons</strong></td><td>Ranged weapons, armed combat</td></tr>' +
      '<tr><td><strong>Sneak</strong></td><td>Stealth, infiltration, hiding</td></tr>' +
      '<tr><td><strong>Wits</strong></td><td>Perception, investigation, deduction, memory</td></tr>' +
      '<tr><td><strong>Tough</strong></td><td>Endurance, resisting damage, physical resilience</td></tr>' +
      '<tr><td><strong>Drive</strong></td><td>Vehicles, piloting, chases</td></tr>' +
      '<tr><td><strong>Hot</strong></td><td>Charisma, persuasion, intimidation, social interaction</td></tr>' +
      '</table>'
  },
  {
    title: "Abilities (Individual)",
    id: "abilities-individual",
    content: '<p>Cost: <strong>2 Turbo Tokens</strong> each. Characters start with 3.</p>' +
      '<p>See the <strong>Character Sheet tab</strong> for the full list of abilities and their effects.</p>' +
      '<p>Notable special abilities:</p>' +
      '<ul>' +
      '<li><strong>Trained / Studied / Mastery</strong>: Each replaces the previous. -1 / -3 / -5 to DCs for one stat.</li>' +
      '<li><strong>Menacing</strong>: Use Brawl instead of Hot for intimidation.</li>' +
      '<li><strong>Poker Face</strong>: Use Tough instead of Hot to conceal truth.</li>' +
      '<li><strong>Hotwire</strong>: Use Drive instead of Tech for vehicles.</li>' +
      '</ul>'
  },
  {
    title: "Group Suites",
    id: "group-suites",
    content: '<p>Unlocked when <strong>all players</strong> reach a certain die type in at least one skill.</p>' +
      '<p>Cost: <strong>10 TT per individual</strong> or <strong>18 TT for the entire group</strong>.</p>' +
      '<table>' +
      '<tr><th>Suite</th><th>Unlock</th><th>Abilities</th></tr>' +
      '<tr><td>La Familia</td><td>d6</td><td>Tough (roll for others), Tokens (1:1 for friends), Skill Die (lend to teammate)</td></tr>' +
      '<tr><td>Criminal Conspiracy</td><td>d6</td><td>Item, Tech+Sneak combo, Hot vs first attack</td></tr>' +
      '<tr><td>Diesel Circus</td><td>d8</td><td>Injury Advantage, Double Explosion, Drive+Skill combo</td></tr>' +
      '<tr><td>The Continentals</td><td>d8</td><td>Wits TT upgrade, Hot auto-steal, Melee DC reduction</td></tr>' +
      '<tr><td>Alpha Squad</td><td>d10</td><td>Group Explosion, Skill Add, Suit Up</td></tr>' +
      '<tr><td>Marauders</td><td>d10</td><td>+10 defeat extra, Destroyer, Firestarter</td></tr>' +
      '<tr><td>The Ones</td><td>d12</td><td>Max Roll (Nat 1 = max), Reroll, TT from Nat 1</td></tr>' +
      '<tr><td>Tactical Command</td><td>d12</td><td>Shared Tokens, Reroll, Token Gain</td></tr>' +
      '<tr><td>Bustin\' Makes Me Feel Good</td><td>d20</td><td>Track Restart, Group Explosion, Become GM</td></tr>' +
      '</table>'
  }
];
