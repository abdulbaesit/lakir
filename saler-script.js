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

    rulesModal.addEventListener('click', function (e) {
        if (e.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
    });

    console.log('All event listeners set up');
}); 