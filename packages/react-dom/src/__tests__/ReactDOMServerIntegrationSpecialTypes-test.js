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
let pure;
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
  pure = React.pure;

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

  describe('pure functional components', () => {
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
      const PureCounter = pure(Counter);
      const domNode = await render(<PureCounter count={0} />);
      expect(domNode.textContent).toEqual('Count: 0');
    });

    itRenders('composition with forwardRef', async render => {
      const RefCounter = (props, ref) => <Counter count={ref.current} />;
      const PureRefCounter = pure(forwardRef(RefCounter));

      const ref = React.createRef();
      ref.current = 0;
      await render(<PureRefCounter ref={ref} />);

      expect(clearYields()).toEqual(['Count: 0']);
    });

    itRenders('with comparator', async render => {
      const PureCounter = pure(Counter, (oldProps, newProps) => false);
      await render(<PureCounter count={0} />);
      expect(clearYields()).toEqual(['Count: 0']);
    });

    itRenders(
      'comparator functions are not invoked on the server',
      async render => {
        const PureCounter = React.pure(Counter, (oldProps, newProps) => {
          yieldValue(
            `Old count: ${oldProps.count}, New count: ${newProps.count}`,
          );
          return oldProps.count === newProps.count;
        });

        await render(<PureCounter count={0} />);
        expect(clearYields()).toEqual(['Count: 0']);
      },
    );
  });
});
