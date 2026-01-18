# SceneWeaver Refactoring Plan

Code quality improvements identified during structure review.

---

## HIGH Priority

### 1. Deduplicate Typewriter Logic
**Problem:** `engine.js:254-286` duplicates `textRenderer.js:72-110`

**Solution:**
- Remove typewriter from engine.js
- Engine delegates to textRenderer.showBlock()
- textRenderer becomes the single source of truth

**Files:** engine.js, text-renderer/index.js

---

### 2. Add Battle Event Constants
**Problem:** battle/index.js uses string literals like `'battle:start'`

**Solution:**
- Add battle events to event-bus.js Events object
- Replace all string literals in battle module

**Files:** event-bus.js, battle/index.js

---

### 3. Move Magic Numbers to TUNING
**Problem:** Hardcoded timeouts scattered in modules

**Locations:**
- battle-ui.js:176-180 - damage animation timeout (1000ms)
- qte modules - various animation timings

**Solution:** Add missing values to tuning.js, reference via TUNING.get()

**Files:** tuning.js, battle-ui.js

---

## MEDIUM Priority

### 4. Extract Shared Typewriter Function
**Problem:** typewriterLogRow duplicates core typewriter logic

**Solution:**
- Create `typewriterCore(element, text, speed, onChar, onComplete)`
- Both block and log modes use this core function

**Files:** text-renderer/index.js

---

### 5. Add Module Cleanup Methods
**Problem:** No standardized destroy/cleanup for modules

**Solution:**
- Add `destroy()` to module interface
- Clear timers, remove event listeners
- Call on module unload

**Files:** All module index.js files

---

### 6. Remove Empty Legacy Directory
**Problem:** Empty `modules/` at root confuses structure

**Solution:** Delete empty directory

**Files:** modules/ (delete)

---

## LOW Priority

### 7. Consolidate Path Configuration
**Problem:** Asset paths scattered across engine.js and audio-manager.js

**Solution:**
- [x] Add `TUNING.paths` with backgrounds, characters, music, sfx, fonts
- [x] Update engine.js to use `TUNING.get('paths.*')`
- [x] Update audio-manager.js to use `TUNING.get('paths.*')`
- [x] Remove duplicate path config and `configure()` method

**Files:** tuning.js, engine.js, audio-manager.js

---

### 8. Add Input Validation
**Problem:** Module start() functions don't validate inputs

**Solution:**
- [x] battle.start() - Validate HP/attack/defense as positive numbers
- [x] quiz.start() - Validate questions array and structure
- [x] qte.startSkillQTE/startDefendQTE() - Require callback function

**Files:** battle/index.js, quiz/index.js, qte/index.js

---

### 9. JSDoc Standardization (Skip for now)

- Add consistent JSDoc to all public functions

---

## Implementation Order

1. [x] Write this plan
2. [x] Deduplicate typewriter (engine → textRenderer)
3. [x] Add battle/QTE/quiz event constants
4. [x] Move magic numbers to TUNING
5. [x] Extract shared typewriter core
6. [x] Add destroy() methods
7. [x] Clean up empty directory
8. [x] Consolidate path configuration
9. [x] Add input validation
10. [ ] JSDoc standardization (skipped)

---

## Status

**Started:** 2026-01-18
**Completed:** 2026-01-18

All refactoring tasks complete (except JSDoc).
