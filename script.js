const board = document.querySelector(".board");
const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");

const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");

const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");

const blockSize = 50;

const cols = Math.floor(board.clientWidth / blockSize);
const rows = Math.floor(board.clientHeight / blockSize);

let intervalId = null;
let timerIntervalId = null;

let score = 0;
let time = "00:00";
let highScore = localStorage.getItem("highScore") || 0;

highScoreElement.innerText = highScore;

/* ===================== */
/* 🔊 AUDIO SYSTEM */
/* ===================== */

let audioCtx;
const sounds = {};

async function loadSound(name, url) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  sounds[name] = await audioCtx.decodeAudioData(buffer);
}

document.addEventListener(
  "pointerdown",
  async () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      await loadSound("start", "assets/soundEffect/shuruKarteHai.mpeg");
      await loadSound("eat", "assets/soundEffect/eatFood.mpeg");
      await loadSound("gameover", "assets/soundEffect/gameover.mpeg");
      await loadSound("restart", "assets/soundEffect/restart2.mp3");
    }
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
  },
  { once: true }
);

function playSound(name) {
  if (!sounds[name]) return;
  const src = audioCtx.createBufferSource();
  src.buffer = sounds[name];
  src.connect(audioCtx.destination);
  src.start(0);
}

/* ===================== */
/* 🍎 FOOD SETUP */
/* ===================== */

const foodTypes = ["🍎", "🍊", "🍌", "🐸", "🐰", "🐛"];

/* ===================== */
/* 🐍 GAME STATE */
/* ===================== */

const blocks = {};
let snake = [{ x: 1, y: 3 }];
let direction = "right";
let food;

/* ===================== */
/* CREATE GRID */
/* ===================== */

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    blocks[`${r}-${c}`] = block;
  }
}

/* ===================== */
/* 🍎 SPAWN FOOD */
/* ===================== */

function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
      type: foodTypes[Math.floor(Math.random() * foodTypes.length)],
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  return newFood;
}

food = spawnFood();

/* ===================== */
/* 🎮 GAME LOOP */
/* ===================== */

function render() {
  // clear board visuals
  Object.values(blocks).forEach(b => {
    b.classList.remove("fill", "food", "head");
    b.innerText = "";
  });

  // draw food
  const foodBlock = blocks[`${food.x}-${food.y}`];
  foodBlock.classList.add("food");
  foodBlock.innerText = food.type;

  // calculate next head
  let head = { ...snake[0] };
  if (direction === "left") head.y--;
  if (direction === "right") head.y++;
  if (direction === "up") head.x--;
  if (direction === "down") head.x++;

  /* 🧱 WALL COLLISION */
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= rows ||
    head.y >= cols
  ) {
    endGame();
    return;
  }

  /* 🐍 SELF COLLISION */
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  /* 🍎 FOOD CONSUME */
  if (head.x === food.x && head.y === food.y) {
    playSound("eat");
    snake.unshift(head);
    food = spawnFood();

    score++;
    scoreElement.innerText = score;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore);
      highScoreElement.innerText = highScore;
    }
    return;
  }

  // normal movement
  snake.unshift(head);
  snake.pop();

  // draw snake
  snake.forEach((seg, index) => {
    const block = blocks[`${seg.x}-${seg.y}`];
    block.classList.add("fill");
    if (index === 0) block.classList.add("head");
  });
}

/* ===================== */
/* 💥 GAME OVER */
/* ===================== */

function endGame() {
  playSound("gameover");
  clearInterval(intervalId);
  clearInterval(timerIntervalId);

  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

/* ===================== */
/* ▶️ START GAME */
/* ===================== */

startButton.addEventListener("click", () => {
  playSound("start");
  modal.style.display = "none";

  intervalId = setInterval(render, 150);

  timerIntervalId = setInterval(() => {
    let [min, sec] = time.split(":").map(Number);
    sec++;
    if (sec === 60) {
      min++;
      sec = 0;
    }
    time = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    timeElement.innerText = time;
  }, 1000);
});

/* ===================== */
/* 🔄 RESTART */
/* ===================== */

restartButton.addEventListener("click", () => {
  playSound("restart");

  score = 0;
  time = "00:00";
  scoreElement.innerText = score;
  timeElement.innerText = time;

  snake = [{ x: 5, y: 5 }];
  direction = "right";
  food = spawnFood();

  modal.style.display = "none";
  startGameModal.style.display = "flex";
  gameOverModal.style.display = "none";

  intervalId = setInterval(render, 150);
});

/* ===================== */
/* 🎮 CONTROLS */
/* ===================== */

addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" && direction !== "right") direction = "left";
  if (e.key === "ArrowRight" && direction !== "left") direction = "right";
  if (e.key === "ArrowUp" && direction !== "down") direction = "up";
  if (e.key === "ArrowDown" && direction !== "up") direction = "down";
});