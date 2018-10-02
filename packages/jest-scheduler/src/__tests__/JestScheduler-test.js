import {
  unstable_getCurrent as getCurrent,
  unstable_subscribe as subscribe,
  unstable_trace as trace,
  unstable_wrap as wrap,
} from 'scheduler/tracing';
import {createMockSubscriber} from 'jest-scheduler';

describe('JestScheduler', () => {
  if (__DEV__) {
    it('should work with an empty set of interactions', () => {
      // Sanity test.
      expect(getCurrent()).toHaveBeenTracedWith([]);
    });

    it('should trace interactions through callbacks', done => {
      function onFinished(value) {
        expect(value).toBe('something');

        // Verify that the callback has been called with the expected interactions.
        expect(getCurrent()).toHaveBeenTracedWith([
          // You can specify a name only if that's all your care about.
          'foo',
          // Or an object with sparse attributes, e.g. name and timestamp.
          {name: 'bar', timestamp: 200},
        ]);
        done();
      }

      // Schedule some work within the context of some traced interactions.
      trace('foo', 100, () => {
        trace('bar', 200, () => {
          setTimeout(
            wrap(() => {
              onFinished('something');
            }),
            1000,
          );
        });
      });

      // Flush timers to run the test.
      jest.runAllTimers();
    });

    it('should support easy testing of interaction subscriptions', () => {
      const subscriber = createMockSubscriber();
      subscribe(subscriber);

      trace('foo', 100, () => {
        trace('bar', 200, () => {
          setTimeout(wrap(() => {}), 1000);
        });
      });

      // Verify that the subscriber's onInteractionTraced() was called for "foo" and "bar".
      expect(subscriber).toHaveBeenNotifiedOfInteractionsTraced(['foo', 'bar']);

      // You can use not.toHaveBeenNotifiedOf...() with no arguments,
      // To assert that the subscriber has not received any interactions of this type.
      expect(
        subscriber,
      ).not.toHaveBeenNotifiedOfInteractionsScheduledWorkCompleted();

      // Or you can specify interactions to ensure that it has not been notified of those.
      expect(subscriber).not.toHaveBeenNotifiedOfInteractionsTraced(['baz']);

      // If you're only concerned about the most recent notification,
      // You can verify that as well.
      expect(subscriber).toHaveBeenLastNotifiedOfInteractionTraced('bar');
      expect(subscriber).not.toHaveBeenLastNotifiedOfInteractionTraced({
        name: 'foo',
      });

      jest.runAllTimers();

      // Verify that the subscriber's onInteractionScheduledWorkCompleted() was called for "foo".
      expect(subscriber).toHaveBeenNotifiedOfInteractionsScheduledWorkCompleted(
        ['foo', 'bar'],
      );
    });

    it('should support easy testing of work subscriptions', () => {
      const subscriber = createMockSubscriber();
      subscribe(subscriber);

      trace('foo', 100, () => {
        // You can verify the most recent onWorkStarted traced interactions:
        expect(subscriber).toHaveBeenLastNotifiedOfWorkStarted(['foo']);
        expect(subscriber).not.toHaveBeenLastNotifiedOfWorkStarted(['bar']);

        trace('bar', 200, () => {
          // You can verify the most recent onWorkStarted traced interactions:
          expect(subscriber).toHaveBeenLastNotifiedOfWorkStarted([
            'foo',
            'bar',
          ]);
          expect(subscriber).not.toHaveBeenLastNotifiedOfWorkStarted(['foo']);

          // If you care about a specific call (or the sequence of calls) for onWorkStarted:
          expect(subscriber.onWorkStarted.mock.calls[0][0]).toMatchInteractions(
            ['foo'],
          );
          expect(
            subscriber.onWorkStarted.mock.calls[0][0],
          ).not.toMatchInteractions(['foo', 'bar']);
        });
      });

      subscriber.clear();

      let wrapped;
      trace('baz', 100, () => {
        // You can verify the subscriber has never been notified of a particular type of event:
        expect(subscriber).not.toHaveBeenLastNotifiedOfWorkScheduled(['baz']);

        wrapped = wrap(() => {});

        // Or that it has:
        expect(subscriber).toHaveBeenLastNotifiedOfWorkScheduled(['baz']);
      });

      // You can verify the most recent onWorkStarted traced interactions:
      expect(subscriber).toHaveBeenLastNotifiedOfWorkScheduled(['baz']);
      expect(subscriber).not.toHaveBeenLastNotifiedOfWorkScheduled(['foo']);

      subscriber.clear();

      wrapped();

      expect(subscriber).toHaveBeenLastNotifiedOfWorkStopped(['baz']);
      expect(subscriber).not.toHaveBeenLastNotifiedOfWorkStopped(['foo']);

      subscriber.clear();

      trace('qux', 100, () => {
        wrapped = wrap(() => {});
      });

      // You can verify the subscriber has never been notified of a particular event:
      expect(subscriber).not.toHaveBeenLastNotifiedOfWorkCanceled(['qux']);

      wrapped.cancel();

      expect(subscriber).toHaveBeenLastNotifiedOfWorkCanceled(['qux']);
      expect(subscriber).not.toHaveBeenLastNotifiedOfWorkCanceled(['foo']);
    });

    it('should support inline interaction comparisons', done => {
      trace('foo', 100, () => {
        trace('bar', 200, () => {
          const interactions = getCurrent();
          expect(interactions).toMatchInteractions(['foo', 'bar']);
          expect(interactions).not.toMatchInteractions(['baz']);
          done();
        });
      });
    });
  } else {
    it('noop', () => {
      // Jest test suites must contain at least one test.
    });
  }
});
