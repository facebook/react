/* global chrome */

export default function inject(scriptName: string, done: ? Function) {
  const source = `
  (function () {
    window.postMessage({ source: 'react-devtools-inject-script', scriptName: "${scriptName}" }, "*");
  })()
  `;

  chrome.devtools.inspectedWindow.eval(source, function(response, error) {
    if (error) {
      console.log(error);
    }

    if (typeof done === 'function') {
      done();
    }
  });
}