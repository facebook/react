function runTest(listItem, callback) {
  try {
    callback();
    listItem.className = 'correct';
    listItem.setAttribute('data-value', 'All checks pass');
  } catch (error) {
    listItem.className = 'incorrect';
    listItem.setAttribute('data-value', error);
  }
}

function runAllTests() {
  try {
    checkSchedulerAPI();
  } finally {
    try {
      checkSchedulerTrackingAPI();
    } finally {
      try {
        checkSchedulerTrackingSubscriptionsAPI();
      } finally {
        checkEndToEndIntegration();
      }
    }
  }
}

function checkSchedulerAPI() {
  runTest(document.getElementById('checkSchedulerAPI'), () => {
    if (
      typeof Schedule === 'undefined' ||
      typeof Schedule.unstable_now !== 'function' ||
      typeof Schedule.unstable_scheduleWork !== 'function' ||
      typeof Schedule.unstable_cancelScheduledWork !== 'function'
    ) {
      throw 'API is not defined';
    }

    if (Schedule.unstable_now() !== performance.now()) {
      throw 'API does not work';
    }

    // There is no real way to verify that the two APIs are connected.
  });
}

function checkSchedulerTrackingAPI() {
  runTest(document.getElementById('checkSchedulerTrackingAPI'), () => {
    if (
      typeof ScheduleTracking === 'undefined' ||
      typeof ScheduleTracking.unstable_clear !== 'function' ||
      typeof ScheduleTracking.unstable_getCurrent !== 'function' ||
      typeof ScheduleTracking.unstable_getThreadID !== 'function' ||
      typeof ScheduleTracking.unstable_track !== 'function' ||
      typeof ScheduleTracking.unstable_wrap !== 'function'
    ) {
      throw 'API is not defined';
    }

    try {
      let interactionsSet;
      ScheduleTracking.unstable_track('test', 123, () => {
        interactionsSet = ScheduleTracking.unstable_getCurrent();
      });
      if (interactionsSet.size !== 1) {
        throw null;
      }
      const interaction = Array.from(interactionsSet)[0];
      if (interaction.name !== 'test' || interaction.timestamp !== 123) {
        throw null;
      }
    } catch (error) {
      throw 'API does not work';
    }

    const ForwardedSchedulerTracking =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ScheduleTracking;

    if (
      ScheduleTracking.unstable_getThreadID() ===
      ForwardedSchedulerTracking.unstable_getThreadID()
    ) {
      throw 'API forwarding is broken';
    }
  });
}

function checkSchedulerTrackingSubscriptionsAPI() {
  runTest(
    document.getElementById('checkSchedulerTrackingSubscriptionsAPI'),
    () => {
      if (
        typeof ScheduleTracking === 'undefined' ||
        typeof ScheduleTracking.unstable_subscribe !== 'function' ||
        typeof ScheduleTracking.unstable_unsubscribe !== 'function'
      ) {
        throw 'API is not defined';
      }

      const onInteractionScheduledWorkCompletedCalls = [];
      const onInteractionTrackedCalls = [];
      const onWorkCanceledCalls = [];
      const onWorkScheduledCalls = [];
      const onWorkStartedCalls = [];
      const onWorkStoppedCalls = [];
      const subscriber = {
        onInteractionScheduledWorkCompleted: (...args) =>
          onInteractionScheduledWorkCompletedCalls.push(args),
        onInteractionTracked: (...args) => onInteractionTrackedCalls.push(args),
        onWorkCanceled: (...args) => onWorkCanceledCalls.push(args),
        onWorkScheduled: (...args) => onWorkScheduledCalls.push(args),
        onWorkStarted: (...args) => onWorkStartedCalls.push(args),
        onWorkStopped: (...args) => onWorkStoppedCalls.push(args),
      };

      try {
        ScheduleTracking.unstable_subscribe(subscriber);
        ScheduleTracking.unstable_track('foo', 123, () => {});
        ScheduleTracking.unstable_unsubscribe(subscriber);
        if (onInteractionTrackedCalls.length !== 1) {
          throw null;
        }
        const interaction = onInteractionTrackedCalls[0][0];
        if (interaction.name !== 'foo' || interaction.timestamp !== 123) {
          throw null;
        }
        ScheduleTracking.unstable_track('bar', 456, () => {});
        if (onInteractionTrackedCalls.length !== 1) {
          throw null;
        }
      } catch (error) {
        throw 'API does not forward methods';
      }

      const ForwardedSchedulerTracking =
        React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
          .ScheduleTracking;

      try {
        ForwardedSchedulerTracking.unstable_subscribe(subscriber);
        ScheduleTracking.unstable_track('foo', 123, () => {});
        ForwardedSchedulerTracking.unstable_track('bar', 456, () => {});
        ScheduleTracking.unstable_unsubscribe(subscriber);
        if (onInteractionTrackedCalls.length !== 3) {
          throw null;
        }
        const interactionFoo = onInteractionTrackedCalls[1][0];
        const interactionBar = onInteractionTrackedCalls[2][0];
        if (
          interactionFoo.name !== 'foo' ||
          interactionFoo.timestamp !== 123 ||
          interactionBar.name !== 'bar' ||
          interactionBar.timestamp !== 456
        ) {
          throw null;
        }
        ForwardedSchedulerTracking.unstable_track('baz', 789, () => {});
        if (onInteractionTrackedCalls.length !== 3) {
          throw null;
        }
      } catch (error) {
        throw 'API forwarding is broken';
      }
    }
  );
}

function checkEndToEndIntegration() {
  runTest(document.getElementById('checkEndToEndIntegration'), () => {
    try {
      const onRenderCalls = [];
      const onRender = (...args) => onRenderCalls.push(args);
      const container = document.createElement('div');

      ScheduleTracking.unstable_track('render', 123, () => {
        ReactDOM.render(
          React.createElement(
            React.unstable_Profiler,
            {id: 'profiler', onRender},
            React.createElement('div', null, 'hi')
          ),
          container
        );
      });

      if (container.textContent !== 'hi') {
        throw null;
      }

      if (onRenderCalls.length !== 1) {
        throw null;
      }
      const call = onRenderCalls[0];
      if (call.length !== 7) {
        throw null;
      }
      const interaction = Array.from(call[6])[0];
      if (interaction.name !== 'render' || interaction.timestamp !== 123) {
        throw null;
      }
    } catch (error) {
      throw 'End to end integration is broken';
    }
  });
}
