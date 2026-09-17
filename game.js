const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const currentScoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const scoreDisplayEl = document.getElementById('score-display');

// Game Constants
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const GRAVITY = 0.25;
const FLAP_STRENGTH = -5;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_RATE = 1400; // ms
const PIPE_WIDTH = 60;
const PIPE_GAP = 170;
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const GROUND_HEIGHT = 80;

// Game States
const STATE = {
    START: 'START',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

// Initialize Canvas
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- DRAWING UTILITIES (Non-Functional, used for side effects) ---

const drawSun = (ctx) => {
    const centerX = CANVAS_WIDTH - 60;
    const centerY = 60;
    ctx.fillStyle = '#ffdb58';
    
    // Blocky sun
    for(let x = -20; x <= 20; x += 4) {
        for(let y = -20; y <= 20; y += 4) {
            if(x*x + y*y <= 400) {
                ctx.fillRect(centerX + x, centerY + y, 4, 4);
            }
        }
    }
};

const drawCloud = (ctx, x, y, scale) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const s = 4 * scale;
    // Blocky cloud clusters
    const blocks = [
        {dx: 0, dy: 0, w: 4, h: 2},
        {dx: 2, dy: -2, w: 6, h: 4},
        {dx: 8, dy: 0, w: 4, h: 2},
    ];
    blocks.forEach(b => {
        ctx.fillRect(x + b.dx*s, y + b.dy*s, b.w*s, b.h*s);
    });
};

const drawBird = (ctx, bird) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    
    const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.1));
    ctx.rotate(rotation);

    // Use a high-quality pixel-art approach directly in canvas
    // Since external image is failing, we'll implement the a refined sprite map
    const px = 4; 
    const birdMap = [
        [0, 0, 4, 4, 4, 4, 4, 0, 0],
        [0, 4, 1, 1, 1, 3, 3, 4, 0],
        [4, 1, 1, 1, 1, 3, 3, 3, 4],
        [4, 1, 1, 1, 1, 3, 4, 2, 2],
        [4, 1, 1, 1, 4, 4, 2, 2, 2],
        [0, 4, 1, 1, 4, 4, 2, 2, 4],
        [0, 0, 4, 4, 4, 4, 4, 4, 0],
    ];

    const colors = {
        1: '#f1c40f', 
        2: '#e67e22', 
        3: '#fff',    
        4: '#000'     
    };

    for (let row = 0; row < birdMap.length; row++) {
        for (let col = 0; col < birdMap[row].length; col++) {
            const colorIdx = birdMap[row][col];
            if (colorIdx !== 0) {
                ctx.fillStyle = colors[colorIdx];
                ctx.fillRect((col - 4) * px, (row - 3) * px, px, px);
            }
        }
    }
    
    ctx.restore();
};

const drawPipes = (ctx, pipes) => {
    pipes.forEach(pipe => {
        const px = 4;
        
        // Top pipe
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Top pipe shading
        ctx.fillStyle = '#a2e4b8';
        ctx.fillRect(pipe.x + px, 0, px, pipe.topHeight);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(pipe.x + PIPE_WIDTH - px, 0, px, pipe.topHeight);
        
        // Top cap
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, PIPE_WIDTH + 8, 20);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeRect(pipe.x - 4, pipe.topHeight - 20, PIPE_WIDTH + 8, 20);

        // Bottom pipe
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY - GROUND_HEIGHT);
        
        // Bottom pipe shading
        ctx.fillStyle = '#a2e4b8';
        ctx.fillRect(pipe.x + px, pipe.bottomY, px, CANVAS_HEIGHT - pipe.bottomY - GROUND_HEIGHT);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(pipe.x + PIPE_WIDTH - px, pipe.bottomY, px, CANVAS_HEIGHT - pipe.bottomY - GROUND_HEIGHT);
        
        // Bottom cap
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(pipe.x - 4, pipe.bottomY, PIPE_WIDTH + 8, 20);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeRect(pipe.x - 4, pipe.bottomY, PIPE_WIDTH + 8, 20);
    });
};

const drawGround = (ctx) => {
    // Grass
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Blocky grass texture
    ctx.fillStyle = '#27ae60';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
        ctx.fillRect(i, CANVAS_HEIGHT - GROUND_HEIGHT, 10, 10);
    }
    
    // Soil
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
    
    // Soil detail
    ctx.fillStyle = '#d35400';
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.fillRect(i + 10, CANVAS_HEIGHT - 20, 20, 10);
    }
};

// --- GAME LOGIC ---

// Global State
let gameState = {
    status: STATE.START,
    bird: {
        x: 50,
        y: CANVAS_HEIGHT / 2,
        velocity: 0,
        radius: 15,
        bobOffset: 0
    },
    pipes: [],
    score: 0,
    highScore: 0,
    lastPipeTime: 0,
    clouds: [
        { x: 50, y: 100, scale: 0.8, speed: 0.2 },
        { x: 200, y: 150, scale: 1.2, speed: 0.15 },
        { x: 350, y: 80, scale: 0.6, speed: 0.25 },
        { x: 100, y: 300, scale: 1.0, speed: 0.1 }
    ]
};

const birdImg = new Image();
birdImg.src = 'bird.png';

const createPipe = (timestamp) => {
    const minPipeHeight = 50;
    const maxPipeHeight = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - minPipeHeight;
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
    
    return {
        x: CANVAS_WIDTH,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        passed: false
    };
};

