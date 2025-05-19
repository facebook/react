(() => {
  "use strict";
  try {
    importScripts("browser-polyfill.min.js", "background.js");
  } catch (err) {
    console.error(err);
  }
})();