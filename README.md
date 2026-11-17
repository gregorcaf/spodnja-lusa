# spodnja-lusa

Prototype of a satirical Slovenian municipality simulation (see `SPEC.md`).

```bash
npm install && npm run dev   # play locally
npm test                     # game logic, content and balance tests (Node's built-in runner)
```

The game saves itself in the browser (localStorage) every month and when the tab is closed.

## Structure

```
src/
  config.js        CONFIG – every tunable number (also edited by the dev panel)
  main.js          wires game ↔ render ↔ UI, main loop
  game/            pure game logic, no Three.js / DOM
    game.js        Game facade + events (tile, state, news, snow, party-*, month, config)
    map.js         16×16 grid, districts, initial layout
    citizens.js    25 citizens, characters, thought selection
    building.js    build/demolish rules, preview forecast
    envy.js        the envy mechanic
    levers.js      the mayor's five levers
    month.js       monthly turn + report
    unrest.js      protests and riots driven by the affair risk
    effects.js     generic effects (used by dilemmas and wishes), modifiers, delayed consequences
    dilemmas.js    picking and resolving dilemma cards
    wishes.js      citizens' wishes: spawn, pay/build, expire
    elections.js   campaign, vote, recount, epilogue
    envelopes.js   loyalty envelopes (secret account)
    seasons.js     seasons from the month
    save.js        save/load (JSON snapshot of the state)
    content/       dilemma cards and wishes (Slovenian text)
    stats.js       mood, support, averages, income/expenses
    texts.js       all Slovenian in-game text
  render/          Three.js (orthographic isometric camera)
    scene.js       MapView: renderer, lights, picking, glue
    camera.js      zoom / pan / 90° rotation
    models.js      low-poly models from primitives
    world.js       ground, district tints and borders, tiles
    citizens.js    walking figures (road pathing, party dancing)
    preview.js     ghost model for construction preview
    overlay.js     envy map
    effects.js     snow, party lights and notes
    labels.js      HTML district labels and thought bubbles
  audio/          everything synthesised with Web Audio (no audio files)
    music.js       original polka (minor key during riots)
    sfx.js         sound effects and protest/riot ambience
    context.js     shared audio context
  ui/              HTML interface (top bar, sidebar, ticker, popup, report, dev panel)
tests/             node --test suites (rules, levers, unrest/elections, content, save/seasons, balance)
```

In dev mode `window.__obcina` exposes `{ game, view }` for debugging.
