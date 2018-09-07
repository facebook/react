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

describe('Component stack trace displaying', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should provide filenames in stack traces', () => {
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
    Object.keys(fileNames).forEach((fileName, i) => {
      ReactDOM.render(
        <Component __source={{fileName, lineNumber: i}} />,
        container,
      );
    });
    if (__DEV__) {
      let i = 0;
      expect(console.error.calls.count()).toBe(Object.keys(fileNames).length);
      for (let fileName in fileNames) {
        if (!fileNames.hasOwnProperty(fileName)) {
          continue;
        }
        const args = console.error.calls.argsFor(i);
        const stack = args[args.length - 1];
        const expected = fileNames[fileName];
        expect(stack).toContain(`at ${expected}:`);
        i++;
      }
    }
  });
});
