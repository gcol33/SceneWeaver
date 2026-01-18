/**
 * SceneWeaver - Flag Manager
 *
 * Manages game state flags (regular and persistent key flags).
 *
 * Usage:
 *   flagManager.set('met_hero');
 *   flagManager.has('met_hero');     // true
 *   flagManager.setKey('completed'); // Persists across Play Again
 */

var flagManager = (function() {
    'use strict';

    var flags = new Set();
    var keyFlags = new Set();

    function init() {
        // Load from store if available
        var savedFlags = store.get('flags.regular', []);
        var savedKeyFlags = store.get('flags.key', []);

        flags = new Set(savedFlags);
        keyFlags = new Set(savedKeyFlags);

        console.log('[FlagManager] Initialized with', flags.size, 'flags,', keyFlags.size, 'key flags');
    }

    // === Regular Flags ===

    function set(flag) {
        if (!flag) return;
        flags.add(flag);
        syncToStore();
        eventBus.emit(Events.FLAG_SET, { flag: flag, isKey: false });
    }

    function has(flag) {
        return flags.has(flag);
    }

    function clear(flag) {
        if (!flag) return;
        flags.delete(flag);
        syncToStore();
        eventBus.emit(Events.FLAG_CLEARED, { flag: flag, isKey: false });
    }

    function getAll() {
        return Array.from(flags);
    }

    function clearAll() {
        flags = new Set();
        syncToStore();
    }

    // === Key Flags (Persistent) ===

    function setKey(flag) {
        if (!flag) return;
        keyFlags.add(flag);
        syncToStore();
        eventBus.emit(Events.FLAG_SET, { flag: flag, isKey: true });
    }

    function hasKey(flag) {
        return keyFlags.has(flag);
    }

    function clearKey(flag) {
        if (!flag) return;
        keyFlags.delete(flag);
        syncToStore();
        eventBus.emit(Events.FLAG_CLEARED, { flag: flag, isKey: true });
    }

    function getAllKey() {
        return Array.from(keyFlags);
    }

    function clearAllKey() {
        keyFlags = new Set();
        syncToStore();
    }

    // === Utilities ===

    /**
     * Check if requirements are met
     * @param {Array} requirements - Array of flag names (prefix ! for "must not have")
     */
    function checkRequirements(requirements) {
        if (!requirements || !requirements.length) return true;

        for (var i = 0; i < requirements.length; i++) {
            var req = requirements[i];

            if (req.startsWith('!')) {
                // Must NOT have this flag
                var flagName = req.substring(1);
                if (has(flagName) || hasKey(flagName)) {
                    return false;
                }
            } else {
                // Must have this flag
                if (!has(req) && !hasKey(req)) {
                    return false;
                }
            }
        }

        return true;
    }

    function syncToStore() {
        store.set('flags.regular', Array.from(flags));
        store.set('flags.key', Array.from(keyFlags));
    }

    /**
     * Reset flags (for Play Again)
     * @param {boolean} keepKeyFlags - Whether to preserve key flags
     */
    function reset(keepKeyFlags) {
        flags = new Set();
        if (!keepKeyFlags) {
            keyFlags = new Set();
        }
        syncToStore();
    }

    return {
        init: init,

        // Regular flags
        set: set,
        has: has,
        clear: clear,
        getAll: getAll,
        clearAll: clearAll,

        // Key flags
        setKey: setKey,
        hasKey: hasKey,
        clearKey: clearKey,
        getAllKey: getAllKey,
        clearAllKey: clearAllKey,

        // Utilities
        checkRequirements: checkRequirements,
        reset: reset
    };
})();

// Global export
window.flagManager = flagManager;
