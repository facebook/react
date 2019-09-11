/* global chrome */

export default function inject(scriptName: string, done: ? Function) {
  const source = `
  (function () {
    window.postMessage({ source: 'react-devtools-inject-backend', type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");
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