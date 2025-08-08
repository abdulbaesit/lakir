// Global Music Manager - Continuous Playback Across Pages
(function () {
    'use strict';

    // Music playlist configuration
    const MUSIC_PLAYLIST = [
        '../assets/audio/dawn.mp3',
        '../assets/audio/i-remember-my-name.mp3',
        '../assets/audio/jung-bae-ya.mp3',
        '../assets/audio/owe.mp3',
        '../assets/audio/pink-soldiers.mp3',
        '../assets/audio/round-i.mp3',
        '../assets/audio/so-it-goes.mp3',
        '../assets/audio/uh....mp3',
        '../assets/audio/unfolded.mp3',
        '../assets/audio/way-back-then.mp3',
        '../assets/audio/wife-husband-and-4.56-billion.mp3'
    ];

    // Global music state
    const STORAGE_KEYS = {
        MUSIC_ENABLED: 'global-music-enabled',
        CURRENT_TRACK: 'global-current-track',
        CURRENT_TIME: 'global-current-time',
        IS_PLAYING: 'global-is-playing',
        PLAYLIST_INDEX: 'global-playlist-index'
    };

    class MusicManager {
        constructor() {
            this.audio = null;
            this.currentTrackIndex = 0;
            this.isEnabled = false;
            this.isPlaying = false;
            this.currentTime = 0;
            this.volume = 0.3;
            this.fadeInterval = null;
            this.isToggling = false; // Add debounce flag

            this.init();
        }

        init() {
            // Create audio element
            this.createAudioElement();

            // Load saved state
            this.loadState();

            // Setup event listeners
            this.setupEventListeners();

            // Update UI
            this.updateMusicButtonState();

            // Note: Don't auto-resume playback on page load due to browser policies
            // Music will resume when user clicks the music button
        }

        createAudioElement() {
            // Remove any existing global audio
            const existingAudio = document.getElementById('global-music-player');
            if (existingAudio) {
                existingAudio.remove();
            }

            this.audio = document.createElement('audio');
            this.audio.id = 'global-music-player';
            this.audio.volume = this.volume;
            this.audio.preload = 'metadata';

            // Add event listeners
            this.audio.addEventListener('ended', () => this.nextTrack());
            this.audio.addEventListener('canplaythrough', () => {
                if (this.currentTime > 0) {
                    this.audio.currentTime = this.currentTime;
                }
            });
            this.audio.addEventListener('timeupdate', () => {
                this.saveCurrentTime();
            });
            this.audio.addEventListener('error', (e) => {
                console.warn('Audio error:', e);
                this.nextTrack();
            });

            document.body.appendChild(this.audio);
        }

        loadState() {
            this.isEnabled = localStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED) === 'true';
            this.isPlaying = localStorage.getItem(STORAGE_KEYS.IS_PLAYING) === 'true';
            this.currentTrackIndex = parseInt(localStorage.getItem(STORAGE_KEYS.PLAYLIST_INDEX)) || 0;
            this.currentTime = parseFloat(localStorage.getItem(STORAGE_KEYS.CURRENT_TIME)) || 0;

            // Ensure valid track index
            if (this.currentTrackIndex >= MUSIC_PLAYLIST.length) {
                this.currentTrackIndex = 0;
            }
        }

        saveState() {
            localStorage.setItem(STORAGE_KEYS.MUSIC_ENABLED, this.isEnabled);
            localStorage.setItem(STORAGE_KEYS.IS_PLAYING, this.isPlaying);
            localStorage.setItem(STORAGE_KEYS.PLAYLIST_INDEX, this.currentTrackIndex);
            localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, MUSIC_PLAYLIST[this.currentTrackIndex]);
        }

        saveCurrentTime() {
            if (this.audio && !this.audio.paused) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_TIME, this.audio.currentTime);
            }
        }

        setupEventListeners() {
            // Listen for page visibility changes to pause/resume
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // Page is hidden, keep playing but save state
                    this.saveCurrentTime();
                } else {
                    // Page is visible, resume if needed
                    if (this.isEnabled && this.isPlaying && this.audio.paused) {
                        this.audio.play().catch(e => console.warn('Resume failed:', e));
                    }
                }
            });

            // Handle page unload
            window.addEventListener('beforeunload', () => {
                this.saveCurrentTime();
                this.saveState();
            });
        }

        loadTrack(index) {
            if (index >= 0 && index < MUSIC_PLAYLIST.length) {
                this.currentTrackIndex = index;
                const trackUrl = MUSIC_PLAYLIST[index];

                if (this.audio.src !== trackUrl) {
                    this.audio.src = trackUrl;
                    this.audio.load();
                }

                this.saveState();
                this.showTrackNotification();
            }
        }

        async play() {
            if (!this.audio.src) {
                this.loadTrack(this.currentTrackIndex);
            }

            // Ensure audio is not paused before trying to play
            if (this.audio.paused) {
                try {
                    await this.audio.play();
                    this.isPlaying = true;
                    this.saveState();
                    this.updateMusicButtonState();
                    return true;
                } catch (error) {
                    console.warn('Playback failed:', error);
                    this.isPlaying = false;
                    this.saveState();
                    return false;
                }
            } else {
                // Already playing
                this.isPlaying = true;
                this.saveState();
                return true;
            }
        }

        pause() {
            if (this.audio) {
                this.audio.pause();
                this.isPlaying = false;
                this.saveState();
                this.updateMusicButtonState();
            }
        }

        async resumePlayback() {
            this.loadTrack(this.currentTrackIndex);

            // Wait a bit for the track to load
            setTimeout(async () => {
                if (this.currentTime > 0) {
                    this.audio.currentTime = this.currentTime;
                }
                await this.play();
            }, 100);
        }

        nextTrack() {
            this.currentTime = 0;
            localStorage.removeItem(STORAGE_KEYS.CURRENT_TIME);

            this.currentTrackIndex = (this.currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
            this.loadTrack(this.currentTrackIndex);

            if (this.isPlaying) {
                setTimeout(() => this.play(), 100);
            }
        }

        prevTrack() {
            this.currentTime = 0;
            localStorage.removeItem(STORAGE_KEYS.CURRENT_TIME);

            this.currentTrackIndex = this.currentTrackIndex > 0 ?
                this.currentTrackIndex - 1 :
                MUSIC_PLAYLIST.length - 1;

            this.loadTrack(this.currentTrackIndex);

            if (this.isPlaying) {
                setTimeout(() => this.play(), 100);
            }
        }

        async toggle() {
            // Prevent rapid clicking
            if (this.isToggling) {
                return;
            }

            this.isToggling = true;
            this.isEnabled = !this.isEnabled;
            this.saveState();

            try {
                if (this.isEnabled) {
                    // If this is resuming a previously playing track, restore position
                    if (this.currentTime > 0 && !this.audio.src) {
                        this.loadTrack(this.currentTrackIndex);
                        // Wait a bit for the track to load, then set position
                        setTimeout(() => {
                            if (this.audio.readyState >= 2) { // HAVE_CURRENT_DATA
                                this.audio.currentTime = this.currentTime;
                            }
                        }, 100);
                    }

                    const success = await this.play();
                    if (success) {
                        this.showNotification('Music enabled', 'success');
                    } else {
                        this.showNotification('Click again to enable music', 'info');
                    }
                } else {
                    this.pause();
                    this.showNotification('Music disabled', 'info');
                }

                this.updateMusicButtonState();
            } finally {
                // Reset toggle flag after a short delay
                setTimeout(() => {
                    this.isToggling = false;
                }, 500);
            }
        }

        updateMusicButtonState() {
            const musicButton = document.getElementById('global-music-toggle');
            if (musicButton) {
                if (this.isEnabled && this.isPlaying) {
                    musicButton.classList.remove('muted');
                } else {
                    musicButton.classList.add('muted');
                }
            }
        }

        showTrackNotification() {
            if (this.isEnabled && typeof showNotification === 'function') {
                const trackName = MUSIC_PLAYLIST[this.currentTrackIndex]
                    .split('/').pop()
                    .replace('.mp3', '')
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());

                showNotification(`Now playing: ${trackName}`, 'info');
            }
        }

        showNotification(message, type) {
            if (typeof showNotification === 'function') {
                showNotification(message, type);
            }
        }

        // Public API
        getCurrentTrack() {
            return MUSIC_PLAYLIST[this.currentTrackIndex];
        }

        getPlaylist() {
            return [...MUSIC_PLAYLIST];
        }

        isCurrentlyPlaying() {
            return this.isEnabled && this.isPlaying && this.audio && !this.audio.paused;
        }
    }

    // Create global instance
    window.musicManager = new MusicManager();

    // Initialize music controls when DOM is ready
    function initMusicControls() {
        const musicToggle = document.getElementById('global-music-toggle');

        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                window.musicManager.toggle();
            });
        }

        // Add keyboard shortcuts (optional)
        document.addEventListener('keydown', (e) => {
            // Only if no input is focused
            if (document.activeElement.tagName !== 'INPUT' &&
                document.activeElement.tagName !== 'TEXTAREA') {

                if (e.key === 'M' || e.key === 'm') {
                    window.musicManager.toggle();
                    e.preventDefault();
                }

                if (e.key === 'ArrowRight' && e.ctrlKey) {
                    window.musicManager.nextTrack();
                    e.preventDefault();
                }

                if (e.key === 'ArrowLeft' && e.ctrlKey) {
                    window.musicManager.prevTrack();
                    e.preventDefault();
                }
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMusicControls);
    } else {
        initMusicControls();
    }

})();
