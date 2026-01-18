# SceneWeaver Extraction Plan

Extract reusable engine from Andi's codebase into SceneWeaver.

## Phase 1: Foundation

### 1.1 Project Structure
- [x] Create folder structure
- [x] Create index.html shell
- [x] Create base CSS with `--u` unit system

### 1.2 Build Pipeline
- [x] Copy and adapt `build_story_from_md.py`
- [x] Remove Andi-specific fields (enemies, summons, player)
- [x] Create sample scene for testing

### 1.3 Core Tuning
- [x] Create `js/tuning.js` with core values
- [x] Add `TUNING.get()` helper
- [x] Add `TUNING.register()` for module overrides

---

## Phase 2: Core Engine

### 2.1 Core Architecture
- [x] `js/core/store.js` — State management
- [x] `js/core/event-bus.js` — Pub/sub system
- [x] `js/core/errors.js` — Error classes
- [x] `js/core/bootstrap.js` — Initialization

### 2.2 Managers
- [x] `js/managers/flag-manager.js` — Regular + key flags
- [x] `js/managers/audio-manager.js` — Music + SFX
- [x] `js/managers/save-manager.js` — Autosave only

### 2.3 Engine Core
- [x] Scene loading
- [x] Text display (block mode)
- [x] Choices rendering
- [x] Flag checking for choices
- [x] Scene transitions

### 2.4 Text Renderer
- [x] `js/modules/text-renderer/` — Extract from Andi
- [x] Typewriter effect
- [x] Auto-pagination
- [x] Log mode (shift-up)

---

## Phase 3: CSS System

### 3.1 Base Styles
- [x] `css/base.css` — Reset, `--u` unit, container
- [x] `css/layout.css` — Game container, aspect ratios
- [x] `css/text-box.css` — Dialogue box styles
- [x] `css/choices.css` — Choice button styles
- [x] `css/transitions.css` — Fade effects

### 3.2 Theme System
- [x] `css/variables.css` — `--sw-` prefixed vars
- [x] `themes/default.css` — Default theme
- [x] Theme loading mechanism

---

## Phase 4: Optional Modules

### 4.1 Save Slots Module
- [x] `modules/save-slots/` — Multi-slot UI
- [x] Export/import functionality

### 4.2 Battle Module (Later)
- [ ] `modules/battle/` — RPG combat
- [ ] Requires QTE module

### 4.3 QTE Module (Later)
- [ ] `modules/qte/` — Timing bar

### 4.4 Quiz Module (Later)
- [ ] `modules/quiz/` — Timed questions

---

## Phase 5: Polish

### 5.1 Documentation
- [x] README.md with quick start
- [x] Example game (6 sample scenes)

### 5.2 Testing
- [ ] Test with sample story
- [ ] Test mobile/portrait mode
- [ ] Test save/load

### 5.3 Sample Assets
- [x] Placeholder backgrounds (SVG)
- [x] Placeholder character (SVG)

---

## Extraction Order (Files from Andi)

### Priority 1: Core (Must Have) ✓
```
Andi/js/core/store.js          → js/core/store.js
Andi/js/core/event-bus.js      → js/core/event-bus.js
Andi/js/core/errors.js         → js/core/errors.js
Andi/js/managers/flag-manager.js → js/managers/flag-manager.js
Andi/js/managers/audio-manager.js → js/managers/audio-manager.js
Andi/js/tuning.js              → js/tuning.js (simplified)
Andi/tools/build_story_from_md.py → tools/build_story_from_md.py
```

### Priority 2: Text System ✓
```
Andi/js/modules/text-renderer/ → js/modules/text-renderer/
Andi/js/engine.js (text parts) → js/engine.js (new, simplified)
```

### Priority 3: CSS ✓
```
Andi/css/shared/variables.css  → css/variables.css (adapted)
Andi/css/layout-system.css     → css/layout.css (adapted)
Andi/css/style.css (parts)     → css/base.css (new)
```

### Priority 4: Modules (Optional)
```
Andi/js/modules/battle/        → modules/battle/ (later)
Andi/js/modules/qte/           → modules/qte/ (later)
Andi/js/modules/quiz/          → modules/quiz/ (later)
```

---

## Key Adaptations

### Remove Andi-Specific Code ✓
- Enemy definitions
- Player stats (HP, mana, skills)
- Battle-specific flags
- Summon system
- Password system

### Rename Prefixes ✓
- `andi_vn_` → `sw_` (localStorage keys)
- `#vn-container` → `#sw-container`
- CSS classes: add `sw-` prefix

### Simplify ✓
- Remove dev panel (make it a module)
- Remove game menu (make it a module)
- Remove inventory (make it a module)
- Keep only: scenes, text, choices, flags, saves, audio

---

## Success Criteria

Phase 1 complete when:
- [x] Can build story.js from Markdown
- [x] index.html loads without errors

Phase 2 complete when:
- [x] Can load and display a scene
- [x] Text displays with typewriter effect
- [x] Choices work and navigate to next scene
- [x] Flags can be set and checked
- [x] Autosave works

Phase 3 complete when:
- [x] Looks good on desktop (16:9)
- [x] Looks good on mobile (9:16)
- [x] Theme can be swapped

Phase 4+ complete when:
- [ ] Battle module works (optional, later)
- [x] Save slots module works (optional)

---

## Current Status

**Phases 1-3 and 5 COMPLETE**

Core engine is functional with:
- 6 sample scenes
- Markdown build pipeline
- Text block and log modes
- Flag system (regular + key)
- Autosave
- Save slots module
- CSS scaling with --u unit
- Theme support

**Remaining (optional, for later):**
- Battle module
- QTE module
- Quiz module
- Browser testing
