import {evalInInspectedWindow} from './evalInInspectedWindow';

export function viewAttributeSource(rendererID, elementID, path) {
  evalInInspectedWindow(
    'viewAttributeSource',
    [{rendererID, elementID, path}],
    '{' + // The outer block is important because it means we can declare local variables.
      'const renderer = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.get(' +
      JSON.stringify(rendererID) +
      ');' +
      'if (renderer) {' +
      '  const value = renderer.getElementAttributeByPath(' +
      JSON.stringify(elementID) +
      ',' +
      JSON.stringify(path) +
      ');' +
      '  if (value) {' +
      '    inspect(value);' +
      '    true;' +
      '  } else {' +
      '    false;' +
      '  }' +
      '} else {' +
      '  false;' +
      '}' +
      '}',
    (didInspect, evalError) => {
      if (evalError) {
        console.error(evalError);
      }
    },
  );
}

export function viewElementSource(rendererID, elementID) {
  evalInInspectedWindow(
    'viewElementSource',
    [{rendererID, elementID}],
    '{' + // The outer block is important because it means we can declare local variables.
      'const renderer = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.get(' +
      JSON.stringify(rendererID) +
      ');' +
      'if (renderer) {' +
      '  const value = renderer.getElementSourceFunctionById(' +
      JSON.stringify(elementID) +
      ');' +
      '  if (value) {' +
      '    inspect(value);' +
      '    true;' +
      '  } else {' +
      '    false;' +
      '  }' +
      '} else {' +
      '  false;' +
      '}' +
      '}',
    (didInspect, evalError) => {
      if (evalError) {
        console.error(evalError);
      }
    },
  );
}
