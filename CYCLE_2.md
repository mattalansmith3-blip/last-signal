# Cycle 2 — v0.4 (deployed, Actions Pages)

## Shipped
- **Aimed shot**: −20% hit chance, ×1.8 damage ("Headshot!"). Gives a risk/reward choice on every turn.
- **Achievements**: 7 trophies (First Blood, Zombie Janitor, Spark of Hope, Halfway Home, Scrap Baron, Homebody, Shiny!). They pop as toasts and the count shows on the title.
- **Battery drops**: 10% chance per kill. The trader is now usable mid-run.
- **Room backdrops**: two new GenerateImage interiors (an overgrown supermarket and a sunlit house). Stores, food courts, garages, basements and offices use them.
- **Escape grace**: retreating or a night raid can't kill you from 18+ HP. You limp away at 1–6 HP instead.
- **Deployment**: the legacy Pages build was erroring/stuck, so deploys now go through a GitHub Actions Pages workflow.

## Live play (real taps)
- **390x844: WIN.** Rescued on day 12 with 12/12 parts, 109 kills and 63 containers, after 818 bot steps.
- **844x390:** reached 12/12 and stood at the tower. The bot looped on Install/Broadcast with HP below 70 because it never went to rest.
- **Cycle-1 live runs, for comparison:**
  - 390x844 died on day 3, "cut off while retreating" from 25 HP. That's why escape grace was added.
  - 844x390 died on day 13, "overrun while sleeping", at 8/12.
- **Findings for cycle 3:**
  - The broadcast prompt needs to show HP readiness.
  - Players want a reason to replay, so add a daily seed.
