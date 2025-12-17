/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

import {useInsertionEffect} from 'react';

describe('useEffectEvent', () => {
  let React;
  let ReactNoop;
  let Scheduler;
  let act;
  let createContext;
  let useContext;
  let useState;
  let useEffectEvent;
  let useEffect;
  let useLayoutEffect;
  let useMemo;
  let waitForAll;
  let assertLog;
  let waitForThrow;

  beforeEach(() => {
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    act = require('internal-test-utils').act;
    createContext = React.createContext;
    useContext = React.useContext;
    useState = React.useState;
    useEffectEvent = React.useEffectEvent;
    useEffect = React.useEffect;
    useLayoutEffect = React.useLayoutEffect;
    useMemo = React.useMemo;

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    assertLog = InternalTestUtils.assertLog;
    waitForThrow = InternalTestUtils.waitForThrow;
  });

  function Text(props) {
    Scheduler.log(props.text);
    return <span prop={props.text} />;
  }

  // @gate enableUseEffectEventHook
  it('memoizes basic case correctly', async () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const onClick = useEffectEvent(() => updateCount(c => c + incrementBy));

      return (
        <>
          <IncrementButton onClick={() => onClick()} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    await waitForAll(['Increment', 'Count: 0']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 0" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog(['Increment', 'Count: 1']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 1" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 2',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 2" />
      </>,
    );

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    await waitForAll(['Increment', 'Count: 2']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 2" />
      </>,
    );

    // Event uses the new prop
    await act(() => button.current.increment());
    assertLog(['Increment', 'Count: 12']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 12" />
      </>,
    );
  });

  // @gate enableUseEffectEventHook
  it('can be defined more than once', async () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      multiply = () => {
        this.props.onMouseEnter();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const onClick = useEffectEvent(() => updateCount(c => c + incrementBy));
      const onMouseEnter = useEffectEvent(() => {
        updateCount(c => c * incrementBy);
      });

      return (
        <>
          <IncrementButton
            onClick={() => onClick()}
            onMouseEnter={() => onMouseEnter()}
            ref={button}
          />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={5} />);
    await waitForAll(['Increment', 'Count: 0']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 0" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog(['Increment', 'Count: 5']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 5" />
      </>,
    );

    await act(() => button.current.multiply());
    assertLog(['Increment', 'Count: 25']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 25" />
      </>,
    );
  });

  // @gate enableUseEffectEventHook
  it('does not preserve `this` in event functions', async () => {
    class GreetButton extends React.PureComponent {
      greet = () => {
        this.props.onClick();
      };
      render() {
        return <Text text={'Say ' + this.props.hello} />;
      }
    }
    function Greeter({hello}) {
      const person = {
        toString() {
          return 'Jane';
        },
        greet() {
          return updateGreeting(this + ' says ' + hello);
        },
      };
      const [greeting, updateGreeting] = useState('Seb says ' + hello);
      const onClick = useEffectEvent(person.greet);

      return (
        <>
          <GreetButton hello={hello} onClick={() => onClick()} ref={button} />
          <Text text={'Greeting: ' + greeting} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Greeter hello={'hej'} />);
    await waitForAll(['Say hej', 'Greeting: Seb says hej']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Say hej" />
        <span prop="Greeting: Seb says hej" />
      </>,
    );

    await act(() => button.current.greet());
    assertLog(['Say hej', 'Greeting: undefined says hej']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Say hej" />
        <span prop="Greeting: undefined says hej" />
      </>,
    );
  });

  // @gate enableUseEffectEventHook
  it('throws when called in render', async () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };

      render() {
        // Will throw.
        this.props.onClick();

        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const onClick = useEffectEvent(() => updateCount(c => c + incrementBy));

      return (
        <>
          <IncrementButton onClick={() => onClick()} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    ReactNoop.render(<Counter incrementBy={1} />);
    await waitForThrow(
      "A function wrapped in useEffectEvent can't be called during rendering.",
    );
    assertLog([]);
  });

  // @gate enableUseEffectEventHook
  it("useLayoutEffect shouldn't re-fire when event handlers change", async () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const increment = useEffectEvent(amount =>
        updateCount(c => c + (amount || incrementBy)),
      );

      useLayoutEffect(() => {
        Scheduler.log('Effect: by ' + incrementBy * 2);
        increment(incrementBy * 2);
      }, [incrementBy]);

      return (
        <>
          <IncrementButton onClick={() => increment()} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    assertLog([]);
    await waitForAll([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Increment',
      'Count: 2',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 2" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog([
      'Increment',
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 3" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 4" />
      </>,
    );

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    await waitForAll([
      'Increment',
      'Count: 4',
      'Effect: by 20',
      'Increment',
      'Count: 24',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 24" />
      </>,
    );

    // Event uses the new prop
    await act(() => button.current.increment());
    assertLog(['Increment', 'Count: 34']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 34" />
      </>,
    );
  });

  // @gate enableUseEffectEventHook
  it("useEffect shouldn't re-fire when event handlers change", async () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const increment = useEffectEvent(amount =>
        updateCount(c => c + (amount || incrementBy)),
      );

      useEffect(() => {
        Scheduler.log('Effect: by ' + incrementBy * 2);
        increment(incrementBy * 2);
      }, [incrementBy]);

      return (
        <>
          <IncrementButton onClick={() => increment()} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    await waitForAll([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Increment',
      'Count: 2',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 2" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog([
      'Increment',
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 3" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 4" />
      </>,
    );

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    await waitForAll([
      'Increment',
      'Count: 4',
      'Effect: by 20',
      'Increment',
      'Count: 24',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 24" />
      </>,
    );

    // Event uses the new prop
    await act(() => button.current.increment());
    assertLog(['Increment', 'Count: 34']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 34" />
      </>,
    );
  });

  // @gate enableUseEffectEventHook
  it('is stable in a custom hook', async () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function useCount(incrementBy) {
      const [count, updateCount] = useState(0);
      const increment = useEffectEvent(amount =>
        updateCount(c => c + (amount || incrementBy)),
      );

      return [count, increment];
    }

    function Counter({incrementBy}) {
      const [count, increment] = useCount(incrementBy);

      useEffect(() => {
        Scheduler.log('Effect: by ' + incrementBy * 2);
        increment(incrementBy * 2);
      }, [incrementBy]);

      return (
        <>
          <IncrementButton onClick={() => increment()} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    await waitForAll([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Increment',
      'Count: 2',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 2" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog([
      'Increment',
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 3" />
      </>,
    );

    await act(() => button.current.increment());
    assertLog([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 4" />
      </>,
    );

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    await waitForAll([
      'Increment',
      'Count: 4',
      'Effect: by 20',
      'Increment',
      'Count: 24',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 24" />
      </>,
    );

    // Event uses the new prop
    await act(() => button.current.increment());
    assertLog(['Increment', 'Count: 34']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span prop="Increment" />
        <span prop="Count: 34" />
      </>,
    );
  });

  // @gate enableUseEffectEventHook
  it('is mutated before all other effects', async () => {
    function Counter({value}) {
      useInsertionEffect(() => {
        Scheduler.log('Effect value: ' + value);
        increment();
      }, [value]);

      // This is defined after the insertion effect, but it should
      // update the event fn _before_ the insertion effect fires.
      const increment = useEffectEvent(() => {
        Scheduler.log('Event value: ' + value);
      });

      return <></>;
    }

    ReactNoop.render(<Counter value={1} />);
    await waitForAll(['Effect value: 1', 'Event value: 1']);

    await act(() => ReactNoop.render(<Counter value={2} />));
    assertLog(['Effect value: 2', 'Event value: 2']);
  });

  // @gate enableUseEffectEventHook
  it("doesn't provide a stable identity", async () => {
    function Counter({shouldRender, value}) {
      const onClick = useEffectEvent(() => {
        Scheduler.log(
          'onClick, shouldRender=' + shouldRender + ', value=' + value,
        );
      });

      // onClick doesn't have a stable function identity so this effect will fire on every render.
      // In a real app useEffectEvent functions should *not* be passed as a dependency, this is for
      // testing purposes only.
      useEffect(() => {
        onClick();
      }, [onClick]);

      useEffect(() => {
        onClick();
      }, [shouldRender]);

      return <></>;
    }

    ReactNoop.render(<Counter shouldRender={true} value={0} />);
    await waitForAll([
      'onClick, shouldRender=true, value=0',
      'onClick, shouldRender=true, value=0',
    ]);

    ReactNoop.render(<Counter shouldRender={true} value={1} />);
    await waitForAll(['onClick, shouldRender=true, value=1']);

    ReactNoop.render(<Counter shouldRender={false} value={2} />);
    await waitForAll([
      'onClick, shouldRender=false, value=2',
      'onClick, shouldRender=false, value=2',
    ]);
  });

  // @gate enableUseEffectEventHook
  it('event handlers always see the latest committed value', async () => {
    let committedEventHandler = null;

    function App({value}) {
      const event = useEffectEvent(() => {
        return 'Value seen by useEffectEvent: ' + value;
      });

      // Set up an effect that registers the event handler with an external
      // event system (e.g. addEventListener).
      useEffect(
        () => {
          // Log when the effect fires. In the test below, we'll assert that this
          // only happens during initial render, not during updates.
          Scheduler.log('Commit new event handler');
          committedEventHandler = event;
          return () => {
            committedEventHandler = null;
          };
        },
        // Note that we've intentionally omitted the event from the dependency
        // array. But it will still be able to see the latest `value`. This is the
        // key feature of useEffectEvent that makes it different from a regular closure.
        [],
      );
      return 'Latest rendered value ' + value;
    }

    // Initial render
    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App value={1} />);
    });
    assertLog(['Commit new event handler']);
    expect(root).toMatchRenderedOutput('Latest rendered value 1');
    expect(committedEventHandler()).toBe('Value seen by useEffectEvent: 1');

    // Update
    await act(() => {
      root.render(<App value={2} />);
    });
    // No new event handler should be committed, because it was omitted from
    // the dependency array.
    assertLog([]);
    // But the event handler should still be able to see the latest value.
    expect(root).toMatchRenderedOutput('Latest rendered value 2');
    expect(committedEventHandler()).toBe('Value seen by useEffectEvent: 2');
  });

  // @gate enableUseEffectEventHook
  it('integration: implements docs chat room example', async () => {
    function createConnection() {
      let connectedCallback;
      let timeout;
      return {
        connect() {
          timeout = setTimeout(() => {
            if (connectedCallback) {
              connectedCallback();
            }
          }, 100);
        },
        on(event, callback) {
          if (connectedCallback) {
            throw Error('Cannot add the handler twice.');
          }
          if (event !== 'connected') {
            throw Error('Only "connected" event is supported.');
          }
          connectedCallback = callback;
        },
        disconnect() {
          clearTimeout(timeout);
        },
      };
    }

    function ChatRoom({roomId, theme}) {
      const onConnected = useEffectEvent(() => {
        Scheduler.log('Connected! theme: ' + theme);
      });

      useEffect(() => {
        const connection = createConnection(roomId);
        connection.on('connected', () => {
          onConnected();
        });
        connection.connect();
        return () => connection.disconnect();
      }, [roomId]);

      return <Text text={`Welcome to the ${roomId} room!`} />;
    }

    await act(() =>
      ReactNoop.render(<ChatRoom roomId="general" theme="light" />),
    );

    assertLog(['Welcome to the general room!', 'Connected! theme: light']);
    expect(ReactNoop).toMatchRenderedOutput(
      <span prop="Welcome to the general room!" />,
    );

    // change roomId only
    await act(() =>
      ReactNoop.render(<ChatRoom roomId="music" theme="light" />),
    );
    assertLog([
      'Welcome to the music room!',
      // should trigger a reconnect
      'Connected! theme: light',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <span prop="Welcome to the music room!" />,
    );

    // change theme only
    await act(() => ReactNoop.render(<ChatRoom roomId="music" theme="dark" />));
    // should not trigger a reconnect
    assertLog(['Welcome to the music room!']);
    expect(ReactNoop).toMatchRenderedOutput(
      <span prop="Welcome to the music room!" />,
    );

    // change roomId only
    await act(() =>
      ReactNoop.render(<ChatRoom roomId="travel" theme="dark" />),
    );
    assertLog([
      'Welcome to the travel room!',
      // should trigger a reconnect
      'Connected! theme: dark',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <span prop="Welcome to the travel room!" />,
    );
  });

  // @gate enableUseEffectEventHook
  it('integration: implements the docs logVisit example', async () => {
    class AddToCartButton extends React.PureComponent {
      addToCart = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Add to cart" />;
      }
    }
    const ShoppingCartContext = createContext(null);

    function AppShell({children}) {
      const [items, updateItems] = useState([]);
      const value = useMemo(() => ({items, updateItems}), [items, updateItems]);

      return (
        <ShoppingCartContext.Provider value={value}>
          {children}
        </ShoppingCartContext.Provider>
      );
    }

    function Page({url}) {
      const {items, updateItems} = useContext(ShoppingCartContext);
      const onClick = useEffectEvent(() => updateItems([...items, 1]));
      const numberOfItems = items.length;

      const onVisit = useEffectEvent(visitedUrl => {
        Scheduler.log(
          'url: ' + visitedUrl + ', numberOfItems: ' + numberOfItems,
        );
      });

      useEffect(() => {
        onVisit(url);
      }, [url]);

      return (
        <AddToCartButton
          onClick={() => {
            onClick();
          }}
          ref={button}
        />
      );
    }

    const button = React.createRef(null);
    await act(() =>
      ReactNoop.render(
        <AppShell>
          <Page url="/shop/1" />
        </AppShell>,
      ),
    );
    assertLog(['Add to cart', 'url: /shop/1, numberOfItems: 0']);
    await act(() => button.current.addToCart());
    assertLog(['Add to cart']);

    await act(() =>
      ReactNoop.render(
        <AppShell>
          <Page url="/shop/2" />
        </AppShell>,
      ),
    );
    assertLog(['Add to cart', 'url: /shop/2, numberOfItems: 1']);
  });

  it('reads the latest context value in memo Components', async () => {
    const MyContext = createContext('default');

    let logContextValue;
    const ContextReader = React.memo(function ContextReader() {
      const value = useContext(MyContext);
      Scheduler.log('ContextReader: ' + value);
      const fireLogContextValue = useEffectEvent(() => {
        Scheduler.log('ContextReader (Effect event): ' + value);
      });
      useEffect(() => {
        logContextValue = fireLogContextValue;
      }, []);
      return null;
    });

    function App({value}) {
      return (
        <MyContext.Provider value={value}>
          <ContextReader />
        </MyContext.Provider>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => root.render(<App value="first" />));
    assertLog(['ContextReader: first']);

    logContextValue();

    assertLog(['ContextReader (Effect event): first']);

    await act(() => root.render(<App value="second" />));
    assertLog(['ContextReader: second']);

    logContextValue();
    assertLog(['ContextReader (Effect event): second']);
  });

  it('reads the latest context value in forwardRef Components', async () => {
    const MyContext = createContext('default');

    let logContextValue;
    const ContextReader = React.forwardRef(function ContextReader(props, ref) {
      const value = useContext(MyContext);
      Scheduler.log('ContextReader: ' + value);
      const fireLogContextValue = useEffectEvent(() => {
        Scheduler.log('ContextReader (Effect event): ' + value);
      });
      useEffect(() => {
        logContextValue = fireLogContextValue;
      }, []);
      return null;
    });

    function App({value}) {
      return (
        <MyContext.Provider value={value}>
          <ContextReader />
        </MyContext.Provider>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => root.render(<App value="first" />));
    assertLog(['ContextReader: first']);

    logContextValue();

    assertLog(['ContextReader (Effect event): first']);

    await act(() => root.render(<App value="second" />));
    assertLog(['ContextReader: second']);

    logContextValue();
    assertLog(['ContextReader (Effect event): second']);
  });
});
