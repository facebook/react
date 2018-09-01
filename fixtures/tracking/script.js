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
      typeof ReactScheduler === 'undefined' ||
      typeof ReactScheduler.unstable_now !== 'function' ||
      typeof ReactScheduler.unstable_scheduleWork !== 'function' ||
      typeof ReactScheduler.unstable_cancelScheduledWork !== 'function'
    ) {
      throw 'API is not defined';
    }

    if (ReactScheduler.unstable_now() !== performance.now()) {
      throw 'API does not work';
    }

    // There is no real way to verify that the two APIs are connected.
  });
}

function checkSchedulerTrackingAPI() {
  runTest(document.getElementById('checkSchedulerTrackingAPI'), () => {
    if (
      typeof ReactSchedulerTracking === 'undefined' ||
      typeof ReactSchedulerTracking.__getInteractionsRef !== 'function' ||
      typeof ReactSchedulerTracking.__getSubscriberRef !== 'function' ||
      typeof ReactSchedulerTracking.unstable_clear !== 'function' ||
      typeof ReactSchedulerTracking.unstable_getCurrent !== 'function' ||
      typeof ReactSchedulerTracking.unstable_getThreadID !== 'function' ||
      typeof ReactSchedulerTracking.unstable_track !== 'function' ||
      typeof ReactSchedulerTracking.unstable_wrap !== 'function'
    ) {
      throw 'API is not defined';
    }

    try {
      let interactionsSet;
      ReactSchedulerTracking.unstable_track('test', 123, () => {
        interactionsSet = ReactSchedulerTracking.__getInteractionsRef().current;
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
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .SchedulerTracking;

    if (
      ReactSchedulerTracking.unstable_getThreadID() ===
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
        typeof ReactSchedulerTracking === 'undefined' ||
        typeof ReactSchedulerTracking.unstable_subscribe !== 'function' ||
        typeof ReactSchedulerTracking.unstable_unsubscribe !== 'function'
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
        ReactSchedulerTracking.unstable_subscribe(subscriber);
        ReactSchedulerTracking.unstable_track('foo', 123, () => {});
        ReactSchedulerTracking.unstable_unsubscribe(subscriber);
        if (onInteractionTrackedCalls.length !== 1) {
          throw null;
        }
        const interaction = onInteractionTrackedCalls[0][0];
        if (interaction.name !== 'foo' || interaction.timestamp !== 123) {
          throw null;
        }
        ReactSchedulerTracking.unstable_track('bar', 456, () => {});
        if (onInteractionTrackedCalls.length !== 1) {
          throw null;
        }
      } catch (error) {
        throw 'API does not forward methods';
      }

      const ForwardedSchedulerTracking =
        React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
          .SchedulerTracking;

      try {
        ForwardedSchedulerTracking.unstable_subscribe(subscriber);
        ReactSchedulerTracking.unstable_track('foo', 123, () => {});
        ForwardedSchedulerTracking.unstable_track('bar', 456, () => {});
        ReactSchedulerTracking.unstable_unsubscribe(subscriber);
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

      ReactSchedulerTracking.unstable_track('render', 123, () => {
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
