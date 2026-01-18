/**
 * SceneWeaver - Save Manager
 *
 * Handles autosave functionality. Uses localStorage.
 *
 * Usage:
 *   saveManager.save();      // Save to slot 0
 *   saveManager.load();      // Load from slot 0
 *   saveManager.hasSave();   // Check if save exists
 */

var saveManager = (function() {
    'use strict';

    var SAVE_KEY = 'sw_save';
    var SETTINGS_KEY = 'sw_settings';
    var READ_BLOCKS_KEY = 'sw_read_blocks';

    var autoSaveTimer = null;
    var autoSaveEnabled = true;

    function init() {
        // Load settings
        loadSettings();

        // Load read blocks
        loadReadBlocks();

        // Start autosave
        if (autoSaveEnabled) {
            startAutoSave();
        }

        console.log('[SaveManager] Initialized');
    }

    /**
     * Save game state to slot 0
     */
    function save() {
        try {
            var data = store.serialize();
            localStorage.setItem(SAVE_KEY, data);

            // Save settings separately
            saveSettings();

            // Save read blocks
            saveReadBlocks();

            eventBus.emit(Events.STATE_SAVED, {});
            console.log('[SaveManager] Saved');

        } catch (e) {
            console.error('[SaveManager] Save failed:', e);
        }
    }

    /**
     * Load game state from slot 0
     * @returns {boolean} Success
     */
    function load() {
        try {
            var data = localStorage.getItem(SAVE_KEY);
            if (!data) {
                console.log('[SaveManager] No save found');
                return false;
            }

            var success = store.deserialize(data);
            if (success) {
                eventBus.emit(Events.STATE_LOADED, {});
                console.log('[SaveManager] Loaded');
            }
            return success;

        } catch (e) {
            console.error('[SaveManager] Load failed:', e);
            return false;
        }
    }

    /**
     * Check if save exists
     */
    function hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    /**
     * Clear save
     */
    function clear() {
        localStorage.removeItem(SAVE_KEY);
        console.log('[SaveManager] Save cleared');
    }

    /**
     * Start autosave timer
     */
    function startAutoSave() {
        if (autoSaveTimer) return;

        var interval = TUNING.get('save.autoSaveInterval', 30000);
        autoSaveTimer = setInterval(function() {
            save();
        }, interval);

        console.log('[SaveManager] Autosave started (interval:', interval, 'ms)');
    }

    /**
     * Stop autosave timer
     */
    function stopAutoSave() {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
            console.log('[SaveManager] Autosave stopped');
        }
    }

    /**
     * Save settings
     */
    function saveSettings() {
        try {
            var settings = store.get('settings', {});
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('[SaveManager] Settings save failed:', e);
        }
    }

    /**
     * Load settings
     */
    function loadSettings() {
        try {
            var data = localStorage.getItem(SETTINGS_KEY);
            if (data) {
                var settings = JSON.parse(data);
                store.set('settings', settings);
            }
        } catch (e) {
            console.error('[SaveManager] Settings load failed:', e);
        }
    }

    /**
     * Save read blocks
     */
    function saveReadBlocks() {
        try {
            var readBlocks = store.get('meta.readBlocks', []);
            localStorage.setItem(READ_BLOCKS_KEY, JSON.stringify(readBlocks));
        } catch (e) {
            console.error('[SaveManager] Read blocks save failed:', e);
        }
    }

    /**
     * Load read blocks
     */
    function loadReadBlocks() {
        try {
            var data = localStorage.getItem(READ_BLOCKS_KEY);
            if (data) {
                var blocks = JSON.parse(data);
                store.set('meta.readBlocks', blocks);
            }
        } catch (e) {
            console.error('[SaveManager] Read blocks load failed:', e);
        }
    }

    /**
     * Reset progress (clear all)
     */
    function resetProgress() {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(READ_BLOCKS_KEY);
        store.reset(true, false); // Keep settings, clear key flags
        console.log('[SaveManager] Progress reset');
    }

    return {
        init: init,
        save: save,
        load: load,
        hasSave: hasSave,
        clear: clear,
        startAutoSave: startAutoSave,
        stopAutoSave: stopAutoSave,
        resetProgress: resetProgress
    };
})();

// Global export
window.saveManager = saveManager;
