(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const TARGET_FPS = 60;
  const FIXED_STEP = 1 / TARGET_FPS;
  const startCard = document.querySelector("#startCard");
  const resultCard = document.querySelector("#resultCard");
  const startButton = document.querySelector("#startButton");
  const restartButton = document.querySelector("#restartButton");
  const pauseButton = document.querySelector("#pauseButton");
  const heartsEl = document.querySelector("#hearts");
  const coinCountEl = document.querySelector("#coinCount");
  const progressFill = document.querySelector("#progressFill");
  const progressRunner = document.querySelector("#progressRunner");
  const toast = document.querySelector("#toast");
  const toastText = document.querySelector("#toastText");

  const COLORS = {
    ink: "#17203b",
    paper: "#fffdf2",
    sun: "#ffcf4a",
    coral: "#ff765f",
    mint: "#7bd6ae",
    mintDark: "#3e9d7d",
    skyTop: "#8fd8e3",
    skyBottom: "#e8f0cf",
    hillFar: "#8ec9b1",
    hillNear: "#5da886",
    dirt: "#bc7452",
    dirtDark: "#864f44",
    lavender: "#a8a4d6",
  };

  const world = {
    width: 6720,
    floor: 560,
    goalX: 6465,
    solids: [],
    hazards: [],
    coins: [],
    enemies: [],
    checkpoints: [],
    particles: [],
    leaves: [],
  };

  const state = {
    mode: "ready",
    coins: 0,
    lives: 3,
    elapsed: 0,
    cameraX: 0,
    shake: 0,
    toastTimer: 0,
    checkpointX: 90,
    checkpointY: 360,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: 1,
    lastTime: 0,
    accumulator: 0,
  };

  const input = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  };

  const player = {
    x: 90,
    y: 360,
    prevY: 360,
    width: 34,
    height: 46,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: false,
    coyote: 0,
    jumpBuffer: 0,
    invulnerable: 0,
    runCycle: 0,
    squash: 0,
  };

  function addSolid(x, y, width, height, type = "ground") {
    world.solids.push({ x, y, width, height, type });
  }

  function addSpikes(x, y, count = 3) {
    world.hazards.push({ x, y, width: count * 24, height: 24, count, type: "spikes" });
  }

  function addCoin(x, y) {
    world.coins.push({ x, y, radius: 11, collected: false, phase: Math.random() * Math.PI * 2 });
  }

  function coinArc(x, y, count, spacing = 42, curve = 0) {
    for (let i = 0; i < count; i += 1) {
      const offset = i - (count - 1) / 2;
      addCoin(x + i * spacing, y - Math.abs(offset) * curve);
    }
  }

  function addEnemy(x, y, minX, maxX, speed = 58, color = COLORS.coral) {
    world.enemies.push({
      x,
      y,
      width: 38,
      height: 32,
      minX,
      maxX,
      speed,
      direction: -1,
      alive: true,
      phase: Math.random() * Math.PI * 2,
      color,
    });
  }

  function buildLevel() {
    world.solids.length = 0;
    world.hazards.length = 0;
    world.coins.length = 0;
    world.enemies.length = 0;
    world.checkpoints.length = 0;
    world.particles.length = 0;

    // Ground islands
    addSolid(-120, 520, 1150, 300);
    addSolid(1145, 535, 750, 300);
    addSolid(2020, 500, 680, 320);
    addSolid(2820, 545, 1060, 300);
    addSolid(4000, 510, 770, 320);
    addSolid(4890, 550, 760, 290);
    addSolid(5785, 515, 1050, 320);

    // Floating platforms
    [
      [380, 418, 130],
      [590, 335, 125],
      [810, 400, 120],
      [1055, 440, 115],
      [1280, 405, 145],
      [1500, 320, 150],
      [1735, 395, 125],
      [1925, 425, 120],
      [2190, 370, 130],
      [2395, 285, 145],
      [2600, 390, 130],
      [2745, 455, 105],
      [3010, 410, 135],
      [3265, 325, 150],
      [3520, 405, 120],
      [3755, 350, 145],
      [3910, 440, 110],
      [4220, 390, 140],
      [4470, 300, 145],
      [4690, 405, 115],
      [4810, 455, 100],
      [5070, 405, 135],
      [5300, 315, 155],
      [5530, 410, 125],
      [5680, 455, 110],
      [5970, 375, 150],
      [6210, 295, 150],
    ].forEach(([x, y, width]) => addSolid(x, y, width, 24, "platform"));

    // Hazards
    addSpikes(720, 496, 3);
    addSpikes(1570, 511, 4);
    addSpikes(2260, 476, 3);
    addSpikes(3090, 521, 4);
    addSpikes(3655, 521, 3);
    addSpikes(4300, 486, 3);
    addSpikes(5140, 526, 4);
    addSpikes(6040, 491, 3);

    // Coin trails
    coinArc(160, 458, 4, 42, 5);
    coinArc(405, 370, 3, 42, 4);
    coinArc(610, 285, 3, 42, 5);
    coinArc(850, 350, 3, 45, 4);
    coinArc(1055, 390, 5, 43, 13);
    coinArc(1310, 355, 3, 45, 4);
    coinArc(1520, 270, 4, 42, 5);
    coinArc(1760, 345, 4, 42, 5);
    coinArc(2060, 440, 4, 45, 9);
    coinArc(2210, 320, 3, 44, 5);
    coinArc(2410, 235, 4, 42, 4);
    coinArc(2650, 340, 4, 44, 10);
    coinArc(2880, 490, 4, 43, 7);
    coinArc(3040, 360, 3, 44, 4);
    coinArc(3290, 275, 4, 42, 4);
    coinArc(3540, 355, 3, 42, 4);
    coinArc(3780, 300, 4, 42, 5);
    coinArc(4100, 450, 4, 44, 8);
    coinArc(4245, 340, 3, 42, 4);
    coinArc(4490, 250, 4, 42, 5);
    coinArc(4710, 355, 3, 44, 4);
    coinArc(4930, 495, 4, 44, 10);
    coinArc(5090, 355, 3, 44, 4);
    coinArc(5320, 265, 4, 42, 5);
    coinArc(5550, 360, 3, 44, 4);
    coinArc(5800, 455, 4, 44, 8);
    coinArc(5995, 325, 4, 42, 4);
    coinArc(6230, 245, 4, 42, 4);
    coinArc(6440, 440, 4, 42, 8);

    // Patrolling critters
    addEnemy(870, 488, 790, 970);
    addEnemy(1370, 503, 1210, 1510, 63, COLORS.lavender);
    addEnemy(1810, 503, 1660, 1860);
    addEnemy(2320, 468, 2110, 2570, 68, COLORS.lavender);
    addEnemy(3350, 513, 3200, 3500);
    addEnemy(3720, 513, 3560, 3810, 65, COLORS.lavender);
    addEnemy(4350, 478, 4160, 4620);
    addEnemy(5250, 518, 5010, 5510, 70, COLORS.lavender);
    addEnemy(6110, 483, 5920, 6300, 72);

    world.checkpoints.push(
      { x: 2860, y: 455, active: false },
      { x: 4895, y: 460, active: false },
    );

    if (!world.leaves.length) {
      for (let i = 0; i < 34; i += 1) {
        world.leaves.push({
          x: Math.random() * world.width,
          y: 160 + Math.random() * 330,
          size: 3 + Math.random() * 5,
          phase: Math.random() * Math.PI * 2,
          speed: 7 + Math.random() * 11,
        });
      }
    }
  }

  function resetGame() {
    buildLevel();
    Object.assign(player, {
      x: 90,
      y: 360,
      prevY: 360,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyote: 0,
      jumpBuffer: 0,
      invulnerable: 0,
      runCycle: 0,
      squash: 0,
    });
    state.coins = 0;
    state.lives = 3;
    state.elapsed = 0;
    state.cameraX = 0;
    state.shake = 0;
    state.checkpointX = 90;
    state.checkpointY = 360;
    updateHUD();
  }

  function beginGame() {
    if (state.mode === "ready" || state.mode === "won" || state.mode === "lost") {
      resetGame();
    }
    state.mode = "playing";
    startCard.classList.remove("is-visible");
    resultCard.classList.remove("is-visible");
    pauseButton.classList.remove("is-paused");
    pauseButton.setAttribute("aria-label", "Pause game");
  }

  function togglePause() {
    if (state.mode === "playing") {
      state.mode = "paused";
      startCard.querySelector(".card-kicker").innerHTML = "<span></span> TRAIL PAUSED <span></span>";
      startCard.querySelector("h1").innerHTML = "Catch your<br><em>breath</em>";
      startCard.querySelector("p").textContent = "The valley will wait right here for you.";
      startButton.querySelector("span").textContent = "KEEP HOPPING";
      startCard.classList.add("is-visible");
      pauseButton.classList.add("is-paused");
      pauseButton.setAttribute("aria-label", "Resume game");
    } else if (state.mode === "paused") {
      state.mode = "playing";
      startCard.classList.remove("is-visible");
      pauseButton.classList.remove("is-paused");
      pauseButton.setAttribute("aria-label", "Pause game");
    }
  }

  function restoreStartCard() {
    startCard.querySelector(".card-kicker").innerHTML = "<span></span> TRAIL 01 <span></span>";
    startCard.querySelector("h1").innerHTML = "Mosslight<br><em>Valley</em>";
    startCard.querySelector("p").textContent =
      "Dash through the valley, bounce on critters, and reach the lantern gate.";
    startButton.querySelector("span").textContent = "START ADVENTURE";
  }

  function showToast(message) {
    toastText.textContent = message;
    toast.classList.add("is-visible");
    state.toastTimer = 2.2;
  }

  function updateHUD() {
    heartsEl.innerHTML = "";
    for (let i = 0; i < 3; i += 1) {
      const heart = document.createElement("span");
      heart.className = `heart${i >= state.lives ? " is-empty" : ""}`;
      heartsEl.appendChild(heart);
    }
    heartsEl.setAttribute("aria-label", `${state.lives} ${state.lives === 1 ? "life" : "lives"}`);
    coinCountEl.textContent = String(state.coins).padStart(2, "0");
    const progress = Math.max(0, Math.min(100, (player.x / world.goalX) * 100));
    progressFill.style.width = `${progress}%`;
    progressRunner.style.left = `${progress}%`;
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function burst(x, y, color, count = 8, speed = 140) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const velocity = speed * (0.55 + Math.random() * 0.7);
      world.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: 3 + Math.random() * 5,
        color,
      });
    }
  }

  function respawn() {
    player.x = state.checkpointX;
    player.y = state.checkpointY;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 1.8;
    state.cameraX = Math.max(0, player.x - state.width * 0.35);
  }

  function hurtPlayer() {
    if (player.invulnerable > 0 || state.mode !== "playing") return;
    burst(player.x + player.width / 2, player.y + player.height / 2, COLORS.coral, 12, 180);
    state.lives -= 1;
    state.shake = 0.35;
    updateHUD();
    if (state.lives <= 0) {
      finishGame(false);
    } else {
      showToast("Ouch — back to the lantern!");
      respawn();
    }
  }

  function finishGame(won) {
    state.mode = won ? "won" : "lost";
    const title = document.querySelector("#resultTitle");
    const kicker = document.querySelector("#resultKicker");
    const text = document.querySelector("#resultText");
    document.querySelector("#resultCoins").textContent = String(state.coins).padStart(2, "0");
    document.querySelector("#resultTime").textContent = formatTime(state.elapsed);
    document.querySelector("#resultIcon").textContent = won ? "✦" : "↟";
    if (won) {
      kicker.textContent = "TRAIL COMPLETE";
      title.innerHTML = "Valley<br><em>crossed!</em>";
      text.textContent =
        state.coins >= 55 ? "The whole valley is glowing. Brilliant run!" : "The lantern gate is lit. What a lovely run.";
      burst(player.x, player.y, COLORS.sun, 24, 230);
    } else {
      kicker.textContent = "TRAIL ENDED";
      title.innerHTML = "One more<br><em>hop?</em>";
      text.textContent = "Those brambles are prickly. Give the valley another go.";
    }
    setTimeout(() => resultCard.classList.add("is-visible"), 300);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function updatePlayer(dt) {
    player.prevY = player.y;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.coyote = player.grounded ? 0.11 : Math.max(0, player.coyote - dt);
    player.jumpBuffer = input.jumpPressed ? 0.13 : Math.max(0, player.jumpBuffer - dt);
    input.jumpPressed = false;

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const targetSpeed = direction * 285;
    const acceleration = player.grounded ? 2050 : 1150;
    const deceleration = player.grounded ? 2350 : 520;

    if (direction) {
      const delta = targetSpeed - player.vx;
      player.vx += Math.sign(delta) * Math.min(Math.abs(delta), acceleration * dt);
      player.facing = direction;
      player.runCycle += Math.abs(player.vx) * dt * 0.035;
    } else {
      const amount = Math.min(Math.abs(player.vx), deceleration * dt);
      player.vx -= Math.sign(player.vx) * amount;
    }

    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -660;
      player.grounded = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.squash = -0.16;
      burst(player.x + player.width / 2, player.y + player.height, COLORS.paper, 5, 65);
    }

    if (!input.jump && player.vy < -250) player.vy += 1500 * dt;
    player.vy = Math.min(player.vy + 1780 * dt, 900);
    player.squash += (0 - player.squash) * Math.min(1, dt * 12);

    player.x += player.vx * dt;
    player.x = Math.max(-20, Math.min(world.width - player.width, player.x));
    for (const solid of world.solids) {
      if (!intersects(player, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.width;
      else if (player.vx < 0) player.x = solid.x + solid.width;
      player.vx = 0;
    }

    player.y += player.vy * dt;
    const wasGrounded = player.grounded;
    player.grounded = false;
    for (const solid of world.solids) {
      if (!intersects(player, solid)) continue;
      if (player.vy >= 0 && player.prevY + player.height <= solid.y + 10) {
        player.y = solid.y - player.height;
        player.vy = 0;
        player.grounded = true;
        if (!wasGrounded) {
          player.squash = 0.14;
          if (Math.abs(player.vx) > 90) {
            burst(player.x + player.width / 2, player.y + player.height, COLORS.paper, 4, 45);
          }
        }
      } else if (player.vy < 0 && player.prevY >= solid.y + solid.height - 8) {
        player.y = solid.y + solid.height;
        player.vy = 30;
      }
    }

    if (player.y > state.height + 220 || player.y > 820) hurtPlayer();

    for (const hazard of world.hazards) {
      const hitbox = {
        x: hazard.x + 5,
        y: hazard.y + 7,
        width: hazard.width - 10,
        height: hazard.height - 7,
      };
      if (intersects(player, hitbox)) hurtPlayer();
    }

    for (const coin of world.coins) {
      if (coin.collected) continue;
      const dx = player.x + player.width / 2 - coin.x;
      const dy = player.y + player.height / 2 - coin.y;
      if (dx * dx + dy * dy < 30 * 30) {
        coin.collected = true;
        state.coins += 1;
        burst(coin.x, coin.y, COLORS.sun, 7, 105);
        updateHUD();
      }
    }

    for (const checkpoint of world.checkpoints) {
      if (!checkpoint.active && player.x + player.width > checkpoint.x) {
        world.checkpoints.forEach((item) => {
          item.active = false;
        });
        checkpoint.active = true;
        state.checkpointX = checkpoint.x + 28;
        state.checkpointY = checkpoint.y - player.height;
        burst(checkpoint.x + 8, checkpoint.y - 35, COLORS.sun, 13, 145);
        showToast("Lantern checkpoint lit!");
      }
    }

    if (player.x + player.width >= world.goalX) finishGame(true);
  }

  function updateEnemies(dt) {
    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;
      enemy.x += enemy.speed * enemy.direction * dt;
      if (enemy.x <= enemy.minX) {
        enemy.x = enemy.minX;
        enemy.direction = 1;
      } else if (enemy.x + enemy.width >= enemy.maxX) {
        enemy.x = enemy.maxX - enemy.width;
        enemy.direction = -1;
      }
      enemy.phase += dt * 4;

      if (!intersects(player, enemy)) continue;
      const previousBottom = player.prevY + player.height;
      if (player.vy > 80 && previousBottom <= enemy.y + 14) {
        enemy.alive = false;
        player.vy = -470;
        player.grounded = false;
        player.squash = -0.18;
        burst(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 12, 155);
      } else {
        hurtPlayer();
      }
    }
  }

  function updateParticles(dt) {
    for (let i = world.particles.length - 1; i >= 0; i -= 1) {
      const particle = world.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        world.particles.splice(i, 1);
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 380 * dt;
      particle.vx *= 0.985;
    }
  }

  function update(dt) {
    if (state.mode !== "playing") {
      updateParticles(dt);
      return;
    }
    state.elapsed += dt;
    updatePlayer(dt);
    updateEnemies(dt);
    updateParticles(dt);

    const targetCamera = player.x - state.width * 0.34;
    const maxCamera = Math.max(0, world.width - state.width);
    state.cameraX += (Math.max(0, Math.min(maxCamera, targetCamera)) - state.cameraX) * Math.min(1, dt * 5.5);
    state.shake = Math.max(0, state.shake - dt);
    if (state.toastTimer > 0) {
      state.toastTimer -= dt;
      if (state.toastTimer <= 0) toast.classList.remove("is-visible");
    }
    updateHUD();
  }

  function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function roundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, r);
  }

  function drawBackground(time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, COLORS.skyTop);
    gradient.addColorStop(0.62, COLORS.skyBottom);
    gradient.addColorStop(1, "#f2e4bd");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    // Sun and orbit lines
    const sunX = state.width * 0.78 - state.cameraX * 0.02;
    const sunY = Math.min(260, state.height * 0.3);
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = COLORS.paper;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.arc(sunX, sunY, 55 + i * 31, 0.15, Math.PI * 1.45);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawCloud(130 - state.cameraX * 0.07, 195, 0.8);
    drawCloud(610 - state.cameraX * 0.05, 260, 0.58);
    drawCloud(1060 - state.cameraX * 0.065, 165, 0.7);
    drawCloud(1520 - state.cameraX * 0.05, 230, 0.52);
    drawCloud(2110 - state.cameraX * 0.06, 175, 0.72);
    drawCloud(2860 - state.cameraX * 0.05, 245, 0.58);
    drawCloud(3700 - state.cameraX * 0.065, 180, 0.68);
    drawCloud(4580 - state.cameraX * 0.05, 220, 0.54);
    drawCloud(5480 - state.cameraX * 0.06, 165, 0.7);

    const horizon = Math.min(state.height - 130, 495);
    drawHillLayer(horizon + 20, 120, COLORS.hillFar, 0.12, 0.63);
    drawHillLayer(horizon + 48, 95, COLORS.hillNear, 0.23, 0.82);

    // Floating leaves in the air
    ctx.save();
    for (const leaf of world.leaves) {
      const x = leaf.x - state.cameraX * 0.32;
      if (x < -30 || x > state.width + 30) continue;
      const y = leaf.y + Math.sin(time * 0.001 + leaf.phase) * 13;
      ctx.translate(x, y);
      ctx.rotate(Math.sin(time * 0.0014 + leaf.phase) * 0.8);
      ctx.fillStyle = "rgba(255,253,242,.55)";
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size * 1.6, leaf.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }
    ctx.restore();
  }

  function drawCloud(x, y, scale) {
    const wrappedX = ((x + 200) % (world.width * 0.14 + state.width + 400)) - 200;
    ctx.save();
    ctx.translate(wrappedX, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255,253,242,.68)";
    ctx.beginPath();
    ctx.arc(0, 5, 30, 0, Math.PI * 2);
    ctx.arc(35, -7, 41, 0, Math.PI * 2);
    ctx.arc(75, 10, 27, 0, Math.PI * 2);
    ctx.roundRect(-18, 5, 112, 35, 18);
    ctx.fill();
    ctx.restore();
  }

  function drawHillLayer(baseY, amplitude, color, parallax, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-80, state.height);
    ctx.lineTo(-80, baseY);
    const offset = -(state.cameraX * parallax) % 620;
    for (let x = offset - 620; x < state.width + 700; x += 620) {
      ctx.bezierCurveTo(x + 90, baseY - amplitude * 0.25, x + 125, baseY - amplitude, x + 260, baseY - amplitude);
      ctx.bezierCurveTo(x + 395, baseY - amplitude, x + 470, baseY + 5, x + 620, baseY);
    }
    ctx.lineTo(state.width + 100, state.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSolid(solid) {
    const x = solid.x - state.cameraX;
    if (x + solid.width < -50 || x > state.width + 50) return;
    if (solid.type === "platform") {
      ctx.fillStyle = COLORS.paper;
      roundedRect(x, solid.y, solid.width, solid.height, 11);
      ctx.fill();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = COLORS.mint;
      roundedRect(x + 4, solid.y + 4, solid.width - 8, 8, 6);
      ctx.fill();
      for (let i = 16; i < solid.width - 10; i += 30) {
        ctx.strokeStyle = "rgba(23,32,59,.2)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + i, solid.y + 15);
        ctx.lineTo(x + i + 7, solid.y + 19);
        ctx.stroke();
      }
      return;
    }

    ctx.fillStyle = COLORS.dirt;
    ctx.fillRect(x, solid.y + 13, solid.width, solid.height);
    ctx.fillStyle = COLORS.mint;
    ctx.fillRect(x, solid.y, solid.width, 18);
    ctx.fillStyle = "#9be0b6";
    ctx.fillRect(x, solid.y, solid.width, 6);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, solid.y);
    ctx.lineTo(x + solid.width, solid.y);
    ctx.stroke();

    const start = Math.max(0, Math.floor((state.cameraX - solid.x) / 52) * 52);
    for (let dx = start + 20; dx < Math.min(solid.width, start + state.width + 100); dx += 52) {
      const row = Math.floor(dx / 52);
      ctx.fillStyle = row % 2 ? "rgba(255,207,74,.22)" : "rgba(23,32,59,.12)";
      ctx.beginPath();
      ctx.arc(x + dx, solid.y + 50 + (row % 3) * 23, 4 + (row % 2), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(23,32,59,.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + dx + 14, solid.y + 80 + (row % 2) * 18);
      ctx.lineTo(x + dx + 23, solid.y + 86 + (row % 2) * 18);
      ctx.stroke();
    }
  }

  function drawSpikes(hazard) {
    const x = hazard.x - state.cameraX;
    if (x + hazard.width < -30 || x > state.width + 30) return;
    for (let i = 0; i < hazard.count; i += 1) {
      const spikeX = x + i * 24;
      ctx.fillStyle = i % 2 ? COLORS.coral : "#ff9473";
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(spikeX, hazard.y + hazard.height);
      ctx.quadraticCurveTo(spikeX + 12, hazard.y - 4, spikeX + 24, hazard.y + hazard.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawCoin(coin, time) {
    if (coin.collected) return;
    const x = coin.x - state.cameraX;
    if (x < -30 || x > state.width + 30) return;
    const bob = Math.sin(time * 0.004 + coin.phase) * 4;
    const squash = 0.55 + Math.abs(Math.sin(time * 0.0035 + coin.phase)) * 0.45;
    ctx.save();
    ctx.translate(x, coin.y + bob);
    ctx.scale(squash, 1);
    ctx.fillStyle = COLORS.sun;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.paper;
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", 0, 1);
    ctx.restore();
  }

  function drawEnemy(enemy) {
    if (!enemy.alive) return;
    const x = enemy.x - state.cameraX;
    if (x + enemy.width < -30 || x > state.width + 30) return;
    const bob = Math.sin(enemy.phase) * 1.5;
    ctx.save();
    ctx.translate(x + enemy.width / 2, enemy.y + enemy.height / 2 + bob);
    ctx.scale(enemy.direction, 1);

    // Little back spikes
    ctx.fillStyle = COLORS.sun;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-12 + i * 9, -12);
      ctx.lineTo(-7 + i * 9, -22 - (i % 2) * 3);
      ctx.lineTo(-1 + i * 9, -11);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 1, 19, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.paper;
    ctx.beginPath();
    ctx.arc(7, -3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(9, -3, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-11, 12);
    ctx.lineTo(-14, 18);
    ctx.moveTo(10, 12);
    ctx.lineTo(13, 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawCheckpoint(checkpoint, time) {
    const x = checkpoint.x - state.cameraX;
    if (x < -80 || x > state.width + 80) return;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, checkpoint.y + 65);
    ctx.lineTo(x, checkpoint.y - 42);
    ctx.stroke();
    ctx.fillStyle = checkpoint.active ? COLORS.sun : COLORS.paper;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 15, checkpoint.y - 62, 31, 34, 9);
    ctx.fill();
    ctx.stroke();
    if (checkpoint.active) {
      ctx.save();
      ctx.globalAlpha = 0.14 + Math.sin(time * 0.004) * 0.04;
      ctx.fillStyle = COLORS.sun;
      ctx.beginPath();
      ctx.arc(x, checkpoint.y - 45, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawGoal(time) {
    const x = world.goalX - state.cameraX;
    if (x < -150 || x > state.width + 150) return;
    const y = 430;

    ctx.save();
    ctx.globalAlpha = 0.13 + Math.sin(time * 0.003) * 0.04;
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(x, y + 5, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 47, 515);
    ctx.lineTo(x - 47, y - 72);
    ctx.quadraticCurveTo(x, y - 118, x + 47, y - 72);
    ctx.lineTo(x + 47, 515);
    ctx.stroke();

    ctx.fillStyle = COLORS.sun;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 18, y - 97, 36, 43, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.paper;
    ctx.beginPath();
    ctx.arc(x, y - 76, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.ink;
    ctx.font = "900 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("LANTERN GATE", x, y - 125);
  }

  function drawPlayer() {
    const x = player.x - state.cameraX;
    const y = player.y;
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) return;

    ctx.save();
    ctx.translate(x + player.width / 2, y + player.height / 2);
    ctx.scale(player.facing, 1);

    const speedStretch = Math.min(0.1, Math.abs(player.vx) / 3000);
    const sx = 1 + speedStretch - player.squash;
    const sy = 1 - speedStretch + player.squash;
    ctx.scale(sx, sy);

    // Scarf, trailing opposite the facing direction
    const scarfWave = Math.sin(player.runCycle * 1.5) * 4;
    ctx.fillStyle = COLORS.coral;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -5);
    ctx.quadraticCurveTo(-25 - Math.min(15, Math.abs(player.vx) * 0.05), -10 + scarfWave, -37, -1 + scarfWave);
    ctx.lineTo(-30, 8 + scarfWave);
    ctx.quadraticCurveTo(-18, 4, -6, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.fillStyle = COLORS.paper;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(-8, -21, 7, 14, -0.28, 0, Math.PI * 2);
    ctx.ellipse(8, -21, 7, 14, 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6b4a0";
    ctx.beginPath();
    ctx.ellipse(-8, -21, 2.7, 8, -0.28, 0, Math.PI * 2);
    ctx.ellipse(8, -21, 2.7, 8, 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COLORS.paper;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 2, 16.5, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye and cheek
    ctx.fillStyle = COLORS.ink;
    ctx.beginPath();
    ctx.arc(7, -5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.coral;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(10, 1, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Nose
    ctx.fillStyle = COLORS.sun;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(15, -2);
    ctx.lineTo(22, 1);
    ctx.lineTo(15, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Feet animate while moving
    const step = player.grounded ? Math.sin(player.runCycle) * Math.min(5, Math.abs(player.vx) * 0.02) : 2;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, 18);
    ctx.lineTo(-10 - step, 24);
    ctx.moveTo(8, 18);
    ctx.lineTo(10 + step, 24);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of world.particles) {
      const x = particle.x - state.cameraX;
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.translate(x, particle.y);
      ctx.rotate((particle.x + particle.y) * 0.05);
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    }
  }

  function drawForegroundGrass(time) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    for (let i = 0; i < 35; i += 1) {
      const worldX = Math.floor(state.cameraX / 65) * 65 + i * 65;
      const x = worldX - state.cameraX;
      const sway = Math.sin(time * 0.002 + worldX * 0.02) * 3;
      ctx.beginPath();
      ctx.moveTo(x, state.height);
      ctx.quadraticCurveTo(x + sway, state.height - 20, x + 8 + sway, state.height - 31 - (i % 4) * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(time) {
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.width, state.height);
    drawBackground(time);

    const worldOffsetY = Math.max(0, state.height - 680);
    ctx.save();
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 8 : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    ctx.translate(shakeX, worldOffsetY + shakeY);

    for (const solid of world.solids) drawSolid(solid);
    for (const hazard of world.hazards) drawSpikes(hazard);
    for (const checkpoint of world.checkpoints) drawCheckpoint(checkpoint, time);
    drawGoal(time);
    for (const coin of world.coins) drawCoin(coin, time);
    for (const enemy of world.enemies) drawEnemy(enemy);
    drawPlayer();
    drawParticles();
    ctx.restore();

    drawForegroundGrass(time);

    if (state.mode === "paused") {
      ctx.fillStyle = "rgba(23,32,59,.12)";
      ctx.fillRect(0, 0, state.width, state.height);
    }
  }

  function loop(time) {
    if (!state.lastTime) {
      state.lastTime = time;
      draw(time);
      requestAnimationFrame(loop);
      return;
    }

    const frameTime = Math.min(0.1, (time - state.lastTime) / 1000);
    state.lastTime = time;
    state.accumulator += frameTime;

    let frameReady = false;
    while (state.accumulator >= FIXED_STEP) {
      update(FIXED_STEP);
      state.accumulator -= FIXED_STEP;
      frameReady = true;
    }

    // requestAnimationFrame can fire at 90–240 Hz on fast displays.
    // Only render after a 60 Hz simulation step so the game stays capped at 60 FPS.
    if (frameReady) draw(time);
    requestAnimationFrame(loop);
  }

  const keyMap = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "jump",
    KeyW: "jump",
    Space: "jump",
  };

  window.addEventListener("keydown", (event) => {
    if (keyMap[event.code]) {
      event.preventDefault();
      const control = keyMap[event.code];
      if (control === "jump" && !input.jump) input.jumpPressed = true;
      input[control] = true;
      if (state.mode === "ready") beginGame();
    }
    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      togglePause();
    }
    if (event.code === "Enter" && ["ready", "paused", "won", "lost"].includes(state.mode)) {
      event.preventDefault();
      if (state.mode === "paused") togglePause();
      else beginGame();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (keyMap[event.code]) {
      event.preventDefault();
      input[keyMap[event.code]] = false;
    }
  });

  window.addEventListener("blur", () => {
    input.left = false;
    input.right = false;
    input.jump = false;
    if (state.mode === "playing") togglePause();
  });

  document.querySelectorAll(".touch-button").forEach((button) => {
    const control = button.dataset.control;
    const press = (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("is-pressed");
      if (control === "jump" && !input.jump) input.jumpPressed = true;
      input[control] = true;
      if (state.mode === "ready") beginGame();
    };
    const release = (event) => {
      event.preventDefault();
      button.classList.remove("is-pressed");
      input[control] = false;
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", (event) => {
      if (event.buttons === 0) release(event);
    });
  });

  startButton.addEventListener("click", () => {
    if (state.mode === "paused") togglePause();
    else beginGame();
  });

  restartButton.addEventListener("click", beginGame);
  pauseButton.addEventListener("click", togglePause);

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.mode === "playing") togglePause();
  });

  resize();
  resetGame();
  restoreStartCard();
  requestAnimationFrame(loop);
})();
