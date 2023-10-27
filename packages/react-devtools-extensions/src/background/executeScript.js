/* global chrome */

// Firefox doesn't support ExecutionWorld.MAIN yet
// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
function executeScriptForFirefoxInMainWorld({target, files}) {
  return chrome.scripting.executeScript({
    target,
    func: fileNames => {
      function injectScriptSync(src) {
        let code = '';
        const request = new XMLHttpRequest();
        request.addEventListener('load', function () {
          code = this.responseText;
        });
        request.open('GET', src, false);
        request.send();

        const script = document.createElement('script');
        script.textContent = code;

        // This script runs before the <head> element is created,
        // so we add the script to <html> instead.
        if (document.documentElement) {
          document.documentElement.appendChild(script);
        }

        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }

      fileNames.forEach(file => injectScriptSync(chrome.runtime.getURL(file)));
    },
    args: [files],
  });
}

export function executeScriptInIsolatedWorld({target, files}) {
  return chrome.scripting.executeScript({
    target,
    files,
    world: chrome.scripting.ExecutionWorld.ISOLATED,
  });
}

export function executeScriptInMainWorld({target, files}) {
  if (__IS_FIREFOX__) {
    return executeScriptForFirefoxInMainWorld({target, files});
  }

  return chrome.scripting.executeScript({
    target,
    files,
    world: chrome.scripting.ExecutionWorld.MAIN,
  });
}
