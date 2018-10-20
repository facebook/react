/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;
let forwardRef;
let memo;
let yieldedValues;
let yieldValue;
let clearYields;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  forwardRef = React.forwardRef;
  memo = React.memo;

  yieldedValues = [];
  yieldValue = value => {
    yieldedValues.push(value);
  };
  clearYields = () => {
    const ret = yieldedValues;
    yieldedValues = [];
    return ret;
  };

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
  };
}

const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  itRenders('a forwardedRef component and its children', async render => {
    const FunctionComponent = ({label, forwardedRef}) => (
      <div ref={forwardedRef}>{label}</div>
    );
    const WrappedFunctionComponent = forwardRef((props, ref) => (
      <FunctionComponent {...props} forwardedRef={ref} />
    ));

    const ref = React.createRef();
    const element = await render(
      <WrappedFunctionComponent ref={ref} label="Test" />,
    );
    const parent = element.parentNode;
    const div = parent.childNodes[0];
    expect(div.tagName).toBe('DIV');
    expect(div.textContent).toBe('Test');
  });

  itRenders('a Profiler component and its children', async render => {
    const element = await render(
      <React.unstable_Profiler id="profiler" onRender={jest.fn()}>
        <div>Test</div>
      </React.unstable_Profiler>,
    );
    const parent = element.parentNode;
    const div = parent.childNodes[0];
    expect(div.tagName).toBe('DIV');
    expect(div.textContent).toBe('Test');
  });

  describe('memoized functional components', () => {
    beforeEach(() => {
      resetModules();
    });

    function Text({text}) {
      yieldValue(text);
      return <span>{text}</span>;
    }

    function Counter({count}) {
      return <Text text={'Count: ' + count} />;
    }

    itRenders('basic render', async render => {
      const MemoCounter = memo(Counter);
      const domNode = await render(<MemoCounter count={0} />);
      expect(domNode.textContent).toEqual('Count: 0');
    });

    itRenders('composition with forwardRef', async render => {
      const RefCounter = (props, ref) => <Counter count={ref.current} />;
      const MemoRefCounter = memo(forwardRef(RefCounter));

      const ref = React.createRef();
      ref.current = 0;
      await render(<MemoRefCounter ref={ref} />);

      expect(clearYields()).toEqual(['Count: 0']);
    });

    itRenders('with comparator', async render => {
      const MemoCounter = memo(Counter, (oldProps, newProps) => false);
      await render(<MemoCounter count={0} />);
      expect(clearYields()).toEqual(['Count: 0']);
    });

    itRenders(
      'comparator functions are not invoked on the server',
      async render => {
        const MemoCounter = React.memo(Counter, (oldProps, newProps) => {
          yieldValue(
            `Old count: ${oldProps.count}, New count: ${newProps.count}`,
          );
          return oldProps.count === newProps.count;
        });

        await render(<MemoCounter count={0} />);
        expect(clearYields()).toEqual(['Count: 0']);
      },
    );
  });
});
