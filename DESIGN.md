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

## Text System

Core provides two text rendering modes. Both use the same `--u` scaling and line-height math.

### Shared Text Properties

```css
.sw-text-box {
  --lines: 4;                    /* Visible line count */
  --line-height: 1.5;            /* Unitless multiplier */
  --text-size: calc(28 * var(--u));

  height: calc(var(--lines) * var(--text-size) * var(--line-height));
  overflow: hidden;              /* No scrollbar ever */
}
```

### Mode 1: Block Mode (Story/Dialogue)

For user-paced reading. Text auto-splits to fit visible lines, Continue button advances.

```
┌─────────────────────────────────┐
│ This is a block of story text   │
│ that auto-splits based on the   │
│ box height. When it fills up,   │
│ user must press Continue.       │
└─────────────────────────────────┘
         [Continue]
```

**Behavior:**
- Text block auto-splits to fit N lines
- Typewriter effect (configurable)
- **Continue** button required to advance
- Next block replaces previous entirely

### Mode 2: Log Mode (Battle/System Messages)

For continuous flow. New messages enter at bottom, old messages shift up and exit.

**Rule:** New message always enters bottom slot. Existing messages shift up. Top slot exits when full.

```
State 1: Message A arrives
┌─────────────────────────────────┐
│                                 │  ← slot 1 (empty)
│ A: Hero attacks!                │  ← slot 2 (new)
└─────────────────────────────────┘

State 2: Message B arrives
┌─────────────────────────────────┐
│ A: Hero attacks!                │  ← slot 1 (A shifted up)
│ B: Goblin takes 12 damage.      │  ← slot 2 (new)
└─────────────────────────────────┘

State 3: Message C arrives
┌─────────────────────────────────┐
│ B: Goblin takes 12 damage.      │  ← slot 1 (B shifted up, A gone)
│ C: Goblin is defeated!          │  ← slot 2 (new)
└─────────────────────────────────┘
```

**Behavior:**
- Fixed slot count (configurable, e.g., 2)
- New message always enters bottom slot
- Existing messages shift up with animation
- Top message exits when pushed out
- No user input required
- No manual scrolling

### Line Count by Orientation

| Mode | Default | Opt-in |
|------|---------|--------|
| Landscape | 4 lines | — |
| Portrait | 4 lines (smaller text) | More lines via config |

### Configuration

See `tuning.js` for all tunable values.

**Minimum slots:** Both modes require at least 2 visible lines/slots. Engine enforces `Math.max(2, value)`.

---

## Tuning System

All timing, speed, and behavior values are centralized in JavaScript files. No magic numbers in code.

### Priority

```
Module tuning > Core tuning > Hardcoded defaults
```

### Structure

```
sceneweaver/
├── js/
│   └── tuning.js             # Core tuning values
└── modules/
    ├── battle/
    │   └── tuning.js         # Battle module overrides
    └── quiz/
        └── tuning.js         # Quiz module overrides
```

### Core Tuning File

```javascript
// js/tuning.js
const TUNING = {
  // === Text Display ===
  text: {
    speed: {
      normal: 18,       // ms per character
      fast: 10,
      instant: 0
    },
    autoAdvanceDelay: 1500,
    skipModeDelay: 150,
    lines: 4,           // Visible lines (min: 2)
    lineHeight: 1.5
  },

  // === Log Mode ===
  log: {
    slots: 2,           // Visible slots (min: 2)
    shiftDuration: 200,
    lingerDelay: 1200,
    row1Opacity: 0.7,
    row2Opacity: 1.0
  },

  // === Audio ===
  audio: {
    defaultVolume: 0.16,
    duckVolume: 0.2,
    crossfadeDuration: 1000
  },

  // === Transitions ===
  transition: {
    sceneFade: 300,
    backgroundFade: 500,
    spriteFade: 300
  }
};

// Helper for dot-path access
TUNING.get = function(path, fallback) {
  var parts = path.split('.');
  var value = TUNING;
  for (var i = 0; i < parts.length; i++) {
    if (value && typeof value === 'object' && parts[i] in value) {
      value = value[parts[i]];
    } else {
      return fallback;
    }
  }
  return value;
};

// Module override registration
TUNING.register = function(moduleName, overrides) {
  // Deep merge, module values win
  for (var key in overrides) {
    var parts = key.split('.');
    var target = TUNING;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in target)) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = overrides[key];
  }
};

window.TUNING = TUNING;
```

### Module Override

```javascript
// modules/battle/tuning.js
TUNING.register('battle', {
  'log.lingerDelay': 800,     // Battle needs faster log
  'text.speed.normal': 25     // Battle text slightly slower
});
```

### Usage in Code

```javascript
// Direct access
var speed = TUNING.text.speed.normal;

// With fallback (preferred)
var speed = TUNING.get('text.speed.normal', 18);
```

### Rules

