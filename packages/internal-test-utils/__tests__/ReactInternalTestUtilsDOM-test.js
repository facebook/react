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
let act;
let Scheduler;
let ReactDOMClient;
let dispatchAndWaitForDiscrete;
let assertLog;

describe('ReactInternalTestUtilsDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    act = require('internal-test-utils').act;
    dispatchAndWaitForDiscrete =
      require('internal-test-utils').dispatchAndWaitForDiscrete;
    Scheduler = require('scheduler/unstable_mock');
    ReactDOMClient = require('react-dom/client');
    React = require('react');
    assertLog = require('internal-test-utils').assertLog;
  });
  describe('dispatchAndWaitForDiscrete', () => {
    test('should fire capture events (discrete)', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onClickCapture={() => {
              setState(1);
              Scheduler.log('onClickCapture parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onClickCapture={() => {
                setState(2);
                Scheduler.log('onClickCapture child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await dispatchAndWaitForDiscrete(childRef, 'click');
      });

      // Capture runs on every event we dispatch,
      // which means we get two for the parent, and one for the child.
      assertLog([
        'onClickCapture parent',
        'onClickCapture child',
        'Render 2',
        'onClickCapture parent',
        'onClickCapture child',
        'Render 2',
        'onClickCapture parent',
        'onClickCapture child',
        'Render 2',
      ]);

      document.body.removeChild(container);
    });

    test('should fire target events (discrete)', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onClick={() => {
              setState(1);
              Scheduler.log('onClick parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onClick={() => {
                setState(2);
                Scheduler.log('onClick child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await dispatchAndWaitForDiscrete(childRef, 'click');
      });

      assertLog(['onClick child', 'onClick parent', 'Render 1']);
    });

    test('should fire capture events (continuous)', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onMouseOutCapture={() => {
              setState(1);
              Scheduler.log('onMouseOutCapture parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onMouseOutCapture={() => {
                setState(2);
                Scheduler.log('onMouseOutCapture child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await dispatchAndWaitForDiscrete(childRef, 'mouseout');
      });

      // Capture runs on every event we dispatch,
      // which means we get two for the parent, and one for the child.
      // Since this is continuous, we batch.
      assertLog([
        'onMouseOutCapture parent',
        'onMouseOutCapture child',
        'onMouseOutCapture parent',
        'onMouseOutCapture child',
        'onMouseOutCapture parent',
        'onMouseOutCapture child',
        'Render 2',
      ]);

      document.body.removeChild(container);
    });

    test('should fire target events (continuous)', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onMouseOut={() => {
              setState(1);
              Scheduler.log('onMouseOut parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onMouseOut={() => {
                setState(2);
                Scheduler.log('onMouseOut child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await dispatchAndWaitForDiscrete(childRef, 'mouseout');
      });

      assertLog(['onMouseOut child', 'onMouseOut parent', 'Render 1']);
    });
  });
});
