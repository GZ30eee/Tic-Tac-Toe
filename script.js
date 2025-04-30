// DOM Elements
const selectBox = document.querySelector(".select-box");
const modeOptions = selectBox.querySelectorAll(".mode-options button");
const difficultyOptions = selectBox.querySelectorAll(".difficulty-options button");
const themeOptions = selectBox.querySelectorAll(".theme-options button");
const selectBtnX = selectBox.querySelector(".options .playerX");
const selectBtnO = selectBox.querySelector(".options .playerO");
const playBoard = document.querySelector(".play-board");
const players = document.querySelector(".players");
const allBox = document.querySelectorAll(".play-area span");
const resultBox = document.querySelector(".result-box");
const wonText = resultBox.querySelector(".won-text");
const replayBtn = document.querySelector("#replay-btn");
const homeBtn = document.querySelector("#home-btn");
const movesList = document.querySelector("#moves-list");
const resetStatsBtn = document.querySelector("#reset-stats");
const countdownEl = document.querySelector("#countdown");

// Audio elements
const placeSound = document.getElementById("place-sound");
const winSound = document.getElementById("win-sound");
const drawSound = document.getElementById("draw-sound");

// Game variables
let playerXIcon = "fas fa-times";
let playerOIcon = "far fa-circle";
let playerSign = "X";
let runBot = true;
let gameMode = "single"; // single or two-player
let difficulty = "easy"; // easy, medium, or hard
let currentPlayer = "X";
let moveCount = 0;
let gameActive = false;
let timer;
let timeLeft = 10;
let winningCombination = [];
let gameHistory = [];

// Statistics
let stats = {
    xWins: 0,
    oWins: 0,
    draws: 0
};

// Load stats from localStorage
function loadStats() {
    const savedStats = localStorage.getItem('ticTacToeStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
        updateStatsDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('ticTacToeStats', JSON.stringify(stats));
    updateStatsDisplay();
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('x-wins').textContent = stats.xWins;
    document.getElementById('o-wins').textContent = stats.oWins;
    document.getElementById('draws').textContent = stats.draws;
}

// Reset stats
resetStatsBtn.addEventListener('click', () => {
    stats = { xWins: 0, oWins: 0, draws: 0 };
    saveStats();
});

// Initialize game
window.onload = () => {
    loadStats();
    
    // Add click event to all boxes
    for (let i = 0; i < allBox.length; i++) {
        allBox[i].setAttribute("onclick", "clickedBox(this)");
    }
    
    // Game mode selection
    modeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            modeOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameMode = btn.classList.contains('single-player') ? 'single' : 'two-player';
            
            // Show/hide difficulty section based on game mode
            const difficultySection = document.querySelector('.difficulty-section');
            difficultySection.style.display = gameMode === 'single' ? 'block' : 'none';
        });
    });
    
    // Difficulty selection
    difficultyOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.classList.contains('easy')) difficulty = 'easy';
            else if (btn.classList.contains('medium')) difficulty = 'medium';
            else difficulty = 'hard';
        });
    });
    
    // Theme selection
    themeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            themeOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const theme = btn.dataset.theme;
            document.body.className = '';
            if (theme !== 'blue') {
                document.body.classList.add(`${theme}-theme`);
            }
        });
    });
}

// Player selection
selectBtnX.onclick = () => {
    selectBox.classList.add("hide");
    playBoard.classList.add("show");
    startGame();
}

selectBtnO.onclick = () => { 
    selectBox.classList.add("hide");
    playBoard.classList.add("show");
    players.setAttribute("class", "players active player");
    currentPlayer = "O";
    playerSign = "O";
    startGame();
}

// Start game
function startGame() {
    gameActive = true;
    moveCount = 0;
    gameHistory = [];
    movesList.innerHTML = '';
    startTimer();
    
    // If player chose O and it's single player mode, bot makes first move
    if (playerSign === "O" && gameMode === "single") {
        setTimeout(() => {
            bot();
        }, 1000);
    }
}

