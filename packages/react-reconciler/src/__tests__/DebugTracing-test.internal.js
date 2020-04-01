/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('DebugTracing', () => {
  //let DebugTrace;
  let React;
  let ReactFeatureFlags;
  let ReactTestRenderer;
  let Scheduler;

  let logs;

  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDebugTracing = true;

    //DebugTrace = require('react-reconciler/src/DebugTrace');
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');

    logs = [];

    const groups = [];

    spyOnDevAndProd(console, 'log').and.callFake(message => {
      logs.push(`log: ${message.replace(/%c/g, '')}`);
    });
    spyOnDevAndProd(console, 'group').and.callFake(message => {
      logs.push(`group: ${message.replace(/%c/g, '')}`);
      groups.push(message);
    });
    spyOnDevAndProd(console, 'groupEnd').and.callFake(() => {
      const message = groups.pop();
      logs.push(`groupEnd: ${message.replace(/%c/g, '')}`);
    });
  });

  if (!__DEV__) {
    it('empty test', () => {
      // Empty test to prevent "Your test suite must contain at least one test." error.
    });
  } else {
    it('should not log anything for sync render without suspends or state updates', () => {
      ReactTestRenderer.create(<div />);

      expect(logs).toEqual(['log: ⚛️ render scheduled (priority: immediate)']);
    });

    it('should not log anything for concurrent render without suspends or state updates', () => {
      ReactTestRenderer.create(<div />, {unstable_isConcurrent: true});

      expect(logs).toEqual(['log: ⚛️ render scheduled (priority: normal)']);

      logs.splice(0);

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(logs).toEqual([]);
    });

    it('should log sync render with suspense', () => {
      const fakeSuspensPromise = new Promise(() => {});
      function Example() {
        throw fakeSuspensPromise;
      }

      ReactTestRenderer.create(
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>,
      );

      expect(logs).toEqual([
        'log: ⚛️ render scheduled (priority: immediate)',
        'group: ⚛️ render (priority: immediate)',
        'log: ⚛️ Example suspended',
        'groupEnd: ⚛️ render (priority: immediate)',
      ]);
    });

    it('should log concurrent render with suspense', () => {
      const fakeSuspensPromise = new Promise(() => {});
      function Example() {
        throw fakeSuspensPromise;
      }

      ReactTestRenderer.create(
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>,
        {unstable_isConcurrent: true},
      );

      expect(logs).toEqual(['log: ⚛️ render scheduled (priority: normal)']);

      logs.splice(0);

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(logs).toEqual([
        'group: ⚛️ render (priority: normal)',
        'log: ⚛️ Example suspended',
        'groupEnd: ⚛️ render (priority: normal)',
      ]);
    });

    it('should log cascading class component updates', () => {
      class Example extends React.Component {
        state = {didMount: false};
        componentDidMount() {
          this.setState({didMount: true});
        }
        render() {
          return null;
        }
      }

      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

      expect(logs).toEqual(['log: ⚛️ render scheduled (priority: normal)']);

      logs.splice(0);

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(logs).toEqual([
        'group: ⚛️ commit (priority: normal)',
        'group: ⚛️ layout effects (priority: immediate)',
        'log: ⚛️ Example updated state (priority: immediate)',
        'groupEnd: ⚛️ layout effects (priority: immediate)',
        'groupEnd: ⚛️ commit (priority: normal)',
      ]);
    });

    it('should log cascading layout updates', () => {
      function Example() {
        const [didMount, setDidMount] = React.useState(false);
        React.useLayoutEffect(() => {
          setDidMount(true);
        }, []);
        return didMount;
      }

      ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});

      expect(logs).toEqual(['log: ⚛️ render scheduled (priority: normal)']);

      logs.splice(0);

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(logs).toEqual([
        'group: ⚛️ commit (priority: normal)',
        'group: ⚛️ layout effects (priority: immediate)',
        'log: ⚛️ Example updated state (priority: immediate)',
        'groupEnd: ⚛️ layout effects (priority: immediate)',
        'groupEnd: ⚛️ commit (priority: normal)',
      ]);
    });

    it('should log cascading passive updates', () => {
      function Example() {
        const [didMount, setDidMount] = React.useState(false);
        React.useEffect(() => {
          setDidMount(true);
        }, []);
        return didMount;
      }

      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<Example />, {unstable_isConcurrent: true});
      });
      expect(logs).toEqual([
        'log: ⚛️ render scheduled (priority: normal)',
        'group: ⚛️ passive effects (priority: normal)',
        'log: ⚛️ Example updated state (priority: normal)',
        'groupEnd: ⚛️ passive effects (priority: normal)',
      ]);
    });
  }
});
