/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let userAgentGetter;
let consoleInfoMock;

function basicRender() {
  const container = document.createElement('div');

  let renderTimes = 0;
  function Parent() {
    renderTimes++;
    return <div>HelloWorld</div>;
  }

  document.body.appendChild(container);
  try {
    ReactDOM.render(<Parent />, container);
    expect(renderTimes).toBe(1);
  } finally {
    document.body.removeChild(container);
  }
}

describe('ReactDOM show download devtools info', () => {
  beforeEach(() => {
    userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    userAgentGetter.mockReturnValue('Mock Chrome UA');
    consoleInfoMock = jest.spyOn(console, 'info').mockImplementation();

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should show download devtools info', function() {
    const isDevEnv = process.env.NODE_ENV === 'development';
    // In dev env, default is show tip
    // Download devtools info only show in dev env, no tip in production env
    expect(consoleInfoMock).toHaveBeenCalledTimes(isDevEnv ? 1 : 0);
    if (isDevEnv) {
      expect(consoleInfoMock).toHaveBeenCalledWith(
        expect.stringContaining('Download the React DevTools'),
        expect.stringContaining('font-weight:bold'),
      );
    }

    basicRender();

    consoleInfoMock.mockRestore();
  });
});

describe('ReactDOM hide download devtools info', () => {
  beforeEach(() => {
    global.HIDE_DOWNLOAD_REACT_DEVTOOLS_TIP = true;

    consoleInfoMock = jest.spyOn(console, 'info').mockImplementation();

    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should hide download devtools info', function() {
    expect(consoleInfoMock).toHaveBeenCalledTimes(0);

    basicRender();

    consoleInfoMock.mockRestore();
  });
});
