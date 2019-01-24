/* global chrome */

export default function inject(scriptName: string, done: () => void) {
  const src = `
  // the prototype stuff is in case document.createElement has been modified
  (function () {
    var script = document.constructor.prototype.createElement.call(document, 'script');
    script.src = "${scriptName}";
    script.charset = "utf-8";
    document.documentElement.appendChild(script);
    script.parentNode.removeChild(script);
  })()
  `;

  chrome.devtools.inspectedWindow.eval(src, function(res, err) {
    if (err) {
      console.log(err);
    }
    done();
  });
}
