// Global Music Manager - Continuous Playback Across Pages
(function () {
    'use strict';

    // Determine the correct path to assets based on current location
    function getAssetsPath() {
        const currentPath = window.location.pathname;

        // If we're in a subdirectory (like /saler/, /lakir/, /tinka/), use ../assets/
        if (currentPath.includes('/saler/') ||
            currentPath.includes('/lakir/') ||
            currentPath.includes('/tinka/') ||
            currentPath.includes('/assets/')) {
            return '../assets/audio/';
        } else {
            // If we're at the root, use assets/
            return 'assets/audio/';
        }
    }

    // Music playlist configuration with dynamic paths
    const getPlaylist = () => {
        const basePath = getAssetsPath();
        return [
            basePath + 'dawn.mp3',
            basePath + 'i-remember-my-name.mp3',
            basePath + 'jung-bae-ya.mp3',
            basePath + 'owe.mp3',
            basePath + 'pink-soldiers.mp3',
            basePath + 'round-i.mp3',
            basePath + 'so-it-goes.mp3',
            basePath + 'uh....mp3',
            basePath + 'unfolded.mp3',
            basePath + 'way-back-then.mp3',
            basePath + 'wife-husband-and-4.56-billion.mp3'
        ];
    };

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
            this.playlist = getPlaylist(); // Get dynamic playlist
            this.saveStateInterval = null; // For periodic state saving

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

            // Auto-resume if music was playing and user has interacted before
            this.attemptAutoResume();
        }

        attemptAutoResume() {
            // Only auto-resume if music was enabled and playing
            if (this.isEnabled && this.isPlaying) {
                // Try to resume after a short delay to allow page to settle
                setTimeout(() => {
                    this.resumePlayback().catch(error => {
                        console.log('Auto-resume failed, waiting for user interaction:', error);
                        // If auto-resume fails, set up a one-time click listener
                        this.setupAutoResumeOnInteraction();
                    });
                }, 500);
            }
        }

        setupAutoResumeOnInteraction() {
            const resumeOnInteraction = () => {
                if (this.isEnabled && this.isPlaying && this.audio.paused) {
                    this.resumePlayback().catch(console.warn);
                }
                // Remove the listeners after first interaction
                document.removeEventListener('click', resumeOnInteraction);
                document.removeEventListener('keydown', resumeOnInteraction);
                document.removeEventListener('touchstart', resumeOnInteraction);
            };

            document.addEventListener('click', resumeOnInteraction, { once: true });
            document.addEventListener('keydown', resumeOnInteraction, { once: true });
            document.addEventListener('touchstart', resumeOnInteraction, { once: true });
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
            this.audio.crossOrigin = 'anonymous'; // Help with CORS if needed

            // Add event listeners
            this.audio.addEventListener('ended', () => this.nextTrack());
            this.audio.addEventListener('canplaythrough', () => {
                if (this.currentTime > 0 && Math.abs(this.audio.currentTime - this.currentTime) > 1) {
                    this.audio.currentTime = this.currentTime;
                }
            });
            this.audio.addEventListener('loadedmetadata', () => {
                if (this.currentTime > 0 && this.audio.duration > this.currentTime) {
                    this.audio.currentTime = this.currentTime;
                }
            });
            this.audio.addEventListener('timeupdate', () => {
                this.saveCurrentTime();
            });
            this.audio.addEventListener('error', (e) => {
                console.warn('Audio error:', e);
                // Try next track after a delay
                setTimeout(() => this.nextTrack(), 1000);
            });
            this.audio.addEventListener('stalled', () => {
                console.warn('Audio stalled, retrying...');
                if (this.isPlaying) {
                    setTimeout(() => {
                        this.audio.load();
                        this.play();
                    }, 1000);
                }
            });

            document.body.appendChild(this.audio);
        }

        loadState() {
            this.isEnabled = localStorage.getItem(STORAGE_KEYS.MUSIC_ENABLED) === 'true';
            this.isPlaying = localStorage.getItem(STORAGE_KEYS.IS_PLAYING) === 'true';
            this.currentTrackIndex = parseInt(localStorage.getItem(STORAGE_KEYS.PLAYLIST_INDEX)) || 0;
            this.currentTime = parseFloat(localStorage.getItem(STORAGE_KEYS.CURRENT_TIME)) || 0;

            // Ensure valid track index
            if (this.currentTrackIndex >= this.playlist.length) {
                this.currentTrackIndex = 0;
            }
        }

        saveState() {
            localStorage.setItem(STORAGE_KEYS.MUSIC_ENABLED, this.isEnabled);
            localStorage.setItem(STORAGE_KEYS.IS_PLAYING, this.isPlaying);
            localStorage.setItem(STORAGE_KEYS.PLAYLIST_INDEX, this.currentTrackIndex);
            localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, this.playlist[this.currentTrackIndex]);
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
                    // Page is hidden, save state more frequently
                    this.saveCurrentTime();
                    this.saveState();
                } else {
                    // Page is visible, try to resume if music should be playing
                    if (this.isEnabled && this.isPlaying && this.audio.paused) {
                        this.audio.play().catch(e => {
                            console.warn('Resume on visibility change failed:', e);
                            this.setupAutoResumeOnInteraction();
                        });
                    }
                }
            });

            // Handle page unload - save state immediately
            window.addEventListener('beforeunload', () => {
                this.saveCurrentTime();
                this.saveState();
            });

            // Save state periodically during playback
            window.addEventListener('pagehide', () => {
                this.saveCurrentTime();
                this.saveState();
            });

            // Additional backup saving on window blur
            window.addEventListener('blur', () => {
                if (this.audio && !this.audio.paused) {
                    this.saveCurrentTime();
                    this.saveState();
                }
            });
        }

        loadTrack(index) {
            if (index >= 0 && index < this.playlist.length) {
                this.currentTrackIndex = index;
                const trackUrl = this.playlist[index];

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
                    this.startPeriodicStateSave();
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
                this.startPeriodicStateSave();
                return true;
            }
        }

        pause() {
            if (this.audio) {
                this.audio.pause();
                this.isPlaying = false;
                this.saveState();
                this.updateMusicButtonState();
                this.stopPeriodicStateSave();
            }
        }

        startPeriodicStateSave() {
            this.stopPeriodicStateSave(); // Clear any existing interval
            this.saveStateInterval = setInterval(() => {
                if (this.audio && !this.audio.paused) {
                    this.saveCurrentTime();
                }
            }, 2000); // Save every 2 seconds during playback
        }

        stopPeriodicStateSave() {
            if (this.saveStateInterval) {
                clearInterval(this.saveStateInterval);
                this.saveStateInterval = null;
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

            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
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
                this.playlist.length - 1;

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
                const trackName = this.playlist[this.currentTrackIndex]
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
            } else {
                // Simple fallback notification
                console.log(`Music: ${message}`);

                // Create a simple toast notification if no system exists
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#1bb8bd'};
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    z-index: 10000;
                    max-width: 300px;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                `;
                toast.textContent = message;
                document.body.appendChild(toast);

                // Animate in
                setTimeout(() => {
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateX(0)';
                }, 100);

                // Remove after 3 seconds
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(100%)';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }, 3000);
            }
        }

        // Public API
        getCurrentTrack() {
            return this.playlist[this.currentTrackIndex];
        }

        getCurrentTrackName() {
            return this.playlist[this.currentTrackIndex]
                .split('/').pop()
                .replace('.mp3', '')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
        }

        getPlaylist() {
            return [...this.playlist];
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
