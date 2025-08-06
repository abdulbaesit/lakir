class Saler1Game {
    constructor() {
        console.log('Saler1Game constructor called');
        this.nodes = ['A', 'B', 'C', 'D', 'E'];
        this.edges = [
            ['A', 'B'], ['A', 'C'], ['B', 'C'],
            ['C', 'E'], ['C', 'D']
        ];
        this.gameState = {
            board: {}, // node -> player (1 or 2)
            currentPlayer: 1,
            gamePhase: 'placement', // 'placement' or 'movement'
            selectedNode: null,
            gameOver: false,
            winner: null
        };

        this.initializeGame();
        this.setupEventListeners();
        console.log('Saler1Game initialization complete');
    }

    initializeGame() {
        console.log('initializeGame called');
        // Clear board
        this.gameState.board = {};
        this.gameState.currentPlayer = 1;
        this.gameState.gamePhase = 'placement';
        this.gameState.selectedNode = null;
        this.gameState.gameOver = false;
        this.gameState.winner = null;

        // Clear visual state
        this.clearNodeStates();
        this.updatePlayerDisplay();
        this.updateStatus();
        console.log('initializeGame complete');
    }

    setupEventListeners() {
        // Node click events
        this.nodes.forEach(nodeId => {
            const node = document.getElementById(nodeId);
            if (node) {
                node.addEventListener('click', () => this.handleNodeClick(nodeId));
                node.addEventListener('mouseenter', () => this.handleNodeMouseEnter(nodeId));
                node.addEventListener('mouseleave', () => node.style.cursor = '');
            } else {
                console.error(`Node ${nodeId} not found`);
            }
        });

        // Control buttons
        const homeBtn = document.getElementById('homeBtn');
        const resetBtn = document.getElementById('resetBtn');
        const rulesBtn = document.getElementById('rulesBtn');

        if (homeBtn) {
            homeBtn.addEventListener('click', () => window.location.href = 'index.html');
        } else {
            console.error('Home button not found');
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        } else {
            console.error('Reset button not found');
        }

        if (rulesBtn) {
            rulesBtn.addEventListener('click', () => this.showRules());
        } else {
            console.error('Rules button not found');
        }

        // Modal close
        const modal = document.getElementById('rulesModal');
        if (modal) {
            const closeBtn = modal.querySelector('.close-rules-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideRules());
            } else {
                console.error('Close button not found');
            }
            window.addEventListener('click', (e) => {
                if (e.target === modal) this.hideRules();
            });
        } else {
            console.error('Rules modal not found');
        }
    }

    handleNodeClick(nodeId) {
        if (this.gameState.gameOver) return;

        if (this.gameState.gamePhase === 'placement') {
            this.handlePlacement(nodeId);
        } else {
            this.handleMovement(nodeId);
        }
    }

    handleNodeMouseEnter(nodeId) {
        const node = document.getElementById(nodeId);
        const player = this.gameState.board[nodeId];
        if (player) {
            if (player !== this.gameState.currentPlayer) {
                node.style.cursor = 'not-allowed';
            } else {
                node.style.cursor = 'pointer';
            }
        } else {
            node.style.cursor = 'pointer';
        }
    }

    handlePlacement(nodeId) {
        if (this.gameState.board[nodeId]) return; // Node already occupied

        // Place stone
        this.gameState.board[nodeId] = this.gameState.currentPlayer;
        this.updateNodeVisual(nodeId, this.gameState.currentPlayer);

        // Check if placement phase is complete
        const placedStones = Object.keys(this.gameState.board).length;
        if (placedStones === 2) {
            this.gameState.gamePhase = 'movement';
            // Reset to Player 1 for the first movement turn
            this.gameState.currentPlayer = 1;
            this.updatePlayerDisplay();
            this.updateStatus();
        } else {
            // Switch to next player for placement
            this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
            this.updatePlayerDisplay();
            this.updateStatus();
        }
    }

    handleMovement(nodeId) {
        const currentNode = this.gameState.selectedNode;

        if (!currentNode) {
            // Select stone to move
            if (this.gameState.board[nodeId] === this.gameState.currentPlayer) {
                this.selectNode(nodeId);
            }
        } else {
            // Try to move to selected node
            if (this.isValidMove(currentNode, nodeId)) {
                this.moveStone(currentNode, nodeId);
                this.clearSelection();

                // Switch players first
                this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
                this.updatePlayerDisplay();

                // Check for win condition after switching players
                if (this.checkWinCondition()) {
                    this.endGame();
                } else {
                    this.updateStatus();
                }
            } else if (this.gameState.board[nodeId] === this.gameState.currentPlayer) {
                // Select different stone
                this.selectNode(nodeId);
            } else {
                // Invalid move, clear selection
                this.clearSelection();
            }
        }
    }

    selectNode(nodeId) {
        this.clearSelection();
        this.gameState.selectedNode = nodeId;
        document.getElementById(nodeId).classList.add('selected');

        // Show valid moves
        this.showValidMoves(nodeId);
    }

    clearSelection() {
        if (this.gameState.selectedNode) {
            document.getElementById(this.gameState.selectedNode).classList.remove('selected');
            this.clearValidMoves();
            this.gameState.selectedNode = null;
        }
    }

    isValidMove(fromNode, toNode) {
        // Check if nodes are connected
        const isConnected = this.edges.some(([a, b]) =>
            (a === fromNode && b === toNode) || (a === toNode && b === fromNode)
        );

        // Check if destination is empty
        const isDestinationEmpty = !this.gameState.board[toNode];

        return isConnected && isDestinationEmpty;
    }

    showValidMoves(fromNode) {
        this.nodes.forEach(nodeId => {
            if (this.isValidMove(fromNode, nodeId)) {
                document.getElementById(nodeId).classList.add('valid-move');
            }
        });
    }

    clearValidMoves() {
        this.nodes.forEach(nodeId => {
            document.getElementById(nodeId).classList.remove('valid-move');
        });
    }

    moveStone(fromNode, toNode) {
        // Move the stone
        this.gameState.board[toNode] = this.gameState.board[fromNode];
        delete this.gameState.board[fromNode];

        // Update visuals
        this.updateNodeVisual(fromNode, null);
        this.updateNodeVisual(toNode, this.gameState.board[toNode]);
    }

    checkWinCondition() {
        const currentPlayer = this.gameState.currentPlayer;
        return !this.hasAnyValidMoves(currentPlayer);
    }

    hasValidMoves(nodeId) {
        return this.nodes.some(targetNode => this.isValidMove(nodeId, targetNode));
    }

    hasAnyValidMoves(player) {
        // Find player's stone
        let playerNode = null;
        for (const [node, stonePlayer] of Object.entries(this.gameState.board)) {
            if (stonePlayer === player) {
                playerNode = node;
                break;
            }
        }

        if (!playerNode) return false;

        // Check if player has any valid moves from their current position
        return this.hasValidMoves(playerNode);
    }

    endGame() {
        this.gameState.gameOver = true;
        // The winner is the player who just moved (the one who trapped the other)
        this.gameState.winner = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.updateStatus();
        this.clearSelection();
    }

    updateNodeVisual(nodeId, player) {
        const node = document.getElementById(nodeId);
        const nodeContent = node.querySelector('.node-content');

        // Clear existing classes
        node.classList.remove('player1', 'player2', 'occupied');

        if (player) {
            node.classList.add(`player${player}`, 'occupied');
        } else {
            // Clear the node content
            nodeContent.style.background = '';
        }
    }

    clearNodeStates() {
        this.nodes.forEach(nodeId => {
            this.updateNodeVisual(nodeId, null);
        });
        this.clearSelection();
    }

    updatePlayerDisplay() {
        console.log('updatePlayerDisplay called, currentPlayer:', this.gameState.currentPlayer);
        const player1Element = document.getElementById('player1');
        const player2Element = document.getElementById('player2');

        console.log('Player 1 element found:', !!player1Element);
        console.log('Player 2 element found:', !!player2Element);

        if (player1Element) {
            const wasActive = player1Element.classList.contains('active');
            if (this.gameState.currentPlayer === 1) {
                player1Element.classList.add('active');
            } else {
                player1Element.classList.remove('active');
            }
            const isActive = player1Element.classList.contains('active');
            console.log('Player 1 active state changed:', wasActive, '->', isActive);
        }

        if (player2Element) {
            const wasActive = player2Element.classList.contains('active');
            if (this.gameState.currentPlayer === 2) {
                player2Element.classList.add('active');
            } else {
                player2Element.classList.remove('active');
            }
            const isActive = player2Element.classList.contains('active');
            console.log('Player 2 active state changed:', wasActive, '->', isActive);
        }
    }

    updateStatus() {
        const statusText = document.getElementById('statusText');

        if (this.gameState.gameOver) {
            statusText.textContent = `🎉 Player ${this.gameState.winner} wins!`;
            return;
        }

        if (this.gameState.gamePhase === 'placement') {
            statusText.textContent = `Player ${this.gameState.currentPlayer}, place your stone!`;
        } else {
            // Check if current player has any valid moves
            if (this.checkWinCondition()) {
                this.endGame();
                return;
            }
            statusText.textContent = `Player ${this.gameState.currentPlayer}, select your stone to move!`;
        }
    }

    resetGame() {
        this.initializeGame();
    }

    // Test function to manually switch players
    testPlayerSwitch() {
        console.log('Testing player switch...');
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        console.log('Switched to player:', this.gameState.currentPlayer);
        this.updatePlayerDisplay();
        this.updateStatus();
    }

    showRules() {
        document.getElementById('rulesModal').style.display = 'block';
    }

    hideRules() {
        document.getElementById('rulesModal').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded event fired');

    // Initialize the game
    const game = new Saler1Game();
    console.log('Game instance created:', game);

    // Set up rules modal
    const rulesBtn = document.getElementById('rulesBtn');
    const rulesModal = document.getElementById('rulesModal');
    const closeBtn = rulesModal.querySelector('.close-rules-btn');

    console.log('Rules button found:', rulesBtn);
    console.log('Rules modal found:', rulesModal);
    console.log('Close button found:', closeBtn);

    rulesBtn.addEventListener('click', function () {
        rulesModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', function () {
        rulesModal.style.display = 'none';
    });

    // Squid Game Audio Controls
    let musicEnabled = false;
    let sfxEnabled = false;

    const squidGameTheme = document.getElementById('squid-game-theme');
    const redLightSound = document.getElementById('red-light-sound');
    const greenLightSound = document.getElementById('green-light-sound');

    function toggleMusic() {
        musicEnabled = !musicEnabled;
        const musicToggle = document.getElementById('musicToggle');
        if (musicEnabled) {
            // Set volume and play
            squidGameTheme.volume = 0.3;
            squidGameTheme.play().then(() => {
                musicToggle.classList.add('active');
                musicToggle.innerHTML = '<i class="fas fa-music"></i>';
                console.log('Music started successfully');
            }).catch(e => {
                console.log('Audio play failed:', e);
                // Fallback: try to enable audio context
                if (e.name === 'NotAllowedError') {
                    console.log('Audio not allowed, user interaction required');
                }
            });
        } else {
            squidGameTheme.pause();
            musicToggle.classList.remove('active');
            musicToggle.innerHTML = '<i class="fas fa-music"></i>';
            console.log('Music paused');
        }
    }

    function toggleSfx() {
        sfxEnabled = !sfxEnabled;
        const sfxToggle = document.getElementById('sfxToggle');
        if (sfxEnabled) {
            sfxToggle.classList.add('active');
            sfxToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            sfxToggle.classList.remove('active');
            sfxToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    }

    // Audio Control Event Listeners
    const musicToggle = document.getElementById('musicToggle');
    const sfxToggle = document.getElementById('sfxToggle');

    if (musicToggle) {
        musicToggle.addEventListener('click', toggleMusic);
    }

    if (sfxToggle) {
        sfxToggle.addEventListener('click', toggleSfx);
    }

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

    // Guard Tower Effects
    function setupGuardTowerEffects() {
        const towers = document.querySelectorAll('.guard-tower');

        towers.forEach(tower => {
            const spotlight = tower.querySelector('.guard-spotlight');

            tower.addEventListener('mouseenter', function () {
                spotlight.style.animation = 'spotlight-sweep 2s ease-in-out infinite';
            });

            tower.addEventListener('mouseleave', function () {
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
                this.style.animation = 'none';
                this.offsetHeight; // Trigger reflow
                this.style.animation = 'number-pulse 4s ease-in-out infinite';

                if (sfxEnabled) {
                    const numberSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                    numberSound.play().catch(e => console.log('Audio play failed:', e));
                }
            });
        });
    }

    setupPlayerNumberInteractions();

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    console.log('Theme toggle button found:', !!themeToggle);
    console.log('HTML element found:', !!html);

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log('Saved theme:', savedTheme);
    html.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            console.log('Theme toggle clicked!');
            console.log('Current theme:', currentTheme);
            console.log('New theme:', newTheme);

            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            console.log('Theme changed to:', newTheme);
        });
        console.log('Theme toggle event listener added successfully');
    } else {
        console.error('Theme toggle button not found');
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            toggleMusic();
        }
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            toggleSfx();
        }
    });

    // Prevent auto-scrolling
    window.scrollTo(0, 0);

    // Force the page to stay at the top
    function preventScroll() {
        if (window.pageYOffset > 0) {
            window.scrollTo(0, 0);
        }
    }

    // Check for scroll every 100ms
    setInterval(preventScroll, 100);

    rulesModal.addEventListener('click', function (e) {
        if (e.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
    });

    console.log('All event listeners set up');
}); 