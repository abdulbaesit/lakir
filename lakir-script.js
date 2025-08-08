// Lakir game script - theme and music now handled by global-controls.js

// Global functions for button clicks
let gameInstance = null;

class LakirGame {
    constructor() {
        this.gameState = {
            currentPlayer: 1,
            gamePhase: 'placement', // 'placement' or 'movement'
            selectedNode: null,
            gameOver: false,
            winner: null,
            stonesPlaced: { 1: 0, 2: 0 },
            stonesLeft: { 1: 9, 2: 9 },
            board: {},
            capturedStones: { 1: 0, 2: 0 },
            claimedLines: { 1: [], 2: [] },
            captureMode: false, // New: indicates if we're in capture selection mode
            pendingCapture: null // New: stores the line that was formed for capture
        };

        // Define board connections (adjacency list)
        this.connections = {
            'outer-tl': ['outer-tm', 'outer-lm'],
            'outer-tm': ['outer-tl', 'outer-tr', 'middle-tm'],
            'outer-tr': ['outer-tm', 'outer-rm'],
            'outer-rm': ['outer-tr', 'outer-br', 'middle-rm'],
            'outer-br': ['outer-rm', 'outer-bm'],
            'outer-bm': ['outer-br', 'outer-bl', 'middle-bm'],
            'outer-bl': ['outer-bm', 'outer-lm'],
            'outer-lm': ['outer-bl', 'outer-tl', 'middle-lm'],

            'middle-tl': ['middle-tm', 'middle-lm'],
            'middle-tm': ['middle-tl', 'middle-tr', 'outer-tm', 'inner-tm'],
            'middle-tr': ['middle-tm', 'middle-rm'],
            'middle-rm': ['middle-tr', 'middle-br', 'outer-rm', 'inner-rm'],
            'middle-br': ['middle-rm', 'middle-bm'],
            'middle-bm': ['middle-br', 'middle-bl', 'outer-bm', 'inner-bm'],
            'middle-bl': ['middle-bm', 'middle-lm'],
            'middle-lm': ['middle-bl', 'middle-tl', 'outer-lm', 'inner-lm'],

            'inner-tl': ['inner-tm', 'inner-lm'],
            'inner-tm': ['inner-tl', 'inner-tr', 'middle-tm'],
            'inner-tr': ['inner-tm', 'inner-rm'],
            'inner-rm': ['inner-tr', 'inner-br', 'middle-rm'],
            'inner-br': ['inner-rm', 'inner-bm'],
            'inner-bm': ['inner-br', 'inner-bl', 'middle-bm'],
            'inner-bl': ['inner-bm', 'inner-lm'],
            'inner-lm': ['inner-bl', 'inner-tl', 'middle-lm']
        };

        // Define all possible lines (3-node combinations that can form a lakir)
        this.possibleLines = [
            // Outer square lines
            ['outer-tl', 'outer-tm', 'outer-tr'],
            ['outer-tr', 'outer-rm', 'outer-br'],
            ['outer-br', 'outer-bm', 'outer-bl'],
            ['outer-bl', 'outer-lm', 'outer-tl'],

            // Middle square lines
            ['middle-tl', 'middle-tm', 'middle-tr'],
            ['middle-tr', 'middle-rm', 'middle-br'],
            ['middle-br', 'middle-bm', 'middle-bl'],
            ['middle-bl', 'middle-lm', 'middle-tl'],

            // Inner square lines
            ['inner-tl', 'inner-tm', 'inner-tr'],
            ['inner-tr', 'inner-rm', 'inner-br'],
            ['inner-br', 'inner-bm', 'inner-bl'],
            ['inner-bl', 'inner-lm', 'inner-tl'],

            // Vertical connecting lines
            ['outer-tm', 'middle-tm', 'inner-tm'],
            ['outer-rm', 'middle-rm', 'inner-rm'],
            ['outer-bm', 'middle-bm', 'inner-bm'],
            ['outer-lm', 'middle-lm', 'inner-lm']
        ];

        this.initializeGame();
        this.setupEventListeners();
        this.setupGameEventListeners();
        this.initializeSquidGameEffects(); // New enhanced features

        // Store global reference
        gameInstance = this;
    }

