# Cycle 3 — v0.5 / v0.5.1 (live)

## Shipped
- **Daily Signal:** a seeded daily run with the same map and loot for everyone that day. Runs are tagged "Daily" in the title history.
- **Broadcast readiness:** the broadcast prompt shows your HP in green or red and recommends 70+.
- **Bot fix:** the bot now rests up before broadcasting instead of looping at the tower.
- **v0.5.1:** sleeping raids are non-lethal unless you're starving. Retreat grace now kicks in from 8 HP.

## Live play (real taps)
- **v0.5:** 4 runs at 390x844 and 844x390.
  - 1 win: rescued on day 7 with 104 kills.
  - The 3 deaths were on the road (an ambush on day 6), from a sleeping raid at 7 HP (day 5), and from a day-1 retreat at the gunstore.
  - These deaths drove v0.5.1.
- **v0.5.1:** 2 portrait runs.
  - Both were still alive on day 8–10 at 8/12 signal when this was written. Neither had ended, so no win or loss is counted for them.
  - No JS errors.
- **Gaps:**
  - The gunstore start is still spiky.
  - Fights are text and button driven. A visual fight scene is next.

## v0.6: visual turn-based fight (Last Stand style)
- **Side-view arena:**
  - The survivor stands on the left, with a pose for each weapon class (bat, pistol or rifle; new GenerateImage sprites).
  - Zombies stand on 5 distance steps (melee, 2–5), with ground markers.
  - Lanes split up zombies at the same distance.
- **Turn rules:**
  - Tap a zombie to target it. The target gets a gold glow, its hit %, and an HP bar.
  - Every turn, aware zombies advance: runners 2 steps, walkers 1, crawlers every other turn. Only zombies at melee range attack.
- **Actions:**
  - **Shoot/Swing:** guns take −4% hit chance per step beyond 2. Melee needs range 1, or a sneak-creep on an unaware zombie.
  - **Brace:** when a melee target is too far, wait a turn for +15% on the next swing.
  - **Aimed:** −20% hit, ×1.8 damage.
  - **Shove:** pushes the zombie back a step and dazes it.
  - **Molotov:** burns everything within ±1 step of the target.
- **Effects:** damage and miss pops, gold crit pops, hit flash, hero hurt flash, screen shake, gun recoil, tweened advance, death collapse animation.
- **Run grace:** fleeing a road ambush from 8+ HP leaves you alive at 1–4 HP.
- **Live tap test** at 390x844 and 844x390: no page or console errors.
- **Bot runs:**
  - local 390x844: win on day 11;
  - local 844x390: died on day 2 (road ambush; this led to run grace);
  - live 844x390: win on day 10;
  - live 390x844: the bot stalled on the map on day 7 carrying 4 parts (8/12 installed). That's bot pathing, not a game softlock.
