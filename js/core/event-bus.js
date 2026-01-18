/**
 * SceneWeaver - Event Bus
 *
 * Simple pub/sub system for decoupled communication.
 *
 * Usage:
 *   eventBus.on('scene:loaded', function(data) { ... });
 *   eventBus.emit('scene:loaded', { sceneId: 'intro' });
 *   eventBus.off('scene:loaded', handler);
 */

var eventBus = (function() {
    'use strict';

    var listeners = {};

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Handler function
     */
    function on(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {function} callback - Handler to remove
     */
    function off(event, callback) {
        if (!listeners[event]) return;

        var index = listeners[event].indexOf(callback);
        if (index > -1) {
            listeners[event].splice(index, 1);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to handlers
     */
    function emit(event, data) {
        if (!listeners[event]) return;

        for (var i = 0; i < listeners[event].length; i++) {
            try {
                listeners[event][i](data);
            } catch (e) {
                console.error('[EventBus] Error in handler for ' + event + ':', e);
            }
        }
    }

    /**
     * Subscribe to an event, but only fire once
     * @param {string} event - Event name
     * @param {function} callback - Handler function
     */
    function once(event, callback) {
        function wrapper(data) {
            off(event, wrapper);
            callback(data);
        }
        on(event, wrapper);
    }

    /**
     * Remove all listeners for an event (or all events)
     * @param {string} [event] - Event name (optional)
     */
    function clear(event) {
        if (event) {
            delete listeners[event];
        } else {
            listeners = {};
        }
    }

    return {
        on: on,
        off: off,
        emit: emit,
        once: once,
        clear: clear
    };
})();

// Event name constants
var Events = {
    // Scene events
    SCENE_LOADING: 'scene:loading',
    SCENE_LOADED: 'scene:loaded',
    SCENE_ERROR: 'scene:error',

    // Text events
    TEXT_START: 'text:start',
    TEXT_COMPLETE: 'text:complete',
    TEXT_SKIP: 'text:skip',

    // Choice events
    CHOICE_SHOWN: 'choice:shown',
    CHOICE_SELECTED: 'choice:selected',

    // State events
    STATE_CHANGED: 'state:changed',
    STATE_SAVED: 'state:saved',
    STATE_LOADED: 'state:loaded',
    STATE_RESET: 'state:reset',

    // Flag events
    FLAG_SET: 'flag:set',
    FLAG_CLEARED: 'flag:cleared',

    // Audio events
    MUSIC_CHANGED: 'music:changed',
    SFX_PLAYED: 'sfx:played',

    // UI events
    UI_OPENED: 'ui:opened',
    UI_CLOSED: 'ui:closed',

    // Save slots events
    SLOT_SAVED: 'slot:saved',
    SLOT_LOADED: 'slot:loaded',
    SLOT_DELETED: 'slot:deleted',

    // Battle events
    BATTLE_START: 'battle:start',
    BATTLE_END: 'battle:end',
    BATTLE_CANCELLED: 'battle:cancelled',
    BATTLE_PLAYER_TURN: 'battle:playerTurn',
    BATTLE_ENEMY_TURN: 'battle:enemyTurn',
    BATTLE_DAMAGE: 'battle:damage',
    BATTLE_PLAYER_DEFEND: 'battle:playerDefend',
    BATTLE_COUNTER: 'battle:counter',

    // QTE events
    QTE_START: 'qte:start',
    QTE_INPUT: 'qte:input',
    QTE_RESULT: 'qte:result',
    QTE_CANCEL: 'qte:cancel',

    // Quiz events
    QUIZ_START: 'quiz:start',
    QUIZ_ANSWER: 'quiz:answer',
    QUIZ_END: 'quiz:end',
    QUIZ_CANCEL: 'quiz:cancel'
};

// Global exports
window.eventBus = eventBus;
window.Events = Events;
