/**
 * 26b43.js
 * Helper functions for butiran-x/26b43 note.
 *
 * Author: Sparisoma Viridi (https://github.com/dudung)
 * Created: 2026-02-18
 *
 * Exports:
 * - clearTextarea(id)
 * - copyTextareaFromTo(src, dest)
 */


/**
 * Clear content of a textarea element.
 * @param {string} id - The id of textarea element whose content to be cleared.
 * @returns {void}
 *
 * @example
 * clearTextarea("text-input");
 * clearTextarea("text-output");
 */
function clearTextarea(id) {
  /** @type {HTMLTextareaElement|null} */
  const el = document.getElementById(id);
  
  if (!(el instanceof HTMLTextAreaElement)) return null;
  
  el.value = "";
}


/**
 * Copy content from a textarea element to other textarea element and overwrite it.
 * @param {string} src - The id of textarea element whose content to be copied.
 * @param {string} dest - The id of textarea element that will have new content.
 * @returns {void}
 *
 * @example
 * CopyTextarea("text-input", "text-output");
 */
function copyTextareaFromTo(src, dest) {
  /** @type {HTMLTextareaElement|null} */
  const el1 = document.getElementById(src);
  const el2 = document.getElementById(dest);
  
  if (!(el1 instanceof HTMLTextAreaElement)) return null;
  if (!(el2 instanceof HTMLTextAreaElement)) return null;
  
  el2.value = el1.value;
}

/**
 * Append content from a textarea element to other textarea element.
 * @param {string} src - The id of textarea element whose content to be copied.
 * @param {string} dest - The id of textarea element that will have new content.
 * @returns {void}
 *
 * @example
 * appendTextareaFromTo("text-input", "text-output");
 */
function appendTextareaFromTo(src, dest) {
  /** @type {HTMLTextareaElement|null} */
  const el1 = document.getElementById(src);
  const el2 = document.getElementById(dest);
  
  if (!(el1 instanceof HTMLTextAreaElement)) return null;
  if (!(el2 instanceof HTMLTextAreaElement)) return null;
  
  el2.value += "\n" + el1.value;
}

// marker: 26b43.js
(() => {
  console.log("[marker] 26b43.js loaded");
})();