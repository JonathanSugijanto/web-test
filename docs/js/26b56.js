/**
 * 26b56.js
 * Helper functions for butiran-x/26b56 note.
 *
 * Author: Sparisoma Viridi (https://github.com/dudung)
 * Created: 2026-02-23
 *
 * Exports:
 * - createCanvas(id)
 * - readDataFromTextarea(id, sep=";")
 * - drawCirclesOnCanvas(id, dataset)
 */


/**
* Creates canvas element and applies standardized container styling.
*
* @param {string} id - The id of the canvas element.
* @returns {HTMLCanvasElement} The styled canvas element.
*
* @example
* const can = createCanvas("canvas-output");
*/
function createCanvas(id) {
  /** @type {HTMLCavnasElement} */
  const el = document.createElement("canvas");
  
  el.id = id;
  
  const styles = {
    flex: "1",
    background: "var(--box-bg)",
    width: "100%",
    height: "100%",
    display: "block",
  };
  
  Object.assign(el.style, styles);
  
  // Initialize resolution after it enters layout
  requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect();
    el.width = rect.width;
    el.height = rect.height;
  });
  
  return el;
}


/**
* Read lines of character-separated values from a textarea element.
*
* Each line format: x{sep}y{sep}radius{sep}color
*
* @param {string} id - The id of the textarea element.
* @param {string} [sep=";"] - Field separator.
* @returns {Array<[number, number, number, string]>} Array of [x, y, radius, color].
*
* @example
* const dataset = readDataFromTextArea("text-input", sep=";");
*/
function readDataFromTextarea(id, sep=";") {
  const el = document.getElementById(id);
  var lines = el.value.split("\n");
  if(lines[0].length == 0) lines = [];
  const dataset = [];
  for(let l of lines) {
    const vals = l.split(sep);
    const x = parseFloat(vals[0]);
    const y = parseFloat(vals[1]);
    const r = parseFloat(vals[2]);
    const c = vals[3];
    dataset.push([x, y, r, c]);
  }
  return dataset;
}


/**
* Draw circles on canvas using a dataset of (x, y, radius, color)
*
* @param {string} id - The id of the canvas element.
* @param {Array<[number, number, number, string]>} dataset - Array of [x, y, radius, color].
* @returns {void.
*
* @example
* drawCirclesOnCanvas("graphic-output", dataset);
*/
function drawCirclesOnCanvas(id, dataset) {
  /** @type {HTMLCanvasElement|null} */
  const el = document.getElementById(id);
  
  if (!(el instanceof HTMLCanvasElement)) return null;
  
  const ctx = el.getContext("2d");
  
  for(let d of dataset) {
    const x = d[0];
    const y = d[1];
    const r = d[2];
    const c = d[3];
    
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.arc(x, y, r, 0, 2*Math.PI);
    ctx.fill();
  }
}


// marker: 26b56.js
(() => {
  console.log("[marker] 26b56.js loaded");
})();