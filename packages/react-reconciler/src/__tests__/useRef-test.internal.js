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

describe('useRef', () => {
  let React;
  let ReactNoop;
  let Scheduler;
  let act;
  let useCallback;
  let useEffect;
  let useLayoutEffect;
  let useRef;
  let useState;

  beforeEach(() => {
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;

    act = require('jest-react').act;
    useCallback = React.useCallback;
    useEffect = React.useEffect;
    useLayoutEffect = React.useLayoutEffect;
    useRef = React.useRef;
    useState = React.useState;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  it('creates a ref object initialized with the provided value', () => {
    jest.useFakeTimers();

    function useDebouncedCallback(callback, ms, inputs) {
      const timeoutID = useRef(-1);
      useEffect(() => {
        return function unmount() {
          clearTimeout(timeoutID.current);
        };
      }, []);
      const debouncedCallback = useCallback(
        (...args) => {
          clearTimeout(timeoutID.current);
          timeoutID.current = setTimeout(callback, ms, ...args);
        },
        [callback, ms],
      );
      return useCallback(debouncedCallback, inputs);
    }

    let ping;
    function App() {
      ping = useDebouncedCallback(
        value => {
          Scheduler.unstable_yieldValue('ping: ' + value);
        },
        100,
        [],
      );
      return null;
    }

    act(() => {
      ReactNoop.render(<App />);
    });
    expect(Scheduler).toHaveYielded([]);

    ping(1);
    ping(2);
    ping(3);

    expect(Scheduler).toHaveYielded([]);

    jest.advanceTimersByTime(100);

    expect(Scheduler).toHaveYielded(['ping: 3']);

    ping(4);
    jest.advanceTimersByTime(20);
    ping(5);
    ping(6);
    jest.advanceTimersByTime(80);

    expect(Scheduler).toHaveYielded([]);

    jest.advanceTimersByTime(20);
    expect(Scheduler).toHaveYielded(['ping: 6']);
  });

  it('should return the same ref during re-renders', () => {
    function Counter() {
      const ref = useRef('val');
      const [count, setCount] = useState(0);
      const [firstRef] = useState(ref);

      if (firstRef !== ref) {
        throw new Error('should never change');
      }

      if (count < 3) {
        setCount(count + 1);
      }

      return <Text text={count} />;
    }

    ReactNoop.render(<Counter />);
    expect(Scheduler).toFlushAndYield([3]);

    ReactNoop.render(<Counter />);
    expect(Scheduler).toFlushAndYield([3]);
  });

  if (__DEV__) {
    it('should never warn when attaching to children', () => {
      class Component extends React.Component {
        render() {
          return null;
        }
      }

      function Example({phase}) {
        const hostRef = useRef();
        const classRef = useRef();
        return (
          <>
            <div key={`host-${phase}`} ref={hostRef} />
            <Component key={`class-${phase}`} ref={classRef} />
          </>
        );
      }

      act(() => {
        ReactNoop.render(<Example phase="mount" />);
      });
      act(() => {
        ReactNoop.render(<Example phase="update" />);
      });
    });

    // @gate enableUseRefAccessWarning
    it('should warn about reads during render', () => {
      function Example() {
        const ref = useRef(123);
        let value;
        expect(() => {
          value = ref.current;
        }).toWarnDev([
          'Example: Unsafe read of a mutable value during render.',
        ]);
        return value;
      }

      act(() => {
        ReactNoop.render(<Example />);
      });
    });

    it('should not warn about lazy init during render', () => {
      function Example() {
        const ref1 = useRef(null);
        const ref2 = useRef(undefined);
        // Read: safe because lazy init:
        if (ref1.current === null) {
          ref1.current = 123;
        }
        if (ref2.current === undefined) {
          ref2.current = 123;
        }
        return null;
      }

      act(() => {
        ReactNoop.render(<Example />);
      });

      // Should not warn after an update either.
      act(() => {
        ReactNoop.render(<Example />);
      });
    });

    it('should not warn about lazy init outside of render', () => {
      function Example() {
        // eslint-disable-next-line no-unused-vars
        const [didMount, setDidMount] = useState(false);
        const ref1 = useRef(null);
        const ref2 = useRef(undefined);
        useLayoutEffect(() => {
          ref1.current = 123;
          ref2.current = 123;
          setDidMount(true);
        }, []);
        return null;
      }

      act(() => {
        ReactNoop.render(<Example />);
      });
    });

    // @gate enableUseRefAccessWarning
    it('should warn about unconditional lazy init during render', () => {
      function Example() {
        const ref1 = useRef(null);
        const ref2 = useRef(undefined);

        if (shouldExpectWarning) {
          expect(() => {
            ref1.current = 123;
          }).toWarnDev([
            'Example: Unsafe write of a mutable value during render',
          ]);
          expect(() => {
            ref2.current = 123;
          }).toWarnDev([
            'Example: Unsafe write of a mutable value during render',
          ]);
        } else {
          ref1.current = 123;
          ref1.current = 123;
        }

        // But only warn once
        ref1.current = 345;
        ref1.current = 345;

        return null;
      }

      let shouldExpectWarning = true;
      act(() => {
        ReactNoop.render(<Example />);
      });

      // Should not warn again on update.
      shouldExpectWarning = false;
      act(() => {
        ReactNoop.render(<Example />);
      });
    });

    // @gate enableUseRefAccessWarning
    it('should warn about reads to ref after lazy init pattern', () => {
      function Example() {
        const ref1 = useRef(null);
        const ref2 = useRef(undefined);

        // Read 1: safe because lazy init:
        if (ref1.current === null) {
          ref1.current = 123;
        }
        if (ref2.current === undefined) {
          ref2.current = 123;
        }

        let value;
        expect(() => {
          value = ref1.current;
        }).toWarnDev(['Example: Unsafe read of a mutable value during render']);
        expect(() => {
          value = ref2.current;
        }).toWarnDev(['Example: Unsafe read of a mutable value during render']);

        // But it should only warn once.
        value = ref1.current;
        value = ref2.current;

        return value;
      }

      act(() => {
        ReactNoop.render(<Example />);
      });
    });

    // @gate enableUseRefAccessWarning
    it('should warn about writes to ref after lazy init pattern', () => {
      function Example() {
        const ref1 = useRef(null);
        const ref2 = useRef(undefined);
        // Read: safe because lazy init:
        if (ref1.current === null) {
          ref1.current = 123;
        }
        if (ref2.current === undefined) {
          ref2.current = 123;
        }

        expect(() => {
          ref1.current = 456;
        }).toWarnDev([
          'Example: Unsafe write of a mutable value during render',
        ]);
        expect(() => {
          ref2.current = 456;
        }).toWarnDev([
          'Example: Unsafe write of a mutable value during render',
        ]);

        return null;
      }

      act(() => {
        ReactNoop.render(<Example />);
      });
    });

    it('should not warn about reads or writes within effect', () => {
      function Example() {
        const ref = useRef(123);
        useLayoutEffect(() => {
          expect(ref.current).toBe(123);
          ref.current = 456;
          expect(ref.current).toBe(456);
        }, []);
        useEffect(() => {
          expect(ref.current).toBe(456);
          ref.current = 789;
          expect(ref.current).toBe(789);
        }, []);
        return null;
      }

      act(() => {
        ReactNoop.render(<Example />);
      });

      ReactNoop.flushPassiveEffects();
    });

    it('should not warn about reads or writes outside of render phase (e.g. event handler)', () => {
      let ref;
      function Example() {
        ref = useRef(123);
        return null;
      }

      act(() => {
        ReactNoop.render(<Example />);
      });

      expect(ref.current).toBe(123);
      ref.current = 456;
      expect(ref.current).toBe(456);
    });
  }
});
