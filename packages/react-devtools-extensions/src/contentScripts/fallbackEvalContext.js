/*
  Can not access `Developer Tools Console API` (e.g., inspect(), $0) in this context.
  So some functions are no-op or throw error.
*/
const evalScripts = {
  checkIfReactPresentInInspectedWindow: () =>
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ &&
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0,
  reload: () => window.location.reload(),
  setBrowserSelectionFromReact: () => {
    throw new Error('Not supported in fallback eval context');
  },
  setReactSelectionFromBrowser: () => {
    throw new Error('Not supported in fallback eval context');
  },
  viewAttributeSource: ({rendererID, elementID, path}) => {
    return false; // Not supported in fallback eval context
  },
  viewElementSource: ({rendererID, elementID}) => {
    return false; // Not supported in fallback eval context
  },
};

window.addEventListener('message', event => {
  if (event.data?.source === 'react-devtools-content-script-eval') {
    const {scriptId, args, requestId} = event.data.payload;
    const response = {result: null, error: null};
    try {
      response.result = evalScripts[scriptId].apply(null, args);
    } catch (err) {
      response.error = err.message;
    }
    window.postMessage(
      {
        source: 'react-devtools-content-script-eval-response',
        payload: {
          requestId,
          response,
        },
      },
      '*',
    );
  }
});