// Reset timer
function startTimer() {
    clearInterval(timer);
    timeLeft = 10;
    countdownEl.textContent = timeLeft;
    
    timer = setInterval(() => {
        timeLeft--;
        countdownEl.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            // Auto move if time runs out
            if (gameActive) {
                if ((gameMode === 'single' && currentPlayer === playerSign) || 
                    gameMode === 'two-player') {
                    // Make random move
                    const emptyBoxes = Array.from(allBox).filter(box => box.childElementCount === 0);
                    if (emptyBoxes.length > 0) {
                        const randomBox = emptyBoxes[Math.floor(Math.random() * emptyBoxes.length)];
                        clickedBox(randomBox);
                    }
                }
            }
        }
    }, 1000);
}

// Handle box click
function clickedBox(element) {
    if (!gameActive) return;
    
    // Reset timer on each move
    startTimer();
    
    moveCount++;
    const boxNumber = element.className.slice(3); // Get box number from class
    
    if (gameMode === "two-player") {
        if (currentPlayer === "O") {
            playerSign = "O";
            element.innerHTML = `<i class="${playerOIcon}"></i>`;
            players.classList.remove("active");
            element.setAttribute("id", playerSign);
            currentPlayer = "X";
        } else {
            playerSign = "X";
            element.innerHTML = `<i class="${playerXIcon}"></i>`;
            players.classList.add("active");
            element.setAttribute("id", playerSign);
            currentPlayer = "O";
        }
        
        // Add move to history
        addMoveToHistory(playerSign, boxNumber);
        
        // Play sound
        placeSound.play();
        
        element.style.pointerEvents = "none";
        selectWinner();
    } else {
        // Single player mode
        if (players.classList.contains("player")) {
            playerSign = "O";
            element.innerHTML = `<i class="${playerOIcon}"></i>`;
            players.classList.remove("active");
            element.setAttribute("id", playerSign);
            currentPlayer = "X";
        } else {
            element.innerHTML = `<i class="${playerXIcon}"></i>`;
            element.setAttribute("id", playerSign);
            players.classList.add("active");
            currentPlayer = "O";
        }
        
        // Add move to history
        addMoveToHistory(playerSign, boxNumber);
        
        // Play sound
        placeSound.play();
        
        element.style.pointerEvents = "none";
        
        // Check for winner before bot moves
        if (!selectWinner() && gameActive) {
            playBoard.style.pointerEvents = "none";
            setTimeout(() => {
                bot();
            }, 800);
        }
    }
}

// Add move to history
function addMoveToHistory(sign, boxNumber) {
    const moveText = `Move ${moveCount}: Player ${sign} placed at position ${boxNumber}`;
    gameHistory.push(moveText);
    
    const li = document.createElement('li');
    li.textContent = moveText;
    movesList.appendChild(li);
    movesList.scrollTop = movesList.scrollHeight;
}

// Bot move
function bot() {
    if (!gameActive) return;
    
    // Reset timer for bot's move
    startTimer();
    
    moveCount++;
    let array = [];
    
    // Get all empty boxes
    for (let i = 0; i < allBox.length; i++) {
        if (allBox[i].childElementCount === 0) {
            array.push(i);
        }
    }
    
    // If no empty boxes, return
    if (array.length === 0) return;
    
    let bestMove;
    
    if (difficulty === 'easy') {
        // Random move for easy difficulty
        bestMove = array[Math.floor(Math.random() * array.length)];
    } else if (difficulty === 'medium') {
        // 70% chance of making a smart move, 30% random for medium difficulty
        if (Math.random() < 0.7) {
            bestMove = findBestMove();
        } else {
            bestMove = array[Math.floor(Math.random() * array.length)];
        }
    } else {
        // Always make the best move for hard difficulty
        bestMove = findBestMove();
    }
    
    // Make the move
    const boxNumber = allBox[bestMove].className.slice(3);
    
    if (players.classList.contains("player")) { 
        playerSign = "X";
        allBox[bestMove].innerHTML = `<i class="${playerXIcon}"></i>`;
        allBox[bestMove].setAttribute("id", playerSign);
        players.classList.add("active");
        currentPlayer = "O";
    } else {
        playerSign = "O";
        allBox[bestMove].innerHTML = `<i class="${playerOIcon}"></i>`;
        players.classList.remove("active");
        allBox[bestMove].setAttribute("id", playerSign);
        currentPlayer = "X";
    }
    
    // Add bot move to history
    addMoveToHistory(playerSign, boxNumber);
    
    // Play sound
    placeSound.play();
    
    allBox[bestMove].style.pointerEvents = "none";
    playBoard.style.pointerEvents = "auto";
    selectWinner();
}

