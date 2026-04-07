/**
 * 26c11.js
 * Helper functions for butiran-x/26c11 note.
 *
 * Author: Sparisoma Viridi (https://github.com/dudung)
 * Created: 2026-03-03
 *
 * Exports:
 * - readParamFromTextarea(id, key)
 */


/**
 * Reads a parameter from a textarea element that starts with the specified key.
 *
 * @param {string} id - The ID of the textarea element to read from.
 * @param {string} key - The key (first word) identifying the parameter to retrieve.
 * @param {"string" | "int" | "float"} type - The expected parameter type.
 * @returns {string | number} The parameter value parsed according to the specified type.
 *
 * @example
 * const value = readParamFromTextarea("text-input", "KEY", "int");
 */
function readParamFromTextarea(id, key, type="string") {
  /** @type {HTMLTextareaElement|null} */
  const el = document.getElementById(id);
  
  if (!(el instanceof HTMLTextAreaElement)) return null;
  
  const lines = el.value.split("\n");
  let param = null;
  for(l of lines) {
    const cols = l.split(" ");
    if(cols[0] == key) {
      if(type == "int") {
        param = parseInt(cols[1]);
      } else if(type == "float") {
        param = parseFloat(cols[1]);
      } else {
        param = cols[1]
      }
    }
  }
  return param;
}


// marker: 26c11.js
(() => {
  console.log("[marker] 26c11.js loaded");
})();