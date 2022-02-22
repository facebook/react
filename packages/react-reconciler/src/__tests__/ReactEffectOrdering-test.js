/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let React;
let ReactNoop;
let Scheduler;
let act;
let useEffect;
let useLayoutEffect;

describe('ReactHooksWithNoopRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    useEffect = React.useEffect;
    useLayoutEffect = React.useLayoutEffect;
  });

  test('layout unmounts on deletion are fired in parent -> child order', async () => {
    const root = ReactNoop.createRoot();

    function Parent() {
      useLayoutEffect(() => {
        return () => Scheduler.unstable_yieldValue('Unmount parent');
      });
      return <Child />;
    }

    function Child() {
      useLayoutEffect(() => {
        return () => Scheduler.unstable_yieldValue('Unmount child');
      });
      return 'Child';
    }

    await act(async () => {
      root.render(<Parent />);
    });
    expect(root).toMatchRenderedOutput('Child');
    await act(async () => {
      root.render(null);
    });
    expect(Scheduler).toHaveYielded(['Unmount parent', 'Unmount child']);
  });

  test('passive unmounts on deletion are fired in parent -> child order', async () => {
    const root = ReactNoop.createRoot();

    function Parent() {
      useEffect(() => {
        return () => Scheduler.unstable_yieldValue('Unmount parent');
      });
      return <Child />;
    }

    function Child() {
      useEffect(() => {
        return () => Scheduler.unstable_yieldValue('Unmount child');
      });
      return 'Child';
    }

    await act(async () => {
      root.render(<Parent />);
    });
    expect(root).toMatchRenderedOutput('Child');
    await act(async () => {
      root.render(null);
    });
    expect(Scheduler).toHaveYielded(['Unmount parent', 'Unmount child']);
  });
});
