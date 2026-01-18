# SceneWeaver

A markdown-first visual novel engine. Write stories in Markdown, compile to playable games.

## Quick Start

1. **Write scenes** in `scenes/` folder as `.md` files
2. **Build** with `python tools/build_story_from_md.py`
3. **Open** `index.html` in a browser

## Scene Format

```markdown
---
id: intro
bg: forest.svg
music: theme.mp3
set_flags: [visited_intro]
---

First text block appears here.

---

Second text block after Continue.

### Choices

- Go to forest -> forest
- Stay here (requires: has_key) -> locked_door
```

### Frontmatter Options

| Field | Description |
|-------|-------------|
| `id` | Unique scene identifier (required) |
| `bg` | Background image filename |
| `music` | Background music filename |
| `chars` | Character sprites (array) |
| `set_flags` | Flags to set when entering |
| `set_key_flags` | Persistent flags (survive Play Again) |
| `clear_flags` | Flags to clear when entering |

### Choice Syntax

```markdown
- Label -> target_scene
- Label (requires: flag_name) -> target_scene
- Label (sets: new_flag) -> target_scene
```

## Project Structure

```
SceneWeaver/
  index.html          # Entry point
  css/
    variables.css     # Theme variables
    base.css          # Reset and --u unit
    layout.css        # Container layout
    text-box.css      # Dialogue styles
    choices.css       # Button styles
    transitions.css   # Animations
  js/
    tuning.js         # Timing/speed values
    story.js          # Generated scene data
    engine.js         # Core engine
    core/
      store.js        # State management
      event-bus.js    # Pub/sub system
      errors.js       # Error classes
      bootstrap.js    # Initialization
    managers/
      flag-manager.js # Flag system
      audio-manager.js# Music/SFX
      save-manager.js # Autosave
    modules/
      text-renderer/  # Text display
      save-slots/     # Multi-slot saves (optional)
  scenes/             # Markdown source files
  assets/
    bg/               # Backgrounds
    char/             # Character sprites
    music/            # Background music
    sfx/              # Sound effects
  themes/
    default.css       # Default theme
  tools/
    build_story_from_md.py
```

## CSS Scaling System

All sizes use a single unit: `calc(N * var(--u))`

```css
/* --u scales based on container width */
/* Reference: 1920px, Minimum: 480px */

.my-element {
    font-size: calc(24 * var(--u));
    padding: calc(16 * var(--u));
}
```

## Text Modes

### Block Mode (Default)
Story text with Continue button. Auto-splits long text into pages.

### Log Mode
Battle/system messages that shift up. New messages appear at bottom.

```javascript
textRenderer.setMode('log');
textRenderer.showLog('Enemy attacks!', callback);
```

## Flags

```javascript
// Regular flags (cleared on Play Again)
flagManager.set('found_key');
flagManager.has('found_key');  // true
flagManager.clear('found_key');

// Key flags (persist across Play Again)
flagManager.setKey('ending_unlocked');
flagManager.hasKey('ending_unlocked');
```

## Events

```javascript
eventBus.on(Events.SCENE_LOADED, function(data) {
    console.log('Loaded:', data.sceneId);
});

eventBus.on(Events.CHOICE_SELECTED, function(data) {
    console.log('Choice:', data.choice.label);
});
```

Available events:
- `SCENE_LOADING`, `SCENE_LOADED`
- `TEXT_START`, `TEXT_COMPLETE`, `TEXT_SKIP`
- `CHOICE_SHOWN`, `CHOICE_SELECTED`
- `FLAG_SET`, `FLAG_CLEARED`
- `STATE_SAVED`, `STATE_LOADED`
- `MUSIC_CHANGED`, `SFX_PLAYED`

## Theming

Create a theme file in `themes/`:

```css
:root {
    --sw-text-color: #ffffff;
    --sw-accent-color: #ffd700;
    --sw-box-bg: rgba(0, 0, 0, 0.75);
    --sw-box-border: rgba(255, 255, 255, 0.2);
}
```

## Tuning

Edit `js/tuning.js` to adjust timing:

```javascript
var TUNING = {
    text: {
        speed: { normal: 18, fast: 10, instant: 0 },
        lines: 4
    },
    log: {
        slots: 2,
        row1Opacity: 0.7,
        row2Opacity: 1.0
    },
    save: {
        autoSaveInterval: 30000,
        autoSaveOnSceneChange: true
    }
};
```

## Save System

**Autosave** (built-in): Automatically saves progress.

**Save Slots** (optional module): Multi-slot UI for manual saves.

```javascript
// Optional save slots module
saveSlots.show('save');  // Show save UI
saveSlots.show('load');  // Show load UI
```

## Browser Requirements

- ES5+ (no build step needed)
- Container queries support
- localStorage for saves

## License

MIT
