/**
 * SceneWeaver - Bootstrap
 *
 * Initializes core systems in correct order.
 */

var SceneWeaver = (function() {
    'use strict';

    var initialized = false;
    var modules = {};

    /**
     * Initialize the engine
     * @param {Object} config - Optional configuration
     */
    function init(config) {
        if (initialized) {
            console.warn('[SceneWeaver] Already initialized');
            return;
        }

        config = config || {};

        console.log('[SceneWeaver] Initializing...');

        // Initialize managers
        if (typeof flagManager !== 'undefined') {
            flagManager.init();
        }

        if (typeof audioManager !== 'undefined') {
            audioManager.init();
        }

        if (typeof saveManager !== 'undefined') {
            saveManager.init();
        }

        // Initialize registered modules
        initModules();

        // Initialize engine
        if (typeof engine !== 'undefined') {
            engine.init(config);
        }

        initialized = true;
        console.log('[SceneWeaver] Ready');
    }

    /**
     * Register a module
     * @param {Object} module - Module definition
     */
    function registerModule(module) {
        if (!module.name) {
            console.error('[SceneWeaver] Module must have a name');
            return;
        }

        if (modules[module.name]) {
            console.warn('[SceneWeaver] Module already registered:', module.name);
            return;
        }

        modules[module.name] = module;
        console.log('[SceneWeaver] Module registered:', module.name);
    }

    /**
     * Get a registered module
     * @param {string} name - Module name
     */
    function getModule(name) {
        return modules[name] || null;
    }

    /**
     * Initialize all registered modules
     */
    function initModules() {
        for (var name in modules) {
            if (modules.hasOwnProperty(name)) {
                var module = modules[name];
                if (typeof module.init === 'function') {
                    try {
                        module.init();
                        console.log('[SceneWeaver] Module initialized:', name);
                    } catch (e) {
                        console.error('[SceneWeaver] Failed to init module:', name, e);
                    }
                }
            }
        }
    }

    return {
        init: init,
        registerModule: registerModule,
        getModule: getModule,
        initModules: initModules,

        // Expose core systems
        get store() { return store; },
        get eventBus() { return eventBus; },
        get tuning() { return TUNING; }
    };
})();

// Global export
window.SceneWeaver = SceneWeaver;
