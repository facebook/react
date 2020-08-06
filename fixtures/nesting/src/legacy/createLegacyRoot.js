/* eslint-disable react/jsx-pascal-case */

import React from 'react';
import ReactDOM from 'react-dom';
import ThemeContext from './shared/ThemeContext';

// Note: this is a semi-private API, but it's ok to use it
// if we never inspect the values, and only pass them through.
import {__RouterContext} from 'react-router';
import {ReactReduxContext} from 'react-redux';

// Pass through every context required by this tree.
// The context object is populated in src/modern/withLegacyRoot.
function Bridge({children, context}) {
  return (
    <ThemeContext.Provider value={context.theme}>
      <__RouterContext.Provider value={context.router}>
        <ReactReduxContext.Provider value={context.reactRedux}>
          {children}
        </ReactReduxContext.Provider>
      </__RouterContext.Provider>
    </ThemeContext.Provider>
  );
}

export default function createLegacyRoot(container) {
  return {
    render(Component, props, context) {
      ReactDOM.render(
        <Bridge context={context}>
          <Component {...props} />
        </Bridge>,
        container
      );
    },
    unmount() {
      ReactDOM.unmountComponentAtNode(container);
    },
  };
}
