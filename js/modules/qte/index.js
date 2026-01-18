/**
 * SceneWeaver - QTE Module
 *
 * Quick-Time Event system for timing-based interactions.
 * Used for combat, minigames, and skill checks.
 *
 * Features:
 *   - Sliding marker timing bar
 *   - Zone-based results: Perfect / Good / Normal / Bad
 *   - Countdown timer with auto-commit
 *   - Skill QTE (attack) and Defend QTE (defense)
 *
 * Usage:
 *   qteEngine.startSkillQTE({ skillName: 'Attack' }, callback);
 *   qteEngine.startDefendQTE({ enemyAttackName: 'Fireball' }, callback);
 */

var qteEngine = (function() {
    'use strict';

    // === Configuration ===
    var config = {
        bar: {
            duration: 2000,
            oscillations: 2
        },
        zones: {
            perfect: 10,
            good: 25,
            normal: 40
        },
        timing: {
            startDelay: 300,
            resultDisplay: 800,
            countdownDuration: 5
        }
    };

    // === State ===
    var state = {
        active: false,
        type: null,
        phase: 'idle',
        markerPosition: 0,
        targetPosition: 50,
        zoneScale: 1.0,
        startTime: 0,
        result: null,
        callback: null,
        animationFrame: null,
        countdown: {
            remaining: 0,
            timerId: null
        }
    };

    // === Initialization ===

    function init() {
        // Load from TUNING if available
        config.bar.duration = TUNING.get('qte.bar.duration', 2000);
        config.zones.perfect = TUNING.get('qte.zones.perfect', 10);
        config.zones.good = TUNING.get('qte.zones.good', 25);
        config.zones.normal = TUNING.get('qte.zones.normal', 40);
        config.timing.countdownDuration = TUNING.get('qte.timing.countdownDuration', 5);

        bindInputs();
        console.log('[QTEEngine] Initialized');
    }

    // === Zone Calculation ===

    function getZoneForPosition(position) {
        var distanceFromTarget = Math.abs(position - state.targetPosition);
        var scale = state.zoneScale || 1;

        var perfectZone = config.zones.perfect * scale;
        var goodZone = config.zones.good * scale;
        var normalZone = config.zones.normal * scale;

        if (distanceFromTarget <= perfectZone) {
            return 'perfect';
        } else if (distanceFromTarget <= goodZone) {
            return 'good';
        } else if (distanceFromTarget <= normalZone) {
            return 'normal';
        } else {
            return 'bad';
        }
    }

    // === Marker Animation ===

    function updateMarkerPosition() {
        if (!state.active || state.phase !== 'running') return;

        var elapsed = performance.now() - state.startTime;
        var cycleTime = config.bar.duration / config.bar.oscillations;
        var phase = (elapsed / cycleTime) * Math.PI;

        state.markerPosition = 50 + (Math.sin(phase) * 50);
        state.markerPosition = Math.max(0, Math.min(100, state.markerPosition));

        // Update UI
        if (typeof qteUI !== 'undefined') {
            qteUI.updateMarker(state.markerPosition);
        }

        if (state.active && state.phase === 'running') {
            state.animationFrame = requestAnimationFrame(updateMarkerPosition);
        }
    }

    // === Input Handling ===

    function handleInput() {
        if (!state.active || state.phase !== 'running') return;

        state.phase = 'input';
        stopCountdown();

        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
            state.animationFrame = null;
        }

        state.result = getZoneForPosition(state.markerPosition);

        if (typeof qteUI !== 'undefined') {
            qteUI.showResult(state.result, state.markerPosition, state.type);
        }

        setTimeout(function() {
            completeQTE();
        }, config.timing.resultDisplay);
    }

    function handleTimeout() {
        if (!state.active || state.phase !== 'running') return;

        state.phase = 'timeout';

        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
            state.animationFrame = null;
        }

        // Auto-commit at current position
        state.result = getZoneForPosition(state.markerPosition);

        if (typeof qteUI !== 'undefined') {
            qteUI.showResult(state.result, state.markerPosition, state.type);
        }

        setTimeout(function() {
            completeQTE();
        }, config.timing.resultDisplay);
    }

    // === Countdown ===

    function startCountdown(seconds) {
        state.countdown.remaining = seconds;

        if (typeof qteUI !== 'undefined') {
            qteUI.updateCountdown(state.countdown.remaining);
        }

        state.countdown.timerId = setInterval(function() {
            state.countdown.remaining--;

            if (typeof qteUI !== 'undefined') {
                qteUI.updateCountdown(state.countdown.remaining);
            }

            if (state.countdown.remaining <= 0) {
                stopCountdown();
                if (state.phase === 'running') {
                    handleTimeout();
                }
            }
        }, 1000);
    }

    function stopCountdown() {
        if (state.countdown.timerId) {
            clearInterval(state.countdown.timerId);
            state.countdown.timerId = null;
        }
        state.countdown.remaining = 0;
    }

    // === QTE Completion ===

    function completeQTE() {
        var modifiers = getModifiers(state.type, state.result);

        var result = {
            type: state.type,
            zone: state.result,
            position: state.markerPosition,
            modifiers: modifiers
        };

        if (typeof qteUI !== 'undefined') {
            qteUI.hide();
        }

        var callback = state.callback;
        resetState();

        if (callback) {
            callback(result);
        }

        eventBus.emit('qte:complete', result);
    }

    function getModifiers(type, zone) {
        var skillMods = {
            perfect: { advantage: true, bonusDamage: 0.25 },
            good: { advantage: true, bonusDamage: 0 },
            normal: { advantage: false, bonusDamage: 0 },
            bad: { disadvantage: true, bonusDamage: -0.25 }
        };

        var defendMods = {
            perfect: { result: 'parry', damageReduction: 1.0, counterAttack: true },
            good: { result: 'dodge', damageReduction: 1.0, counterAttack: false },
            normal: { result: 'block', damageReduction: 0.5, counterAttack: false },
            bad: { result: 'hit', damageReduction: 0, counterAttack: false }
        };

        if (type === 'skill') {
            return skillMods[zone] || skillMods.normal;
        } else if (type === 'defend') {
            return defendMods[zone] || defendMods.normal;
        }

        return {};
    }

    function resetState() {
        if (state.animationFrame) {
            cancelAnimationFrame(state.animationFrame);
        }
        stopCountdown();

        state.active = false;
        state.type = null;
        state.phase = 'idle';
        state.markerPosition = 0;
        state.targetPosition = 50;
        state.zoneScale = 1.0;
        state.result = null;
        state.callback = null;
        state.animationFrame = null;
    }

    // === Public QTE Starters ===

    function startSkillQTE(params, callback) {
        if (state.active) {
            console.warn('[QTE] Already active');
            return false;
        }

        params = params || {};
        state.active = true;
        state.type = 'skill';
        state.phase = 'waiting';
        state.callback = callback;
        state.zoneScale = 1.0;

        // Random target position (10-90%)
        state.targetPosition = 10 + Math.random() * 80;

        if (typeof qteUI !== 'undefined') {
            qteUI.show('skill', {
                label: (params.skillName || 'SKILL') + '!',
                zones: config.zones,
                targetPosition: state.targetPosition
            });
        }

        setTimeout(function() {
            state.phase = 'running';
            state.startTime = performance.now();
            state.markerPosition = 0;
            state.animationFrame = requestAnimationFrame(updateMarkerPosition);
            startCountdown(config.timing.countdownDuration);
        }, config.timing.startDelay);

        eventBus.emit('qte:start', { type: 'skill' });
        return true;
    }

    function startDefendQTE(params, callback) {
        if (state.active) {
            console.warn('[QTE] Already active');
            return false;
        }

        params = params || {};
        state.active = true;
        state.type = 'defend';
        state.phase = 'waiting';
        state.callback = callback;
        state.zoneScale = 0.7; // Tighter zones for defense

        state.targetPosition = 10 + Math.random() * 80;

        if (typeof qteUI !== 'undefined') {
            qteUI.show('defend', {
                label: 'DEFEND!',
                subLabel: params.enemyAttackName || '',
                zones: {
                    perfect: config.zones.perfect * state.zoneScale,
                    good: config.zones.good * state.zoneScale,
                    normal: config.zones.normal * state.zoneScale
                },
                targetPosition: state.targetPosition
            });
        }

        setTimeout(function() {
            state.phase = 'running';
            state.startTime = performance.now();
            state.markerPosition = 0;
            state.animationFrame = requestAnimationFrame(updateMarkerPosition);
            startCountdown(config.timing.countdownDuration);
        }, config.timing.startDelay * 0.5);

        eventBus.emit('qte:start', { type: 'defend' });
        return true;
    }

    function cancel() {
        if (!state.active) return;

        if (typeof qteUI !== 'undefined') {
            qteUI.hide();
        }

        resetState();
        eventBus.emit('qte:cancelled', {});
    }

    // === Input Binding ===

    var inputsBound = false;

    function bindInputs() {
        if (inputsBound) return;
        inputsBound = true;

        document.addEventListener('keydown', function(e) {
            if (!state.active || state.phase !== 'running') return;
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                handleInput();
            }
        });

        document.addEventListener('click', function(e) {
            if (!state.active || state.phase !== 'running') return;
            var container = document.getElementById('sw-container');
            if (container && container.contains(e.target)) {
                if (e.target.tagName === 'BUTTON') return;
                e.preventDefault();
                handleInput();
            }
        });

        document.addEventListener('touchstart', function(e) {
            if (!state.active || state.phase !== 'running') return;
            var container = document.getElementById('sw-container');
            if (container && container.contains(e.target)) {
                if (e.target.tagName === 'BUTTON') return;
                e.preventDefault();
                handleInput();
            }
        }, { passive: false });
    }

    // === Public API ===

    return {
        init: init,
        startSkillQTE: startSkillQTE,
        startDefendQTE: startDefendQTE,
        cancel: cancel,
        isActive: function() { return state.active; },
        getPhase: function() { return state.phase; },
        getConfig: function() { return config; }
    };
})();

// Register as module
if (typeof SceneWeaver !== 'undefined') {
    SceneWeaver.registerModule({
        name: 'qte',
        version: '1.0.0',
        init: function() { qteEngine.init(); }
    });
}

window.qteEngine = qteEngine;
