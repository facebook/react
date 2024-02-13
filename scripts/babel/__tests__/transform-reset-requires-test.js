'use strict';

const babel = require('@babel/core');
const myPlugin = require('../transform-reset-requires'); // Adjust the path to where your plugin is located

const transform = code => {
  return babel.transform(code, {
    configFile: false,
    plugins: [
      // require.resolve('@babel/plugin-transform-modules-commonjs'),
      [
        myPlugin,
        {
          moduleNames: [
            'react',
            'react-dom',
            'react-dom/client',
            'internal-test-utils',
            'scheduler',
            'react-noop-renderer',
            'scheduler/unstable_mock',
          ],
        },
      ],
    ],
  }).code;
};

function normalizeIndent(strings) {
  const codeLines = strings[0].split('\n');
  const leftPadding = codeLines[1].match(/\s+/)[0];
  return codeLines.map(line => line.slice(leftPadding.length)).join('\n');
}

function formatSnapshot(inputCode) {
  return `### Before\n${inputCode}\n\n### After\n${transform(inputCode)}`;
}
expect.extend({
  toEqualIgnoringWhitespace(received, expected) {
    const normalizeWhitespace = str => str.replace(/\s+/g, ' ').trim();
    const normalizedReceived = normalizeWhitespace(received);
    const normalizedExpected = normalizeWhitespace(expected);

    if (normalizedReceived === normalizedExpected) {
      return {
        message: () =>
          `expected ${received} not to equal (ignoring whitespace) ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to equal (ignoring whitespace) ${expected}`,
        pass: false,
      };
    }
  },
});

describe('transformPlugin', () => {
  it("transforms require('react') correctly", () => {
    const inputCode = `const React = require('react');`;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it("transforms require('react-dom') correctly", () => {
    const inputCode = `const ReactDOM = require('react-dom');`;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it("transforms require('react-dom/client') correctly", () => {
    const inputCode = `const ReactDOMClient = require('react-dom/client');`;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it('transforms act correctly', () => {
    const inputCode = `const act = require('internal-test-utils').act;`;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it('transforms destructured imports correctly', () => {
    const inputCode = normalizeIndent`
      const React = require('react');
      const {startTransition, useDeferredValue} = React;
      const {
        waitFor,
        waitForAll,
        waitForPaint,
        waitForThrow,
        assertLog,
        act,
      } = require('internal-test-utils');
    `;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it('transforms babel output correctly', () => {
    const inputCode = normalizeIndent`
    var React = require('react');var _React = React,
    startTransition = _React.startTransition,useDeferredValue = _React.useDeferredValue;
    var ReactNoop = require('react-noop-renderer');var _require = require('internal-test-utils'),waitFor = _require.waitFor,waitForAll = _require.waitForAll,waitForPaint = _require.waitForPaint,waitForThrow = _require.waitForThrow,assertLog = _require.assertLog;
    var act = require('internal-test-utils').act;
    `;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it('transforms all imports correctly', () => {
    const inputCode = normalizeIndent`
      const React = require('react');
      const ReactDOM = require('react-dom');
      const ReactDOMClient = require('react-dom/client');
      const act = require('internal-test-utils').act;
    `;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it('inserts before each at top', () => {
    const inputCode = normalizeIndent`
      const React = require('react');
      describe('test', () => {

      });
    `;

    expect(formatSnapshot(inputCode)).toMatchSnapshot();
  });

  it('does not transform non-configured modules', () => {
    const inputCode = `const moment = require('moment');`;
    const outputCode = transform(inputCode);

    expect(outputCode).toEqualIgnoringWhitespace(inputCode);
  });

  it('does not transform nested imports', () => {
    const inputCode = normalizeIndent`
      describe(() => {
        const React = require('react');
        const ReactDOM = require('react-dom');
        const ReactDOMClient = require('react-dom/client');
      });
    `;
    const outputCode = transform(inputCode);

    expect(outputCode).toEqualIgnoringWhitespace(inputCode);
  });

  it('does not transform lets in the existing pattern', () => {
    const inputCode = normalizeIndent`
    let React;
    let ReactDOM;
    let ReactDOMClient;
    beforeEach(() => {
      React = require('react');
      ReactDOM = require('react-dom');
      ReactDOMClient = require('react-dom/client');
    });`;
    const outputCode = transform(inputCode);

    expect(outputCode).toEqualIgnoringWhitespace(inputCode);
  });
});
