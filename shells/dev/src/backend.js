/** @flow */

import html2canvas from 'html2canvas';
import Agent from 'src/backend/agent';
import Bridge from 'src/bridge';
import { initBackend } from 'src/backend';

const bridge = new Bridge({
  listen(fn) {
    const listener = event => {
      fn(event.data);
    };
    window.addEventListener('message', listener);
    return () => {
      window.removeEventListener('message', listener);
    };
  },
  send(event: string, payload: any, transferable?: Array<any>) {
    window.parent.postMessage({ event, payload }, '*', transferable);
  },
});

bridge.addListener('captureScreenshot', ({ commitIndex }) => {
  html2canvas(document.body, { logging: false }).then(canvas => {
    bridge.send('screenshotCaptured', {
      commitIndex,
      dataURL: canvas.toDataURL(),
    });
  });
});

const agent = new Agent();
agent.addBridge(bridge);

initBackend(window.__REACT_DEVTOOLS_GLOBAL_HOOK__, agent, window.parent);