// Find best move using minimax algorithm (for medium and hard difficulties)
function findBestMove() {
    // Get current board state
    let board = [];
    for (let i = 0; i < 9; i++) {
        if (allBox[i].childElementCount === 0) {
            board[i] = '';
        } else {
            board[i] = allBox[i].id;
        }
    }
    
    // Check for winning move
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = players.classList.contains("player") ? 'X' : 'O';
            if (isWinningMove(board)) {
                return i;
            }
            board[i] = '';
        }
    }
    
    // Check for blocking move
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = players.classList.contains("player") ? 'O' : 'X';
            if (isWinningMove(board)) {
                return i;
            }
            board[i] = '';
        }
    }
    
    // Take center if available
    if (board[4] === '') {
        return 4;
    }
    
    // Take corners if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Take any available edge
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(i => board[i] === '');
    if (availableEdges.length > 0) {
        return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }
    
    // If no strategic move found, return a random empty cell
    const emptyIndices = board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// Check if current board state has a winner
function isWinningMove(board) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
}

// Get ID value of a box
function getIdVal(classname) {
    return document.querySelector(".box" + classname).id;
}

// Check if three boxes have the same sign
function checkIdSign(val1, val2, val3, sign) { 
    if(getIdVal(val1) == sign && getIdVal(val2) == sign && getIdVal(val3) == sign) {
        return true;
    }
}

// Select winner
function selectWinner() {
    const winningCombos = [
        [1, 2, 3], [4, 5, 6], [7, 8, 9], // rows
        [1, 4, 7], [2, 5, 8], [3, 6, 9], // columns
        [1, 5, 9], [3, 5, 7]             // diagonals
    ];
    
    for (let combo of winningCombos) {
        const [a, b, c] = combo;
        if (checkIdSign(a, b, c, playerSign)) {
            gameActive = false;
            clearInterval(timer);
            
            // Highlight winning combination
            winningCombination = [a, b, c];
            for (let val of winningCombination) {
                document.querySelector(".box" + val).classList.add("win");
            }
            
            // Update stats
            if (playerSign === 'X') {
                stats.xWins++;
            } else {
                stats.oWins++;
            }
            saveStats();
            
            // Play win sound
            winSound.play();
            
            setTimeout(() => {
                resultBox.classList.add("show");
                playBoard.classList.remove("show");
            }, 700);
            
            wonText.innerHTML = `Player <p>${playerSign}</p> won the game!`;
            return true;
        }
    }
    
    // Check for draw
    let isDraw = true;
    for (let i = 1; i <= 9; i++) {
        if (getIdVal(i) === "") {
            isDraw = false;
            break;
        }
    }
    
    if (isDraw) {
        gameActive = false;
        clearInterval(timer);
        
        // Update stats
        stats.draws++;
        saveStats();
        
        // Play draw sound
        drawSound.play();
        
        setTimeout(() => {
            resultBox.classList.add("show");
            playBoard.classList.remove("show");
        }, 700);
        
        wonText.textContent = "Match has been drawn!";
        return true;
    }
    
    return false;
}

// Replay button
replayBtn.onclick = () => {
    window.location.reload();
}

// Home button
homeBtn.onclick = () => {
    // Reset game state
    resultBox.classList.remove("show");
    selectBox.classList.remove("hide");
    
    // Clear the board
    allBox.forEach(box => {
        box.innerHTML = "";
        box.removeAttribute("id");
        box.style.pointerEvents = "auto";
        box.classList.remove("win");
    });
    
    // Reset players
    players.classList.remove("active");
    if (players.classList.contains("player")) {
        players.classList.remove("player");
    }
    
    // Clear move history
    movesList.innerHTML = "";
    
    // Stop timer
    clearInterval(timer);
}
