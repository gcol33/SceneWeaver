/**
 * SceneWeaver - Battle Module
 *
 * Turn-based combat system with QTE integration.
 *
 * Features:
 *   - Player vs Enemy combat
 *   - Skill-based attacks with QTE
 *   - Defense with QTE timing
 *   - HP/damage system
 *   - Win/lose conditions
 *
 * Usage:
 *   battleEngine.start({
 *       enemy: { name: 'Goblin', hp: 50, attack: 10 },
 *       winTarget: 'battle_win',
 *       loseTarget: 'battle_lose'
 *   }, onComplete);
 */

var battleEngine = (function() {
    'use strict';

    // === State ===
    var state = {
        active: false,
        turn: 'player',  // 'player' or 'enemy'
        player: {
            hp: 100,
            maxHP: 100,
            attack: 15,
            defense: 5,
            defending: false
        },
        enemy: {
            name: 'Enemy',
            hp: 50,
            maxHP: 50,
            attack: 10,
            defense: 3
        },
        winTarget: null,
        loseTarget: null,
        onComplete: null,
        pendingAction: null
    };

    // === Initialization ===

    function init() {
        console.log('[BattleEngine] Initialized');
    }

    // === Start Battle ===

    function start(config, onComplete) {
        if (state.active) {
            console.warn('[Battle] Already active');
            return;
        }

        config = config || {};

        // Setup player
        state.player = {
            hp: config.playerHP || TUNING.get('battle.player.hp', 100),
            maxHP: config.playerMaxHP || TUNING.get('battle.player.maxHP', 100),
            attack: config.playerAttack || TUNING.get('battle.player.attack', 15),
            defense: config.playerDefense || TUNING.get('battle.player.defense', 5),
            defending: false
        };

        // Setup enemy
        var enemyConfig = config.enemy || {};
        state.enemy = {
            name: enemyConfig.name || 'Enemy',
            hp: enemyConfig.hp || 50,
            maxHP: enemyConfig.hp || 50,
            attack: enemyConfig.attack || 10,
            defense: enemyConfig.defense || 3
        };

        state.winTarget = config.winTarget;
        state.loseTarget = config.loseTarget;
        state.onComplete = onComplete;
        state.turn = 'player';
        state.active = true;

        console.log('[Battle] Starting against', state.enemy.name);

        eventBus.emit('battle:start', {
            player: state.player,
            enemy: state.enemy
        });

        // Show battle UI
        if (typeof battleUI !== 'undefined') {
            battleUI.show(state);
        }

        startPlayerTurn();
    }

    // === Turn Management ===

    function startPlayerTurn() {
        state.turn = 'player';
        state.player.defending = false;

        eventBus.emit('battle:playerTurn', { player: state.player });

        if (typeof battleUI !== 'undefined') {
            battleUI.showPlayerActions();
        }
    }

    function startEnemyTurn() {
        state.turn = 'enemy';

        eventBus.emit('battle:enemyTurn', { enemy: state.enemy });

        if (typeof battleUI !== 'undefined') {
            battleUI.showEnemyTurn();
        }

        // Enemy attacks after a delay
        setTimeout(function() {
            executeEnemyAttack();
        }, TUNING.get('battle.timing.enemyDelay', 1000));
    }

    // === Player Actions ===

    function playerAttack() {
        if (!state.active || state.turn !== 'player') return;

        state.pendingAction = 'attack';

        // Start QTE for attack
        if (typeof qteEngine !== 'undefined') {
            qteEngine.startSkillQTE({ skillName: 'Attack' }, function(result) {
                resolvePlayerAttack(result);
            });
        } else {
            // No QTE, just attack
            resolvePlayerAttack({ zone: 'normal', modifiers: { bonusDamage: 0 } });
        }
    }

    function playerDefend() {
        if (!state.active || state.turn !== 'player') return;

        state.player.defending = true;

        eventBus.emit('battle:playerDefend', {});

        if (typeof battleUI !== 'undefined') {
            battleUI.showMessage('Defending...');
        }

        // End player turn
        setTimeout(function() {
            startEnemyTurn();
        }, 500);
    }

    function resolvePlayerAttack(qteResult) {
        var baseDamage = state.player.attack - state.enemy.defense;
        var bonus = qteResult.modifiers.bonusDamage || 0;
        var damage = Math.max(1, Math.floor(baseDamage * (1 + bonus)));

        // Apply advantage/disadvantage
        if (qteResult.modifiers.advantage) {
            damage = Math.floor(damage * 1.2);
        } else if (qteResult.modifiers.disadvantage) {
            damage = Math.floor(damage * 0.8);
        }

        state.enemy.hp = Math.max(0, state.enemy.hp - damage);

        eventBus.emit('battle:damage', {
            target: 'enemy',
            damage: damage,
            qteZone: qteResult.zone
        });

        if (typeof battleUI !== 'undefined') {
            battleUI.showDamage('enemy', damage, qteResult.zone);
            battleUI.updateStats(state);
        }

        // Check win condition
        if (state.enemy.hp <= 0) {
            setTimeout(function() {
                endBattle(true);
            }, TUNING.get('battle.timing.victoryDelay', 1000));
            return;
        }

        // Enemy turn
        setTimeout(function() {
            startEnemyTurn();
        }, TUNING.get('battle.timing.turnDelay', 800));
    }

    // === Enemy Attack ===

    function executeEnemyAttack() {
        if (!state.active) return;

        // If player is defending, trigger defend QTE
        if (state.player.defending && typeof qteEngine !== 'undefined') {
            qteEngine.startDefendQTE({ enemyAttackName: state.enemy.name + ' attacks!' }, function(result) {
                resolveEnemyAttack(result);
            });
        } else {
            // No defense, full damage
            resolveEnemyAttack({ zone: 'bad', modifiers: { damageReduction: 0 } });
        }
    }

    function resolveEnemyAttack(qteResult) {
        var baseDamage = state.enemy.attack - state.player.defense;
        var reduction = qteResult.modifiers.damageReduction || 0;
        var damage = Math.max(0, Math.floor(baseDamage * (1 - reduction)));

        // Counter attack on parry
        if (qteResult.modifiers.counterAttack) {
            var counterDamage = Math.floor(state.player.attack * 0.5);
            state.enemy.hp = Math.max(0, state.enemy.hp - counterDamage);

            eventBus.emit('battle:counter', { damage: counterDamage });

            if (typeof battleUI !== 'undefined') {
                battleUI.showMessage('Counter! ' + counterDamage + ' damage!');
            }
        }

        state.player.hp = Math.max(0, state.player.hp - damage);

        eventBus.emit('battle:damage', {
            target: 'player',
            damage: damage,
            qteZone: qteResult.zone,
            defended: state.player.defending
        });

        if (typeof battleUI !== 'undefined') {
            if (damage > 0) {
                battleUI.showDamage('player', damage, qteResult.zone);
            } else {
                battleUI.showMessage(getDefenseText(qteResult.zone));
            }
            battleUI.updateStats(state);
        }

        // Check lose condition
        if (state.player.hp <= 0) {
            setTimeout(function() {
                endBattle(false);
            }, TUNING.get('battle.timing.defeatDelay', 1000));
            return;
        }

        // Check if enemy died from counter
        if (state.enemy.hp <= 0) {
            setTimeout(function() {
                endBattle(true);
            }, TUNING.get('battle.timing.victoryDelay', 1000));
            return;
        }

        // Player turn
        setTimeout(function() {
            startPlayerTurn();
        }, TUNING.get('battle.timing.turnDelay', 800));
    }

    function getDefenseText(zone) {
        switch (zone) {
            case 'perfect': return 'PARRY!';
            case 'good': return 'DODGE!';
            case 'normal': return 'BLOCK!';
            default: return '';
        }
    }

    // === End Battle ===

    function endBattle(won) {
        state.active = false;

        var result = {
            won: won,
            target: won ? state.winTarget : state.loseTarget,
            playerHP: state.player.hp,
            enemyHP: state.enemy.hp
        };

        console.log('[Battle] Ended:', won ? 'Victory!' : 'Defeat');

        eventBus.emit('battle:end', result);

        if (typeof battleUI !== 'undefined') {
            battleUI.showOutro(won, function() {
                battleUI.hide();
                if (state.onComplete) {
                    state.onComplete(result);
                }
            });
        } else {
            if (state.onComplete) {
                state.onComplete(result);
            }
        }
    }

    function cancel() {
        if (!state.active) return;

        state.active = false;

        if (typeof qteEngine !== 'undefined') {
            qteEngine.cancel();
        }

        if (typeof battleUI !== 'undefined') {
            battleUI.hide();
        }

        eventBus.emit('battle:cancelled', {});
    }

    // === Public API ===

    return {
        init: init,
        start: start,
        playerAttack: playerAttack,
        playerDefend: playerDefend,
        cancel: cancel,
        isActive: function() { return state.active; },
        getState: function() { return state; }
    };
})();

// Register as module
if (typeof SceneWeaver !== 'undefined') {
    SceneWeaver.registerModule({
        name: 'battle',
        version: '1.0.0',
        dependencies: ['qte'],
        init: function() { battleEngine.init(); }
    });
}

window.battleEngine = battleEngine;
