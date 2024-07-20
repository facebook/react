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
let ReactTestRenderer;
let Scheduler;
let Suspense;
let lazy;
let waitForAll;
let assertLog;
let act;

let fakeModuleCache;

describe('ReactLazyClassComponentPropResolution', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    lazy = React.lazy;

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    assertLog = InternalTestUtils.assertLog;
    act = InternalTestUtils.act;

    fakeModuleCache = new Map();
  });

  async function fakeImport(Component) {
    const record = fakeModuleCache.get(Component);
    if (record === undefined) {
      const newRecord = {
        status: 'pending',
        value: {default: Component},
        pings: [],
        then(ping) {
          switch (newRecord.status) {
            case 'pending': {
              newRecord.pings.push(ping);
              return;
            }
            case 'resolved': {
              ping(newRecord.value);
              return;
            }
            case 'rejected': {
              throw newRecord.value;
            }
          }
        },
      };
      fakeModuleCache.set(Component, newRecord);
      return newRecord;
    }
    return record;
  }

  function resolveFakeImport(moduleName) {
    const record = fakeModuleCache.get(moduleName);
    if (record === undefined) {
      throw new Error('Module not found');
    }
    if (record.status !== 'pending') {
      throw new Error('Module already resolved');
    }
    record.status = 'resolved';
    record.pings.forEach(ping => ping(record.value));
  }

  it('class component defaultProps should be set with lazy module.', async () => {
    function Text(props) {
      Scheduler.log(props.text);
      return props.text;
    }

    class Component extends React.Component {
      state = {};
      static defaultProps = {defaultProp: true};

      componentDidMount() {
        Scheduler.log('componentDidMount: ' + this.props.defaultProp);
        this.setState({defaultProp: this.props.defaultProp});
      }

      componentWillUnmount() {
        Scheduler.log('componentWillUnmount: ' + this.props.defaultProp);
      }

      render() {
        Scheduler.log('render: ' + this.state.defaultProp);
        return this.state.defaultProp ? (
          <Text text="ok" />
        ) : (
          <Text text="not ok" />
        );
      }
    }

    const LazyComponent = lazy(async () => fakeImport(Component));

    const root = ReactTestRenderer.create(
      <Suspense fallback={<Text text="Loading..." />}>
        <React.StrictMode>
          <LazyComponent />
        </React.StrictMode>
      </Suspense>,
    );

    await waitForAll(['Loading...']);

    await act(() => resolveFakeImport(Component));

    assertLog([
      'render: undefined',
      'not ok',
      'componentDidMount: true',
      'render: true',
      'ok',
    ]);
    expect(root).toMatchRenderedOutput('ok');
  });
});
