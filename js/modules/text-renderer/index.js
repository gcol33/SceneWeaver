/**
 * SceneWeaver - Text Renderer Module
 *
 * Handles text display in two modes:
 * - Block Mode: Story/dialogue with Continue button
 * - Log Mode: Battle/system messages with shift-up
 *
 * Usage:
 *   textRenderer.showBlock(text, callback);
 *   textRenderer.showLog(message);
 */

var textRenderer = (function() {
    'use strict';

    var elements = {
        textBox: null,
        textContent: null
    };

    var state = {
        mode: 'block',          // 'block' or 'log'
        isTyping: false,
        typewriterTimer: null,
        currentText: '',
        onComplete: null,
        logRows: []             // For log mode
    };

    var config = {
        lines: 4,
        logSlots: 2,
        typewriterSpeed: 18
    };

    // ===========================================
    // INITIALIZATION
    // ===========================================

    function init(cfg) {
        elements.textBox = document.getElementById('sw-text-box');
        elements.textContent = document.getElementById('sw-text-content');

        if (cfg) {
            if (cfg.lines) config.lines = cfg.lines;
            if (cfg.logSlots) config.logSlots = cfg.logSlots;
        }

        // Load from TUNING
        config.lines = TUNING.get('text.lines', 4);
        config.logSlots = TUNING.get('log.slots', 2);
        config.typewriterSpeed = TUNING.get('text.speed.normal', 18);

        console.log('[TextRenderer] Initialized');
    }

    // ===========================================
    // TYPEWRITER CORE
    // ===========================================

    /**
     * Core typewriter function - shared by block and log modes
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text to type
     * @param {number} speed - Ms per character
     * @param {function} onComplete - Called when done
     */
    function typewriterCore(element, text, speed, onComplete) {
        var index = 0;
        state.isTyping = true;
        element.innerHTML = '';

        function type() {
            if (index < text.length) {
                // Handle HTML tags as atomic units
                if (text[index] === '<') {
                    var tagEnd = text.indexOf('>', index);
                    if (tagEnd > index) {
                        element.innerHTML += text.substring(index, tagEnd + 1);
                        index = tagEnd + 1;
                        state.typewriterTimer = setTimeout(type, 0);
                        return;
                    }
                }

                // Handle newlines
                if (text[index] === '\n') {
                    element.innerHTML += '<br>';
                } else {
                    element.innerHTML += text[index];
                }

                index++;
                state.typewriterTimer = setTimeout(type, speed);
            } else {
                state.isTyping = false;
                if (onComplete) onComplete();
            }
        }

        type();
    }

    // ===========================================
    // BLOCK MODE (Story/Dialogue)
    // ===========================================

    function showBlock(text, callback) {
        if (state.mode !== 'block') {
            setMode('block');
        }

        state.currentText = text;
        state.onComplete = callback || null;

        elements.textContent.classList.remove('sw-typing-complete');
        eventBus.emit(Events.TEXT_START, { text: text });

        typewriterCore(elements.textContent, text, config.typewriterSpeed, finishTypewriter);
    }

    function skipTypewriter() {
        if (!state.isTyping) return;

        clearTimeout(state.typewriterTimer);
        elements.textContent.innerHTML = state.currentText.replace(/\n/g, '<br>');
        finishTypewriter();

        eventBus.emit(Events.TEXT_SKIP, {});
    }

    function finishTypewriter() {
        state.isTyping = false;
        state.typewriterTimer = null;
        elements.textContent.classList.add('sw-typing-complete');

        eventBus.emit(Events.TEXT_COMPLETE, {});

        if (state.onComplete) {
            state.onComplete();
        }
    }

    // ===========================================
    // LOG MODE (Battle/System Messages)
    // ===========================================

    /**
     * Show a log message (shifts up older messages)
     * @param {string} message - Message to display
     * @param {function} callback - Called when message is fully displayed
     */
    function showLog(message, callback) {
        if (state.mode !== 'log') {
            setMode('log');
        }

        // Shift existing rows up
        shiftLogRows();

        // Add new message to bottom row
        var bottomRow = getBottomRow();
        typewriterLogRow(bottomRow, message, callback);
    }

    function setMode(mode) {
        state.mode = mode;

        if (mode === 'log') {
            elements.textBox.classList.add('sw-log-mode');
            setupLogRows();
        } else {
            elements.textBox.classList.remove('sw-log-mode');
            elements.textContent.innerHTML = '';
            state.logRows = [];
        }
    }

    function setupLogRows() {
        elements.textContent.innerHTML = '';
        state.logRows = [];

        for (var i = 0; i < config.logSlots; i++) {
            var row = document.createElement('div');
            row.className = 'sw-log-row sw-log-row--' + (i + 1);
            row.id = 'sw-log-row-' + (i + 1);
            elements.textContent.appendChild(row);
            state.logRows.push(row);
        }
    }

    function shiftLogRows() {
        if (state.logRows.length < 2) return;

        // Move content from row 2 to row 1 (shift up)
        var row1 = state.logRows[0];
        var row2 = state.logRows[1];

        row1.innerHTML = row2.innerHTML;
        row2.innerHTML = '';

        // Update opacity classes
        row1.style.opacity = TUNING.get('log.row1Opacity', 0.7);
        row2.style.opacity = TUNING.get('log.row2Opacity', 1.0);
    }

    function getBottomRow() {
        return state.logRows[state.logRows.length - 1];
    }

    function typewriterLogRow(row, text, callback) {
        typewriterCore(row, text, config.typewriterSpeed, callback);
    }

    /**
     * Clear the log
     */
    function clearLog() {
        for (var i = 0; i < state.logRows.length; i++) {
            state.logRows[i].innerHTML = '';
        }
    }

    // ===========================================
    // UTILITIES
    // ===========================================

    function clear() {
        clearTimeout(state.typewriterTimer);
        state.isTyping = false;
        state.currentText = '';
        elements.textContent.innerHTML = '';
        elements.textContent.classList.add('sw-typing-complete');
    }

    function setSpeed(speed) {
        if (speed === 'normal') {
            config.typewriterSpeed = TUNING.get('text.speed.normal', 18);
        } else if (speed === 'fast') {
            config.typewriterSpeed = TUNING.get('text.speed.fast', 10);
        } else if (speed === 'instant') {
            config.typewriterSpeed = 0;
        } else if (typeof speed === 'number') {
            config.typewriterSpeed = speed;
        }
    }

    /**
     * Clean up module resources
     */
    function destroy() {
        clearTimeout(state.typewriterTimer);
        state.isTyping = false;
        state.typewriterTimer = null;
        state.currentText = '';
        state.onComplete = null;
        state.logRows = [];

        if (elements.textContent) {
            elements.textContent.innerHTML = '';
        }

        elements.textBox = null;
        elements.textContent = null;
    }

    // ===========================================
    // PUBLIC API
    // ===========================================

    return {
        init: init,
        destroy: destroy,

        // Block mode
        showBlock: showBlock,
        skipTypewriter: skipTypewriter,

        // Log mode
        showLog: showLog,
        clearLog: clearLog,
        setMode: setMode,

        // Utilities
        clear: clear,
        setSpeed: setSpeed,
        isTyping: function() { return state.isTyping; },
        getMode: function() { return state.mode; }
    };
})();

// Register as module
if (typeof SceneWeaver !== 'undefined') {
    SceneWeaver.registerModule({
        name: 'text-renderer',
        version: '1.0.0',
        init: function() { textRenderer.init(); }
    });
}

// Global export
window.textRenderer = textRenderer;
