/**
 * SceneWeaver - Battle UI Module
 *
 * Handles all battle UI rendering.
 */

var battleUI = (function() {
    'use strict';

    var elements = {
        container: null,
        battleOverlay: null,
        playerStats: null,
        enemyStats: null,
        actionPanel: null,
        messageArea: null
    };

    var uiState = {
        visible: false
    };

    function init(container) {
        elements.container = container || document.getElementById('sw-container');
    }

    // === Show Battle UI ===

    function show(state) {
        if (uiState.visible) {
            hide();
        }

        if (!elements.container) {
            elements.container = document.getElementById('sw-container');
        }

        var overlay = document.createElement('div');
        overlay.className = 'sw-battle-overlay';
        overlay.id = 'sw-battle-overlay';

        // Enemy section
        var enemySection = document.createElement('div');
        enemySection.className = 'sw-battle-enemy';
        enemySection.innerHTML = [
            '<div class="sw-battle-enemy-name">' + state.enemy.name + '</div>',
            '<div class="sw-battle-hp-bar">',
            '  <div class="sw-battle-hp-fill sw-battle-hp-enemy" style="width: 100%"></div>',
            '</div>',
            '<div class="sw-battle-hp-text">HP: <span class="sw-enemy-hp">' + state.enemy.hp + '</span>/' + state.enemy.maxHP + '</div>'
        ].join('');

        // Player section
        var playerSection = document.createElement('div');
        playerSection.className = 'sw-battle-player';
        playerSection.innerHTML = [
            '<div class="sw-battle-player-name">Player</div>',
            '<div class="sw-battle-hp-bar">',
            '  <div class="sw-battle-hp-fill sw-battle-hp-player" style="width: 100%"></div>',
            '</div>',
            '<div class="sw-battle-hp-text">HP: <span class="sw-player-hp">' + state.player.hp + '</span>/' + state.player.maxHP + '</div>'
        ].join('');

        // Action panel
        var actionPanel = document.createElement('div');
        actionPanel.className = 'sw-battle-actions';
        actionPanel.style.display = 'none';

        var attackBtn = document.createElement('button');
        attackBtn.className = 'sw-battle-btn sw-battle-btn-attack';
        attackBtn.textContent = 'Attack';
        attackBtn.addEventListener('click', function() {
            if (typeof battleEngine !== 'undefined') {
                battleEngine.playerAttack();
            }
        });

        var defendBtn = document.createElement('button');
        defendBtn.className = 'sw-battle-btn sw-battle-btn-defend';
        defendBtn.textContent = 'Defend';
        defendBtn.addEventListener('click', function() {
            if (typeof battleEngine !== 'undefined') {
                battleEngine.playerDefend();
            }
        });

        actionPanel.appendChild(attackBtn);
        actionPanel.appendChild(defendBtn);

        // Message area
        var messageArea = document.createElement('div');
        messageArea.className = 'sw-battle-message';

        // Assemble
        overlay.appendChild(enemySection);
        overlay.appendChild(playerSection);
        overlay.appendChild(actionPanel);
        overlay.appendChild(messageArea);

        elements.battleOverlay = overlay;
        elements.enemyStats = enemySection;
        elements.playerStats = playerSection;
        elements.actionPanel = actionPanel;
        elements.messageArea = messageArea;

        elements.container.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.classList.add('sw-battle-visible');
        });

        uiState.visible = true;
    }

    // === Update Stats ===

    function updateStats(state) {
        if (!elements.battleOverlay) return;

        // Player HP
        var playerHpFill = elements.playerStats.querySelector('.sw-battle-hp-fill');
        var playerHpText = elements.playerStats.querySelector('.sw-player-hp');
        if (playerHpFill) {
            playerHpFill.style.width = (state.player.hp / state.player.maxHP * 100) + '%';
        }
        if (playerHpText) {
            playerHpText.textContent = state.player.hp;
        }

        // Enemy HP
        var enemyHpFill = elements.enemyStats.querySelector('.sw-battle-hp-fill');
        var enemyHpText = elements.enemyStats.querySelector('.sw-enemy-hp');
        if (enemyHpFill) {
            enemyHpFill.style.width = (state.enemy.hp / state.enemy.maxHP * 100) + '%';
        }
        if (enemyHpText) {
            enemyHpText.textContent = state.enemy.hp;
        }
    }

    // === Show Actions ===

    function showPlayerActions() {
        if (elements.actionPanel) {
            elements.actionPanel.style.display = 'flex';
            var buttons = elements.actionPanel.querySelectorAll('button');
            buttons.forEach(function(btn) { btn.disabled = false; });
        }
        showMessage('Your turn!');
    }

    function showEnemyTurn() {
        if (elements.actionPanel) {
            elements.actionPanel.style.display = 'none';
        }
        showMessage(battleEngine.getState().enemy.name + ' is attacking...');
    }

    // === Show Damage ===

    function showDamage(target, amount, zone) {
        if (elements.actionPanel) {
            elements.actionPanel.style.display = 'none';
        }

        var targetEl = target === 'player' ? elements.playerStats : elements.enemyStats;
        if (!targetEl) return;

        // Create floating damage number
        var dmgEl = document.createElement('div');
        dmgEl.className = 'sw-battle-damage sw-battle-damage-' + zone;
        dmgEl.textContent = '-' + amount;
        targetEl.appendChild(dmgEl);

        // Remove after animation
        setTimeout(function() {
            if (dmgEl.parentNode) {
                dmgEl.parentNode.removeChild(dmgEl);
            }
        }, 1000);

        // Flash effect
        targetEl.classList.add('sw-battle-hit');
        setTimeout(function() {
            targetEl.classList.remove('sw-battle-hit');
        }, 300);
    }

    // === Show Message ===

    function showMessage(text) {
        if (!elements.messageArea) return;
        elements.messageArea.textContent = text;
        elements.messageArea.classList.remove('sw-battle-message-appear');
        void elements.messageArea.offsetWidth;
        elements.messageArea.classList.add('sw-battle-message-appear');
    }

    // === Show Outro ===

    function showOutro(won, callback) {
        if (elements.actionPanel) {
            elements.actionPanel.style.display = 'none';
        }

        var outroOverlay = document.createElement('div');
        outroOverlay.className = 'sw-battle-outro ' + (won ? 'sw-battle-victory' : 'sw-battle-defeat');
        outroOverlay.id = 'sw-battle-outro';

        var text = document.createElement('div');
        text.className = 'sw-battle-outro-text';
        text.textContent = won ? 'VICTORY!' : 'DEFEAT';
        outroOverlay.appendChild(text);

        if (elements.battleOverlay) {
            elements.battleOverlay.appendChild(outroOverlay);
        }

        setTimeout(function() {
            if (callback) callback();
        }, TUNING.get('battle.timing.outroDelay', 2000));
    }

    // === Hide ===

    function hide() {
        if (elements.battleOverlay && elements.battleOverlay.parentNode) {
            elements.battleOverlay.parentNode.removeChild(elements.battleOverlay);
        }

        elements.battleOverlay = null;
        elements.playerStats = null;
        elements.enemyStats = null;
        elements.actionPanel = null;
        elements.messageArea = null;

        uiState.visible = false;
    }

    // === Public API ===

    return {
        init: init,
        show: show,
        hide: hide,
        updateStats: updateStats,
        showPlayerActions: showPlayerActions,
        showEnemyTurn: showEnemyTurn,
        showDamage: showDamage,
        showMessage: showMessage,
        showOutro: showOutro,
        isVisible: function() { return uiState.visible; }
    };
})();

window.battleUI = battleUI;
