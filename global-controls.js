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

        if (globalMusicToggle) {
            globalMusicToggle.addEventListener('click', toggleMusic);
        }

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
        closeBtn.addEventListener('click', function() {
            const modal = document.getElementById('rulesModal');
            if (modal) {
                modal.style.display = 'none';
                toggleCloseButton(false);
            }
        });

        // Watch for modal changes using MutationObserver
        const modal = document.getElementById('rulesModal');
        if (modal) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
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
        window.addEventListener('resize', function() {
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
})();
