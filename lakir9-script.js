// --- Board Graph Definition (25 positions) ---
// Each node lists its directly connected neighbors (by node id)
const BOARD_CONNECTIONS = {
    1: [2, 4, 18, 20],
    2: [1, 3, 5],
    3: [2, 6, 19, 21],
    4: [1, 5, 7],
    5: [2, 4, 6, 8],
    6: [3, 5, 9],
    7: [4, 8, 15, 22],
    8: [5, 7, 9],
    9: [6, 8, 10, 23],
    10: [9, 11, 14],
    11: [10, 12, 13],
    12: [11, 16, 24],
    13: [11, 14, 17],
    14: [10, 13, 18],
    15: [7, 16, 22],
    16: [12, 15, 17],
    17: [13, 16, 21],
    18: [1, 14, 19, 25],
    19: [3, 18, 20],
    20: [1, 19, 21, 25],
    21: [3, 17, 20, 25],
    22: [7, 15, 23, 24],
    23: [9, 22, 24, 25],
    24: [12, 22, 23, 25],
    25: [18, 20, 21, 23, 24]
};

// --- Lines for "mills" (rows/columns of 3) ---
// Each array is a line of 3 positions that can be claimed for a capture
const LINES = [
    // Outer square
    [1, 2, 3], [1, 4, 7], [3, 6, 9], [7, 8, 9],
    // Middle square
    [10, 11, 12], [10, 13, 14], [12, 15, 16], [14, 17, 18],
    // Inner square
    [19, 20, 21], [19, 22, 23], [21, 24, 25], [23, 24, 25],
    // Vertical/Horizontal bridges
    [2, 5, 8], [4, 8, 12], [6, 9, 13], [8, 13, 17],
    [11, 13, 15], [13, 17, 21], [15, 18, 21], [17, 21, 25],
    // Center lines
    [18, 25, 21], [20, 25, 24], [22, 25, 23], [24, 25, 25]
    // (You may want to adjust/add lines for your exact board logic)
];

// --- Game State ---
const gameState = {
    board: {}, // nodeId: null | 1 | 2
    currentPlayer: 1,
    phase: 'placement', // or 'movement'
    stonesPlaced: { 1: 0, 2: 0 },
    stonesLeft: { 1: 9, 2: 9 },
    selectedNode: null,
    claimedLines: { 1: new Set(), 2: new Set() },
    gameOver: false,
    winner: null,
    extraTurn: false
};

// --- DOM Elements ---
const statusDiv = document.getElementById('gameStatus');
const p1Count = document.getElementById('p1-count');
const p2Count = document.getElementById('p2-count');
const nodes = Array.from(document.querySelectorAll('.node'));

// --- Initialize Board ---
function resetBoard() {
    for (let i = 1; i <= 25; i++) gameState.board[i] = null;
    gameState.currentPlayer = 1;
    gameState.phase = 'placement';
    gameState.stonesPlaced = { 1: 0, 2: 0 };
    gameState.stonesLeft = { 1: 9, 2: 9 };
    gameState.selectedNode = null;
    gameState.claimedLines = { 1: new Set(), 2: new Set() };
    gameState.gameOver = false;
    gameState.winner = null;
    gameState.extraTurn = false;
    updateUI();
}
resetBoard();

// --- UI Update ---
function updateUI() {
    nodes.forEach(node => {
        const id = parseInt(node.dataset.node);
        node.classList.remove('player1', 'player2', 'selected');
        if (gameState.board[id] === 1) node.classList.add('player1');
        if (gameState.board[id] === 2) node.classList.add('player2');
        if (gameState.selectedNode === id) node.classList.add('selected');
    });
    p1Count.textContent = `Stones: ${gameState.stonesLeft[1]}`;
    p2Count.textContent = `Stones: ${gameState.stonesLeft[2]}`;
    if (gameState.gameOver) {
        statusDiv.textContent = `Game Over! Player ${gameState.winner} wins!`;
    } else if (gameState.phase === 'placement') {
        statusDiv.textContent = `Player ${gameState.currentPlayer}, place your stone!`;
    } else {
        statusDiv.textContent = `Player ${gameState.currentPlayer}, move your stone!`;
    }
}

// --- Placement Handler ---
function handlePlacement(nodeId) {
    if (gameState.board[nodeId] !== null) return;
    const player = gameState.currentPlayer;
    gameState.board[nodeId] = player;
    gameState.stonesPlaced[player]++;
    gameState.stonesLeft[player]--;
    // Check for mill
    const lines = getLinesForNode(nodeId).filter(line => isLineFormed(line, player));
    let captured = false;
    for (const line of lines) {
        const key = line.join('-');
        if (!gameState.claimedLines[player].has(key)) {
            gameState.claimedLines[player].add(key);
            captured = true;
        }
    }
    if (captured) {
        captureOpponentStone();
        gameState.extraTurn = true;
    } else {
        gameState.extraTurn = false;
    }
    // Check if placement phase ends for this player
    if (gameState.stonesPlaced[player] === 9) {
        if (gameState.stonesPlaced[3 - player] === 9) {
            gameState.phase = 'movement';
        }
    }
    updateUI();
    if (!gameState.extraTurn) switchPlayer();
}

