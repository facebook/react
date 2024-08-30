/* global chrome */

export function executeScriptInIsolatedWorld({target, files}) {
  return chrome.scripting.executeScript({
    target,
    files,
    world: chrome.scripting.ExecutionWorld.ISOLATED,
  });
}

export function executeScriptInMainWorld({target, files}) {
  return chrome.scripting.executeScript({
    target,
    files,
    world: chrome.scripting.ExecutionWorld.MAIN,
  });
}
