const meta = document.getElementById("meta");

meta.innerText =
  "Author: Jonathan Sugijanto | Launch Date: 5/19/2026";

const GRID_X = 100000;
const GRID_Y = 100000;

// GRID should be divisible by DRAW_GRID for simplicity of drawing
const DRAW_GRID_X = 100;
const DRAW_GRID_Y = 100;

const c = 299792458; // assume the medium is 1 x 1 m^2 in size

const applyBtn = document.getElementById("apply-btn");
const runBtn = document.getElementById("run-btn");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const terminal = document.getElementById("output-terminal");

const nInput = document.getElementById("n-input");
const laserInput = document.getElementById("laser-input");

const rawOutput = document.getElementById("raw-output");

const xGraph = document.getElementById("x-graph");
const yGraph = document.getElementById("y-graph");
const thetaGraph = document.getElementById("theta-graph");

const xCtx = xGraph.getContext("2d");
const yCtx = yGraph.getContext("2d");
const thetaCtx = thetaGraph.getContext("2d");

const graphBtn = document.getElementById("graph-btn");

const exportBtn = document.getElementById("export-btn");

const medium = {
  x: 0,
  y: 0,
  w: 0,
  h: 0
};

let applied = false;
let refractiveFunction = null;
let refractiveGrid = [];
let nMin = Infinity;
let nMax = -Infinity;
let simulationResult = [];

function log(msg) {
  terminal.value += msg + "\n";
  terminal.scrollTop = terminal.scrollHeight;
}

function clearLog() {
  terminal.value = "";
}