const updateBird = (bird) => ({
    ...bird,
    y: bird.y + bird.velocity,
    velocity: bird.velocity + GRAVITY
});

const updatePipes = (pipes) => {
    return pipes
        .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
        .filter(pipe => pipe.x + PIPE_WIDTH > -20);
};

const updateClouds = (clouds) => {
    return clouds.map(cloud => {
        let newX = cloud.x - cloud.speed;
        if (newX < -100) newX = CANVAS_WIDTH + 50;
        return { ...cloud, x: newX };
    });
};

const checkCollision = (bird, pipes) => {
    // Floor/Ceiling collision
    if (bird.y + 12 > CANVAS_HEIGHT - GROUND_HEIGHT || bird.y - 12 < 0) {
        return true;
    }

    // Pipe collision
    for (const pipe of pipes) {
        if (
            bird.x + 14 > pipe.x &&
            bird.x - 14 < pipe.x + PIPE_WIDTH
        ) {
            if (bird.y - 12 < pipe.topHeight || bird.y + 12 > pipe.bottomY) {
                return true;
            }
        }
    }
    return false;
};

const updateScore = (pipes, currentScore) => {
    let newScore = currentScore;
    for (const pipe of pipes) {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 50) {
            pipe.passed = true;
            newScore += 1;
        }
    }
    return newScore;
};

const update = (state, action, timestamp) => {
    switch (action.type) {
        case 'START':
            console.log("Game Starting...");
            return {
                ...state,
                status: STATE.PLAYING,
                bird: { 
                    x: 50, 
                    y: CANVAS_HEIGHT / 2, 
                    velocity: 0,
                    radius: 15,
                    bobOffset: 0 
                },
                pipes: [],
                score: 0,
                lastPipeTime: timestamp || performance.now()
            };

        case 'FLAP':
            if (state.status === STATE.PLAYING) {
                return {
                    ...state,
                    bird: { ...state.bird, velocity: FLAP_STRENGTH }
                };
            }
            return state;

        case 'TICK':
            if (state.status !== STATE.PLAYING) return state;

            const nextBird = updateBird(state.bird);
            let nextPipes = updatePipes(state.pipes);
            const nextClouds = updateClouds(state.clouds);

            // Spawn new pipes
            let nextLastPipeTime = state.lastPipeTime;
            if (timestamp - state.lastPipeTime > PIPE_SPAWN_RATE) {
                nextPipes.push(createPipe(timestamp));
                nextLastPipeTime = timestamp;
            }

            const nextScore = updateScore(nextPipes, state.score);
            const isColliding = checkCollision(nextBird, nextPipes);

            if (isColliding) {
                if (nextScore > state.highScore) {
                    fetch('/api/highscore', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: nextScore })
                    }).catch(err => console.error('Failed to save score:', err));
                }
                return {
                    ...state,
                    status: STATE.GAME_OVER,
                    bird: nextBird,
                    pipes: nextPipes,
                    score: nextScore,
                    highScore: Math.max(nextScore, state.highScore),
                    clouds: nextClouds
                };
            }

            return {
                ...state,
                bird: nextBird,
                pipes: nextPipes,
                score: nextScore,
                lastPipeTime: nextLastPipeTime,
                clouds: nextClouds
            };

        case 'RESET':
            return { ...state, status: STATE.START };

        default:
            return state;
    }
};

// --- RENDERING ---

const render = (state) => {
    // Background/Sky
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Sun
    drawSun(ctx);
    
    // Clouds
    state.clouds.forEach(cloud => drawCloud(ctx, cloud.x, cloud.y, cloud.scale));
    
    // Pipes
    drawPipes(ctx, state.pipes);
    
    // Ground
    drawGround(ctx);
    
    // Bird
    const birdToDraw = { ...state.bird };
    if (state.status === STATE.START) {
        birdToDraw.y += state.bird.bobOffset;
    }
    drawBird(ctx, birdToDraw);
    
    // UI
    scoreDisplayEl.textContent = state.score;
    highScoreEl.textContent = state.highScore;
    
    if (state.status === STATE.START) {
        startScreen.classList.remove('hidden');
        gameOverScreen.classList.add('hidden');
    } else if (state.status === STATE.GAME_OVER) {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        currentScoreEl.textContent = state.score;
    } else {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
    }
};


const gameLoop = (timestamp) => {
    if (gameState.status === STATE.START) {
        gameState.bird.bobOffset = Math.sin(timestamp / 200) * 10;
    }
    gameState = update(gameState, { type: 'TICK' }, timestamp);
    render(gameState);
    requestAnimationFrame(gameLoop);
};

// --- EVENTS ---

const handleFlap = () => {
    gameState = update(gameState, { type: 'FLAP' }, 0);
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleFlap();
    }
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    handleFlap();
});

startBtn.addEventListener('click', () => {
    gameState = update(gameState, { type: 'START' }, performance.now());
});

restartBtn.addEventListener('click', () => {
    gameState = update(gameState, { type: 'START' }, performance.now());
});

// --- START ---
async function initGame() {
    try {
        const response = await fetch('/api/highscore');
        const data = await response.json();
        gameState.highScore = data.score || 0;
    } catch (err) {
        console.error('Failed to load high score:', err);
    }
    
    birdImg.onload = () => {
        requestAnimationFrame(gameLoop);
    };
    
    // Fallback in case image is already cached
    if (birdImg.complete) {
        birdImg.onload();
    }
}

initGame();
