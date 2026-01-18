# SceneWeaver Extraction Plan

Extract reusable engine from Andi's codebase into SceneWeaver.

## Phase 1: Foundation

### 1.1 Project Structure
- [ ] Create folder structure
- [ ] Create index.html shell
- [ ] Create base CSS with `--u` unit system

### 1.2 Build Pipeline
- [ ] Copy and adapt `build_story_from_md.py`
- [ ] Remove Andi-specific fields (enemies, summons, player)
- [ ] Create sample scene for testing

### 1.3 Core Tuning
- [ ] Create `js/tuning.js` with core values
- [ ] Add `TUNING.get()` helper
- [ ] Add `TUNING.register()` for module overrides

---

## Phase 2: Core Engine

### 2.1 Core Architecture
- [ ] `js/core/store.js` — State management
- [ ] `js/core/event-bus.js` — Pub/sub system
- [ ] `js/core/errors.js` — Error classes
- [ ] `js/core/bootstrap.js` — Initialization

### 2.2 Managers
- [ ] `js/managers/flag-manager.js` — Regular + key flags
- [ ] `js/managers/audio-manager.js` — Music + SFX
- [ ] `js/managers/save-manager.js` — Autosave only

### 2.3 Engine Core
- [ ] Scene loading
- [ ] Text display (block mode)
- [ ] Choices rendering
- [ ] Flag checking for choices
- [ ] Scene transitions

### 2.4 Text Renderer
- [ ] `js/modules/text-renderer/` — Extract from Andi
- [ ] Typewriter effect
- [ ] Auto-pagination
- [ ] Log mode (shift-up)

---

## Phase 3: CSS System

### 3.1 Base Styles
- [ ] `css/base.css` — Reset, `--u` unit, container
- [ ] `css/layout.css` — Game container, aspect ratios
- [ ] `css/text-box.css` — Dialogue box styles
- [ ] `css/choices.css` — Choice button styles
- [ ] `css/transitions.css` — Fade effects

### 3.2 Theme System
- [ ] `css/variables.css` — `--sw-` prefixed vars
- [ ] `themes/default.css` — Default theme
- [ ] Theme loading mechanism

---

## Phase 4: Optional Modules

### 4.1 Save Slots Module
- [ ] `modules/save-slots/` — Multi-slot UI
- [ ] Export/import functionality

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
- [ ] README.md with quick start
- [ ] Example game

### 5.2 Testing
- [ ] Test with sample story
- [ ] Test mobile/portrait mode
- [ ] Test save/load

---

## Extraction Order (Files from Andi)

### Priority 1: Core (Must Have)
```
Andi/js/core/store.js          → js/core/store.js
Andi/js/core/event-bus.js      → js/core/event-bus.js
Andi/js/core/errors.js         → js/core/errors.js
Andi/js/managers/flag-manager.js → js/managers/flag-manager.js
Andi/js/managers/audio-manager.js → js/managers/audio-manager.js
Andi/js/tuning.js              → js/tuning.js (simplified)
Andi/tools/build_story_from_md.py → tools/build_story_from_md.py
```

### Priority 2: Text System
```
Andi/js/modules/text-renderer/ → js/modules/text-renderer/
Andi/js/engine.js (text parts) → js/engine.js (new, simplified)
```

### Priority 3: CSS
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

### Remove Andi-Specific Code
- Enemy definitions
- Player stats (HP, mana, skills)
- Battle-specific flags
- Summon system
- Password system

### Rename Prefixes
- `andi_vn_` → `sw_` (localStorage keys)
- `#vn-container` → `#sw-container`
- CSS classes: add `sw-` prefix

### Simplify
- Remove dev panel (make it a module)
- Remove game menu (make it a module)
- Remove inventory (make it a module)
- Keep only: scenes, text, choices, flags, saves, audio

---

## Success Criteria

Phase 1 complete when:
- [ ] Can build story.js from Markdown
- [ ] index.html loads without errors

Phase 2 complete when:
- [ ] Can load and display a scene
- [ ] Text displays with typewriter effect
- [ ] Choices work and navigate to next scene
- [ ] Flags can be set and checked
- [ ] Autosave works

Phase 3 complete when:
- [ ] Looks good on desktop (16:9)
- [ ] Looks good on mobile (9:16)
- [ ] Theme can be swapped

Phase 4+ complete when:
- [ ] Battle module works (optional)
- [ ] Save slots module works (optional)
