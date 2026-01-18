# SceneWeaver Core Tuning Numbers

All timing, speed, and behavior values that affect "game feel" live here.
Modules can override any value by defining the same key in their own tuning file.

**Priority:** Module tuning > Core tuning > Hardcoded defaults

---

## Text Display

| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| `text.speed.normal` | 18 | ms/char | Default typewriter speed |
| `text.speed.fast` | 10 | ms/char | Fast but readable |
| `text.speed.instant` | 0 | ms/char | No typewriter effect |
| `text.autoAdvanceDelay` | 1500 | ms | Pause before auto-advance (auto mode) |
| `text.skipModeDelay` | 150 | ms | Delay between blocks in skip mode |
| `text.lineHeight` | 1.5 | multiplier | Line height (unitless) |
| `text.lines` | 4 | count | Visible lines in block mode (min: 2) |
| `text.logSlots` | 2 | count | Visible slots in log mode (min: 2) |

---

## Log Mode (Continuous Text)

| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| `log.shiftDuration` | 200 | ms | Animation duration for row shift |
| `log.lingerDelay` | 1200 | ms | Time before auto-shifting to next message |
| `log.row1Opacity` | 0.7 | 0-1 | Opacity of older row (dimmed) |
| `log.row2Opacity` | 1.0 | 0-1 | Opacity of newest row (full) |
| `log.fadeOnExit` | true | bool | Fade out row 1 when pushed out |

---

## Audio

| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| `audio.defaultVolume` | 0.16 | 0-1 | Default music volume |
| `audio.duckVolume` | 0.2 | 0-1 | Music volume during SFX |
| `audio.sfxPreDelay` | 150 | ms | Pause before playing SFX |
| `audio.sfxPostDelay` | 200 | ms | Pause after SFX before text |
| `audio.crossfadeDuration` | 1000 | ms | Music crossfade time |

---

## Transitions

| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| `transition.sceneFade` | 300 | ms | Scene transition fade duration |
| `transition.backgroundFade` | 500 | ms | Background image crossfade |
| `transition.spriteFade` | 300 | ms | Character sprite fade in/out |
| `transition.uiTransition` | 200 | ms | General UI element transitions |

---

## Input

| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| `input.clickDebounce` | 100 | ms | Minimum time between click actions |
| `input.holdThreshold` | 500 | ms | Time before hold is detected |

---

## Theming

| Key | Default | Unit | Description |
|-----|---------|------|-------------|
| `theme.allowLayoutOverride` | false | bool | Allow themes to change layout (not just colors) |

---

## Usage in Code

```javascript
// Get tuning value (with module override support)
const speed = SceneWeaver.tuning.get('text.speed.normal');

// Get with fallback
const delay = SceneWeaver.tuning.get('custom.value', 500);

// Module registers its tuning (takes priority)
SceneWeaver.tuning.register('battle', {
  'log.lingerDelay': 800,  // Battle needs faster log
  'text.speed.normal': 25  // Battle text slightly slower
});
```

---

## File Structure

```
sceneweaver/
├── TUNING.md              # This file (core defaults)
└── modules/
    └── battle/
        └── TUNING.md      # Battle module overrides
```

---

## Adding New Tuning Values

1. Add to this file with default value
2. Document unit and purpose
3. Use `SceneWeaver.tuning.get()` in code
4. Never hardcode magic numbers
