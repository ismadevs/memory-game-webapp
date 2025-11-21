// Game state
const game = {
    sequence: [],
    playerSequence: [],
    round: 0,
    score: 0,
    bestScore: parseInt(localStorage.getItem('memoryFlowBest')) || 0,
    isPlaying: false,
    isPlayerTurn: false,
    speed: 600,
    colors: [0, 1, 2, 3]
};

// Audio context for sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Sound frequencies for each color
const sounds = {
    0: 329.63, // E4 - Blue
    1: 392.00, // G4 - Red
    2: 523.25, // C5 - Yellow
    3: 659.25  // E5 - Green
};

// DOM elements
const tiles = document.querySelectorAll('.tile');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modal = document.getElementById('modal');
const modalBtn = document.getElementById('modalBtn');
const statusText = document.getElementById('statusText');
const progressFill = document.getElementById('progressFill');

// Update UI
function updateUI() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('round').textContent = game.round;
    document.getElementById('best').textContent = game.bestScore;
}

// Update status text
function updateStatus(text) {
    statusText.textContent = text;
}

// Update progress bar
function updateProgress() {
    const progress = (game.playerSequence.length / game.sequence.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// Flash tile
function flashTile(colorIndex, duration = game.speed) {
    return new Promise(resolve => {
        const tile = document.querySelector(`[data-color="${colorIndex}"]`);
        
        tile.classList.add('active');
        playSound(sounds[colorIndex], duration / 1000);
        
        setTimeout(() => {
            tile.classList.remove('active');
            setTimeout(resolve, 100);
        }, duration);
    });
}

// Play sequence
async function playSequence() {
    game.isPlayerTurn = false;
    disableTiles();
    updateStatus(`Round ${game.round} - Watch carefully...`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (let i = 0; i < game.sequence.length; i++) {
        await flashTile(game.sequence[i]);
    }
    
    game.isPlayerTurn = true;
    game.playerSequence = [];
    updateProgress();
    enableTiles();
    updateStatus('Your turn! Repeat the sequence');
}

// Check player input
function checkPlayerInput() {
    const currentIndex = game.playerSequence.length - 1;
    
    if (game.playerSequence[currentIndex] !== game.sequence[currentIndex]) {
        gameOver();
        return;
    }
    
    updateProgress();
    
    if (game.playerSequence.length === game.sequence.length) {
        game.score += game.round * 10;
        updateUI();
        
        setTimeout(() => {
            nextRound();
        }, 800);
    }
}

// Next round
function nextRound() {
    game.round++;
    game.sequence.push(game.colors[Math.floor(Math.random() * game.colors.length)]);
    
    if (game.round % 5 === 0) {
        game.speed = Math.max(300, game.speed - 50);
    }
    
    updateUI();
    playSequence();
}

// Handle tile click
function handleTileClick(e) {
    if (!game.isPlayerTurn || !game.isPlaying) return;
    
    const tile = e.currentTarget;
    const colorIndex = parseInt(tile.dataset.color);
    
    game.playerSequence.push(colorIndex);
    
    tile.classList.add('active');
    playSound(sounds[colorIndex], 0.2);
    
    setTimeout(() => {
        tile.classList.remove('active');
    }, 200);
    
    checkPlayerInput();
}

// Disable/Enable tiles
function disableTiles() {
    tiles.forEach(tile => {
        tile.classList.add('disabled');
        tile.style.pointerEvents = 'none';
    });
}

function enableTiles() {
    tiles.forEach(tile => {
        tile.classList.remove('disabled');
        tile.style.pointerEvents = 'auto';
    });
}

// Start game
function startGame() {
    game.sequence = [];
    game.playerSequence = [];
    game.round = 0;
    game.score = 0;
    game.isPlaying = true;
    game.speed = 600;
    
    updateUI();
    hideModal();
    
    startBtn.disabled = true;
    startBtn.textContent = 'Playing...';
    
    nextRound();
}

// Game over
function gameOver() {
    game.isPlaying = false;
    game.isPlayerTurn = false;
    disableTiles();
    
    tiles.forEach(tile => {
        tile.classList.add('error');
    });
    
    playSound(130.81, 0.5);
    
    setTimeout(() => {
        tiles.forEach(tile => {
            tile.classList.remove('error');
        });
    }, 400);
    
    if (game.score > game.bestScore) {
        game.bestScore = game.score;
        localStorage.setItem('memoryFlowBest', game.bestScore);
        updateUI();
    }
    
    updateStatus('Game Over!');
    progressFill.style.width = '0%';
    
    startBtn.disabled = false;
    startBtn.textContent = 'Start Game';
    
    setTimeout(() => {
        showModal(
            'Game Over',
            `You reached round ${game.round} with a score of ${game.score}!${game.score === game.bestScore && game.score > 0 ? ' 🎉 New best score!' : ''}`,
            'Play Again'
        );
    }, 1000);
}

// Reset game
function resetGame() {
    if (game.isPlaying) {
        game.isPlaying = false;
        disableTiles();
    }
    
    game.sequence = [];
    game.playerSequence = [];
    game.round = 0;
    game.score = 0;
    game.speed = 600;
    
    updateUI();
    updateStatus('Watch the pattern and repeat it');
    progressFill.style.width = '0%';
    
    startBtn.disabled = false;
    startBtn.textContent = 'Start Game';
}

// Modal controls
function showModal(title, message, buttonText) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    modalBtn.textContent = buttonText;
    modal.classList.add('active');
}

function hideModal() {
    modal.classList.remove('active');
}

// Event listeners
tiles.forEach(tile => {
    tile.addEventListener('click', handleTileClick);
});

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);

modalBtn.addEventListener('click', () => {
    hideModal();
    if (!game.isPlaying) {
        startGame();
    }
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (!game.isPlayerTurn || !game.isPlaying) return;
    
    let colorIndex;
    switch(e.key) {
        case '1':
        case 'q':
            colorIndex = 0;
            break;
        case '2':
        case 'w':
            colorIndex = 1;
            break;
        case '3':
        case 'a':
            colorIndex = 2;
            break;
        case '4':
        case 's':
            colorIndex = 3;
            break;
        default:
            return;
    }
    
    const tile = document.querySelector(`[data-color="${colorIndex}"]`);
    if (tile) {
        tile.click();
    }
});

// Initialize
updateUI();
showModal('Memory GameApp', 'Watch the sequence of colors, then repeat them in the same order. Each round adds a new color!', 'Start Playing');
