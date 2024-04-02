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
let ReactNoop;
let Scheduler;
let act;
let assertLog;

describe('ReactClassComponentPropResolution', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
  });

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  test('resolves ref and default props before calling lifecycle methods', async () => {
    const root = ReactNoop.createRoot();

    function getPropKeys(props) {
      return Object.keys(props).join(', ');
    }

    class Component extends React.Component {
      shouldComponentUpdate(props) {
        Scheduler.log(
          'shouldComponentUpdate (prev props): ' + getPropKeys(this.props),
        );
        Scheduler.log(
          'shouldComponentUpdate (next props): ' + getPropKeys(props),
        );
        return true;
      }
      componentDidUpdate(props) {
        Scheduler.log('componentDidUpdate (prev props): ' + getPropKeys(props));
        Scheduler.log(
          'componentDidUpdate (next props): ' + getPropKeys(this.props),
        );
        return true;
      }
      componentDidMount() {
        Scheduler.log('componentDidMount: ' + getPropKeys(this.props));
        return true;
      }
      render() {
        return <Text text={'render: ' + getPropKeys(this.props)} />;
      }
    }

    Component.defaultProps = {
      default: 'yo',
    };

    // `ref` should never appear as a prop. `default` always should.

    // Mount
    const ref = React.createRef();
    await act(async () => {
      root.render(<Component text="Yay" ref={ref} />);
    });
    assertLog(['render: text, default', 'componentDidMount: text, default']);

    // Update
    await act(async () => {
      root.render(<Component text="Yay (again)" ref={ref} />);
    });
    assertLog([
      'shouldComponentUpdate (prev props): text, default',
      'shouldComponentUpdate (next props): text, default',
      'render: text, default',
      'componentDidUpdate (prev props): text, default',
      'componentDidUpdate (next props): text, default',
    ]);
  });
});
