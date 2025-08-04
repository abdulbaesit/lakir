class Lakir9Game {
    constructor() {
        this.board = this.createBoard();
        this.gameState = {
            currentPlayer: 1,
            gamePhase: 'placement', // 'placement' or 'movement'
            selectedNode: null,
            gameOver: false,
            winner: null,
            stonesPlaced: 0,
            playerStones: { 1: 9, 2: 9 }, // Stones remaining for each player
            claimedLines: { 1: new Set(), 2: new Set() } // Track which lines each player has claimed
        };

        this.initializeGame();
        this.setupEventListeners();
    }

    createBoard() {
        // Create a board with 24 positions (nodes 1-24)
        const board = {};
        for (let i = 1; i <= 24; i++) {
            board[i] = null; // null = empty, 1 = player1, 2 = player2
        }
        return board;
    }

    initializeGame() {
        // Clear board
        for (let i = 1; i <= 24; i++) {
            this.board[i] = null;
        }

        // Reset game state
        this.gameState = {
            currentPlayer: 1,
            gamePhase: 'placement',
            selectedNode: null,
            gameOver: false,
            winner: null,
            stonesPlaced: 0,
            playerStones: { 1: 9, 2: 9 },
            claimedLines: { 1: new Set(), 2: new Set() }
        };

        this.clearNodeStates();
        this.updatePlayerDisplay();
        this.updateStatus();
    }

    setupEventListeners() {
        // Node events for all 24 nodes
        for (let i = 1; i <= 24; i++) {
            const node = document.getElementById(i.toString());
            if (node) {
                node.addEventListener('click', () => this.handleNodeClick(i));
                node.addEventListener('mouseenter', () => this.handleNodeMouseEnter(i));
                node.addEventListener('mouseleave', () => node.style.cursor = '');
            }
        }

        // Control buttons
        document.getElementById('homeBtn').addEventListener('click', () => window.location.href = 'index.html');
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('rulesBtn').addEventListener('click', () => this.showRules());

        // Modal close
        const modal = document.getElementById('rulesModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => this.hideRules());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.hideRules();
        });
    }

    handleNodeMouseEnter(nodeId) {
        const node = document.getElementById(nodeId.toString());
        const player = this.board[nodeId];

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

    handleNodeClick(nodeId) {
        if (this.gameState.gameOver) return;

        if (this.gameState.gamePhase === 'placement') {
            this.handlePlacement(nodeId);
        } else {
            this.handleMovement(nodeId);
        }
    }

    handlePlacement(nodeId) {
        if (this.board[nodeId] !== null) return; // Position already occupied

        // Place stone
        this.board[nodeId] = this.gameState.currentPlayer;
        this.updateNodeVisual(nodeId, this.gameState.currentPlayer);
        this.gameState.stonesPlaced++;

        // Check for line formation and capture
        const linesFormed = this.checkLineFormation(nodeId, this.gameState.currentPlayer);
        if (linesFormed.length > 0) {
            this.handleCapture(linesFormed);
        }

        // Check if placement phase is complete
        if (this.gameState.stonesPlaced >= 18) { // 9 stones per player
            this.gameState.gamePhase = 'movement';
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
            if (this.board[nodeId] === this.gameState.currentPlayer) {
                this.selectNode(nodeId);
            }
        } else {
            // Try to move to selected node
            if (this.isValidMove(currentNode, nodeId)) {
                this.moveStone(currentNode, nodeId);

                // Check for line formation and capture
                const linesFormed = this.checkLineFormation(nodeId, this.gameState.currentPlayer);
                if (linesFormed.length > 0) {
                    this.handleCapture(linesFormed);
                } else {
                    // Switch to next player if no capture
                    this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
                    this.updatePlayerDisplay();
                }

                this.updateStatus();
            }
        }
    }

    selectNode(nodeId) {
        this.clearSelection();
        this.gameState.selectedNode = nodeId;
        document.getElementById(nodeId.toString()).classList.add('selected');
        this.showValidMoves(nodeId);
    }

    clearSelection() {
        if (this.gameState.selectedNode) {
            document.getElementById(this.gameState.selectedNode.toString()).classList.remove('selected');
            this.gameState.selectedNode = null;
        }
        this.clearValidMoves();
    }

    isValidMove(fromNodeId, toNodeId) {
        // Check if destination is empty
        if (this.board[toNodeId] !== null) return false;

        // Check if positions are adjacent (connected by a line)
        return this.areAdjacent(fromNodeId, toNodeId);
    }

    areAdjacent(node1, node2) {
        // Define valid connections based on Nine Men's Morris layout (24 nodes)
        const connections = [
            // Outer square edges
            [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1],
            // Middle square edges
            [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 9],
            // Inner square edges
            [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 24], [24, 17],
            // Midpoint connections (bridges between squares)
            [2, 10], [10, 18], [18, 22], [22, 14], [14, 6],
            [8, 16], [16, 24], [24, 20], [20, 12], [12, 4]
        ];

        return connections.some(conn =>
            (conn[0] === node1 && conn[1] === node2) ||
            (conn[0] === node2 && conn[1] === node1)
        );
    }

    showValidMoves(fromNodeId) {
        // Highlight valid moves
        for (let i = 1; i <= 24; i++) {
            if (this.board[i] === null && this.areAdjacent(fromNodeId, i)) {
                const node = document.getElementById(i.toString());
                if (node) {
                    node.style.borderColor = '#ffd700';
                    node.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.6)';
                }
            }
        }
    }

    clearValidMoves() {
        const nodes = document.querySelectorAll('.node');
        nodes.forEach(node => {
            node.style.borderColor = '';
            node.style.boxShadow = '';
        });
    }

    moveStone(fromNodeId, toNodeId) {
        // Move the stone
        this.board[toNodeId] = this.board[fromNodeId];
        this.board[fromNodeId] = null;

        // Update visual
        this.updateNodeVisual(fromNodeId, null);
        this.updateNodeVisual(toNodeId, this.gameState.currentPlayer);

        this.clearSelection();
    }

    checkLineFormation(nodeId, player) {
        const linesFormed = [];

        // Check all possible lines of 3 that include this node
        const possibleLines = this.getPossibleLines(nodeId);

        possibleLines.forEach(line => {
            if (this.checkLine(line, player)) {
                const lineKey = line.sort().join('-');
                if (!this.gameState.claimedLines[player].has(lineKey)) {
                    linesFormed.push({ nodes: line, lineKey });
                }
            }
        });

        return linesFormed;
    }

    getPossibleLines(nodeId) {
        // Define all possible lines of 3 nodes based on Nine Men's Morris layout (24 nodes)
        const allLines = [
            // Horizontal lines on each square
            [1, 2, 3], [9, 10, 11], [17, 18, 19], // Top edges
            [7, 6, 5], [15, 14, 13], [23, 22, 21], // Bottom edges

            // Vertical lines on each square
            [1, 8, 7], [9, 16, 15], [17, 24, 23], // Left edges
            [3, 4, 5], [11, 12, 13], [19, 20, 21], // Right edges

            // Diagonal lines through midpoints
            [2, 10, 18], [10, 18, 22], [18, 22, 14], [22, 14, 6],
            [8, 16, 24], [16, 24, 20], [24, 20, 12], [20, 12, 4]
        ];

        // Return only lines that contain the given node
        return allLines.filter(line => line.includes(nodeId));
    }

    checkLine(line, player) {
        // Check if all three positions are occupied by the player
        return line.every(nodeId => this.board[nodeId] === player);
    }

    handleCapture(linesFormed) {
        // Mark lines as claimed
        linesFormed.forEach(line => {
            this.gameState.claimedLines[this.gameState.currentPlayer].add(line.lineKey);
        });

        // Allow player to choose which opponent stone to capture
        const opponent = this.gameState.currentPlayer === 1 ? 2 : 1;
        const opponentStones = this.getOpponentStones(opponent);

        if (opponentStones.length > 0) {
            // For simplicity, capture the first available opponent stone
            const captureNodeId = opponentStones[0];
            this.board[captureNodeId] = null;
            this.updateNodeVisual(captureNodeId, null);
            this.gameState.playerStones[opponent]--;

            // Update stone count display
            this.updatePlayerDisplay();
        }

        // Player gets an extra turn (no player switch)
        this.updateStatus();
    }

    getOpponentStones(opponent) {
        const stones = [];
        for (let i = 1; i <= 24; i++) {
            if (this.board[i] === opponent) {
                stones.push(i);
            }
        }
        return stones;
    }

    updateNodeVisual(nodeId, player) {
        const node = document.getElementById(nodeId.toString());
        if (!node) return;

        node.className = 'node';
        if (player === 1) {
            node.classList.add('player1');
        } else if (player === 2) {
            node.classList.add('player2');
        }
    }

    clearNodeStates() {
        const nodes = document.querySelectorAll('.node');
        nodes.forEach(node => {
            node.className = 'node';
        });
    }

    updatePlayerDisplay() {
        // Update stone counts
        document.querySelector('.player1 .stone-count').textContent = `Stones: ${this.gameState.playerStones[1]}`;
        document.querySelector('.player2 .stone-count').textContent = `Stones: ${this.gameState.playerStones[2]}`;

        // Update active player highlighting
        document.querySelectorAll('.player').forEach(player => {
            player.style.opacity = '0.7';
        });

        const activePlayer = document.querySelector(`.player${this.gameState.currentPlayer}`);
        if (activePlayer) {
            activePlayer.style.opacity = '1';
        }
    }

    updateStatus() {
        const statusElement = document.getElementById('gameStatus');

        if (this.gameState.gameOver) {
            statusElement.textContent = `Game Over! ${this.gameState.winner ? `Player ${this.gameState.winner} wins!` : "It's a tie!"}`;
            return;
        }

        if (this.gameState.gamePhase === 'placement') {
            statusElement.textContent = `Player ${this.gameState.currentPlayer}, place your stone!`;
        } else {
            if (this.gameState.selectedNode) {
                statusElement.textContent = `Player ${this.gameState.currentPlayer}, select destination for your stone!`;
            } else {
                statusElement.textContent = `Player ${this.gameState.currentPlayer}, select your stone to move!`;
            }
        }
    }

    resetGame() {
        this.initializeGame();
    }

    showRules() {
        document.getElementById('rulesModal').style.display = 'block';
    }

    hideRules() {
        document.getElementById('rulesModal').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Lakir9Game();
}); 