function resizeGraphCanvas(canvas) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  medium.w = canvas.width * 0.8;
  medium.h = canvas.height * 0.8;
  medium.x = canvas.width * 0.1;
  medium.y = canvas.height * 0.1;

  drawMedium();

  resizeGraphCanvas(xGraph);
  resizeGraphCanvas(yGraph);
  resizeGraphCanvas(thetaGraph);
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

  // assume GRID_X and GRID_Y are divisible by DRAW_GRID_X and DRAW_GRID_Y for simplicity
  const dx = medium.w / DRAW_GRID_X;
  const dy = medium.h / DRAW_GRID_Y;

  for(let iy = 0; iy < DRAW_GRID_Y; iy++) {
    for(let ix = 0; ix < DRAW_GRID_X; ix++) {
      const gy = Math.floor(iy * GRID_Y / DRAW_GRID_Y);
      const gx = Math.floor(ix * GRID_X / DRAW_GRID_X);
      const n = refractiveGrid[gy][gx];

      let t = (n - nMin) / (nMax - nMin);

      if(!isFinite(t)) t = 0;

      const gray = Math.floor(255 * (1 - t));

      ctx.fillStyle =
        `rgb(${gray},${gray},255)`;

      ctx.fillRect(
        medium.x + ix * dx,
        medium.y + (DRAW_GRID_Y - iy - 1) * dy, // y=0 is the bottom of the medium
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

    const t0 = performance.now();
    refractiveGrid = [];

    for(let iy = 0; iy < DRAW_GRID_Y; iy++) {

      for(let ix = 0; ix < DRAW_GRID_X; ix++) {
        const x = ix / DRAW_GRID_X;
        const y = iy / DRAW_GRID_Y;

        const n = refractiveFunction(x, y); // find all the n values from the start
        // const n = null; // set all n values to null first to speed up the process, then fill the n values as the laser passes

        const gy = Math.floor(iy * GRID_Y / DRAW_GRID_Y);
        const gx = Math.floor(ix * GRID_X / DRAW_GRID_X);

        if(!refractiveGrid[gy]) {
          refractiveGrid[gy] = [];
        }
        refractiveGrid[gy][gx] = n;
      }
    }

    nMin = Infinity;
    nMax = -Infinity;

    for(let row of refractiveGrid) {
      if(!row) continue;
      for(let n of row) {
        if(n === undefined) continue;
        nMin = Math.min(nMin, n);
        nMax = Math.max(nMax, n);
      }
    }

    drawMedium();
    const t1 = performance.now();
    log(`Refractive grid initialized in ${((t1 - t0)/1000).toFixed(3)} s`);

    applied = true;
    runBtn.disabled = false;

    log("Medium applied successfully.");
    log(`Grid size: ${GRID_X} x ${GRID_Y}`);
    log("Drawing resolution: " + `${DRAW_GRID_X} x ${DRAW_GRID_Y}`);
    log("Refractive index range: " + `${nMin} to ${nMax}`);

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

function quadrantAdjust(theta, quadrant) {

  if(quadrant === 1) {
    return theta;
  } else if(quadrant === 2) {
    return Math.PI - theta;
  } else if(quadrant === 3) {
    return Math.PI + theta;
  } else if(quadrant === 4) {
    return 2*Math.PI - theta;
  }
}

function findQuadrant(angle) {

  const tau = 2 * Math.PI;
  const a = ((angle % tau) + tau) % tau;
  if(a < Math.PI/2) {
    return 1;
  } else if(a < Math.PI) {
    return 2;
  } else if(a < 3*Math.PI/2) {
    return 3;
  } else {
    return 4;
  }
}

function laserStart(side, position){
  if(side === 0) {
    return [
      0,
      Math.floor(position * GRID_Y)
    ];
  } else if(side === 1){
    return [
      Math.floor(position * GRID_X),
      0
    ];
  } else if(side === 2){
    return [
      GRID_X - 1,
      Math.floor(position * GRID_Y)
    ];
  } else if(side === 3){
    return [
      Math.floor(position * GRID_X),
      GRID_Y - 1
    ];
  }
}

function propagate(xCell, yCell, cos_t, sin_t) {
  let new_xCell = xCell;
  let new_yCell = yCell;
  const probX = Math.abs(cos_t)/(Math.abs(cos_t) + Math.abs(sin_t));
  const manhattanComp = Math.sqrt(1.0+2*Math.abs(cos_t*sin_t)); // compensation factor for the definition of ProbX
  let steps = 1; // whether to take an extra step in the same direction to compensate for the manhattan distance issue, this is a random process based on the manhattanComp factor
  if(Math.random() < manhattanComp - 1){
    steps = 2;
  }
  if(Math.random() < probX) {   
    const LR_dir = Math.sign(cos_t);
    new_xCell += LR_dir * steps;
  } else {
    const UD_dir = Math.sign(sin_t);
    new_yCell += UD_dir * steps;
  }
  // log('cell: ' + `(${new_xCell}, ${new_yCell})`);
  return [new_xCell, new_yCell];
}

function callN(xCell, yCell) {
  if(!refractiveGrid[yCell]) {
    refractiveGrid[yCell] = [];
  }
  if(refractiveGrid[yCell][xCell] === undefined) {
    const x = xCell / GRID_X;
    const y = yCell / GRID_Y;
    refractiveGrid[yCell][xCell] = refractiveFunction(x, y);
  }
  return refractiveGrid[yCell][xCell];
}

function diffractionAdjust(xCell, yCell, theta, cos_t, sin_t) {
  if(xCell < 1 || xCell >= GRID_X - 1 || yCell < 1 || yCell >= GRID_Y - 1) {
    return theta; // no adjustment at the boundary
  }
  const n = callN(xCell, yCell);

  // assume GRID_X = GRID_Y so they can be omitted
  const doN_doX = (callN(xCell + 1, yCell) - callN(xCell - 1, yCell)) / 2;
  const doN_doY = (callN(xCell, yCell + 1) - callN(xCell, yCell - 1)) / 2;
  if(doN_doX === 0 && doN_doY === 0) {
    return theta; // no adjustment if the gradient is zero
  }
  
  const cos_p = doN_doX / Math.sqrt(doN_doX**2 + doN_doY**2);
  const sin_p = doN_doY / Math.sqrt(doN_doX**2 + doN_doY**2);
  const phi = Math.atan2(doN_doY, doN_doX); // angle of the normal vector to the n gradient
  // define delta = theta - phi
  const delta = theta - phi; // angle of the laser relative to the normal vector
  const cos_d = cos_t * cos_p + sin_t * sin_p; // cos of the angle between the laser direction and the normal vector
  const sin_d = Math.sqrt(1 - cos_d**2); // sin of the angle between the laser direction and the normal vector, the direction info is not used

  const grad_mag = Math.sqrt(doN_doX**2 + doN_doY**2);
  // const ProbComp = Math.sqrt(1.0 / (1.0 + 2*Math.abs(cos_t*sin_t))); // probability compensation factor because the speed of propagation of the definition of ProbX
  const ProbComp = 1;
  
  const new_n = n + grad_mag * cos_d * ProbComp; // 

  const ratio = n / new_n;
  let sin2 = ratio * Math.abs(sin_d); // sin of the new angle relative to the normal vector
  if(sin2 > 1 || sin2 < 0) {
    log("ERROR: Refraction stops because of total internal reflection or others at cell: " +
      `(${xCell}, ${yCell})`
    );
  }
  const delta_quadrant = findQuadrant(delta);
  const new_theta = quadrantAdjust(
    Math.asin(sin2),
    delta_quadrant
  ) + phi;
  // log(`cell: (${xCell}, ${yCell}), n: ${n.toFixed(3)}, new_n: ${new_n.toFixed(3)}, phi: ${(phi*180/Math.PI).toFixed(2)} deg, delta: ${(delta*180/Math.PI).toFixed(2)} deg, new_delta: ${((new_theta-phi)*180/Math.PI).toFixed(2)} deg`);
  return new_theta;

}

function simulateLaser(laser) {

  const path = [];

  const dxCell = medium.w / GRID_X;
  const dyCell = medium.h / GRID_Y;

  let xCell;
  let yCell;

  let theta;

  [xCell, yCell] = laserStart(laser.side, laser.position);
  theta = laser.angle * Math.PI / 180;

  let steps = 0;
  const maxSteps = 500000;
  // const maxSteps = 3;

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
      (GRID_Y - (yCell + 0.5)) * dyCell;

    path.push([px, py, theta, callN(xCell, yCell)]);

    const cos_t = Math.cos(theta);
    const sin_t = Math.sin(theta);
    // const quadrant = findQuadrant(theta);

    [xCell, yCell] = propagate(xCell, yCell, cos_t, sin_t);
    if(xCell < 0 || xCell >= GRID_X || yCell < 0 || yCell >= GRID_Y) break;

    theta = diffractionAdjust(xCell, yCell, theta, cos_t, sin_t);

    steps++;
  }

  if(steps >= maxSteps) {
    log("WARNING: Maximum steps reached, laser may not have exited the medium properly.");
  }

  return {
    path,
    exitCoordinates: [xCell / GRID_X, yCell / GRID_Y],
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


function drawMultiGraph(
  ctx,
  datasets,
  xmax,
  ymin,
  ymax,
  xlabel,
  ylabel
) {

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const left = 70;
  const right = 20;
  const top = 20;
  const bottom = 50;

  const plotW = w - left - right;
  const plotH = h - top - bottom;

  ctx.clearRect(0,0,w,h);

  if(ymax === ymin) {
    ymax += 1;
    ymin -= 1;
  }

  // ===== GRID =====

  ctx.strokeStyle = "#dddddd";
  ctx.lineWidth = 1;

  const Ngrid = 10;

  for(let i=0;i<=Ngrid;i++) {

    const x =
      left + i/Ngrid*plotW;

    ctx.beginPath();
    ctx.moveTo(x,top);
    ctx.lineTo(x,top+plotH);
    ctx.stroke();
  }

  for(let i=0;i<=Ngrid;i++) {

    const y =
      top + i/Ngrid*plotH;

    ctx.beginPath();
    ctx.moveTo(left,y);
    ctx.lineTo(left+plotW,y);
    ctx.stroke();
  }

  // ===== AXES =====

  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(left,top);
  ctx.lineTo(left,top+plotH);

  ctx.lineTo(
    left+plotW,
    top+plotH
  );

  ctx.stroke();

  // ===== TICKS =====

  ctx.fillStyle = "black";
  ctx.font = "12px Arial";

  for(let i=0;i<=Ngrid;i++) {

    const x =
      left + i/Ngrid*plotW;

    const val =
      xmax*i/Ngrid;

    ctx.fillText(
      val.toFixed(2),
      x-10,
      top+plotH+20
    );
  }

  for(let i=0;i<=Ngrid;i++) {

    const y =
      top + plotH
      - i/Ngrid*plotH;

    const val =
      ymin +
      (ymax-ymin)
      * i/Ngrid;

    ctx.textAlign = "right";

    ctx.fillText(
      val.toFixed(2),
      left - 8,
      y + 4
    );
  }

  // ===== AXIS LABELS =====

  ctx.fillText(
    xlabel,
    left + plotW/2 - 30,
    h - 10
  );

  ctx.save();

  ctx.translate(
    15,
    top + plotH/2
  );

  ctx.rotate(-Math.PI/2);

  ctx.fillText(
    ylabel,
    0,
    0
  );

  ctx.restore();

  // ===== CURVES =====

  for(const dataset of datasets) {

    const data =
      dataset.data;

    if(data.length < 2)
      continue;

    ctx.strokeStyle =
      dataset.color;

    ctx.lineWidth = 2;

    ctx.beginPath();

    for(let i=0;i<data.length;i++) {

      const x =
        left +
        data[i].t/xmax
        * plotW;

      const y =
        top +
        plotH
        -
        (data[i].value-ymin)
        /(ymax-ymin)
        * plotH;

      if(i===0)
        ctx.moveTo(x,y);
      else
        ctx.lineTo(x,y);
    }

    ctx.stroke();
  }
}

function exportData(laser, result) {
  const exportData = {
    refractiveFunction: nInput.value,
    laserInput: laser,
    result: result
  };

  rawOutput.value +=
  JSON.stringify(
    exportData,
    null,
    2
  );

  rawOutput.value += "\n\n";
}

async function runSimulation() {

  if(!applied) return;

  clearLog();
  simulationResult = [];

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
        `Exit coordinates: (${result.exitCoordinates[0]}, ${result.exitCoordinates[1]})`
      );

      log(
        `Exit angle: ${
          result.exitAngle.toFixed(2) % 360
        } deg`
      );

      log(
        `Steps: ${result.steps}`
      );

      log("");

      // drawAllGraphs(laser.color, result.path);
      // exportData(laser, result);
      simulationResult.push({
        laser,
        result
      });
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
  graphBtn.disabled = false;
  exportBtn.disabled = false;
}

function generateGraphs() {

  if(simulationResult.length === 0){
    log("No simulation result to graph. Please run the simulation first.");
    return;
  }

  const t0 = performance.now();

  const xDatasets = [];
  const yDatasets = [];
  const thetaDatasets = [];

  let globalTmax = 0;

  let globalXmin = Infinity;
  let globalXmax = -Infinity;

  let globalYmin = Infinity;
  let globalYmax = -Infinity;

  let globalThetaMin = Infinity;
  let globalThetaMax = -Infinity;

  try{
    for(const sim of simulationResult) {

      const laser = sim.laser;
      const path = sim.result.path;

      const xData = [];
      const yData = [];
      const thetaData = [];

      let t = 0;

      for(const p of path) {

        const px = p[0];
        const py = p[1];
        const theta = p[2];
        const n = p[3];

        const ds = 1 / GRID_X;
        const dt = ds * n / c;

        const t_ns = t * 1e9;

        const xCoord =
          (px - medium.x) / medium.w;

        const yCoord =
          1 - (py - medium.y) / medium.h;

        const thetaDeg =
          theta * 180 / Math.PI;

        xData.push({
          t: t_ns,
          value: xCoord
        });

        yData.push({
          t: t_ns,
          value: yCoord
        });

        thetaData.push({
          t: t_ns,
          value: thetaDeg
        });

        globalTmax =
          Math.max(globalTmax, t_ns);

        globalXmin =
          Math.min(globalXmin, xCoord);

        globalXmax =
          Math.max(globalXmax, xCoord);

        globalYmin =
          Math.min(globalYmin, yCoord);

        globalYmax =
          Math.max(globalYmax, yCoord);

        globalThetaMin =
          Math.min(globalThetaMin, thetaDeg);

        globalThetaMax =
          Math.max(globalThetaMax, thetaDeg);

        t += dt;
      }

      xDatasets.push({
        color: laser.color,
        data: xData
      });

      yDatasets.push({
        color: laser.color,
        data: yData
      });

      thetaDatasets.push({
        color: laser.color,
        data: thetaData
      });
    }

    drawMultiGraph(
      xCtx,
      xDatasets,
      globalTmax,
      globalXmin,
      globalXmax,
      "time (ns)",
      "x coordinate (m)"
    );

    drawMultiGraph(
      yCtx,
      yDatasets,
      globalTmax,
      globalYmin,
      globalYmax,
      "time (ns)",
      "y coordinate (m)"
    );

    drawMultiGraph(
      thetaCtx,
      thetaDatasets,
      globalTmax,
      globalThetaMin,
      globalThetaMax,
      "time (ns)",
      "theta (degree)"
    );
  } catch(err) {

    log("GRAPHING ERROR");
    log(err);

  }

  const t1 = performance.now();

  log(
    `Graphs generated in ${
      ((t1-t0)/1000).toFixed(3)
    } s`
  );
}

function exportAllData() {

  if(simulationResult.length === 0){
    log("No simulation result to export. Please run the simulation first.");
    return;
  }

  const t0 = performance.now();
  for(const res of simulationResult) {
    exportData(res.laser, res.result);
  }
  const t1 = performance.now();

  log(
    `JSON exported in ${
      ((t1-t0)/1000).toFixed(3)
    } s`
  );
}

applyBtn.onclick =
  applyMedium;

runBtn.onclick =
  runSimulation;

graphBtn.onclick = generateGraphs;

exportBtn.onclick = exportAllData;

resizeCanvas();

applyMedium();