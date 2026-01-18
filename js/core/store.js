/**
 * SceneWeaver - State Store
 *
 * Centralized state management with serialization support.
 *
 * Usage:
 *   store.set('scene.currentId', 'intro');
 *   var id = store.get('scene.currentId');
 *   store.subscribe('scene', function(newState) { ... });
 */

var store = (function() {
    'use strict';

    // Initial state
    var state = {
        scene: {
            currentId: null,
            currentBlockIndex: 0,
            history: []
        },
        flags: {
            regular: [],    // Cleared on Play Again
            key: []         // Persist across Play Again
        },
        meta: {
            readBlocks: [], // Tracks which text has been read
            timestamp: null
        },
        settings: {
            textSpeed: 'normal',
            volume: 0.16
        }
    };

    var subscribers = {};

    /**
     * Get value at path
     * @param {string} path - Dot-separated path
     * @param {*} fallback - Default value
     */
    function get(path, fallback) {
        var parts = path.split('.');
        var value = state;

        for (var i = 0; i < parts.length; i++) {
            if (value && typeof value === 'object' && parts[i] in value) {
                value = value[parts[i]];
            } else {
                return fallback;
            }
        }
        return value;
    }

    /**
     * Set value at path
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     */
    function set(path, value) {
        var parts = path.split('.');
        var target = state;

        // Navigate to parent
        for (var i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in target)) {
                target[parts[i]] = {};
            }
            target = target[parts[i]];
        }

        // Set value
        target[parts[parts.length - 1]] = value;

        // Notify subscribers
        var rootKey = parts[0];
        if (subscribers[rootKey]) {
            for (var j = 0; j < subscribers[rootKey].length; j++) {
                subscribers[rootKey][j](state[rootKey]);
            }
        }

        // Emit state changed event
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(Events.STATE_CHANGED, { path: path, value: value });
        }
    }

    /**
     * Subscribe to changes on a root key
     * @param {string} rootKey - Top-level state key
     * @param {function} callback - Handler
     */
    function subscribe(rootKey, callback) {
        if (!subscribers[rootKey]) {
            subscribers[rootKey] = [];
        }
        subscribers[rootKey].push(callback);
    }

    /**
     * Serialize state for saving
     * @returns {string} JSON string
     */
    function serialize() {
        return JSON.stringify({
            scene: state.scene,
            flags: state.flags,
            meta: {
                readBlocks: state.meta.readBlocks,
                timestamp: Date.now()
            },
            settings: state.settings,
            version: '1.0.0'
        });
    }

    /**
     * Deserialize state from save
     * @param {string} json - JSON string
     */
    function deserialize(json) {
        try {
            var data = JSON.parse(json);

            if (data.scene) state.scene = data.scene;
            if (data.flags) state.flags = data.flags;
            if (data.meta) state.meta = data.meta;
            if (data.settings) state.settings = data.settings;

            // Notify all subscribers
            for (var key in subscribers) {
                if (subscribers.hasOwnProperty(key) && state[key]) {
                    for (var i = 0; i < subscribers[key].length; i++) {
                        subscribers[key][i](state[key]);
                    }
                }
            }

            return true;
        } catch (e) {
            console.error('[Store] Failed to deserialize:', e);
            return false;
        }
    }

    /**
     * Reset state
     * @param {boolean} keepSettings - Preserve user settings
     * @param {boolean} keepKeyFlags - Preserve key flags (Play Again vs Full Reset)
     */
    function reset(keepSettings, keepKeyFlags) {
        var savedSettings = keepSettings ? state.settings : null;
        var savedKeyFlags = keepKeyFlags ? state.flags.key : [];

        state.scene = {
            currentId: null,
            currentBlockIndex: 0,
            history: []
        };

        state.flags = {
            regular: [],
            key: savedKeyFlags
        };

        state.meta = {
            readBlocks: [],
            timestamp: null
        };

        if (savedSettings) {
            state.settings = savedSettings;
        }

        // Emit reset event
        if (typeof eventBus !== 'undefined') {
            eventBus.emit(Events.STATE_RESET, { keepSettings: keepSettings, keepKeyFlags: keepKeyFlags });
        }
    }

    /**
     * Get full state (for debugging)
     */
    function getState() {
        return state;
    }

    return {
        get: get,
        set: set,
        subscribe: subscribe,
        serialize: serialize,
        deserialize: deserialize,
        reset: reset,
        getState: getState
    };
})();

// Global export
window.store = store;