1. **Never hardcode** timing/speed values
2. **Always use** `TUNING.get(key, default)` for safety
3. **Document** values with comments in tuning.js
4. **Modules override** via `TUNING.register()`

---

## Theming System

Themes override **visual appearance only** — colors, fonts, decorative elements. Layout is not theme-controlled.

### Theme Files

```css
/* themes/my-theme.css */
:root {
  /* Colors */
  --sw-text-color: #ffffff;
  --sw-bg-color: #1a1a2e;
  --sw-accent-color: #ffd700;

  /* Fonts */
  --sw-font-family: 'My Custom Font', sans-serif;

  /* Decorative */
  --sw-border-style: 2px solid var(--sw-accent-color);
}
```

### Rules

1. **Colors only** — no width, height, padding, margin
2. **Fonts allowed** — family, weight, style
3. **Decorative borders** — style and color, not width in layout units
4. **No layout changes** — themes cannot change element positioning

### CSS Variable Naming

All themeable variables use `--sw-` prefix:

| Variable | Purpose |
|----------|---------|
| `--sw-text-color` | Primary text color |
| `--sw-text-dim` | Dimmed/secondary text |
| `--sw-bg-color` | Background color |
| `--sw-accent-color` | Accent/highlight color |
| `--sw-font-family` | Primary font |

---

## Save System

### Core: Autosave

Core provides automatic save/load using localStorage. No user action required.

**What's saved:**
- Current scene ID
- Current text block index
- Flags (regular + persistent)
- Read blocks (for skip functionality)
- Scene history (for undo/back)

**Autosave behavior:**
- Saves to slot 0 automatically
- Interval: every 30 seconds (tunable)
- Also saves on scene change
- Loads automatically on page load

```javascript
// Core save manager (built-in)
SceneWeaver.save.auto();           // Trigger autosave
SceneWeaver.save.load();           // Load from slot 0
SceneWeaver.save.hasSave();        // Check if save exists
SceneWeaver.save.clear();          // Delete save
```

**localStorage keys:**
```
sw_save          # Main autosave (slot 0)
sw_settings      # User settings (volume, text speed)
sw_read_blocks   # Tracks which text has been read
```

### Module: Save Slots (Optional)

For games that need multiple save slots, a save-slots module provides:

- Multiple slots (1-9)
- Manual save/load UI
- Export/import as JSON files
- Save metadata (timestamp, scene name, playtime)

```javascript
// Save slots module (optional)
SceneWeaver.saveSlots.save(3);           // Save to slot 3
SceneWeaver.saveSlots.load(3);           // Load from slot 3
SceneWeaver.saveSlots.delete(3);         // Delete slot 3
SceneWeaver.saveSlots.getInfo(3);        // Get slot metadata
SceneWeaver.saveSlots.export(3);         // Download as JSON
SceneWeaver.saveSlots.import(file, 3);   // Import from file
```

### Save Data Structure

```javascript
{
  // Scene state
  currentSceneId: 'chapter1_scene5',
  currentBlockIndex: 2,

  // Flags
  flags: ['met_hero', 'opened_door'],
  keyFlags: ['unlocked_ending_b'],    // Persist across "New Game"

  // Progress tracking
  readBlocks: ['scene1:0', 'scene1:1', 'scene2:0'],
  history: ['intro', 'chapter1_scene1', 'chapter1_scene2'],

  // Metadata
  timestamp: 1705123456789,
  version: '1.0.0'
}
```

### Validation

Save data is validated on load to prevent crashes from corrupted saves:

- Check required fields exist
- Verify types (string, number, array)
- Clear corrupted saves with user notification

---

## Core vs Module Responsibilities

### Core (Built-in)

- Scene loading & transitions
- Text display (typewriter effect)
- Choices & branching
- Flag management (regular + persistent)
- Autosave (slot 0)
- Audio playback (music + SFX)
- Asset loading & caching

### Modules (Opt-in)

- Save slots UI (multiple slots, export/import)
- Battle system
- Quick-time events (QTE)
- Quiz/dialogue trees
- Inventory UI
- Mini-games
- Custom scene actions

---

## Build Pipeline

### Overview

```
scenes/*.md (Markdown source)
       ↓
   build.py (Python script)
       ↓
js/story.js (Generated JSON)
       ↓
   Engine loads and plays
```

### Build Command

```bash
python tools/build_story_from_md.py
```

### What Gets Built

| Source | Output | Description |
|--------|--------|-------------|
| `scenes/*.md` | `js/story.js` | Scene data (text, choices, actions) |
| `theme.md` | `js/theme.js` | Selected theme config |

### Scene File Format

```markdown
---
id: scene_id
bg: background.jpg
music: track.mp3
chars: [sprite.svg]
set_flags: [met_hero]
set_key_flags: [completed_tutorial]
clear_flags: [old_flag]
add_items: [sword]
actions:
  - type: start_battle
    enemy: goblin
---

First text block displayed to user.

---

Second text block (after Continue).

---

Third text block.

### Choices

- Go left → left_path
- Go right (requires: has_key) → right_path
- Fight (require_skills: Fireball) → battle_scene
```

