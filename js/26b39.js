/**
 * 26b39.js
 * Helper functions for butiran/26b39 note.
 *
 * Author: Sparisoma Viridi (https://github.com/dudung)
 * Created: 2026-02-17
 *
 * Exports:
 * - getContainer(id, width?)
 * - createTextarea(id, height?)
 * - consolex.setOutput(el)
 * - consolex.log(...args)
 * - consolex.clear()
 * - consolex.setEOL(eol)
 */


/**
 * Retrieves a div element by id and applies standardized container styling.
 *
 * @param {string} id - The id of the target div element.
 * @param {string} [width="320px"] - Optional width of the container.
 * @returns {HTMLDivElement|null} The styled div element, or null if not found.
 *
 * @example
 * const cnt = getContainer("container-name");
 */
function getContainer(id, width = "320px") {
  /** @type {HTMLDivElement|null} */
  const el = document.getElementById(id);

  if (!(el instanceof HTMLDivElement)) return null;

  const styles = {
    marginTop: "1em",
    width: width,
    background: "var(--box-bg)",
    border: "0 solid var(--border)",
    display: "flex",
  };

  Object.assign(el.style, styles);

  return el;
}


/**
 * Creates and returns a styled textarea element for output.
 *
 * @param {string} id - The id to assign to the textarea element.
 * @param {number|string} [height="10em"] - Optional height of the textarea.
 * @returns {HTMLTextAreaElement} The created textarea element.
 *
 * @example
 * const txa = createTextarea("text-output");
 */
function createTextarea(id, height = "12em") {
  /** @type {HTMLTextAreaElement} */
  const el = document.createElement("textarea");

  el.id = id;

  const styles = {
    flex: "1",
    height: typeof height === "number" ? `${height}px` : height,
    overflowY: "scroll",
    fontFamily: "monospace",
    fontSize: "12px",
    lineHeight: "1.5",
    padding: "0.25em 0.5em",
    resize: "none",
    boxSizing: "border-box",
  };

  Object.assign(el.style, styles);

  return el;
}


/**
 * Simple console-like logger that writes messages into a textarea element.
 *
 * @example
 * consolex.setOutput(document.getElementById("output"));
 * consolex.log("Hello, World!");
 */
const consolex = {
  /** @type {HTMLTextAreaElement|null} */
  el: null,

  /** @type {string} */
  eol: "\n",
  
  /**
   * Sets end of line character.
   * @param {string} eol - End of line character.
   * @returns {void}
   */
  setEOL(eol) {
    this.eol = eol;
  },
  
  /**
   * Sets the textarea element where logs will be written.
   * @param {HTMLTextAreaElement|null} el - Target textarea element.
   * @returns {void}
   */
  setOutput(el) {
    this.el = el instanceof HTMLTextAreaElement ? el : null;
  },

  /**
   * Writes a message to the configured textarea.
   * @param {...any} args - Values to log (similar to console.log).
   * @returns {void}
   */
  log(...args) {
    if (!this.el) return;

    const message = args
      .map(v =>
        typeof v === "object"
          ? JSON.stringify(v, null, 2)
          : String(v)
      )
      .join(" ");

    this.el.value += message + "\n";

    // Auto-scroll to bottom
    this.el.scrollTop = this.el.scrollHeight;
  },

  /**
   * Clears the output textarea.
   * @returns {void}
   */
  clear() {
    if (this.el) {
      this.el.value = "";
    }
  },
};


// marker: 26b39.js
(() => {
  console.log("[marker] 26b39.js loaded");
})();