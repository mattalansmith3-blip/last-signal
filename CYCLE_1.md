# Cycle 1 — v0.3 (commit bb08e8a, deployed via GitHub Actions Pages)

## Shipped
- Scrap/sell: one-tap Scrap per item, Scrap Junk (confirm list), Select multi-scrap/sell, auto JUNK tags on clear downgrades, ★ lock, Mark junk.
- Scrap → Workbench (gear upgrades, crafting bandages/bolts/lockpicks/molotov/medkit) and Safehouse upgrades (barricade, bed, garden, radio).
- Rosa the wandering trader (moves every 2–3 days): sell junk for batteries, buy food/meds/ammo/part rumors, trade 5 scrap → 1 battery.
- Fixes: rarity clamps per zone, crossbow uses craftable bolts, honest per-gear danger labels, save after every action (no reload exploits), drawn roads with hours + horde risk, portrait map 60vh with swipe hint, 21-day deadline, hordes every 4 days, rooms re-infest.
- Found during play: no way to eat outside combat → added map **Eat** button + **Forage 2h** (food, with a small ambush risk); starving-rest warning.

## Play findings (bot, real taps, 390x844 + 844x390)
- Pre-fix runs: starved day 3–6 (the "can't eat on map" bug).
- After Eat/Forage: alive day 9, 8/12 signal parts, 82 kills.
- Scrap piles up (120+ unspent) → need sinks; batteries too scarce → trader barely usable.
- Fights are flat (only Fight/Shove) → want aimed shots.
