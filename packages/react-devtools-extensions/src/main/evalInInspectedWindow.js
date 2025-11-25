const EVAL_TIMEOUT = 1000 * 10;

let evalRequestId = 0;
const evalRequestCallbacks = new Map();

function fallbackEvalInInspectedWindow(scriptId, args, code, callback) {
  const tabId = chrome.devtools.inspectedWindow.tabId;
  const requestId = evalRequestId++;
  chrome.runtime.sendMessage({
    source: 'devtools-page',
    payload: {
      type: 'eval-in-inspected-window',
      tabId,
      requestId,
      scriptId,
      args,
    },
  });
  const timeout = setTimeout(() => {
    evalRequestCallbacks.delete(requestId);
    if (callback) {
      callback(null, {
        code,
        description:
          'Timed out while waiting for eval response from the inspected window.',
        isError: true,
        isException: false,
        value: undefined,
      });
    }
  }, EVAL_TIMEOUT);
  evalRequestCallbacks.set(requestId, ({result, error}) => {
    clearTimeout(timeout);
    evalRequestCallbacks.delete(requestId);
    if (callback) {
      if (error) {
        callback(null, {
          code,
          description: undefined,
          isError: false,
          isException: true,
          value: error,
        });
        return;
      }
      callback(result, null);
    }
  });
}

export function evalInInspectedWindow(scriptId, args, code, callback) {
  chrome.devtools.inspectedWindow.eval(code, (result, exceptionInfo) => {
    if (!exceptionInfo) {
      callback(result, exceptionInfo);
      return;
    }
    // If an exception (e.g. CSP Blocked) occurred,
    // fallback to the content script eval context
    fallbackEvalInInspectedWindow(scriptId, args, code, callback);
  });
}

function handleEvalInInspectedWindow({payload, source}) {
  if (source === 'react-devtools-background') {
    switch (payload?.type) {
      case 'eval-in-inspected-window-response': {
        const {requestId, result, error} = payload;
        const callback = evalRequestCallbacks.get(requestId);
        if (callback) {
          callback({result, error});
        }
        break;
      }
    }
  }
}

chrome.runtime.onMessage.addListener(handleEvalInInspectedWindow);