    updateAudioButtons() {
        const musicBtn = document.getElementById('musicToggle');
        const sfxBtn = document.getElementById('sfxToggle');

        if (musicBtn) {
            musicBtn.classList.toggle('active', this.musicEnabled);
            const musicIcon = musicBtn.querySelector('i');
            if (musicIcon) {
                musicIcon.className = this.musicEnabled ? 'fas fa-music' : 'fas fa-music-slash';
            }
        }

        if (sfxBtn) {
            sfxBtn.classList.toggle('active', this.sfxEnabled);
            const sfxIcon = sfxBtn.querySelector('i');
            if (sfxIcon) {
                sfxIcon.className = this.sfxEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('lakir-music', this.musicEnabled.toString());
        this.updateAudioButtons();

        const bgMusic = document.getElementById('squid-game-theme');
        if (bgMusic) {
            if (this.musicEnabled) {
                bgMusic.play().catch(e => { });
            } else {
                bgMusic.pause();
            }
        }
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        localStorage.setItem('lakir-sfx', this.sfxEnabled.toString());
        this.updateAudioButtons();
    }

    playSound(soundId) {
        if (!this.sfxEnabled) return;

        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => { });
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Music toggle
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => this.toggleMusic());
        }

        // SFX toggle
        const sfxToggle = document.getElementById('sfxToggle');
        if (sfxToggle) {
            sfxToggle.addEventListener('click', () => this.toggleSfx());
        }
    }

    playThemeChangeSound() {
        // Optional sound effect for theme change
        const audio = new Audio();
        audio.volume = 0.3;
        // You can add a sound file here if desired
    }

    initializeGame() {
        // Reset board state
        this.gameState = {
            currentPlayer: 1,
            gamePhase: 'placement',
            selectedNode: null,
            gameOver: false,
            winner: null,
            stonesPlaced: { 1: 0, 2: 0 },
            stonesLeft: { 1: 9, 2: 9 },
            board: {},
            capturedStones: { 1: 0, 2: 0 },
            claimedLines: { 1: [], 2: [] },
            captureMode: false,
            pendingCapture: null
        };

        // Clear all nodes
        const nodes = document.querySelectorAll('.node');
        nodes.forEach(node => {
            node.classList.remove('player1', 'player2', 'selected', 'valid-move', 'occupied', 'invalid-placement', 'capturable');
        });

        this.updatePlayerDisplay();
        this.updateStoneCounts();
        this.updateStatus();
        this.updateInvalidPlacementIndicators();
    }

    setupGameEventListeners() {
        // Node click events
        const nodes = document.querySelectorAll('.node');
        nodes.forEach(node => {
            if (node) {
                node.addEventListener('click', () => this.handleNodeClick(node));
                node.addEventListener('mouseenter', () => this.handleNodeMouseEnter(node));
                node.addEventListener('mouseleave', () => this.handleNodeMouseLeave(node));
            }
        });

        // Button events
        const homeBtn = document.getElementById('homeBtn');
        const resetBtn = document.getElementById('resetBtn');
        const rulesBtn = document.getElementById('rulesBtn');

        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGame());
        }

        if (rulesBtn) {
            rulesBtn.addEventListener('click', () => this.showRules());
        }

        // Modal close (support both .close and .close-rules-btn) - matching tinka implementation
        const modal = document.getElementById('rulesModal');
        const closeBtn = modal.querySelector('.close') || modal.querySelector('.close-rules-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    handleNodeClick(node) {
        if (this.gameState.gameOver) return;

        const nodeId = node.id;

        // Handle capture selection mode
        if (this.gameState.captureMode) {
            this.handleCaptureSelection(node, nodeId);
            return;
        }

        if (this.gameState.gamePhase === 'placement') {
            this.handlePlacement(node, nodeId);
        } else {
            this.handleMovement(node, nodeId);
        }
    }

    handlePlacement(node, nodeId) {
        if (this.gameState.board[nodeId]) return; // Node already occupied

        // Check if placement would form a line of 3 (forbidden during placement)
        if (this.wouldFormLine(nodeId, this.gameState.currentPlayer)) {
            this.playSound('red-light-sound');
            return;
        }

        // Check if this is an invalid placement position
        if (node.classList.contains('invalid-placement')) {
            this.playSound('red-light-sound');
            return;
        }

        // Place stone
        this.gameState.board[nodeId] = this.gameState.currentPlayer;
        node.classList.add('player' + this.gameState.currentPlayer, 'occupied');
        this.playSound('green-light-sound');

        this.gameState.stonesPlaced[this.gameState.currentPlayer]++;
        this.gameState.stonesLeft[this.gameState.currentPlayer]--;

        // Check if placement phase is over
        if (this.gameState.stonesPlaced[1] >= 9 && this.gameState.stonesPlaced[2] >= 9) {
            this.gameState.gamePhase = 'movement';
        }

        this.switchPlayer();
        this.updatePlayerDisplay();
        this.updateStoneCounts();
        this.updateStatus();
        this.updateInvalidPlacementIndicators();
    }

    handleMovement(node, nodeId) {
        if (this.gameState.selectedNode) {
            // Try to move to this node
            if (this.gameState.board[nodeId]) {
                // If clicking on own stone, select it instead
                if (this.gameState.board[nodeId] === this.gameState.currentPlayer) {
                    this.clearSelection();
                    this.gameState.selectedNode = nodeId;
                    node.classList.add('selected');
                    this.showValidMoves(nodeId);
                }
                return;
            }

            // Check if move is valid (adjacent)
            if (!this.isValidMove(this.gameState.selectedNode, nodeId)) {
                return;
            }

            // Move the stone
            const fromNode = document.getElementById(this.gameState.selectedNode);
            if (fromNode) {
                fromNode.classList.remove('selected', 'player' + this.gameState.currentPlayer, 'occupied');
            }

            this.gameState.board[this.gameState.selectedNode] = null;
            this.gameState.board[nodeId] = this.gameState.currentPlayer;

            // Update visuals
            node.classList.add('player' + this.gameState.currentPlayer, 'occupied');

            // Check for line formation and capture
            const lineFormed = this.checkForLineFormationAndCapture();

            this.gameState.selectedNode = null;

            // Only switch player if no line was formed (capture gives extra turn)
            if (!lineFormed) {
                this.switchPlayer();
            }

            this.updatePlayerDisplay();
            this.updateStoneCounts();
            this.updateStatus();
            this.checkWinCondition();
        } else {
            // Select node for movement
            if (this.gameState.board[nodeId] === this.gameState.currentPlayer) {
                this.gameState.selectedNode = nodeId;
                node.classList.add('selected');
                this.showValidMoves(nodeId);
            }
        }
    }

    isValidMove(fromNode, toNode) {
        return this.connections[fromNode] && this.connections[fromNode].includes(toNode);
    }

    showValidMoves(nodeId) {
        // Clear previous valid moves
        document.querySelectorAll('.valid-move').forEach(node => {
            node.classList.remove('valid-move');
        });

        // Show valid moves
        if (this.connections[nodeId]) {
            this.connections[nodeId].forEach(adjacentNode => {
                if (!this.gameState.board[adjacentNode]) {
                    const node = document.getElementById(adjacentNode);
                    if (node) {
                        node.classList.add('valid-move');
                    }
                }
            });
        }
    }

    wouldFormLine(nodeId, player) {
        // Check if placing a stone at nodeId would form a line of 3 for the player
        const tempBoard = { ...this.gameState.board };
        tempBoard[nodeId] = player;

        for (const line of this.possibleLines) {
            if (line.includes(nodeId)) {
                const stonesInLine = line.filter(pos => tempBoard[pos] === player);
                if (stonesInLine.length === 3) {
                    return true;
                }
            }
        }
        return false;
    }

    handleCaptureSelection(node, nodeId) {
        const opponentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;

        // Check if clicked node contains an opponent stone
        if (this.gameState.board[nodeId] === opponentPlayer) {
            // Perform the capture
            this.performCapture(nodeId);

            // Exit capture mode
            this.gameState.captureMode = false;
            this.gameState.pendingCapture = null;

            // Clear capturable indicators
            this.clearCapturableIndicators();

            // Continue with extra turn (don't switch player)
            this.updatePlayerDisplay();
            this.updateStoneCounts();
            this.updateStatus();
            this.checkWinCondition();
        }
    }

    clearCapturableIndicators() {
        document.querySelectorAll('.capturable').forEach(node => {
            node.classList.remove('capturable');
        });
    }

    checkForLineFormationAndCapture() {
        let lineFormed = false;

        for (const line of this.possibleLines) {
            // Check if this line is already claimed
            const lineKey = line.sort().join(',');
            if (this.gameState.claimedLines[1].includes(lineKey) ||
                this.gameState.claimedLines[2].includes(lineKey)) {
                continue;
            }

            // Check if current player has 3 stones in this line
            const playerStones = line.filter(pos => this.gameState.board[pos] === this.gameState.currentPlayer);
            if (playerStones.length === 3) {
                // Line formed! Enter capture mode
                this.enterCaptureMode(lineKey);
                lineFormed = true;
                break; // Only handle one line at a time
            }
        }

        return lineFormed;
    }

    enterCaptureMode(lineKey) {
        this.gameState.captureMode = true;
        this.gameState.pendingCapture = lineKey;

        // Find all opponent stones and make them capturable
        const opponentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        const opponentStones = Object.keys(this.gameState.board).filter(
            pos => this.gameState.board[pos] === opponentPlayer
        );

        opponentStones.forEach(stonePos => {
            const node = document.getElementById(stonePos);
            if (node) {
                node.classList.add('capturable');
            }
        });

        // Update status to indicate capture selection
        this.updateStatus();
    }

    performCapture(stoneToCapture) {
        const opponentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;

        // Remove the stone
        this.gameState.board[stoneToCapture] = null;
        this.gameState.capturedStones[opponentPlayer]++;

        // Update visual
        const capturedNode = document.getElementById(stoneToCapture);
        if (capturedNode) {
            capturedNode.classList.remove('player' + opponentPlayer, 'occupied', 'capturable');
        }

        // Claim the line
        this.gameState.claimedLines[this.gameState.currentPlayer].push(this.gameState.pendingCapture);
    }

    checkWinCondition() {
        // Check if either player has less than 3 stones
        const player1Stones = Object.values(this.gameState.board).filter(stone => stone === 1).length;
        const player2Stones = Object.values(this.gameState.board).filter(stone => stone === 2).length;

        if (player1Stones < 3) {
            this.endGame(2);
        } else if (player2Stones < 3) {
            this.endGame(1);
        }
    }

    endGame(winner) {
        this.gameState.gameOver = true;
        this.gameState.winner = winner;
        this.updateStatus();
    }

    updateInvalidPlacementIndicators() {
        // Clear all invalid placement indicators
        document.querySelectorAll('.invalid-placement').forEach(node => {
            node.classList.remove('invalid-placement');
        });

        // Only show invalid placement indicators during placement phase
        if (this.gameState.gamePhase === 'placement') {
            const nodes = document.querySelectorAll('.node');
            nodes.forEach(node => {
                const nodeId = node.id;
                // Check if this node is empty and would form a line if placed
                if (!this.gameState.board[nodeId] && this.wouldFormLine(nodeId, this.gameState.currentPlayer)) {
                    node.classList.add('invalid-placement');
                }
            });
        }
    }

    clearSelection() {
        if (this.gameState.selectedNode) {
            const selectedNode = document.getElementById(this.gameState.selectedNode);
            if (selectedNode) {
                selectedNode.classList.remove('selected');
            }
            this.clearValidMoves();
            this.gameState.selectedNode = null;
        }
    }

    clearValidMoves() {
        document.querySelectorAll('.valid-move').forEach(node => {
            node.classList.remove('valid-move');
        });
    }

    handleNodeMouseEnter(node) {
        if (this.gameState.gameOver) return;

        const nodeId = node.id;
        const player = this.gameState.board[nodeId];

        if (this.gameState.captureMode) {
            // During capture mode, opponent stones are clickable
            const opponentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
            if (player === opponentPlayer) {
                node.style.cursor = 'pointer';
            } else {
                node.style.cursor = 'default';
            }
        } else if (player) {
            if (player !== this.gameState.currentPlayer) {
                node.style.cursor = 'not-allowed';
            } else {
                node.style.cursor = 'pointer';
            }
        } else {
            node.style.cursor = 'pointer';
        }
    }

    handleNodeMouseLeave(node) {
        node.classList.remove('valid-move');
        // Don't remove invalid-placement class here as it's managed by updateInvalidPlacementIndicators
    }

    switchPlayer() {
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
        this.updateInvalidPlacementIndicators();
    }

    updatePlayerDisplay() {
        const player1Element = document.getElementById('player1');
        const player2Element = document.getElementById('player2');

        if (player1Element) {
            if (this.gameState.currentPlayer === 1) {
                player1Element.classList.add('active');
            } else {
                player1Element.classList.remove('active');
            }
        }

        if (player2Element) {
            if (this.gameState.currentPlayer === 2) {
                player2Element.classList.add('active');
            } else {
                player2Element.classList.remove('active');
            }
        }
    }

    updateStoneCounts() {
        const player1Count = document.querySelector('.player1 .stone-count');
        const player2Count = document.querySelector('.player2 .stone-count');

        if (player1Count) {
            const stonesOnBoard = Object.values(this.gameState.board).filter(stone => stone === 1).length;
            player1Count.textContent = this.gameState.stonesLeft[1] + stonesOnBoard;
        }

        if (player2Count) {
            const stonesOnBoard = Object.values(this.gameState.board).filter(stone => stone === 2).length;
            player2Count.textContent = this.gameState.stonesLeft[2] + stonesOnBoard;
        }
    }

    updateStatus() {
        const statusElement = document.querySelector('.game-status');
        if (statusElement) {
            if (this.gameState.gameOver) {
                statusElement.textContent = `Game Over! Player ${this.gameState.winner} wins!`;
            } else if (this.gameState.captureMode) {
                statusElement.textContent = `Player ${this.gameState.currentPlayer}, Select an opponent stone to capture!`;
            } else if (this.gameState.gamePhase === 'placement') {
                statusElement.textContent = `Player ${this.gameState.currentPlayer}, place your stone!`;
            } else {
                statusElement.textContent = `Player ${this.gameState.currentPlayer}, select your stone to move!`;
            }
        }
    }

    resetGame() {
        this.initializeGame();
    }

    showRules() {
        const modal = document.getElementById('rulesModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideRules() {
        const modal = document.getElementById('rulesModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Enhanced Squid Game Interactive Features
    initializeSquidGameEffects() {
        this.initializeGiantEyeTracking();
        this.initializeGameCardInteractions();
        this.initializeEliminationCounter();
        this.initializePrizeMoneyCounter();
        this.initializeGuardPatrols();
        this.initializeBloodSplatters();
        this.initializeSquidShapeInteractions();
    }

    initializeGiantEyeTracking() {
        const gameContainer = document.querySelector('.game-container');
        const leftPupil = document.querySelector('.giant-eye.eye-left .pupil');
        const rightPupil = document.querySelector('.giant-eye.eye-right .pupil');

        if (!gameContainer || !leftPupil || !rightPupil) return;

        gameContainer.addEventListener('mousemove', (e) => {
            const rect = gameContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const mouseX = e.clientX;
            const mouseY = e.clientY;

            const deltaX = (mouseX - centerX) / rect.width;
            const deltaY = (mouseY - centerY) / rect.height;

            const maxMovement = 8;
            const moveX = deltaX * maxMovement;
            const moveY = deltaY * maxMovement;

            leftPupil.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
            rightPupil.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        });
    }

    initializeGameCardInteractions() {
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.1) rotateZ(0deg)';
                card.style.opacity = '0.8';
                card.style.zIndex = '10';
                this.playSquidGameSound('card-hover');
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.zIndex = '';
            });

            card.addEventListener('click', () => {
                this.triggerGameCardEffect(index);
            });
        });
    }

    initializeEliminationCounter() {
        // Placeholder for elimination counter functionality
        const counter = document.querySelector('.elimination-counter');
        if (counter) {
            setInterval(() => {
                const currentCount = parseInt(counter.textContent) || 0;
                if (currentCount < 456) {
                    counter.textContent = currentCount + Math.floor(Math.random() * 3);
                }
            }, 5000);
        }
    }

    initializePrizeMoneyCounter() {
        // Placeholder for prize money counter functionality
        const prizeDisplay = document.querySelector('.prize-money-display');
        if (prizeDisplay) {
            let currentAmount = 0;
            const targetAmount = 45600000000; // 45.6 billion won
            const increment = targetAmount / 1000;

            const countUp = () => {
                if (currentAmount < targetAmount) {
                    currentAmount += increment;
                    prizeDisplay.textContent = `₩${Math.floor(currentAmount).toLocaleString()}`;
                    setTimeout(countUp, 50);
                }
            };

            setTimeout(countUp, 2000);
        }
    }

    initializeGuardPatrols() {
        // Placeholder for guard patrol animations
        const soldiers = document.querySelectorAll('.pink-soldier');
        soldiers.forEach((soldier, index) => {
            soldier.style.animationDelay = `${index * 0.5}s`;
        });
    }

    initializeBloodSplatters() {
        // Placeholder for blood splatter effects
        const bloodSplatters = document.querySelectorAll('.blood-splatter');
        bloodSplatters.forEach((splatter, index) => {
            splatter.addEventListener('mouseenter', () => {
                splatter.style.transform = 'scale(1.2)';
                splatter.style.opacity = '0.8';
            });
            splatter.addEventListener('mouseleave', () => {
                splatter.style.transform = '';
                splatter.style.opacity = '';
            });
        });
    }

    initializeSquidShapeInteractions() {
        // Placeholder for squid shape interactions
        const shapes = document.querySelectorAll('.squid-shape');
        shapes.forEach((shape, index) => {
            shape.addEventListener('click', () => {
                this.playSquidGameSound('shape-hover');
                shape.style.animation = 'bounce 0.5s ease-in-out';
                setTimeout(() => {
                    shape.style.animation = '';
                }, 500);
            });
        });
    }

    playSquidGameSound(type) {
        if (!this.sfxEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const frequencies = {
                'card-hover': 800,
                'shape-hover': 600,
                'red-light': 200,
                'honeycomb-crack': 400,
                'rope-strain': 150,
                'marble-clink': 1000,
                'glass-break': 1200,
                'elimination': 100
            };

            oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio context not available
        }
    }

    triggerGameCardEffect(cardIndex) {
        const effects = [
            () => this.redLightGreenLightEffect(),
            () => this.honeycombEffect(),
            () => this.tugOfWarEffect(),
            () => this.marblesEffect(),
            () => this.glassBridgeEffect(),
            () => this.squidGameEffect()
        ];

        if (effects[cardIndex]) {
            effects[cardIndex]();
        }
    }

    redLightGreenLightEffect() {
        const doll = document.querySelector('.doll-container');
        if (doll) {
            doll.style.animation = 'doll-turn 2s ease-in-out';
            this.flashScreen('#ff0000', 500);
            this.playSquidGameSound('red-light');
        }
    }

    honeycombEffect() {
        const honeycomb = document.querySelector('.honeycomb-piece');
        if (honeycomb) {
            honeycomb.style.animation = 'honeycomb-crack 1s ease-in-out';
            this.playSquidGameSound('honeycomb-crack');
        }
    }

    tugOfWarEffect() {
        const rope = document.querySelector('.tug-of-war-rope');
        if (rope) {
            rope.style.animation = 'rope-tension 2s ease-in-out';
            this.playSquidGameSound('rope-strain');
        }
    }

    marblesEffect() {
        const marbles = document.querySelectorAll('.marble');
        marbles.forEach((marble, index) => {
            setTimeout(() => {
                marble.style.animation = 'marble-roll 1s ease-in-out';
                this.playSquidGameSound('marble-clink');
            }, index * 200);
        });
    }

    glassBridgeEffect() {
        const glasses = document.querySelectorAll('.glass-panel');
        glasses.forEach((glass, index) => {
            setTimeout(() => {
                if (Math.random() > 0.5) {
                    glass.style.animation = 'glass-shatter 0.5s ease-in-out';
                    this.playSquidGameSound('glass-break');
                }
            }, index * 100);
        });
    }

    squidGameEffect() {
        const shapes = document.querySelectorAll('.squid-shape');
        shapes.forEach((shape, index) => {
            setTimeout(() => {
                shape.style.animation = 'shape-glow 2s ease-in-out';
                this.playSquidGameSound('shape-hover');
            }, index * 300);
        });
    }

    flashScreen(color, duration) {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = color;
        flash.style.opacity = '0.3';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        flash.style.transition = `opacity ${duration}ms ease-in-out`;

        document.body.appendChild(flash);

        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => {
                flash.remove();
            }, duration);
        }, 100);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new LakirGame();

    // Auto-show rules on page load
    setTimeout(() => {
        console.log('Auto-showing rules modal for Lakir...');
        const modal = document.getElementById('rulesModal');
        if (modal) {
            modal.style.display = 'block';
            console.log('Lakir rules modal displayed');
        }
    }, 800);

    // Additional rules modal event listeners
    const closeRulesBtn = document.querySelector('.close-rules-btn');
    if (closeRulesBtn) {
        closeRulesBtn.addEventListener('click', () => {
            const modal = document.getElementById('rulesModal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('rulesModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Initialize particle animation with delay variations
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        particle.style.setProperty('--delay', `${index * 0.8}s`);
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
    });

    // Add some interactive hover effects to grid cells
    const gridCells = document.querySelectorAll('.grid-cell');
    gridCells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
            cell.style.borderColor = 'rgba(27, 184, 189, 0.4)';
            cell.style.background = 'rgba(27, 184, 189, 0.05)';
        });
        cell.addEventListener('mouseleave', () => {
            cell.style.borderColor = '';
            cell.style.background = '';
        });
    });
});