### Generated Output

```javascript
// js/story.js
var story = {
  "scene_id": {
    "id": "scene_id",
    "bg": "background.jpg",
    "music": "track.mp3",
    "chars": ["sprite.svg"],
    "set_flags": ["met_hero"],
    "set_key_flags": ["completed_tutorial"],
    "textBlocks": [
      "First text block displayed to user.",
      "Second text block (after Continue).",
      "Third text block."
    ],
    "choices": [
      { "label": "Go left", "target": "left_path" },
      { "label": "Go right", "target": "right_path", "require_flags": ["has_key"] },
      { "label": "Fight", "target": "battle_scene", "require_skills": ["Fireball"] }
    ]
  }
};
```

---

## Flag System

### Two Types of Flags

| Type | Cleared on "Play Again" | Use Case |
|------|------------------------|----------|
| **Regular flags** | Yes | Per-playthrough state (opened_door, talked_to_npc) |
| **Key flags** | No | Permanent unlocks (completed_tutorial, unlocked_ending_b) |

### Setting Flags in Markdown

```yaml
---
id: some_scene
set_flags: [met_hero, opened_chest]      # Regular flags
set_key_flags: [boss_defeated]           # Persistent flags
clear_flags: [has_key]                   # Remove flags
---
```

### Checking Flags in Choices

```markdown
### Choices

- Enter (requires: has_key) → locked_room
- Leave (requires: !has_key) → go_back
```

The `!` prefix means "flag must NOT be set".

### API

```javascript
// Regular flags
SceneWeaver.flags.set('met_hero');
SceneWeaver.flags.has('met_hero');      // true
SceneWeaver.flags.clear('met_hero');
SceneWeaver.flags.getAll();             // ['flag1', 'flag2']

// Key flags (persistent)
SceneWeaver.flags.setKey('boss_defeated');
SceneWeaver.flags.hasKey('boss_defeated');
SceneWeaver.flags.clearKey('boss_defeated');
SceneWeaver.flags.getAllKey();
```

### Reset Behavior

| Action | Regular Flags | Key Flags |
|--------|---------------|-----------|
| Play Again | Cleared | Kept |
| Full Reset | Cleared | Cleared |

---

## History / Undo System

### How It Works

- Every scene load pushes scene ID to history stack
- Undo pops from history and loads previous scene
- History is saved with game state

### State

```javascript
state.history = ['intro', 'chapter1', 'chapter2', 'current_scene'];
```

### Undo Behavior

1. If `currentBlockIndex > 0`: Go back one text block
2. If at first block: Pop history, load previous scene

### API

```javascript
SceneWeaver.history.push(sceneId);    // Called automatically on scene load
SceneWeaver.history.pop();            // Go back one scene
SceneWeaver.history.canUndo();        // Check if undo possible
SceneWeaver.history.clear();          // Clear history
```

### Configuration

Undo can be restricted to dev mode only (default) or enabled for players:

```javascript
// In tuning.js
history: {
  undoEnabled: false,       // Allow player undo (default: false)
  devModeUndoEnabled: true  // Allow undo in dev mode (default: true)
}
```

---

## Error Handling

### Error Types

```javascript
// Built-in error classes
SceneNotFoundError    // Scene ID doesn't exist
InvalidChoiceError    // Choice target missing or invalid
ValidationError       // Save data corrupted
ModuleError          // Module failed to load/init
```

### Error Screen

When a critical error occurs, show user-friendly error screen:

```javascript
showErrorScreen({
  title: 'Scene Not Found',
  message: 'Could not find scene: "missing_scene"',
  suggestion: 'Check that the scene ID is correct in your story files.'
});
```

### Graceful Degradation

- Missing scene: Show error screen with scene ID
- Missing background: Use fallback color
- Missing music: Continue silently
- Missing sprite: Hide character slot
- Corrupted save: Clear save, notify user, start fresh

### Logging

```javascript
_log.debug('Engine', 'Loading scene:', sceneId);
_log.warn('Engine', 'Missing background:', bg);
_log.error('Engine', 'Scene not found:', sceneId);
```

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
├── js/
│   ├── tuning.js             # Core tuning values
│   └── story.js              # Generated from scenes/
├── tools/
│   └── build_story_from_md.py
├── assets/
│   ├── bg/                   # Background images
│   ├── char/                 # Character sprites
│   ├── music/                # Background music
│   ├── sfx/                  # Sound effects
│   └── fonts/                # Custom fonts
├── modules/                  # Optional custom modules
│   └── my-module/
│       ├── index.js
│       ├── tuning.js         # Module tuning overrides
│       └── style.css
└── themes/                   # Optional custom themes
    └── my-theme.css
```
