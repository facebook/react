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
let parseErrorInfo;

describe('Component stack trace parsing', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    parseErrorInfo = require('react-debug-tools').parseErrorInfo;
  });

  it('should parse filenames and line numbers', () => {
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
      for (const fileName in fileNames) {
        if (!fileNames.hasOwnProperty(fileName)) {
          continue;
        }
        const args = console.error.calls.argsFor(i);
        const componentStack = args[args.length - 1];
        const parsed = parseErrorInfo({componentStack});
        expect(parsed).toEqual({
          componentStack: [
            {
              name: 'Component',
              owner: null,
              source: {fileName: fileNames[fileName], lineNumber: i},
            },
          ],
        });
        i++;
      }
    }
  });

  it('should parse owner names when source is missing', () => {
    let parsedErrorInfo;
    class Owner extends React.Component {
      componentDidCatch(error, errorInfo) {
        parsedErrorInfo = parseErrorInfo(errorInfo);
      }

      render() {
        return <Component __source={undefined} />;
      }
    }

    class Component extends React.Component {
      componentDidMount() {
        throw new Error();
      }

      render() {
        return <div />;
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(<Owner __source={undefined} />, container);

    expect(parsedErrorInfo).toEqual({
      componentStack: [
        {
          name: 'Component',
          owner: __DEV__ ? {name: 'Owner'} : null,
          source: null,
        },
        {
          name: 'Owner',
          owner: null,
          source: null,
        },
      ],
    });
  });

  it('should work with anonymous components', () => {
    let parsedErrorInfo;

    class ErrorBoundary extends React.Component {
      componentDidCatch(error, errorInfo) {
        parsedErrorInfo = parseErrorInfo(errorInfo);
      }

      render() {
        return <>{this.props.children}</>;
      }
    }

    const AnonymousComponent = (() =>
      function() {
        React.useLayoutEffect(() => {
          throw new Error();
        }, []);

        return <div />;
      })();

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <AnonymousComponent />
      </ErrorBoundary>,
      container,
    );

    expect(parsedErrorInfo).toEqual({
      componentStack: [
        {
          name: 'Unknown',
          owner: null,
          source: __DEV__
            ? {
                fileName: 'ReactErrorInfoParser-test.js',
                lineNumber: expect.any(Number),
              }
            : null,
        },
        {
          name: 'ErrorBoundary',
          owner: null,
          source: __DEV__
            ? {
                fileName: 'ReactErrorInfoParser-test.js',
                lineNumber: expect.any(Number),
              }
            : null,
        },
      ],
    });
  });

  it('should parse source info', () => {
    let parsedErrorInfo;

    class ErrorBoundary extends React.Component {
      componentDidCatch(error, errorInfo) {
        parsedErrorInfo = parseErrorInfo(errorInfo);
      }

      render() {
        return <>{this.props.children}</>;
      }
    }

    class Component extends React.Component {
      componentDidMount() {
        throw new Error();
      }

      render() {
        return <div />;
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Component />
      </ErrorBoundary>,
      container,
    );

    expect(parsedErrorInfo).toEqual({
      componentStack: [
        {
          name: 'Component',
          owner: null,
          source: __DEV__
            ? {
                fileName: 'ReactErrorInfoParser-test.js',
                lineNumber: expect.any(Number),
              }
            : null,
        },
        {
          name: 'ErrorBoundary',
          owner: null,
          source: __DEV__
            ? {
                fileName: 'ReactErrorInfoParser-test.js',
                lineNumber: expect.any(Number),
              }
            : null,
        },
      ],
    });
  });
});