// --- Movement Handler ---
function handleMovement(fromId, toId) {
    if (gameState.board[fromId] !== gameState.currentPlayer) return;
    if (gameState.board[toId] !== null) return;
    if (!BOARD_CONNECTIONS[fromId].includes(toId)) return;
    gameState.board[fromId] = null;
    gameState.board[toId] = gameState.currentPlayer;
    // Check for mill
    const lines = getLinesForNode(toId).filter(line => isLineFormed(line, gameState.currentPlayer));
    let captured = false;
    for (const line of lines) {
        const key = line.join('-');
        if (!gameState.claimedLines[gameState.currentPlayer].has(key)) {
            gameState.claimedLines[gameState.currentPlayer].add(key);
            captured = true;
        }
    }
    if (captured) {
        captureOpponentStone();
        gameState.extraTurn = true;
    } else {
        gameState.extraTurn = false;
    }
    updateUI();
    if (!gameState.extraTurn) switchPlayer();
}

// --- Capture Handler ---
function captureOpponentStone() {
    // Let the player click an opponent's stone to remove
    statusDiv.textContent = `Player ${gameState.currentPlayer}, capture an opponent's stone!`;
    nodes.forEach(node => {
        const id = parseInt(node.dataset.node);
        if (gameState.board[id] === 3 - gameState.currentPlayer) {
            node.classList.add('capture-target');
            node.onclick = () => {
                gameState.board[id] = null;
                gameState.stonesLeft[3 - gameState.currentPlayer]--;
                nodes.forEach(n => n.classList.remove('capture-target'));
                updateUI();
                checkGameEnd();
                if (!gameState.gameOver) {
                    if (gameState.phase === 'placement') {
                        if (!gameState.extraTurn) switchPlayer();
                    } else {
                        if (!gameState.extraTurn) switchPlayer();
                    }
                }
            };
        }
    });
}

// --- Switch Player ---
function switchPlayer() {
    gameState.selectedNode = null;
    gameState.currentPlayer = 3 - gameState.currentPlayer;
    updateUI();
}

// --- Node Click Handler ---
nodes.forEach(node => {
    node.onclick = () => {
        if (gameState.gameOver) return;
        const id = parseInt(node.dataset.node);
        if (gameState.phase === 'placement') {
            if (gameState.board[id] === null) handlePlacement(id);
        } else {
            if (gameState.selectedNode === null) {
                if (gameState.board[id] === gameState.currentPlayer) {
                    gameState.selectedNode = id;
                    updateUI();
                }
            } else {
                if (id === gameState.selectedNode) {
                    gameState.selectedNode = null;
                    updateUI();
                } else {
                    handleMovement(gameState.selectedNode, id);
                    gameState.selectedNode = null;
                    updateUI();
                }
            }
        }
    };
});

// --- Get Lines for a Node ---
function getLinesForNode(nodeId) {
    return LINES.filter(line => line.includes(nodeId));
}

// --- Is Line Formed ---
function isLineFormed(line, player) {
    return line.every(id => gameState.board[id] === player);
}

// --- Check Game End ---
function checkGameEnd() {
    [1, 2].forEach(player => {
        if (gameState.stonesLeft[player] === 0) {
            gameState.gameOver = true;
            gameState.winner = 3 - player;
        }
        // Blocked: no valid moves
        if (gameState.phase === 'movement') {
            const hasMove = Object.entries(gameState.board)
                .filter(([id, p]) => p === player)
                .some(([id]) => BOARD_CONNECTIONS[id].some(n => gameState.board[n] === null));
            if (!hasMove) {
                gameState.gameOver = true;
                gameState.winner = 3 - player;
            }
        }
    });
    updateUI();
}

// --- Reset Button ---
document.getElementById('resetBtn').onclick = () => {
    resetBoard();
};

// --- Rules Modal ---
const rulesBtn = document.getElementById('rulesBtn');
const rulesModal = document.getElementById('rulesModal');
const closeBtn = rulesModal.querySelector('.close');
rulesBtn.onclick = () => rulesModal.style.display = 'block';
closeBtn.onclick = () => rulesModal.style.display = 'none';
window.onclick = e => { if (e.target === rulesModal) rulesModal.style.display = 'none'; };

// --- Initial UI ---
updateUI();