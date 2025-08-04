class Lakir3Game {
    constructor() {
        this.board = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
        this.gameState = {
            currentPlayer: 1,
            gamePhase: 'placement', // 'placement' or 'movement'
            selectedCell: null,
            gameOver: false,
            winner: null,
            player1Stones: 3,
            player2Stones: 3,
            extraTurn: false
        };

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // Clear board
        this.board = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];

        this.gameState = {
            currentPlayer: 1,
            gamePhase: 'placement',
            selectedCell: null,
            gameOver: false,
            winner: null,
            player1Stones: 3,
            player2Stones: 3,
            extraTurn: false
        };

        // Clear visual state
        this.clearCellStates();
        this.updatePlayerDisplay();
        this.updateStoneCounts();
        this.updateStatus();
    }

    setupEventListeners() {
        // Node (cell) events
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const node = document.getElementById(`${row},${col}`);
                node.addEventListener('click', () => this.handleCellClick(row, col));
                node.addEventListener('mouseenter', () => this.handleNodeMouseEnter(row, col));
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

    handleCellClick(row, col) {
        if (this.gameState.gameOver) return;

        if (this.gameState.gamePhase === 'placement') {
            this.handlePlacement(row, col);
        } else {
            this.handleMovement(row, col);
        }
    }

    handleNodeMouseEnter(row, col) {
        const node = document.getElementById(`${row},${col}`);
        const player = this.board[row][col];
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

    handlePlacement(row, col) {
        if (this.board[row][col] !== null) return; // Cell already occupied

        // Place stone
        this.board[row][col] = this.gameState.currentPlayer;
        this.updateCellVisual(row, col, this.gameState.currentPlayer);

        // Check if placement phase is complete
        const placedStones = this.countPlacedStones();
        if (placedStones === 6) {
            this.gameState.gamePhase = 'movement';
            this.gameState.currentPlayer = 1; // Start with Player 1
            this.updatePlayerDisplay();
            this.updateStatus();
        } else {
            // Switch to next player for placement
            this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
            this.updatePlayerDisplay();
            this.updateStatus();
        }
    }

    handleMovement(row, col) {
        const selectedCell = this.gameState.selectedCell;

        if (!selectedCell) {
            // Select stone to move
            if (this.board[row][col] === this.gameState.currentPlayer) {
                this.selectCell(row, col);
            }
        } else {
            // Try to move to selected cell
            if (this.isValidMove(selectedCell.row, selectedCell.col, row, col)) {
                const captured = this.moveStone(selectedCell.row, selectedCell.col, row, col);
                this.clearSelection();

                // Check for win condition
                if (this.checkWinCondition()) {
                    this.endGame();
                    return;
                }

                // Handle extra turn after capture
                if (captured && this.hasValidMoves(row, col)) {
                    this.gameState.extraTurn = true;
                    this.selectCell(row, col); // Keep the same stone selected
                } else {
                    // Switch players
                    this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;
                    this.gameState.extraTurn = false;
                    this.updatePlayerDisplay();
                    this.updateStatus();
                }
            } else if (this.board[row][col] === this.gameState.currentPlayer) {
                // Select different stone
                this.selectCell(row, col);
            } else {
                // Invalid move, clear selection
                this.clearSelection();
            }
        }
    }

    selectCell(row, col) {
        this.clearSelection();
        this.gameState.selectedCell = { row, col };
        document.getElementById(`${row},${col}`).classList.add('selected');

        // Show valid moves
        this.showValidMoves(row, col);
    }

    clearSelection() {
        if (this.gameState.selectedCell) {
            const { row, col } = this.gameState.selectedCell;
            document.getElementById(`${row},${col}`).classList.remove('selected');
            this.clearValidMoves();
            this.gameState.selectedCell = null;
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Check if destination is empty
        if (this.board[toRow][toCol] !== null) return false;

        // Check if it's an adjacent move
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        if (rowDiff + colDiff === 1) {
            // Adjacent move
            return true;
        } else if (rowDiff + colDiff === 2 && (rowDiff === 2 || colDiff === 2)) {
            // Jump move - check if there's an opponent's stone in between
            const midRow = (fromRow + toRow) / 2;
            const midCol = (fromCol + toCol) / 2;
            const opponent = this.gameState.currentPlayer === 1 ? 2 : 1;

            return this.board[midRow][midCol] === opponent;
        }

        return false;
    }

    showValidMoves(fromRow, fromCol) {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.isValidMove(fromRow, fromCol, row, col)) {
                    document.getElementById(`${row},${col}`).classList.add('valid-move');
                }
            }
        }
    }

    clearValidMoves() {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                document.getElementById(`${row},${col}`).classList.remove('valid-move');
            }
        }
    }

    moveStone(fromRow, fromCol, toRow, toCol) {
        const player = this.board[fromRow][fromCol];
        let captured = false;

        // Check if this is a capture move
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        if (rowDiff + colDiff === 2) {
            // Capture move
            const midRow = (fromRow + toRow) / 2;
            const midCol = (fromCol + toCol) / 2;
            const opponent = player === 1 ? 2 : 1;

            if (this.board[midRow][midCol] === opponent) {
                // Remove captured stone
                this.board[midRow][midCol] = null;
                this.updateCellVisual(midRow, midCol, null);
                captured = true;

                // Update stone count
                if (opponent === 1) {
                    this.gameState.player1Stones--;
                } else {
                    this.gameState.player2Stones--;
                }
                this.updateStoneCounts();
            }
        }

        // Move the stone
        this.board[toRow][toCol] = player;
        this.board[fromRow][fromCol] = null;

        // Update visuals
        this.updateCellVisual(fromRow, fromCol, null);
        this.updateCellVisual(toRow, toCol, player);

        return captured;
    }

    hasValidMoves(row, col) {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    return true;
                }
            }
        }
        return false;
    }

    checkWinCondition() {
        return this.gameState.player1Stones === 0 || this.gameState.player2Stones === 0;
    }

    countPlacedStones() {
        let count = 0;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (this.board[row][col] !== null) {
                    count++;
                }
            }
        }
        return count;
    }

    endGame() {
        this.gameState.gameOver = true;
        this.gameState.winner = this.gameState.player1Stones === 0 ? 2 : 1;
        this.updateStatus();
        this.clearSelection();
    }

    updateCellVisual(row, col, player) {
        const node = document.getElementById(`${row},${col}`);
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

    clearCellStates() {
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                this.updateCellVisual(row, col, null);
            }
        }
        this.clearSelection();
    }

    updatePlayerDisplay() {
        document.getElementById('player1').classList.toggle('active', this.gameState.currentPlayer === 1);
        document.getElementById('player2').classList.toggle('active', this.gameState.currentPlayer === 2);
    }

    updateStoneCounts() {
        document.getElementById('player1-count').textContent = this.gameState.player1Stones;
        document.getElementById('player2-count').textContent = this.gameState.player2Stones;
    }

    updateStatus() {
        const statusText = document.getElementById('statusText');

        if (this.gameState.gameOver) {
            statusText.textContent = `🎉 Player ${this.gameState.winner} wins!`;
            return;
        }

        if (this.gameState.gamePhase === 'placement') {
            const placedStones = this.countPlacedStones();
            if (placedStones < 6) {
                statusText.textContent = `Player ${this.gameState.currentPlayer}, place your stone!`;
            }
        } else {
            if (this.gameState.extraTurn) {
                statusText.textContent = `Player ${this.gameState.currentPlayer}, you have an extra turn after capture!`;
            } else {
                statusText.textContent = `Player ${this.gameState.currentPlayer}, select your stone to move!`;
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
    new Lakir3Game();
}); 