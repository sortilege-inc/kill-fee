# Kill Fee — a Daggerheart chronicle set in Night City

A static campaign wiki for **Kill Fee**, a 3–5 session Daggerheart mini-campaign at street level
in Night City, between *Edgerunners* and *Cyberpunk 2077*. Daggerheart lightly reskinned, not
converted: the crew starts at level 3 and ends at 5.

Aesthetic: black screen, corporate yellow, and the two colours that mean trouble — cyan for
anything read off the net, hot pink for the warning light. Sharp corners, hazard stripes, a
yellow band on the masthead.

## Structure

| Path | What |
|------|------|
| `index.html` | Landing page — masthead band, section cards, optional spine tally |
| `chronicle/` | Session pages. **Empty — no sessions played yet** |
| `crew/` | The player characters. **Empty — built after the remap** |
| `faces/` | NPCs. **Empty** |
| `gigs/` | The job board. **Empty** |
| `factions/` | Corps & Gangs, player-facing. **Empty** — the GM view is under `gm/` |
| `night-city/` | Districts and places, player-facing. **Empty** — the GM view is under `gm/` |
| `gear/` | Gear & Chrome. **Empty — after the remap settles equipment** |
| `cards/` | Domain Cards — one page per remapped domain, cards rendered from a `.cards.json` sidecar with the staged netrunner art. **Codex levels 1–2 so far** |
| `lore/` | How the city works. **Empty** |
| `table/` | Player-facing: principles, Session 0, character options. **Empty until the remap is done** |
| `gm/` | **Behind the Blackwall** — campaign frame, the remap workbench, the **Card Tracker** (generated from the Daggerheart corpus on every build: all 210 domain cards, converted or not), character menus, the plot, session outline, factions, locations, campaign state, next session |
| `builder/` | **Character Builder** (player-facing, level 1): the book's nine steps in Night City terms, live sheet, saves in the browser, Export/Import JSON, Print. `data.js` is generated from the Daggerheart corpus + the card sidecars through the term map; the page itself lives in `../kill-fee-support/build/builder/` |
| `edgerunners.css` | The theme |

**The remap is the gate.** `gm/daggerheart-remap.html` is the GM's workbench for turning
Daggerheart's subsystems into Night City terms, one table per subsystem, each row tagged `OPEN`
until it is `SET`. When it closes, the character menus in `gm/character-menus.html` move to the
table pages as the character creation options, and the play sheet gets the renamed traits.

## Theme

Three signals: **yellow** is the city (signage, contracts, the wordmark on everything you can
buy), **cyan** is the net (links, data, anything read off a screen), **pink** is the warning
light (the bounty, the GM section). Pink is used sparingly; it should read as "this is going
wrong".

Type: **Big Shoulders Display** (mastheads, numerals) · **Chakra Petch** (nav, headings, labels)
· **IBM Plex Sans** (body) · **Share Tech Mono** (dispatches, tags, epigraphs).

## Regenerating

This site is **generated** from Markdown in `../kill-fee-support/content/`:

```bash
python3 ../kill-fee-support/scripts/build_site.py
```

One `.md` file per page, one directory per category, front matter carrying `title` / `eyebrow` /
`summary` / `group` / `order` / `pronouns` / `portrait` / `source` / `date`. `[[Wikilinks]]`
resolve against page titles (leading articles and the part before a comma or dash both match, so
`[[Orbital Air]]` would find *Orbital Air — Corp A*); unresolved ones render as dotted "not yet
chronicled" spans, and the build prints them. Re-running wipes and rebuilds the generated
category directories and `index.html` only — `edgerunners.css`, `README.md`, `LICENSE`, `CNAME`,
`favicon.svg` and `.git` are preserved.

Provenance tags in GM notes: `` `SET` `` decided · `` `SOURCE` `` verified in the campaign summary ·
`` `YOURS` `` GM invention · `` `OPEN` `` undecided · `` `NOTE` `` caution. Markdown task lists
(`- [ ]`) render as checkboxes.

Adding a session: drop `content/chronicle/s01-<slug>.md` in with `date:` and `order:` front
matter and rebuild; the Chronicle index swaps its empty state for the session list.

Maps live in `../kill-fee-support/build/maps/` (the game-maps.com Night City world map plus 19
district maps). `atlas_map` in `site.config.json` draws the world map at the top of the Night City
index; any page can carry `map: <file>` in its front matter to show a district map above its text.
Only referenced maps are copied into the repo.

Domain cards: `content/cards/<domain>.md` carries the domain's intro; `content/cards/<domain>.cards.json`
lists its cards (`name`, `was`, `level`, `domain`, `type`, `recall`, `art`, `art_credit`, `text` in
Markdown). `art` is a path under `build/art/`; the build copies referenced files into `cards/img/`. Card text is
passed through `term_map` in `site.config.json` at build time (whole-word: the six trait renames,
Spellcast → Quickhack), so the sidecar can keep the book's wording.

Card art for the remap (domain cards, cyberware, quickhacks) is staged in
`../kill-fee-support/build/art/netrunner/` — 155 Android: Netrunner card illustrations, mostly
Emilio Rodriguez, liiga and other DeviantArt pieces, named by card. Only files a card references
are copied into the repo.

The optional spine tally (`spine` in `site.config.json`, off by default) draws a numbered row on
the home page and the Gigs index — set it to `{"label": "…", "total": N, "reached": M}` once the
campaign has a count worth tracking.

## Provenance

The GM section is the campaign concept as written by the GM (campaign summary, 2026-10-02),
restructured into pages and tagged. The Daggerheart remap workbench lists subsystems and
counts from the Daggerheart corpus (`titterpig-dsl-daggerheart` 0.5, core book + *Hope & Fear*);
nothing is remapped yet. No player-facing setting text has been written.
