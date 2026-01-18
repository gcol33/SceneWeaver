/**
 * SceneWeaver - Audio Manager
 *
 * Handles music and sound effects playback.
 *
 * Usage:
 *   audioManager.setMusic('track.mp3');
 *   audioManager.playSfx('click.ogg');
 */

var audioManager = (function() {
    'use strict';

    var musicElement = null;
    var currentTrack = null;
    var volume = 0.16;

    function init() {
        // Create music element
        musicElement = document.createElement('audio');
        musicElement.loop = true;
        musicElement.volume = TUNING.get('audio.defaultVolume', 0.16);

        volume = musicElement.volume;

        console.log('[AudioManager] Initialized');
    }

    /**
     * Set background music
     * @param {string} track - Filename (e.g., 'theme.mp3')
     */
    function setMusic(track) {
        if (!track) {
            stopMusic();
            return;
        }

        if (track === currentTrack) return;

        var src = TUNING.get('paths.music', 'assets/music/') + track;

        // Crossfade (simple version)
        musicElement.src = src;
        musicElement.volume = volume;
        musicElement.play().catch(function(e) {
            console.warn('[AudioManager] Autoplay blocked:', e.message);
        });

        currentTrack = track;
        eventBus.emit(Events.MUSIC_CHANGED, { track: track });
    }

    /**
     * Stop music
     */
    function stopMusic() {
        musicElement.pause();
        musicElement.currentTime = 0;
        currentTrack = null;
    }

    /**
     * Play sound effect
     * @param {string} sfx - Filename (e.g., 'click.ogg')
     */
    function playSfx(sfx) {
        if (!sfx) return;

        var audio = new Audio(TUNING.get('paths.sfx', 'assets/sfx/') + sfx);
        audio.volume = Math.min(volume * 2, 1); // SFX slightly louder
        audio.play().catch(function(e) {
            console.warn('[AudioManager] SFX play failed:', e.message);
        });

        eventBus.emit(Events.SFX_PLAYED, { sfx: sfx });
    }

    /**
     * Set volume
     * @param {number} vol - Volume (0-1)
     */
    function setVolume(vol) {
        volume = Math.max(0, Math.min(1, vol));
        if (musicElement) {
            musicElement.volume = volume;
        }
        store.set('settings.volume', volume);
    }

    /**
     * Get current volume
     */
    function getVolume() {
        return volume;
    }

    return {
        init: init,
        setMusic: setMusic,
        stopMusic: stopMusic,
        playSfx: playSfx,
        setVolume: setVolume,
        getVolume: getVolume
    };
})();

// Global export
window.audioManager = audioManager;
