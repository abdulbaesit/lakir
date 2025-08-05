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

    setupEventListeners() {
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
        const closeRulesBtn = document.querySelector('.close-rules-btn');

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

        if (closeRulesBtn) {
            closeRulesBtn.addEventListener('click', () => this.hideRules());
        }

        console.log('LakirGame event listeners set up');
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
            console.log('Cannot place here - would form a line of 3');
            return;
        }

        // Check if this is an invalid placement position
        if (node.classList.contains('invalid-placement')) {
            console.log('Cannot place here - invalid placement position');
            return;
        }

        // Place stone
        this.gameState.board[nodeId] = this.gameState.currentPlayer;
        node.classList.add('player' + this.gameState.currentPlayer, 'occupied');

        this.gameState.stonesPlaced[this.gameState.currentPlayer]++;
        this.gameState.stonesLeft[this.gameState.currentPlayer]--;

        // Check if placement phase is over
        if (this.gameState.stonesPlaced[1] >= 9 && this.gameState.stonesPlaced[2] >= 9) {
            this.gameState.gamePhase = 'movement';
            console.log('Placement phase complete, movement phase begins');
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
                console.log('Invalid move - not adjacent');
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
        console.log(`Player ${this.gameState.currentPlayer} formed a line! Select an opponent stone to capture.`);
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

        console.log(`Player ${this.gameState.currentPlayer} captured stone at ${stoneToCapture} and claimed line: ${this.gameState.pendingCapture}`);
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
        console.log(`Game Over! Player ${winner} wins!`);
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
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new LakirGame();

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
});