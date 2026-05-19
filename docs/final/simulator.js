const meta = document.getElementById("meta");

meta.innerText =
  "Author: Jonathan Sugijanto | Launch Date: 5/19/2026";

const applyBtn = document.getElementById("apply-btn");
const runBtn = document.getElementById("run-btn");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const terminal = document.getElementById("output-terminal");

const nInput = document.getElementById("n-input");
const laserInput = document.getElementById("laser-input");

const GRID_X = 1000;
const GRID_Y = 1000;

// GRID should be divisible by DRAW_GRID for simplicity of drawing
const DRAW_GRID_X = 100;
const DRAW_GRID_Y = 100;

const medium = {
  x: 0,
  y: 0,
  w: 0,
  h: 0
};

let applied = false;
let refractiveFunction = null;
let refractiveGrid = [];

function log(msg) {
  terminal.value += msg + "\n";
  terminal.scrollTop = terminal.scrollHeight;
}

function clearLog() {
  terminal.value = "";
}

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  medium.w = canvas.width * 0.8;
  medium.h = canvas.height * 0.8;
  medium.x = canvas.width * 0.1;
  medium.y = canvas.height * 0.1;

  drawMedium();
}

window.addEventListener("resize", resizeCanvas);

function parseFunction(expr) {
  expr = expr.replaceAll("^", "**");

  return new Function(
    "x",
    "y",
    `
    return ${expr};
    `
  );
}

function drawMedium() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(refractiveGrid.length === 0) return;

  let nMin = Infinity;
  let nMax = -Infinity;

  for(let row of refractiveGrid) {
    for(let n of row) {
      nMin = Math.min(nMin, n);
      nMax = Math.max(nMax, n);
    }
  }

  // assume GRID_X and GRID_Y are divisible by DRAW_GRID_X and DRAW_GRID_Y for simplicity
  const dx = medium.w / DRAW_GRID_X;
  const dy = medium.h / DRAW_GRID_Y;

  for(let iy = 0; iy < DRAW_GRID_Y; iy++) {
    for(let ix = 0; ix < DRAW_GRID_X; ix++) {
      const n = refractiveGrid[iy * GRID_X / DRAW_GRID_X][ix * GRID_Y / DRAW_GRID_Y];

      let t = (n - nMin) / (nMax - nMin);

      if(!isFinite(t)) t = 0;

      const gray = Math.floor(255 * (1 - t));

      ctx.fillStyle =
        `rgb(${gray},${gray},255)`;

      ctx.fillRect(
        medium.x + ix * dx,
        medium.y + iy * dy,
        dx + 1,
        dy + 1
      );
    }
  }

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    medium.x,
    medium.y,
    medium.w,
    medium.h
  );
}

function applyMedium() {

  clearLog();

  try {

    refractiveFunction =
      parseFunction(nInput.value);

    refractiveGrid = [];

    for(let iy = 0; iy < GRID_Y; iy++) {

      const row = [];

      for(let ix = 0; ix < GRID_X; ix++) {

        const x = ix / GRID_X;
        const y = iy / GRID_Y;

        const n =
          refractiveFunction(x, y);

        row.push(n);
      }

      refractiveGrid.push(row);
    }

    drawMedium();

    applied = true;
    runBtn.disabled = false;

    log("Medium applied successfully.");
    log(`Grid size: ${GRID_X} x ${GRID_Y}`);
    log("Drawing resolution: " + `${DRAW_GRID_X} x ${DRAW_GRID_Y}`);
    log("Refractive index range: " +
      `${refractiveGrid.flat().reduce((a,b) => Math.min(a,b))} to ` +
      `${refractiveGrid.flat().reduce((a,b) => Math.max(a,b))}`
    );

  } catch(err) {

    log("ERROR while parsing n(x,y)");
    log(err);

    applied = false;
    runBtn.disabled = true;
  }
}

function parseLasers() {

  const lines =
    laserInput.value.split("\n");

  const lasers = [];

  for(let line of lines) {

    if(line.trim() === "") continue;

    const vals = line.split(";");

    lasers.push({
      side: parseInt(vals[0]),
      position: parseFloat(vals[1]),
      angle: parseFloat(vals[2]),
      color: vals[3]
    });
  }

  return lasers;
}

function quadrantAdjust(theta, LR_dir, UD_dir) {

  if(LR_dir === 1) {
    return UD_dir * theta;
  } else {
    return - UD_dir * theta + Math.PI;
  }
}

