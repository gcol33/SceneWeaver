/**
 * SceneWeaver - Save Slots Module
 *
 * Provides multi-slot save system with UI.
 * This is an OPTIONAL module - core only has autosave.
 *
 * Usage:
 *   saveSlots.show();           // Show save/load UI
 *   saveSlots.saveToSlot(1);    // Save to slot 1
 *   saveSlots.loadFromSlot(1);  // Load from slot 1
 */

var saveSlots = (function() {
    'use strict';

    var SLOT_PREFIX = 'sw_slot_';
    var MAX_SLOTS = 3;

    var elements = {
        overlay: null,
        panel: null
    };

    var state = {
        isOpen: false,
        mode: 'save'  // 'save' or 'load'
    };

    // ===========================================
    // INITIALIZATION
    // ===========================================

    function init() {
        MAX_SLOTS = TUNING.get('saveSlots.maxSlots', 3);
        createUI();
        console.log('[SaveSlots] Initialized with', MAX_SLOTS, 'slots');
    }

    function createUI() {
        // Create overlay
        elements.overlay = document.createElement('div');
        elements.overlay.id = 'sw-save-overlay';
        elements.overlay.className = 'sw-save-overlay sw-hidden';
        elements.overlay.addEventListener('click', function(e) {
            if (e.target === elements.overlay) {
                hide();
            }
        });

        // Create panel
        elements.panel = document.createElement('div');
        elements.panel.className = 'sw-save-panel';
        elements.panel.innerHTML = buildPanelHTML();

        elements.overlay.appendChild(elements.panel);
        document.body.appendChild(elements.overlay);

        // Add event listeners
        setupEventListeners();
    }

    function buildPanelHTML() {
        return [
            '<div class="sw-save-header">',
            '  <h2 class="sw-save-title">Save/Load</h2>',
            '  <button class="sw-save-close" data-action="close">&times;</button>',
            '</div>',
            '<div class="sw-save-tabs">',
            '  <button class="sw-save-tab sw-active" data-mode="save">Save</button>',
            '  <button class="sw-save-tab" data-mode="load">Load</button>',
            '</div>',
            '<div class="sw-save-slots"></div>'
        ].join('\n');
    }

    function setupEventListeners() {
        // Close button
        elements.panel.querySelector('[data-action="close"]').addEventListener('click', hide);

        // Tabs
        var tabs = elements.panel.querySelectorAll('.sw-save-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function() {
                setMode(this.getAttribute('data-mode'));
            });
        }

        // Keyboard
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && state.isOpen) {
                hide();
            }
        });
    }

    // ===========================================
    // UI MANAGEMENT
    // ===========================================

    function show(mode) {
        state.mode = mode || 'save';
        state.isOpen = true;
        elements.overlay.classList.remove('sw-hidden');
        updateTabs();
        renderSlots();
        eventBus.emit(Events.UI_OPENED, { panel: 'saveSlots', mode: state.mode });
    }

    function hide() {
        state.isOpen = false;
        elements.overlay.classList.add('sw-hidden');
        eventBus.emit(Events.UI_CLOSED, { panel: 'saveSlots' });
    }

    function setMode(mode) {
        state.mode = mode;
        updateTabs();
        renderSlots();
    }

    function updateTabs() {
        var tabs = elements.panel.querySelectorAll('.sw-save-tab');
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            if (tab.getAttribute('data-mode') === state.mode) {
                tab.classList.add('sw-active');
            } else {
                tab.classList.remove('sw-active');
            }
        }
    }

    function renderSlots() {
        var container = elements.panel.querySelector('.sw-save-slots');
        container.innerHTML = '';

        for (var i = 1; i <= MAX_SLOTS; i++) {
            var slot = createSlotElement(i);
            container.appendChild(slot);
        }
    }

    function createSlotElement(slotNum) {
        var data = getSlotData(slotNum);
        var isEmpty = !data;

        var div = document.createElement('div');
        div.className = 'sw-save-slot' + (isEmpty ? ' sw-empty' : '');
        div.setAttribute('data-slot', slotNum);

        if (isEmpty) {
            div.innerHTML = [
                '<div class="sw-slot-number">Slot ' + slotNum + '</div>',
                '<div class="sw-slot-empty">Empty</div>'
            ].join('');
        } else {
            var date = new Date(data.timestamp);
            var dateStr = formatDate(date);

            div.innerHTML = [
                '<div class="sw-slot-number">Slot ' + slotNum + '</div>',
                '<div class="sw-slot-scene">' + (data.sceneName || data.sceneId || 'Unknown') + '</div>',
                '<div class="sw-slot-date">' + dateStr + '</div>'
            ].join('');
        }

        // Click handler
        div.addEventListener('click', function() {
            if (state.mode === 'save') {
                saveToSlot(slotNum);
            } else {
                if (!isEmpty) {
                    loadFromSlot(slotNum);
                }
            }
        });

        return div;
    }

    function formatDate(date) {
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return date.getFullYear() + '-' +
               pad(date.getMonth() + 1) + '-' +
               pad(date.getDate()) + ' ' +
               pad(date.getHours()) + ':' +
               pad(date.getMinutes());
    }

    // ===========================================
    // SAVE/LOAD OPERATIONS
    // ===========================================

    /**
     * Save to a specific slot
     * @param {number} slotNum - Slot number (1-MAX_SLOTS)
     */
    function saveToSlot(slotNum) {
        try {
            var saveData = {
                timestamp: Date.now(),
                sceneId: engine.getCurrentSceneId(),
                sceneName: getSceneName(engine.getCurrentSceneId()),
                blockIndex: engine.getCurrentBlockIndex(),
                store: store.serialize(),
                version: '1.0.0'
            };

            localStorage.setItem(SLOT_PREFIX + slotNum, JSON.stringify(saveData));

            eventBus.emit(Events.SLOT_SAVED, { slot: slotNum, data: saveData });
            console.log('[SaveSlots] Saved to slot', slotNum);

            // Refresh UI
            renderSlots();

            // Show feedback
            showFeedback('Saved to Slot ' + slotNum);

        } catch (e) {
            console.error('[SaveSlots] Save failed:', e);
            showFeedback('Save failed!');
        }
    }

    /**
     * Load from a specific slot
     * @param {number} slotNum - Slot number (1-MAX_SLOTS)
     */
    function loadFromSlot(slotNum) {
        try {
            var data = getSlotData(slotNum);
            if (!data) {
                console.warn('[SaveSlots] Slot', slotNum, 'is empty');
                return false;
            }

            // Restore store state
            if (data.store) {
                store.deserialize(data.store);
            }

            // Load scene
            engine.loadScene(data.sceneId, data.blockIndex);

            eventBus.emit(Events.SLOT_LOADED, { slot: slotNum, data: data });
            console.log('[SaveSlots] Loaded from slot', slotNum);

            // Close panel
            hide();

            return true;

        } catch (e) {
            console.error('[SaveSlots] Load failed:', e);
            showFeedback('Load failed!');
            return false;
        }
    }

    /**
     * Get data from a slot
     * @param {number} slotNum - Slot number
     * @returns {Object|null} Save data or null if empty
     */
    function getSlotData(slotNum) {
        try {
            var raw = localStorage.getItem(SLOT_PREFIX + slotNum);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Delete a slot
     * @param {number} slotNum - Slot number
     */
    function deleteSlot(slotNum) {
        localStorage.removeItem(SLOT_PREFIX + slotNum);
        eventBus.emit(Events.SLOT_DELETED, { slot: slotNum });
        console.log('[SaveSlots] Deleted slot', slotNum);
    }

    /**
     * Check if any slots have data
     */
    function hasAnySave() {
        for (var i = 1; i <= MAX_SLOTS; i++) {
            if (getSlotData(i)) return true;
        }
        return false;
    }

    // ===========================================
    // UTILITIES
    // ===========================================

    function getSceneName(sceneId) {
        if (typeof story !== 'undefined' && story[sceneId]) {
            return story[sceneId].name || sceneId;
        }
        return sceneId;
    }

    function showFeedback(message) {
        // Simple feedback - could be enhanced with animations
        var feedback = document.createElement('div');
        feedback.className = 'sw-save-feedback';
        feedback.textContent = message;
        elements.panel.appendChild(feedback);

        setTimeout(function() {
            feedback.classList.add('sw-fade-out');
            setTimeout(function() {
                feedback.remove();
            }, 300);
        }, 1500);
    }

    // ===========================================
    // EXPORT/IMPORT
    // ===========================================

    /**
     * Export all saves as JSON
     */
    function exportSaves() {
        var exports = {};
        for (var i = 1; i <= MAX_SLOTS; i++) {
            var data = getSlotData(i);
            if (data) {
                exports['slot_' + i] = data;
            }
        }
        return JSON.stringify(exports, null, 2);
    }

    /**
     * Import saves from JSON
     * @param {string} json - Exported save data
     */
    function importSaves(json) {
        try {
            var data = JSON.parse(json);
            for (var key in data) {
                if (key.startsWith('slot_')) {
                    var slotNum = parseInt(key.replace('slot_', ''), 10);
                    if (slotNum >= 1 && slotNum <= MAX_SLOTS) {
                        localStorage.setItem(SLOT_PREFIX + slotNum, JSON.stringify(data[key]));
                    }
                }
            }
            console.log('[SaveSlots] Imported saves');
            renderSlots();
            return true;
        } catch (e) {
            console.error('[SaveSlots] Import failed:', e);
            return false;
        }
    }

    // ===========================================
    // PUBLIC API
    // ===========================================

    return {
        init: init,

        // UI
        show: show,
        hide: hide,
        isOpen: function() { return state.isOpen; },

        // Operations
        saveToSlot: saveToSlot,
        loadFromSlot: loadFromSlot,
        deleteSlot: deleteSlot,
        getSlotData: getSlotData,
        hasAnySave: hasAnySave,

        // Export/Import
        exportSaves: exportSaves,
        importSaves: importSaves
    };
})();

// Register as module
if (typeof SceneWeaver !== 'undefined') {
    SceneWeaver.registerModule({
        name: 'save-slots',
        version: '1.0.0',
        init: function() { saveSlots.init(); }
    });
}

// Global export
window.saveSlots = saveSlots;
