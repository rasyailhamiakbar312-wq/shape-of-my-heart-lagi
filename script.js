const LYRICS = [
  "Got nothing to hide no more",
  "I don't know where to start",
  "But to show you the shape of my heart",
  "I'm lookin' back on things I've done",
  "I never wanna play the same old part",
  "I'll keep you in the dark",
  "Now let me show you the shape of my heart"
];

const DELAYS = [0.3, 4.0, 9.0, 19.0, 25.5, 31.5, 35.0];
const X_POSITIONS = [400, 700, 400, 550, 700, 400, 700];
const KARAOKE_SPEEDS = [5, 5, 6, 5, 4, 4, 5];

const BOX_COLORS = [
  "#FF0000",
  "#E60000",
  "#CC0000",
  "#FF1A1A",
  "#FF3333",
  "#B30000",
  "#FF4D4D"
];

const PARTICLE_COLORS = [
  "#FFB6C1", "#FFC0CB", "#DC143C",
  "#FFF0F5", "#FF69B4", "#FF1493", "#FF6B6B"
];

const app = document.getElementById("app");
const startTime = performance.now();
const spawned = Array(LYRICS.length).fill(false);
let stopped = false;

function heartPath() {
  return `
    M 50 88
    C 45 83, 10 61, 7 36
    C 4 14, 18 4, 31 4
    C 41 4, 47 10, 50 18
    C 53 10, 59 4, 69 4
    C 82 4, 96 14, 93 36
    C 90 61, 55 83, 50 88 Z
  `;
}

function createHeart(index) {
  const heart = document.createElement("div");
  heart.className = "heart";

  const isBig = LYRICS[index].includes("lookin' back on things I've done");
  if (isBig) heart.classList.add("big");

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 100 90");
  svg.setAttribute("preserveAspectRatio", "none");

  const shadow = document.createElementNS(svgNS, "path");
  shadow.setAttribute("d", heartPath());
  shadow.setAttribute("fill", darken(BOX_COLORS[index % BOX_COLORS.length], 0.30));
  shadow.setAttribute("transform", "translate(1.8 2)");

  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("d", heartPath());
  path.setAttribute("fill", BOX_COLORS[index % BOX_COLORS.length]);

  const text = document.createElementNS(svgNS, "text");
  text.classList.add("lyric");
  text.setAttribute("x", "50");
  text.setAttribute("y", "47");

  const tspans = wrapText(LYRICS[index], isBig ? 24 : 31);
  tspans.forEach((line, n) => {
    const t = document.createElementNS(svgNS, "tspan");
    t.setAttribute("x", "50");
    t.setAttribute("dy", n === 0 ? `${-(tspans.length - 1) * 0.55}em` : "1.1em");
    t.textContent = "";
    text.appendChild(t);
  });

  svg.appendChild(shadow);
  svg.appendChild(path);
  svg.appendChild(text);
  heart.appendChild(svg);

  const maxX = Math.max(0, window.innerWidth - heart.offsetWidth);
  const wantedX = X_POSITIONS[index] ?? (window.innerWidth - heart.offsetWidth) / 2;
  heart.style.left = `${Math.min(Math.max(0, wantedX), maxX)}px`;
  heart.style.bottom = `${-heart.offsetHeight - 20}px`;

  app.appendChild(heart);

  let shown = 0;
  const interval = KARAOKE_SPEEDS[index] * 20;

  const timer = setInterval(() => {
    if (stopped || !heart.isConnected) {
      clearInterval(timer);
      return;
    }

    shown++;
    const current = LYRICS[index].slice(0, shown);

    let pos = 0;
    text.querySelectorAll("tspan").forEach(t => {
      const remaining = current.slice(pos);
      const max = tspans[t ? [...text.children].indexOf(t) : 0]?.length ?? 31;
      t.textContent = remaining.slice(0, max);
      pos += max;
    });

    if (shown >= LYRICS[index].length) clearInterval(timer);
  }, interval);

  const duration = 12 + index * 0.8;
  const start = performance.now();
  const startBottom = -heart.offsetHeight - 20;
  const endBottom = window.innerHeight + 30;

  function move(now) {
    if (stopped || !heart.isConnected) return;
    const p = Math.min(1, (now - start) / (duration * 1000));
    const bottom = startBottom + (endBottom - startBottom) * p;
    heart.style.bottom = `${bottom}px`;

    if (p < 1) {
      requestAnimationFrame(move);
    } else {
      heart.remove();
    }
  }

  requestAnimationFrame(move);
}

function wrapText(str, maxChars) {
  const words = str.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    if ((line + " " + word).trim().length <= maxChars) {
      line = (line + " " + word).trim();
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function darken(hex, factor) {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function createParticle() {
  const p = document.createElement("div");
  p.className = "particle";

  const size = 10 + Math.random() * 16;
  p.style.width = `${size}px`;
  p.style.height = `${size}px`;
  p.style.left = `${Math.random() * 100}vw`;
  p.style.bottom = "-30px";

  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

  p.innerHTML = `
    <svg viewBox="0 0 100 90" preserveAspectRatio="none">
      <path d="${heartPath()}" fill="${color}"/>
    </svg>
  `;

  const duration = 5 + Math.random() * 7;
  p.style.animationDuration = `${duration}s`;
  app.appendChild(p);

  setTimeout(() => p.remove(), duration * 1000 + 200);
}

function animate(now) {
  if (stopped) return;

  const elapsed = (now - startTime) / 1000;

  LYRICS.forEach((_, i) => {
    if (!spawned[i] && elapsed >= DELAYS[i]) {
      createHeart(i);
      spawned[i] = true;
    }
  });

  if (Math.random() < 0.15) createParticle();

  if (!spawned.every(Boolean)) {
    requestAnimationFrame(animate);
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    stopped = true;
    app.innerHTML = "";
  }
});

requestAnimationFrame(animate);

const song = document.getElementById("song");
const playButton = document.getElementById("playButton");

playButton.addEventListener("click", () => {
  if (song.paused) {
    song.play();
    playButton.textContent = "⏸ PAUSE";
  } else {
    song.pause();
    playButton.textContent = "▶ PLAY";
  }
});
