/**
 * SceneWeaver - QTE UI Module
 *
 * Handles all QTE visual rendering and DOM manipulation.
 * Theme-agnostic - all styling comes from CSS.
 */

var qteUI = (function() {
    'use strict';

    var elements = {
        container: null,
        qteOverlay: null,
        qteBar: null,
        qteMarker: null,
        qteLabel: null,
        qteZones: null,
        qteResult: null,
        qteCountdown: null
    };

    var uiState = {
        visible: false,
        type: null,
        targetPosition: 50,
        zones: null
    };

    // === Initialization ===

    function init(container) {
        elements.container = container || document.getElementById('sw-container');
    }

    // === Show QTE ===

    function show(type, options) {
        if (uiState.visible) {
            hide();
        }

        options = options || {};
        uiState.type = type;
        uiState.targetPosition = options.targetPosition || 50;
        uiState.zones = options.zones || { perfect: 10, good: 25, normal: 40 };

        // Create overlay
        var overlay = document.createElement('div');
        overlay.className = 'sw-qte-overlay sw-qte-' + type;
        overlay.id = 'sw-qte-overlay';

        // Label
        var label = document.createElement('div');
        label.className = 'sw-qte-label';
        label.textContent = options.label || 'TIMING!';

        if (options.subLabel) {
            var sub = document.createElement('div');
            sub.className = 'sw-qte-sublabel';
            sub.textContent = options.subLabel;
            label.appendChild(sub);
        }

        // Bar wrapper
        var barWrapper = document.createElement('div');
        barWrapper.className = 'sw-qte-bar-wrapper';

        // Zones
        var zones = createZones(uiState.zones, uiState.targetPosition);

        // Bar
        var bar = document.createElement('div');
        bar.className = 'sw-qte-bar';

        // Marker
        var marker = document.createElement('div');
        marker.className = 'sw-qte-marker';
        bar.appendChild(marker);

        barWrapper.appendChild(zones);
        barWrapper.appendChild(bar);

        // Countdown
        var countdown = document.createElement('div');
        countdown.className = 'sw-qte-countdown';
        countdown.style.display = 'none';

        // Instructions
        var instructions = document.createElement('div');
        instructions.className = 'sw-qte-instructions';
        instructions.innerHTML = 'Press <span class="sw-qte-key">SPACE</span> or <span class="sw-qte-key">CLICK</span>';

        // Result (hidden)
        var result = document.createElement('div');
        result.className = 'sw-qte-result';
        result.style.display = 'none';

        // Assemble
        overlay.appendChild(label);
        overlay.appendChild(barWrapper);
        overlay.appendChild(countdown);
        overlay.appendChild(instructions);
        overlay.appendChild(result);

        // Cache elements
        elements.qteOverlay = overlay;
        elements.qteBar = bar;
        elements.qteMarker = marker;
        elements.qteLabel = label;
        elements.qteZones = zones;
        elements.qteResult = result;
        elements.qteCountdown = countdown;

        // Add to container
        var container = elements.container || document.getElementById('sw-container');
        if (container) {
            container.appendChild(overlay);
        } else {
            document.body.appendChild(overlay);
        }

        // Animate in
        requestAnimationFrame(function() {
            overlay.classList.add('sw-qte-visible');
        });

        uiState.visible = true;
    }

    function createZones(zones, targetPosition) {
        var container = document.createElement('div');
        container.className = 'sw-qte-zones';
        container.style.position = 'relative';

        // Calculate zone boundaries
        var perfectLeft = Math.max(0, targetPosition - zones.perfect);
        var perfectRight = Math.min(100, targetPosition + zones.perfect);
        var goodLeft = Math.max(0, targetPosition - zones.good);
        var goodRight = Math.min(100, targetPosition + zones.good);
        var normalLeft = Math.max(0, targetPosition - zones.normal);
        var normalRight = Math.min(100, targetPosition + zones.normal);

        // Bad zone (background)
        var badZone = document.createElement('div');
        badZone.className = 'sw-qte-zone sw-qte-zone-bad';
        badZone.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;';

        // Normal zone
        var normalZone = document.createElement('div');
        normalZone.className = 'sw-qte-zone sw-qte-zone-normal';
        normalZone.style.cssText = 'position:absolute;top:0;height:100%;left:' + normalLeft + '%;width:' + (normalRight - normalLeft) + '%;';

        // Good zone
        var goodZone = document.createElement('div');
        goodZone.className = 'sw-qte-zone sw-qte-zone-good';
        goodZone.style.cssText = 'position:absolute;top:0;height:100%;left:' + goodLeft + '%;width:' + (goodRight - goodLeft) + '%;';

        // Perfect zone
        var perfectZone = document.createElement('div');
        perfectZone.className = 'sw-qte-zone sw-qte-zone-perfect';
        perfectZone.style.cssText = 'position:absolute;top:0;height:100%;left:' + perfectLeft + '%;width:' + (perfectRight - perfectLeft) + '%;';

        container.appendChild(badZone);
        container.appendChild(normalZone);
        container.appendChild(goodZone);
        container.appendChild(perfectZone);

        return container;
    }

    // === Update Marker ===

    function updateMarker(position) {
        if (!elements.qteMarker) return;
        elements.qteMarker.style.left = position + '%';
    }

    // === Update Countdown ===

    function updateCountdown(value) {
        if (!elements.qteCountdown) return;

        elements.qteCountdown.style.display = 'block';
        elements.qteCountdown.textContent = value;

        elements.qteCountdown.classList.remove('sw-qte-countdown-urgent', 'sw-qte-countdown-critical', 'sw-qte-countdown-pulse');

        if (value <= 1) {
            elements.qteCountdown.classList.add('sw-qte-countdown-critical');
        } else if (value <= 2) {
            elements.qteCountdown.classList.add('sw-qte-countdown-urgent');
        }

        void elements.qteCountdown.offsetWidth;
        elements.qteCountdown.classList.add('sw-qte-countdown-pulse');
    }

    // === Show Result ===

    function showResult(zone, position, qteType) {
        if (!elements.qteResult || !elements.qteMarker) return;

        elements.qteMarker.classList.add('sw-qte-marker-stopped');

        // Hide countdown and instructions
        if (elements.qteCountdown) {
            elements.qteCountdown.style.display = 'none';
        }
        var instructions = elements.qteOverlay.querySelector('.sw-qte-instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }

        // Show result text
        var text = getResultText(zone, qteType);
        elements.qteResult.textContent = text;
        elements.qteResult.className = 'sw-qte-result sw-qte-result-' + zone;
        elements.qteResult.style.display = 'block';

        // Add result class to container
        if (elements.qteOverlay) {
            elements.qteOverlay.classList.add('sw-qte-result-' + zone);
        }
    }

    function getResultText(zone, qteType) {
        if (qteType === 'skill') {
            switch (zone) {
                case 'perfect': return 'PERFECT!';
                case 'good': return 'GOOD!';
                case 'normal': return 'OK';
                case 'bad': return 'BAD...';
                default: return zone.toUpperCase();
            }
        } else if (qteType === 'defend') {
            switch (zone) {
                case 'perfect': return 'PARRY!';
                case 'good': return 'DODGE!';
                case 'normal': return 'BLOCK!';
                case 'bad': return 'HIT!';
                default: return zone.toUpperCase();
            }
        }
        return zone.toUpperCase() + '!';
    }

    // === Hide ===

    function hide() {
        if (!elements.qteOverlay) return;

        elements.qteOverlay.classList.remove('sw-qte-visible');
        elements.qteOverlay.classList.add('sw-qte-hiding');

        setTimeout(function() {
            if (elements.qteOverlay && elements.qteOverlay.parentNode) {
                elements.qteOverlay.parentNode.removeChild(elements.qteOverlay);
            }

            elements.qteOverlay = null;
            elements.qteBar = null;
            elements.qteMarker = null;
            elements.qteLabel = null;
            elements.qteZones = null;
            elements.qteResult = null;
            elements.qteCountdown = null;

            uiState.visible = false;
            uiState.type = null;
        }, 200);
    }

    // === Public API ===

    return {
        init: init,
        show: show,
        hide: hide,
        updateMarker: updateMarker,
        updateCountdown: updateCountdown,
        showResult: showResult,
        isVisible: function() { return uiState.visible; }
    };
})();

window.qteUI = qteUI;
