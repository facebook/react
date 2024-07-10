/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMClient;
let act;
let jsxDEV;

describe('Component stack trace displaying', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    jsxDEV = require('react/jsx-dev-runtime').jsxDEV;
  });

  // @gate !enableComponentStackLocations
  // @gate __DEV__
  it('should provide filenames in stack traces', async () => {
    class Component extends React.Component {
      render() {
        return [<span>a</span>, <span>b</span>];
      }
    }

    spyOnDev(console, 'error');
    const container = document.createElement('div');
    const fileNames = {
      '': '',
      '/': '',
      '\\': '',
      Foo: 'Foo',
      'Bar/Foo': 'Foo',
      'Bar\\Foo': 'Foo',
      'Baz/Bar/Foo': 'Foo',
      'Baz\\Bar\\Foo': 'Foo',

      'Foo.js': 'Foo.js',
      'Foo.jsx': 'Foo.jsx',
      '/Foo.js': 'Foo.js',
      '/Foo.jsx': 'Foo.jsx',
      '\\Foo.js': 'Foo.js',
      '\\Foo.jsx': 'Foo.jsx',
      'Bar/Foo.js': 'Foo.js',
      'Bar/Foo.jsx': 'Foo.jsx',
      'Bar\\Foo.js': 'Foo.js',
      'Bar\\Foo.jsx': 'Foo.jsx',
      '/Bar/Foo.js': 'Foo.js',
      '/Bar/Foo.jsx': 'Foo.jsx',
      '\\Bar\\Foo.js': 'Foo.js',
      '\\Bar\\Foo.jsx': 'Foo.jsx',
      'Bar/Baz/Foo.js': 'Foo.js',
      'Bar/Baz/Foo.jsx': 'Foo.jsx',
      'Bar\\Baz\\Foo.js': 'Foo.js',
      'Bar\\Baz\\Foo.jsx': 'Foo.jsx',
      '/Bar/Baz/Foo.js': 'Foo.js',
      '/Bar/Baz/Foo.jsx': 'Foo.jsx',
      '\\Bar\\Baz\\Foo.js': 'Foo.js',
      '\\Bar\\Baz\\Foo.jsx': 'Foo.jsx',
      'C:\\funny long (path)/Foo.js': 'Foo.js',
      'C:\\funny long (path)/Foo.jsx': 'Foo.jsx',

      'index.js': 'index.js',
      'index.jsx': 'index.jsx',
      '/index.js': 'index.js',
      '/index.jsx': 'index.jsx',
      '\\index.js': 'index.js',
      '\\index.jsx': 'index.jsx',
      'Bar/index.js': 'Bar/index.js',
      'Bar/index.jsx': 'Bar/index.jsx',
      'Bar\\index.js': 'Bar/index.js',
      'Bar\\index.jsx': 'Bar/index.jsx',
      '/Bar/index.js': 'Bar/index.js',
      '/Bar/index.jsx': 'Bar/index.jsx',
      '\\Bar\\index.js': 'Bar/index.js',
      '\\Bar\\index.jsx': 'Bar/index.jsx',
      'Bar/Baz/index.js': 'Baz/index.js',
      'Bar/Baz/index.jsx': 'Baz/index.jsx',
      'Bar\\Baz\\index.js': 'Baz/index.js',
      'Bar\\Baz\\index.jsx': 'Baz/index.jsx',
      '/Bar/Baz/index.js': 'Baz/index.js',
      '/Bar/Baz/index.jsx': 'Baz/index.jsx',
      '\\Bar\\Baz\\index.js': 'Baz/index.js',
      '\\Bar\\Baz\\index.jsx': 'Baz/index.jsx',
      'C:\\funny long (path)/index.js': 'funny long (path)/index.js',
      'C:\\funny long (path)/index.jsx': 'funny long (path)/index.jsx',
    };

    const root = ReactDOMClient.createRoot(container);

    let i = 0;
    for (const fileName in fileNames) {
      Component.displayName = 'Component ' + i;

      await act(() => {
        root.render(
          // Intentionally inlining a manual jsxDEV() instead of relying on the
          // compiler so that we can pass a custom source location.
          jsxDEV(
            Component,
            {},
            undefined,
            false,
            {fileName, lineNumber: i},
            this,
          ),
        );
      });

      i++;
    }
    if (__DEV__) {
      i = 0;
      expect(console.error).toHaveBeenCalledTimes(
        Object.keys(fileNames).length,
      );
      for (const fileName in fileNames) {
        if (!fileNames.hasOwnProperty(fileName)) {
          continue;
        }
        const args = console.error.mock.calls[i];
        const stack = args[args.length - 1];
        const expected = fileNames[fileName];
        expect(stack).toContain(`at ${expected}:`);
        i++;
      }
    }
  });
});
