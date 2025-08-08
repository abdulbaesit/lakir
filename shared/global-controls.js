// Global Controls Shared Functionality
(function () {
    'use strict';

    // Global variables
    let musicEnabled = false;
    let currentAudio = null;

    // Initialize global controls
    function initGlobalControls() {
        const globalThemeToggle = document.getElementById('global-theme-toggle');
        const globalMusicToggle = document.getElementById('global-music-toggle');

        // Theme is already applied in <head>, no need to re-apply here
        // Just get the current theme for reference
        const savedTheme = localStorage.getItem('global-theme') || 'light';

        // Theme Control Function
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('global-theme', newTheme);

            // Show notification if available
            if (typeof showNotification === 'function') {
                showNotification(`Switched to ${newTheme} mode`, 'info');
            }
        }

        // Music Control Function
        function toggleMusic() {
            // Use the new music manager if available
            if (window.musicManager) {
                window.musicManager.toggle();
                return;
            }

            // Fallback to old method
            musicEnabled = !musicEnabled;

            // Find available audio elements
            const audioElements = [
                document.getElementById('squid-game-theme'),
                document.getElementById('squidGameTheme'),
                // Add more audio IDs as needed
            ].filter(el => el !== null);

            if (musicEnabled) {
                // Try to play first available audio
                for (let audio of audioElements) {
                    if (audio) {
                        currentAudio = audio;
                        audio.volume = 0.3;
                        audio.play().then(() => {
                            globalMusicToggle.classList.remove('muted');
                            if (typeof showNotification === 'function') {
                                showNotification('Music enabled', 'success');
                            }
                        }).catch(e => {
                            if (typeof showNotification === 'function') {
                                showNotification('Click the music button again to enable audio', 'info');
                            }
                        });
                        break;
                    }
                }
            } else {
                // Pause all audio
                audioElements.forEach(audio => {
                    if (audio) audio.pause();
                });
                globalMusicToggle.classList.add('muted');
                if (typeof showNotification === 'function') {
                    showNotification('Music disabled', 'info');
                }
            }
        }

        // Event Listeners
        if (globalThemeToggle) {
            globalThemeToggle.addEventListener('click', toggleTheme);
        }

        // Music button behavior is handled by the music control panel function
        // No direct music toggle here - only panel visibility

        // Auto-enable audio on first user interaction
        document.addEventListener('click', function enableAudio() {
            const audioElements = [
                document.getElementById('squid-game-theme'),
                document.getElementById('squidGameTheme'),
            ].filter(el => el !== null);

            audioElements.forEach(audio => {
                if (audio) audio.load();
            });

            document.removeEventListener('click', enableAudio);
        }, { once: true });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobalControls);
    } else {
        initGlobalControls();
    }

    // Expose for other scripts if needed
    window.globalControls = {
        toggleTheme: function () {
            const event = new Event('click');
            const themeToggle = document.getElementById('global-theme-toggle');
            if (themeToggle) themeToggle.dispatchEvent(event);
        },
        toggleMusic: function () {
            const event = new Event('click');
            const musicToggle = document.getElementById('global-music-toggle');
            if (musicToggle) musicToggle.dispatchEvent(event);
        }
    };

    // Mobile Close Button Functionality
    function initMobileCloseButton() {
        const closeBtn = document.querySelector('.close-rules-btn');
        if (!closeBtn) return;

        // Function to check if device is mobile
        function isMobile() {
            return window.innerWidth <= 768;
        }

        // Function to show/hide close button
        function toggleCloseButton(show) {
            if (closeBtn && isMobile()) {
                if (show) {
                    closeBtn.classList.add('show-mobile');
                } else {
                    closeBtn.classList.remove('show-mobile');
                }
            } else if (closeBtn) {
                // Always hide on desktop
                closeBtn.classList.remove('show-mobile');
            }
        }

        // Add click event to close button
        closeBtn.addEventListener('click', function () {
            const modal = document.getElementById('rulesModal');
            if (modal) {
                modal.style.display = 'none';
                toggleCloseButton(false);
            }
        });

        // Watch for modal changes using MutationObserver
        const modal = document.getElementById('rulesModal');
        if (modal) {
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const isVisible = modal.style.display === 'block';
                        toggleCloseButton(isVisible);
                    }
                });
            });

            observer.observe(modal, {
                attributes: true,
                attributeFilter: ['style']
            });
        }

        // Handle window resize
        window.addEventListener('resize', function () {
            const modal = document.getElementById('rulesModal');
            if (modal && modal.style.display === 'block') {
                toggleCloseButton(isMobile());
            } else {
                toggleCloseButton(false);
            }
        });
    }

    // Initialize mobile close button when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileCloseButton);
    } else {
        initMobileCloseButton();
    }

    // Track Name Display for non-homepage pages
    function initTrackDisplay() {
        const musicButton = document.getElementById('global-music-toggle');

        // Create track name display for all pages
        if (musicButton) {
            // Create track name display
            const trackDisplay = document.createElement('div');
            trackDisplay.id = 'track-name-display';
            trackDisplay.style.cssText = `
                position: fixed;
                top: 75px;
                right: 20px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 0.8rem;
                font-family: 'DM Sans', sans-serif;
                color: #1bb8bd;
                font-weight: 500;
                border: 1px solid rgba(27, 184, 189, 0.3);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 999;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                max-width: 200px;
                text-align: center;
                pointer-events: none;
            `;

            // Add dark theme styles
            if (document.documentElement.getAttribute('data-theme') === 'dark') {
                trackDisplay.style.background = 'rgba(10, 42, 45, 0.9)';
                trackDisplay.style.color = '#1bb8bd';
            }

            trackDisplay.textContent = 'No track playing';
            document.body.appendChild(trackDisplay);

            // Update track display
            function updateTrackDisplay() {
                if (window.musicManager && window.musicManager.isCurrentlyPlaying()) {
                    const trackName = window.musicManager.getCurrentTrackName();
                    trackDisplay.textContent = `♪ ${trackName}`;
                    trackDisplay.style.opacity = '1';
                    trackDisplay.style.transform = 'translateY(0)';
                } else {
                    trackDisplay.style.opacity = '0';
                    trackDisplay.style.transform = 'translateY(-10px)';
                }
            }

            // Update display periodically
            setInterval(updateTrackDisplay, 2000);

            // Show/hide on music button hover
            musicButton.addEventListener('mouseenter', () => {
                if (window.musicManager && window.musicManager.isCurrentlyPlaying()) {
                    updateTrackDisplay();
                }
            });

            // Listen for theme changes
            const observer = new MutationObserver(() => {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                if (isDark) {
                    trackDisplay.style.background = 'rgba(10, 42, 45, 0.9)';
                    trackDisplay.style.color = '#1bb8bd';
                } else {
                    trackDisplay.style.background = 'rgba(255, 255, 255, 0.9)';
                    trackDisplay.style.color = '#1bb8bd';
                }
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme']
            });
        }
    }

    // Music Control Panel Functionality
    function initMusicControlPanel() {
        const musicToggle = document.getElementById('global-music-toggle');
        const musicPanel = document.getElementById('music-control-panel');
        const closePanelBtn = document.getElementById('close-music-panel');
        const playPauseBtn = document.getElementById('play-pause');
        const prevTrackBtn = document.getElementById('prev-track');
        const nextTrackBtn = document.getElementById('next-track');
        const currentTrackName = document.getElementById('current-track-name');
        const currentTime = document.getElementById('current-time');
        const totalTime = document.getElementById('total-time');
        const progressFill = document.getElementById('progress-fill');
        const playlistContainer = document.getElementById('playlist-container');

        // Only initialize if all elements exist
        if (!musicPanel || !closePanelBtn || !musicToggle) {
            // console.log('Music control panel elements not found, skipping initialization');
            return;
        }

        // console.log('Initializing music control panel');

        let panelVisible = false;

        // Toggle panel visibility
        function togglePanel() {
            panelVisible = !panelVisible;
            // console.log('Toggling panel, visible:', panelVisible);

            if (panelVisible) {
                musicPanel.classList.remove('hidden');
                musicPanel.classList.add('show');
                updateTrackInfo();
                populatePlaylist();
                updatePlayPauseButton();
            } else {
                musicPanel.classList.add('hidden');
                musicPanel.classList.remove('show');
            }
        }

        // Update current track information
        function updateTrackInfo() {
            if (currentTrackName && window.musicManager) {
                const currentTrack = window.musicManager.getCurrentTrack();
                if (currentTrack) {
                    const trackName = currentTrack
                        .split('/').pop()
                        .replace('.mp3', '')
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                    currentTrackName.textContent = trackName;
                } else {
                    currentTrackName.textContent = 'No track selected';
                }
            }
        }

        // Update play/pause button
        function updatePlayPauseButton() {
            if (playPauseBtn && window.musicManager && window.musicManager.isCurrentlyPlaying()) {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                playPauseBtn.title = 'Pause';
            } else if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playPauseBtn.title = 'Play';
            }
        }

        // Update progress bar
        function updateProgress() {
            if (progressFill && currentTime && totalTime && window.musicManager && window.musicManager.audio) {
                const audio = window.musicManager.audio;
                if (audio.duration) {
                    const current = audio.currentTime;
                    const duration = audio.duration;
                    const progressPercent = (current / duration) * 100;

                    progressFill.style.width = progressPercent + '%';

                    // Update time displays
                    currentTime.textContent = formatTime(current);
                    totalTime.textContent = formatTime(duration);
                }
            }
        }

        // Format time in MM:SS
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Populate playlist
        function populatePlaylist() {
            if (playlistContainer && window.musicManager) {
                const playlist = window.musicManager.getPlaylist();
                playlistContainer.innerHTML = '';

                playlist.forEach((track, index) => {
                    const trackName = track
                        .split('/').pop()
                        .replace('.mp3', '')
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());

                    const item = document.createElement('div');
                    item.className = 'playlist-item';
                    item.textContent = `${index + 1}. ${trackName}`;

                    if (index === window.musicManager.currentTrackIndex) {
                        item.classList.add('active');
                    }

                    item.addEventListener('click', () => {
                        window.musicManager.loadTrack(index);
                        if (window.musicManager.isEnabled) {
                            window.musicManager.play();
                        }
                        updateTrackInfo();
                        updatePlaylist();
                    });

                    playlistContainer.appendChild(item);
                });
            }
        }

        // Update playlist active state
        function updatePlaylist() {
            if (playlistContainer) {
                const items = playlistContainer.querySelectorAll('.playlist-item');
                items.forEach((item, index) => {
                    if (window.musicManager && index === window.musicManager.currentTrackIndex) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
        }

        // Clear any existing event listeners and force only panel toggle
        if (musicToggle) {
            // Clone the element to remove all existing event listeners
            const newMusicToggle = musicToggle.cloneNode(true);
            musicToggle.parentNode.replaceChild(newMusicToggle, musicToggle);

            // Add only our panel toggle event listener
            newMusicToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Only toggle panel visibility - no music control
                togglePanel();
            });

            // Also allow right-click to toggle panel without affecting music
            newMusicToggle.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                togglePanel();
            });
        }

        closePanelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // console.log('Close button clicked');
            panelVisible = false;
            musicPanel.classList.add('hidden');
            musicPanel.classList.remove('show');
        });

        // Alternative close methods
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panelVisible) {
                // console.log('Escape key pressed, closing panel');
                panelVisible = false;
                musicPanel.classList.add('hidden');
                musicPanel.classList.remove('show');
            }
        });

        // Double-click on panel header to close
        const panelHeader = musicPanel.querySelector('.music-panel-header h3');
        if (panelHeader) {
            panelHeader.addEventListener('dblclick', () => {
                // console.log('Double-clicked header, closing panel');
                panelVisible = false;
                musicPanel.classList.add('hidden');
                musicPanel.classList.remove('show');
            });
        }

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (window.musicManager) {
                    window.musicManager.toggle();
                    setTimeout(updatePlayPauseButton, 100);
                }
            });
        }

        if (prevTrackBtn) {
            prevTrackBtn.addEventListener('click', () => {
                if (window.musicManager) {
                    window.musicManager.prevTrack();
                    setTimeout(() => {
                        updateTrackInfo();
                        updatePlaylist();
                    }, 100);
                }
            });
        }

        if (nextTrackBtn) {
            nextTrackBtn.addEventListener('click', () => {
                if (window.musicManager) {
                    window.musicManager.nextTrack();
                    setTimeout(() => {
                        updateTrackInfo();
                        updatePlaylist();
                    }, 100);
                }
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (panelVisible &&
                !musicPanel.contains(e.target) &&
                !musicToggle.contains(e.target)) {
                panelVisible = false;
                musicPanel.classList.add('hidden');
            }
        });

        // Update progress regularly
        setInterval(updateProgress, 1000);

        // Listen for track changes
        setInterval(() => {
            if (panelVisible) {
                updateTrackInfo();
                updatePlayPauseButton();
                updatePlaylist();
            }
        }, 2000);

        // Expose debug functions for testing
        window.debugMusicPanel = {
            togglePanel: togglePanel,
            testCloseButton: () => {
                console.log('Testing close button...');
                closePanelBtn.click();
            },
            showPanel: () => {
                panelVisible = true;
                togglePanel();
            },
            hidePanel: () => {
                panelVisible = false;
                musicPanel.classList.add('hidden');
                musicPanel.classList.remove('show');
            }
        };
    }

    // Initialize track display and music control panel
    setTimeout(() => {
        initTrackDisplay();
        initMusicControlPanel();
    }, 1000);

})();