function simulateLaser(laser) {

  const path = [];

  const dxCell = medium.w / GRID_X;
  const dyCell = medium.h / GRID_Y;

  let xCell;
  let yCell;

  let theta;

  if(laser.side === 0) {

    xCell = 0;
    yCell = Math.floor(
      laser.position * GRID_Y
    );

    theta =
      laser.angle * Math.PI / 180;

  } else if(laser.side === 1){

    xCell = Math.floor(
      laser.position * GRID_X
    );

    yCell = 0;

    theta =
      (-90 + laser.angle)
      * Math.PI / 180;
  }

  let steps = 0;
  const maxSteps = 5000;

  while(
    xCell >= 0 &&
    xCell < GRID_X &&
    yCell >= 0 &&
    yCell < GRID_Y &&
    steps < maxSteps
  ) {

    const px =
      medium.x +
      (xCell + 0.5) * dxCell;

    const py =
      medium.y +
      (yCell + 0.5) * dyCell;

    path.push([px, py]);

    const probX = Math.cos(theta)**2;
    const LR_dir =
        Math.sign(Math.cos(theta));
    const UD_dir =
      Math.sign(Math.sin(theta));

    if(Math.random() < probX) {
      const oldN =
        refractiveGrid[yCell][xCell];

      xCell += LR_dir;

      if(
        xCell < 0 ||
        xCell >= GRID_X
      ) break;

      const newN =
        refractiveGrid[yCell][xCell];

      const ratio =
        oldN / newN;

      let sin2 =
        ratio * Math.abs(Math.sin(theta));

      // throw an error when abs(sin2) > 1 encountered
      if(sin2 > 1 && sin2 < 0) {

        log("ERROR: Refraction stops because of total internal reflection or others at cell: " +
          `(${xCell}, ${yCell})`
        );
      }
      theta = quadrantAdjust(
        Math.asin(sin2),
        LR_dir,
        UD_dir
      );
    } else {
      const oldN =
        refractiveGrid[yCell][xCell];

      yCell -= UD_dir;

      if(
        yCell < 0 ||
        yCell >= GRID_Y
      ) break;

      const newN =
        refractiveGrid[yCell][xCell];

      const ratio =
        oldN / newN;

      let sin2 =
        ratio * Math.abs(Math.cos(theta)); // cos(x) = sin(90-x) is used

      // throw an error when abs(sin2) > 1 encountered
      if(sin2 > 1 && sin2 < 0) {

        log("ERROR: Refraction stops because of total internal reflection or others at cell: " +
          `(${xCell}, ${yCell})`
        );
      }
      
      theta = quadrantAdjust(
        Math.PI/2 - Math.asin(sin2),
        LR_dir,
        UD_dir
      );
    }

    steps++;
  }

  return {
    path,
    exitAngle:
      theta * 180 / Math.PI,
    steps
  };
}

function drawPath(path, color) {

  if(path.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(path[0][0], path[0][1]);

  // only draw every min(GRID/DRAW_GRID) points to optimize performance
  const step = Math.min(
    Math.floor(GRID_X / DRAW_GRID_X),
    Math.floor(GRID_Y / DRAW_GRID_Y)
  );
  for(let i = 0; i < path.length; i += step) {
    const p = path[i];
    ctx.lineTo(p[0], p[1]);
  }

  ctx.stroke();
}

async function runSimulation() {

  if(!applied) return;

  clearLog();

  const t0 = performance.now();
  // let t0 = performance.now();

  runBtn.disabled = true;
  applyBtn.disabled = true;

  const originalText =
    runBtn.innerText;

  runBtn.innerText =
    "Running...";

  drawMedium();

  // let t1 = performance.now();
  try {

    const lasers =
      parseLasers();

    log(
      `Running ${lasers.length} laser(s)...`
    );

    for(let i = 0;
        i < lasers.length;
        i++) {

      const laser =
        lasers[i];

      // t0 = performance.now();
      const result =
        simulateLaser(laser);
      // t1 = performance.now();

      drawPath(
        result.path,
        laser.color
      );

      log(
        `Laser ${i+1} completed`
      );

      log(
        `Exit angle: ${
          result.exitAngle.toFixed(2)
        } deg`
      );

      log(
        `Steps: ${result.steps}`
      );

      log("");
    }

    const t1 = performance.now();

    log(
      `Simulation successful`
    );

    log(
      `Calculation duration: ${
        ((t1 - t0)/1000)
        .toFixed(3)
      } s`
    );

  } catch(err) {

    log("SIMULATION ERROR");
    log(err);

  }

  runBtn.innerText =
    originalText;

  runBtn.disabled = false;
  applyBtn.disabled = false;
}

applyBtn.onclick =
  applyMedium;

runBtn.onclick =
  runSimulation;

resizeCanvas();

applyMedium();