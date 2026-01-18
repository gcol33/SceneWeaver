/**
 * SceneWeaver - Tuning Numbers
 *
 * Centralized game feel constants.
 * All timing, speed, and behavior values live here.
 *
 * Usage:
 *   TUNING.text.speed.normal
 *   TUNING.get('text.speed.normal', 18)
 *
 * Module override:
 *   TUNING.register('battle', { 'log.lingerDelay': 800 });
 */

var TUNING = {

    // =========================================
    // ASSET PATHS
    // =========================================

    paths: {
        backgrounds: 'assets/bg/',
        characters: 'assets/char/',
        music: 'assets/music/',
        sfx: 'assets/sfx/',
        fonts: 'assets/fonts/'
    },

    // =========================================
    // TEXT DISPLAY
    // =========================================

    text: {
        speed: {
            normal: 18,         // ms per character
            fast: 10,           // Faster but readable
            instant: 0          // No typewriter effect
        },
        autoAdvanceDelay: 1500, // ms before auto-advance (auto mode)
        skipModeDelay: 150,     // ms between blocks in skip mode
        lines: 4,               // Visible lines (min: 2)
        lineHeight: 1.5         // Unitless multiplier
    },

    // =========================================
    // LOG MODE (continuous text)
    // =========================================

    log: {
        slots: 2,               // Visible slots (min: 2)
        shiftDuration: 200,     // Animation duration for row shift (ms)
        lingerDelay: 1200,      // Time before auto-shift to next message (ms)
        row1Opacity: 0.7,       // Older row opacity
        row2Opacity: 1.0        // Newest row opacity
    },

    // =========================================
    // AUDIO
    // =========================================

    audio: {
        defaultVolume: 0.16,    // Default music volume (0-1)
        duckVolume: 0.2,        // Music volume during SFX (0-1)
        crossfadeDuration: 1000,// Music crossfade time (ms)
        sfxPreDelay: 150,       // Pause before playing SFX (ms)
        sfxPostDelay: 200       // Pause after SFX before text (ms)
    },

    // =========================================
    // TRANSITIONS
    // =========================================

    transition: {
        sceneFade: 300,         // Scene transition fade (ms)
        backgroundFade: 500,    // Background image crossfade (ms)
        spriteFade: 300,        // Character sprite fade (ms)
        uiTransition: 200       // General UI transitions (ms)
    },

    // =========================================
    // SAVE SYSTEM
    // =========================================

    save: {
        autoSaveInterval: 30000,// Auto-save interval (ms)
        autoSaveOnSceneChange: true
    },

    // =========================================
    // HISTORY / UNDO
    // =========================================

    history: {
        undoEnabled: false,     // Allow player undo
        devModeUndoEnabled: true// Allow undo in dev mode
    },

    // =========================================
    // INPUT
    // =========================================

    input: {
        clickDebounce: 100,     // Min time between clicks (ms)
        holdThreshold: 500      // Time before hold detected (ms)
    },

    // =========================================
    // QTE (Quick-Time Events)
    // =========================================

    qte: {
        bar: {
            duration: 2000,     // Full bar oscillation time (ms)
            oscillations: 2     // Number of back-and-forth cycles
        },
        zones: {
            perfect: 10,        // Perfect zone width (% of bar, each side)
            good: 25,           // Good zone width (%)
            normal: 40          // Normal zone width (%)
        },
        timing: {
            startDelay: 300,    // Delay before QTE starts (ms)
            resultDisplay: 800, // How long result shows (ms)
            countdownDuration: 5// Countdown seconds for defend QTE
        },
        modifiers: {
            perfect: { bonusDamage: 0.5, damageReduction: 1.0 },
            good: { bonusDamage: 0.25, damageReduction: 0.75 },
            normal: { bonusDamage: 0, damageReduction: 0.5 },
            bad: { bonusDamage: -0.25, damageReduction: 0 }
        }
    },

    // =========================================
    // QUIZ
    // =========================================

    quiz: {
        timePerQuestion: 10,    // Default seconds per question
        urgentThreshold: 3,     // Time when countdown turns orange
        criticalThreshold: 2,   // Time when countdown turns red
        feedbackDelay: 500,     // Delay after answer feedback (ms)
        outroDelay: 2000        // How long victory/defeat shows (ms)
    },

    // =========================================
    // BATTLE
    // =========================================

    battle: {
        player: {
            hp: 100,
            maxHP: 100,
            attack: 15,
            defense: 5
        },
        timing: {
            enemyDelay: 1000,   // Delay before enemy attacks (ms)
            turnDelay: 800,     // Delay between turns (ms)
            defendDelay: 500,   // Delay after defending (ms)
            victoryDelay: 1000, // Delay before victory screen (ms)
            defeatDelay: 1000,  // Delay before defeat screen (ms)
            outroDelay: 2000,   // How long victory/defeat shows (ms)
            damageDisplay: 1000,// How long damage numbers show (ms)
            hitFlash: 300       // Hit flash animation duration (ms)
        }
    }
};

/**
 * Get nested tuning value with fallback
 * @param {string} path - Dot-separated path like 'text.speed.normal'
 * @param {*} fallback - Default value if path not found
 * @returns {*}
 */
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

/**
 * Register module tuning overrides
 * Module values take priority over core values.
 * @param {string} moduleName - Module identifier
 * @param {Object} overrides - Key-value pairs with dot-path keys
 */
TUNING.register = function(moduleName, overrides) {
    for (var key in overrides) {
        if (!overrides.hasOwnProperty(key)) continue;

        var parts = key.split('.');
        var target = TUNING;

        // Navigate/create nested path
        for (var i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in target)) {
                target[parts[i]] = {};
            }
            target = target[parts[i]];
        }

        // Set the value
        target[parts[parts.length - 1]] = overrides[key];
    }
};

// Global export
window.TUNING = TUNING;
