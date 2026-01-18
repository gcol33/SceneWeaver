# SceneWeaver Design Specification

Version: 0.1.0

## Philosophy

SceneWeaver is a markdown-first visual novel engine. Authors write `.md` files that compile to playable games. No code required for basic stories. Modules are opt-in extensions.

```
Author writes .md files
        ↓
    Build step
        ↓
  Playable game
```

---

## CSS Scaling System

### The Rule

> **Every size value in SceneWeaver CSS must be `calc(N * var(--u))` or `%` for layout proportions. No px, em, rem, vw, vh, cqw used directly.**

### The Unit

```css
#game-container {
  container-type: inline-size;

  /* Reference width: design at 1920px */
  --ref: 1920;

  /* Minimum scale (480px / 1920px = 0.25) */
  --min-scale: 0.25;

  /* Raw unit: 1u = 1px at 1920px width */
  --raw-u: calc(100cqw / var(--ref));

  /* Clamped unit: never smaller than min-scale */
  --u: max(var(--raw-u), calc(1px * var(--min-scale)));
}
```

### Usage

Design in "pixels at 1920px reference", then use those numbers:

```css
.dialogue-text {
  font-size: calc(28 * var(--u));      /* 28px at 1920 */
  padding: calc(16 * var(--u));        /* 16px at 1920 */
  border-radius: calc(8 * var(--u));   /* 8px at 1920 */
}

.character-sprite {
  width: calc(400 * var(--u));
  height: calc(600 * var(--u));
}
```

### Scaling Behavior

| Container Width | --u Value | 28-unit Font |
|-----------------|-----------|--------------|
| 480px (min)     | 0.25px    | 7px          |
| 960px           | 0.5px     | 14px         |
| 1920px (ref)    | 1px       | 28px         |
| 2560px (1440p)  | 1.33px    | 37px         |
| 3840px (4K)     | 2px       | 56px         |

### Allowed Units

| Unit | When to Use |
|------|-------------|
| `calc(N * var(--u))` | All sizes: fonts, spacing, borders, dimensions |
| `%` | Layout proportions only (e.g., `width: 50%`) |

### Forbidden Units

Never use directly: `px`, `em`, `rem`, `vw`, `vh`, `vmin`, `vmax`, `cqw`, `cqh`

---

## Aspect Ratios

### Landscape (Default)

- Ratio: **16:9**
- Reference width: **1920px**
- Trigger: `@media (orientation: landscape)` or default

### Portrait (Mobile)

- Ratio: **9:16**
- Reference width: **1080px**
- Trigger: `@media (orientation: portrait)`

### Implementation

```css
#game-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 100vh;
  max-height: 100dvh;
}

@media (orientation: portrait) {
  #game-container {
    aspect-ratio: 9 / 16;
    max-height: 90dvh; /* Room for browser chrome */
    --ref: 1080;       /* Portrait reference width */
  }
}
```

---

## Asset Paths

### Configuration

```javascript
// sceneweaver.config.js (optional)
export default {
  paths: {
    backgrounds: 'assets/bg/',
    characters: 'assets/char/',
    music: 'assets/music/',
    sfx: 'assets/sfx/',
    fonts: 'assets/fonts/'
  }
}
```

### Defaults

If no config provided:

| Asset Type | Default Path |
|------------|--------------|
| Backgrounds | `assets/bg/` |
| Characters | `assets/char/` |
| Music | `assets/music/` |
| SFX | `assets/sfx/` |
| Fonts | `assets/fonts/` |

### Markdown Usage

```yaml
bg: forest.jpg      # → assets/bg/forest.jpg
chars: [hero.svg]   # → assets/char/hero.svg
music: theme.mp3    # → assets/music/theme.mp3
```

---

## Scene Contract

### Core (Always Available)

```yaml
---
id: scene_id              # Required: unique identifier
bg: background.jpg        # Optional: background image
music: track.mp3          # Optional: background music
chars: [sprite.svg]       # Optional: character sprites
set_flags: [flag1]        # Optional: flags to set
clear_flags: [flag2]      # Optional: flags to clear
---

Dialogue text goes here.

---

Another text block (shown after Continue).

### Choices

- Choice A → target_scene_a
- Choice B (requires: some_flag) → target_scene_b
```

### Module-Provided Actions

Only available if the corresponding module is loaded:

```yaml
actions:
  - type: start_battle    # Requires: battle module
    enemy: goblin
  - type: start_quiz      # Requires: quiz module
    questions: intro_quiz
```

---

## Module Contract

Every module must implement:

```javascript
const MyModule = {
  // === Required ===
  name: 'my-module',              // Unique identifier
  version: '1.0.0',               // Semver

  // === Lifecycle ===
  init(api) { },                  // Called on load
  destroy() { },                  // Called on cleanup

  // === Optional ===
  dependencies: [],               // Other module names

  actions: {                      // Scene action handlers
    'action_name': (data, api) => { }
  },

  cssVars: [],                    // CSS custom properties used
  containerId: null               // DOM container (if any)
};

SceneWeaver.registerModule(MyModule);
```

### Module Rules

1. Must self-register with `SceneWeaver.registerModule()`
2. Must declare dependencies explicitly
3. Must not touch DOM outside designated container
4. Must use only `--u` based CSS (no raw units)
5. Must clean up in `destroy()`

---

## Core vs Module Responsibilities

### Core (Built-in)

- Scene loading & transitions
- Text display (typewriter effect)
- Choices & branching
- Flag management (regular + persistent)
- Save/load system
- Audio playback (music + SFX)
- Asset loading & caching

### Modules (Opt-in)

- Battle system
- Quick-time events (QTE)
- Quiz/dialogue trees
- Inventory UI
- Mini-games
- Custom scene actions

---

## File Structure

```
my-game/
├── index.html
├── sceneweaver.config.js     # Optional configuration
├── scenes/                   # Markdown source files
│   ├── intro.md
│   ├── chapter1/
│   │   ├── scene1.md
│   │   └── scene2.md
│   └── endings/
│       └── good_end.md
├── assets/
│   ├── bg/                   # Background images
│   ├── char/                 # Character sprites
│   ├── music/                # Background music
│   ├── sfx/                  # Sound effects
│   └── fonts/                # Custom fonts
├── modules/                  # Optional custom modules
│   └── my-module/
│       ├── index.js
│       └── style.css
└── themes/                   # Optional custom themes
    └── my-theme.css
```
