/**
 * SceneWeaver - Error Classes
 *
 * Custom error types for meaningful error handling.
 */

/**
 * Base engine error
 */
function EngineError(message, code, details) {
    Error.call(this, message);
    this.name = 'EngineError';
    this.message = message;
    this.code = code || 'ENGINE_ERROR';
    this.details = details || {};
}
EngineError.prototype = Object.create(Error.prototype);
EngineError.prototype.constructor = EngineError;

/**
 * Scene not found error
 */
function SceneNotFoundError(sceneId) {
    EngineError.call(
        this,
        'Scene "' + sceneId + '" not found',
        'SCENE_NOT_FOUND',
        { sceneId: sceneId }
    );
    this.name = 'SceneNotFoundError';
}
SceneNotFoundError.prototype = Object.create(EngineError.prototype);
SceneNotFoundError.prototype.constructor = SceneNotFoundError;

/**
 * Invalid choice error
 */
function InvalidChoiceError(choiceIndex, reason) {
    EngineError.call(
        this,
        'Invalid choice: ' + reason,
        'INVALID_CHOICE',
        { choiceIndex: choiceIndex, reason: reason }
    );
    this.name = 'InvalidChoiceError';
}
InvalidChoiceError.prototype = Object.create(EngineError.prototype);
InvalidChoiceError.prototype.constructor = InvalidChoiceError;

/**
 * Validation error (e.g., corrupted save)
 */
function ValidationError(message, field) {
    EngineError.call(
        this,
        message,
        'VALIDATION_ERROR',
        { field: field }
    );
    this.name = 'ValidationError';
}
ValidationError.prototype = Object.create(EngineError.prototype);
ValidationError.prototype.constructor = ValidationError;

// Global exports
window.EngineError = EngineError;
window.SceneNotFoundError = SceneNotFoundError;
window.InvalidChoiceError = InvalidChoiceError;
window.ValidationError = ValidationError;
