/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let ImmediatePriority;
let UserBlockingPriority;
let NormalPriority;
let LowPriority;
let IdlePriority;
let runWithPriority;

describe('ReactSchedulerIntegration', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ImmediatePriority = Scheduler.unstable_ImmediatePriority;
    UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
    NormalPriority = Scheduler.unstable_NormalPriority;
    LowPriority = Scheduler.unstable_LowPriority;
    IdlePriority = Scheduler.unstable_IdlePriority;
    runWithPriority = Scheduler.unstable_runWithPriority;
  });

  function getCurrentPriorityAsString() {
    const priorityLevel = Scheduler.unstable_getCurrentPriorityLevel();
    switch (priorityLevel) {
      case ImmediatePriority:
        return 'Immediate';
      case UserBlockingPriority:
        return 'UserBlocking';
      case NormalPriority:
        return 'Normal';
      case LowPriority:
        return 'Low';
      case IdlePriority:
        return 'Idle';
      default:
        throw Error('Unknown priority level: ' + priorityLevel);
    }
  }

  it('has correct priority during rendering', () => {
    function ReadPriority() {
      Scheduler.yieldValue('Priority: ' + getCurrentPriorityAsString());
      return null;
    }
    ReactNoop.render(<ReadPriority />);
    expect(Scheduler).toFlushAndYield(['Priority: Normal']);

    runWithPriority(UserBlockingPriority, () => {
      ReactNoop.render(<ReadPriority />);
    });
    expect(Scheduler).toFlushAndYield(['Priority: UserBlocking']);

    runWithPriority(IdlePriority, () => {
      ReactNoop.render(<ReadPriority />);
    });
    expect(Scheduler).toFlushAndYield(['Priority: Idle']);
  });

  it('has correct priority when continuing a render after yielding', () => {
    function ReadPriority() {
      Scheduler.yieldValue('Priority: ' + getCurrentPriorityAsString());
      return null;
    }

    runWithPriority(UserBlockingPriority, () => {
      ReactNoop.render(
        <React.Fragment>
          <ReadPriority />
          <ReadPriority />
          <ReadPriority />
        </React.Fragment>,
      );
    });

    // Render part of the tree
    expect(Scheduler).toFlushAndYieldThrough(['Priority: UserBlocking']);

    // Priority is set back to normal when yielding
    expect(getCurrentPriorityAsString()).toEqual('Normal');

    // Priority is restored to user-blocking when continuing
    expect(Scheduler).toFlushAndYield([
      'Priority: UserBlocking',
      'Priority: UserBlocking',
    ]);
  });

  it('layout effects have immediate priority', () => {
    const {useLayoutEffect} = React;
    function ReadPriority() {
      Scheduler.yieldValue('Render priority: ' + getCurrentPriorityAsString());
      useLayoutEffect(() => {
        Scheduler.yieldValue(
          'Layout priority: ' + getCurrentPriorityAsString(),
        );
      });
      return null;
    }

    ReactNoop.render(<ReadPriority />);
    expect(Scheduler).toFlushAndYield([
      'Render priority: Normal',
      'Layout priority: Immediate',
    ]);
  });

  it('passive effects have the same priority as render', () => {
    const {useEffect} = React;
    function ReadPriority() {
      Scheduler.yieldValue('Render priority: ' + getCurrentPriorityAsString());
      useEffect(() => {
        Scheduler.yieldValue(
          'Passive priority: ' + getCurrentPriorityAsString(),
        );
      });
      return null;
    }

    ReactNoop.render(<ReadPriority />);
    expect(Scheduler).toFlushAndYield([
      'Render priority: Normal',
      'Passive priority: Normal',
    ]);

    runWithPriority(UserBlockingPriority, () => {
      ReactNoop.render(<ReadPriority />);
    });

    expect(Scheduler).toFlushAndYield([
      'Render priority: UserBlocking',
      'Passive priority: UserBlocking',
    ]);
  });

  // TODO
  it.skip('passive effects have render priority even if they are flushed early', () => {});
});
