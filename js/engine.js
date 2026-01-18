/**
 * SceneWeaver - Engine
 *
 * Core visual novel engine. Handles:
 * - Scene loading and transitions
 * - Text display with typewriter effect
 * - Choice rendering and navigation
 * - Flag-based conditional logic
 */

var engine = (function() {
    'use strict';

    // === State ===
    var state = {
        currentSceneId: null,
        currentBlockIndex: 0
    };

    // === DOM Elements ===
    var elements = {
        container: null,
        background: null,
        sprites: null,
        textBox: null,
        textContent: null,
        choices: null,
        continueBtn: null
    };

    // === Configuration ===
    var config = {
        bgPath: 'assets/bg/',
        charPath: 'assets/char/',
        startScene: 'intro'
    };

    // ===========================================
    // INITIALIZATION
    // ===========================================

    function init(cfg) {
        if (cfg) {
            if (cfg.bgPath) config.bgPath = cfg.bgPath;
            if (cfg.charPath) config.charPath = cfg.charPath;
            if (cfg.startScene) config.startScene = cfg.startScene;
        }

        // Get DOM elements
        elements.container = document.getElementById('sw-container');
        elements.background = document.getElementById('sw-background');
        elements.sprites = document.getElementById('sw-sprites');
        elements.textBox = document.getElementById('sw-text-box');
        elements.textContent = document.getElementById('sw-text-content');
        elements.choices = document.getElementById('sw-choices');
        elements.continueBtn = document.getElementById('sw-continue');

        // Setup event listeners
        setupEventListeners();

        // Try to load saved game, or start fresh
        if (saveManager.hasSave()) {
            if (saveManager.load()) {
                var savedScene = store.get('scene.currentId');
                var savedBlock = store.get('scene.currentBlockIndex', 0);
                if (savedScene) {
                    loadScene(savedScene, savedBlock);
                    console.log('[Engine] Resumed from save');
                    return;
                }
            }
        }

        // Start fresh
        loadScene(config.startScene);
        console.log('[Engine] Started fresh');
    }

    function setupEventListeners() {
        // Continue button
        elements.continueBtn.addEventListener('click', function() {
            if (textRenderer.isTyping()) {
                textRenderer.skipTypewriter();
            } else {
                advanceText();
            }
        });

        // Click on text box to skip/advance
        elements.textBox.addEventListener('click', function() {
            if (textRenderer.isTyping()) {
                textRenderer.skipTypewriter();
            }
        });

        // Keyboard
        document.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (textRenderer.isTyping()) {
                    textRenderer.skipTypewriter();
                } else if (!elements.choices.children.length) {
                    advanceText();
                }
            }
        });
    }

    // ===========================================
    // SCENE LOADING
    // ===========================================

    function loadScene(sceneId, startBlock) {
        if (typeof story === 'undefined') {
            console.error('[Engine] story.js not loaded');
            showError('Story not loaded', 'Make sure js/story.js exists');
            return;
        }

        var scene = story[sceneId];
        if (!scene) {
            console.error('[Engine] Scene not found:', sceneId);
            showError('Scene Not Found', 'Could not find scene: "' + sceneId + '"');
            return;
        }

        eventBus.emit(Events.SCENE_LOADING, { sceneId: sceneId });

        // Update state
        state.currentSceneId = sceneId;
        state.currentBlockIndex = startBlock || 0;

        // Add to history
        var history = store.get('scene.history', []);
        if (history[history.length - 1] !== sceneId) {
            history.push(sceneId);
            store.set('scene.history', history);
        }

        // Update store
        store.set('scene.currentId', sceneId);
        store.set('scene.currentBlockIndex', state.currentBlockIndex);

        // Process scene data
        processSceneFlags(scene);
        setBackground(scene.bg);
        setMusic(scene.music);
        setSprites(scene.chars);

        // Clear previous choices
        elements.choices.innerHTML = '';

        // Display text
        showTextBlock(state.currentBlockIndex);

        // Save
        if (TUNING.get('save.autoSaveOnSceneChange', true)) {
            saveManager.save();
        }

        eventBus.emit(Events.SCENE_LOADED, { sceneId: sceneId, scene: scene });
    }

    function processSceneFlags(scene) {
        // Set flags
        if (scene.set_flags) {
            for (var i = 0; i < scene.set_flags.length; i++) {
                flagManager.set(scene.set_flags[i]);
            }
        }

        // Set key flags
        if (scene.set_key_flags) {
            for (var j = 0; j < scene.set_key_flags.length; j++) {
                flagManager.setKey(scene.set_key_flags[j]);
            }
        }

        // Clear flags
        if (scene.clear_flags) {
            for (var k = 0; k < scene.clear_flags.length; k++) {
                flagManager.clear(scene.clear_flags[k]);
            }
        }
    }

    // ===========================================
    // BACKGROUND & SPRITES
    // ===========================================

    function setBackground(bg) {
        if (!bg) {
            elements.background.style.backgroundImage = '';
            return;
        }

        var url = config.bgPath + bg;
        elements.background.style.backgroundImage = 'url("' + url + '")';
    }

    function setMusic(track) {
        audioManager.setMusic(track);
    }

    function setSprites(chars) {
        elements.sprites.innerHTML = '';

        if (!chars || !chars.length) return;

        for (var i = 0; i < chars.length; i++) {
            var char = chars[i];
            var file = typeof char === 'string' ? char : char.file;

            var img = document.createElement('img');
            img.src = config.charPath + file;
            img.className = 'sw-sprite sw-sprite--center sw-entering';
            elements.sprites.appendChild(img);
        }
    }

    // ===========================================
    // TEXT DISPLAY
    // ===========================================

    function showTextBlock(index) {
        var scene = story[state.currentSceneId];
        if (!scene || !scene.textBlocks) return;

        if (index >= scene.textBlocks.length) {
            // No more text blocks, show choices
            showChoices();
            return;
        }

        var text = scene.textBlocks[index];
        state.currentBlockIndex = index;
        store.set('scene.currentBlockIndex', index);

        // Mark as read
        markBlockRead(state.currentSceneId, index);

        // Hide choices while showing text
        elements.choices.innerHTML = '';

        // Show continue button
        elements.continueBtn.classList.remove('sw-hidden');

        // Delegate to textRenderer
        textRenderer.showBlock(text);
    }

    function advanceText() {
        var scene = story[state.currentSceneId];
        if (!scene) return;

        var nextIndex = state.currentBlockIndex + 1;

        if (scene.textBlocks && nextIndex < scene.textBlocks.length) {
            showTextBlock(nextIndex);
        } else {
            // No more text, show choices
            showChoices();
        }
    }

    function markBlockRead(sceneId, blockIndex) {
        var key = sceneId + ':' + blockIndex;
        var readBlocks = store.get('meta.readBlocks', []);
        if (readBlocks.indexOf(key) === -1) {
            readBlocks.push(key);
            store.set('meta.readBlocks', readBlocks);
        }
    }

    // ===========================================
    // CHOICES
    // ===========================================

    function showChoices() {
        var scene = story[state.currentSceneId];
        if (!scene || !scene.choices || !scene.choices.length) {
            // No choices, might be an ending
            elements.continueBtn.classList.add('sw-hidden');
            return;
        }

        // Hide continue button
        elements.continueBtn.classList.add('sw-hidden');

        // Clear and populate
        elements.choices.innerHTML = '';

        for (var i = 0; i < scene.choices.length; i++) {
            var choice = scene.choices[i];
            var btn = createChoiceButton(choice, i);
            elements.choices.appendChild(btn);
        }

        eventBus.emit(Events.CHOICE_SHOWN, { choices: scene.choices });
    }

    function createChoiceButton(choice, index) {
        var btn = document.createElement('button');
        btn.className = 'sw-choice';
        btn.textContent = choice.label;

        // Check requirements
        var meetsRequirements = flagManager.checkRequirements(choice.require_flags);

        if (!meetsRequirements) {
            btn.classList.add('sw-choice--disabled');
            btn.disabled = true;
        } else {
            btn.addEventListener('click', function() {
                selectChoice(choice, index);
            });
        }

        return btn;
    }

    function selectChoice(choice, index) {
        eventBus.emit(Events.CHOICE_SELECTED, { choice: choice, index: index });

        // Set flags from choice
        if (choice.set_flags) {
            for (var i = 0; i < choice.set_flags.length; i++) {
                flagManager.set(choice.set_flags[i]);
            }
        }

        // Navigate to target
        if (choice.target) {
            loadScene(choice.target);
        }
    }

    // ===========================================
    // ERROR HANDLING
    // ===========================================

    function showError(title, message) {
        elements.textContent.innerHTML = '<strong>' + title + '</strong><br><br>' + message;
        elements.textContent.classList.add('sw-typing-complete');
        elements.choices.innerHTML = '';
        elements.continueBtn.classList.add('sw-hidden');
    }

    // ===========================================
    // PUBLIC API
    // ===========================================

    return {
        init: init,
        loadScene: loadScene,
        advanceText: advanceText,

        // Getters
        getCurrentSceneId: function() { return state.currentSceneId; },
        getCurrentBlockIndex: function() { return state.currentBlockIndex; }
    };
})();

// Global export
window.engine = engine;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    SceneWeaver.init();
});
