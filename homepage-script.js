document.addEventListener('DOMContentLoaded', function () {
    // Initialize GSAP plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // Audio Elements
    const squidGameTheme = document.getElementById('squid-game-theme');
    const redLightSound = document.getElementById('red-light-sound');
    const greenLightSound = document.getElementById('green-light-sound');

    // Audio Controls
    const toggleMusicBtn = document.getElementById('toggle-music');
    const toggleSfxBtn = document.getElementById('toggle-sfx');

    let musicEnabled = false;
    let sfxEnabled = false;

    // Audio Control Functions
    function toggleMusic() {
        musicEnabled = !musicEnabled;
        if (musicEnabled) {
            // Set volume and play
            squidGameTheme.volume = 0.3;
            squidGameTheme.play().then(() => {
                toggleMusicBtn.classList.add('active');
                toggleMusicBtn.textContent = '🎵';
                console.log('Music started successfully');
            }).catch(e => {
                console.log('Audio play failed:', e);
                // Fallback: try to enable audio context
                if (e.name === 'NotAllowedError') {
                    showNotification('Click the music button again to enable audio', 'info');
                }
            });
        } else {
            squidGameTheme.pause();
            toggleMusicBtn.classList.remove('active');
            toggleMusicBtn.textContent = '🔇';
            console.log('Music paused');
        }
    }

    function toggleSfx() {
        sfxEnabled = !sfxEnabled;
        if (sfxEnabled) {
            toggleSfxBtn.classList.add('active');
            toggleSfxBtn.textContent = '🔊';
        } else {
            toggleSfxBtn.classList.remove('active');
            toggleSfxBtn.textContent = '🔇';
        }
    }

    // Audio Control Event Listeners
    toggleMusicBtn.addEventListener('click', toggleMusic);
    toggleSfxBtn.addEventListener('click', toggleSfx);

    // Enable audio on first user interaction
    document.addEventListener('click', function enableAudio() {
        // This ensures audio can play after user interaction
        squidGameTheme.load();
        redLightSound.load();
        greenLightSound.load();
        document.removeEventListener('click', enableAudio);
    }, { once: true });

    // Red Light Green Light Game Logic - DISABLED to prevent layout issues
    let isRedLight = false;
    let gameTimer = 0;

    function startRedLightGreenLight() {
        // Disabled to prevent layout shifts and blur effects
        /*
        setInterval(() => {
            isRedLight = !isRedLight;
            if (isRedLight) {
                if (sfxEnabled) {
                    redLightSound.volume = 0.2;
                    redLightSound.play().catch(e => console.log('Red light sound failed:', e));
                }
                document.body.style.filter = 'hue-rotate(0deg)';
            } else {
                if (sfxEnabled) {
                    greenLightSound.volume = 0.2;
                    greenLightSound.play().catch(e => console.log('Green light sound failed:', e));
                }
                document.body.style.filter = 'hue-rotate(120deg)';
            }
        }, 5000); // Change every 5 seconds
        */
    }

    // Start the Red Light Green Light game
    startRedLightGreenLight();

    // Money Counter Animation
    function animateMoneyCounter() {
        const digits = document.querySelectorAll('.counter-digit');
        let currentAmount = 456000000000;

        setInterval(() => {
            currentAmount += Math.floor(Math.random() * 1000000);
            const amountStr = currentAmount.toString().padStart(12, '0');

            digits.forEach((digit, index) => {
                if (index === 0) {
                    digit.textContent = '₩';
                } else {
                    digit.textContent = amountStr[index - 1];
                }
            });
        }, 2000);
    }

    animateMoneyCounter();

    // Game Timer Animation
    function updateGameTimer() {
        const timerDisplay = document.querySelector('.timer-display');
        let seconds = 0;

        setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    updateGameTimer();

    // Interactive Camera Effects
    function setupCameraInteractions() {
        const cameras = document.querySelectorAll('.camera');

        cameras.forEach(camera => {
            camera.addEventListener('mouseenter', function () {
                if (sfxEnabled) {
                    // Play camera sound effect
                    const cameraSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                    cameraSound.play().catch(e => console.log('Audio play failed:', e));
                }
                this.style.transform = 'scale(1.2)';
            });

            camera.addEventListener('mouseleave', function () {
                this.style.transform = 'scale(1)';
            });
        });
    }

    setupCameraInteractions();

    // Elimination Effects Trigger
    function triggerEliminationEffects() {
        const elimEffects = document.querySelectorAll('.elimination-effect');

        setInterval(() => {
            const randomEffect = elimEffects[Math.floor(Math.random() * elimEffects.length)];
            randomEffect.style.animation = 'none';
            randomEffect.offsetHeight; // Trigger reflow
            randomEffect.style.animation = 'elimination-blast 2s ease-out';

            if (sfxEnabled) {
                const elimSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                elimSound.play().catch(e => console.log('Audio play failed:', e));
            }
        }, 8000);
    }

    triggerEliminationEffects();

    // Guard Tower Spotlight Effects
    function setupGuardTowerEffects() {
        const towers = document.querySelectorAll('.guard-tower');

        towers.forEach(tower => {
            tower.addEventListener('mouseenter', function () {
                const spotlight = this.querySelector('.guard-spotlight');
                spotlight.style.animation = 'spotlight-sweep 1s ease-in-out infinite';
            });

            tower.addEventListener('mouseleave', function () {
                const spotlight = this.querySelector('.guard-spotlight');
                spotlight.style.animation = 'spotlight-sweep 4s ease-in-out infinite';
            });
        });
    }

    setupGuardTowerEffects();

    // Player Number Interactions
    function setupPlayerNumberInteractions() {
        const playerNumbers = document.querySelectorAll('.player-number');

        playerNumbers.forEach(number => {
            number.addEventListener('click', function () {
                this.style.animation = 'number-pulse 0.5s ease-in-out';
                setTimeout(() => {
                    this.style.animation = 'number-pulse 4s ease-in-out infinite';
                }, 500);

                if (sfxEnabled) {
                    const numberSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                    numberSound.play().catch(e => console.log('Audio play failed:', e));
                }
            });
        });
    }

    setupPlayerNumberInteractions();

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Check for saved theme preference or default to light
    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', function () {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Add animation effect
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    });

    // Parallax Effects
    const parallaxLayers = document.querySelectorAll('.parallax-layer');
    const floatingParticles = document.querySelectorAll('.particle');
    const stellarParticles = document.querySelectorAll('.stellar-particle');
    const plasmaOrbs = document.querySelectorAll('.plasma-orb');
    const energyBeams = document.querySelectorAll('.energy-beam');
    const timePortals = document.querySelectorAll('.time-portal');
    const crystalShards = document.querySelectorAll('.crystal-shard');
    const dimensionalRifts = document.querySelectorAll('.dimensional-rift');

    // Mouse movement parallax
    document.addEventListener('mousemove', function (e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        parallaxLayers.forEach((layer, index) => {
            const speed = (index + 1) * 0.1;
            const x = (mouseX - 0.5) * speed * 50;
            const y = (mouseY - 0.5) * speed * 50;
            layer.style.transform = `translate(${x}px, ${y}px)`;
        });

        // Interactive particles
        floatingParticles.forEach((particle, index) => {
            const speed = (index + 1) * 0.02;
            const x = (mouseX - 0.5) * speed * 30;
            const y = (mouseY - 0.5) * speed * 30;
            particle.style.transform = `translate(${x}px, ${y}px)`;
        });

        stellarParticles.forEach((particle, index) => {
            const speed = (index + 1) * 0.03;
            const x = (mouseX - 0.5) * speed * 20;
            const y = (mouseY - 0.5) * speed * 20;
            particle.style.transform = `translate(${x}px, ${y}px)`;
        });

        plasmaOrbs.forEach((orb, index) => {
            const speed = (index + 1) * 0.02;
            const x = (mouseX - 0.5) * speed * 25;
            const y = (mouseY - 0.5) * speed * 25;
            orb.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Simple header animations (removed problematic game card animations)
    gsap.timeline()
        .from('.parallax-header h1', {
            y: -50,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out'
        })
        .from('.parallax-header .subtitle', {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: 'power2.out'
        }, '-=0.8');

    // Ensure sections are always visible
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.add('animate-in');
        section.style.opacity = '1';
        section.style.transform = 'translateY(0)';
    });

    // Game card hover animations (simplified)
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        // Ensure cards are always visible
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';

        card.addEventListener('mouseenter', function () {
            gsap.to(this, {
                y: -12,
                scale: 1.03,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', function () {
            gsap.to(this, {
                y: 0,
                scale: 1,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });

    // Mouse trail effect
    const mouseTrail = document.getElementById('mouse-trail');
    let mouseX = 0;
    let mouseY = 0;
    let trailX = 0;
    let trailY = 0;

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateMouseTrail() {
        trailX += (mouseX - trailX) * 0.1;
        trailY += (mouseY - trailY) * 0.1;

        mouseTrail.style.left = trailX + 'px';
        mouseTrail.style.top = trailY + 'px';

        requestAnimationFrame(updateMouseTrail);
    }

    updateMouseTrail();

    // Dynamic particle generation
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';

        const floatingParticles = document.querySelector('.floating-particles');
        floatingParticles.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 20000);
    }

    // Create particles periodically
    setInterval(createParticle, 3000);

    // Interactive grid cells
    const gridCells = document.querySelectorAll('.grid-cell');
    gridCells.forEach(cell => {
        cell.addEventListener('mouseenter', function () {
            this.style.background = 'rgba(27, 184, 189, 0.2)';
            this.style.transform = 'scale(1.1)';
        });

        cell.addEventListener('mouseleave', function () {
            this.style.background = '';
            this.style.transform = '';
        });
    });

    // Energy beam interactions
    energyBeams.forEach(beam => {
        beam.addEventListener('mouseenter', function () {
            this.style.opacity = '1';
            this.style.filter = 'brightness(1.5)';
        });

        beam.addEventListener('mouseleave', function () {
            this.style.opacity = '';
            this.style.filter = '';
        });
    });

    // Time portal interactions
    timePortals.forEach(portal => {
        portal.addEventListener('mouseenter', function () {
            this.style.borderColor = 'rgba(27, 184, 189, 0.8)';
            this.style.transform = 'scale(1.2)';
        });

        portal.addEventListener('mouseleave', function () {
            this.style.borderColor = '';
            this.style.transform = '';
        });
    });

    // Crystal shard interactions
    crystalShards.forEach(shard => {
        shard.addEventListener('mouseenter', function () {
            this.style.filter = 'brightness(2) drop-shadow(0 0 10px rgba(27, 184, 189, 0.8))';
        });

        shard.addEventListener('mouseleave', function () {
            this.style.filter = '';
        });
    });

    // Dimensional rift interactions
    dimensionalRifts.forEach(rift => {
        rift.addEventListener('mouseenter', function () {
            this.style.opacity = '1';
            this.style.transform = 'scaleX(1.5)';
        });

        rift.addEventListener('mouseleave', function () {
            this.style.opacity = '';
            this.style.transform = '';
        });
    });

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');

        notificationText.textContent = message;
        notification.className = `notification notification-${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Close notification
    const notificationClose = document.getElementById('notification-close');
    notificationClose.addEventListener('click', function () {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    });

    // Game card interactions
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            gsap.to(this, {
                y: -12,
                scale: 1.03,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', function () {
            gsap.to(this, {
                y: 0,
                scale: 1,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        card.addEventListener('click', function () {
            const gameName = this.querySelector('h2').textContent;
            showNotification(`Launching ${gameName}...`, 'success');
        });
    });

    // Play button interactions
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            gsap.to(this, {
                y: -4,
                scale: 1.05,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        button.addEventListener('mouseleave', function () {
            gsap.to(this, {
                y: 0,
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Navbar scroll effect - Disabled auto-scrolling
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    // Prevent auto-scrolling
    window.scrollTo(0, 0);

    // Force the page to stay at the top
    // Removed preventScroll function that was causing jumping behavior
    // function preventScroll() {
    //     if (window.pageYOffset > 0) {
    //         window.scrollTo(0, 0);
    //     }
    // }

    // Removed setInterval that was forcing scroll to top every 100ms
    // setInterval(preventScroll, 100);

    // Disable scroll-based navbar hiding
    /*
    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.classList.add('navbar-hidden');
        } else {
            navbar.classList.remove('navbar-hidden');
        }

        lastScrollTop = scrollTop;
    });
    */

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Loading animation
    window.addEventListener('load', function () {
        document.body.style.opacity = '1';
        showNotification('Welcome to KK Board Games!', 'info');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'd':
                    e.preventDefault();
                    themeToggle.click();
                    break;
                case 'h':
                    e.preventDefault();
                    window.location.href = '/';
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMusic();
                    break;
                case 's':
                    e.preventDefault();
                    toggleSfx();
                    break;
            }
        }
    });

    // Performance optimization
    let ticking = false;

    function updateParallax() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        parallaxLayers.forEach((layer, index) => {
            const speed = (index + 1) * 0.1;
            layer.style.transform = `translateY(${rate * speed}px)`;
        });

        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);

    // Initialize interactive grid
    function createInteractiveGrid() {
        const grid = document.querySelector('.interactive-grid');
        if (!grid) return;

        for (let i = 0; i < 400; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            grid.appendChild(cell);
        }
    }

    createInteractiveGrid();

    // Welcome message
    setTimeout(() => {
        showNotification('Explore our collection of strategic board games!', 'info');
    }, 2000);

    // Removed ScrollTrigger refresh that could cause layout issues
    // ScrollTrigger.refresh();
}); 