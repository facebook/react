/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

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

  beforeEach(() => {
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    act = require('jest-react').act;
    createContext = React.createContext;
    useContext = React.useContext;
    useState = React.useState;
    useEffectEvent = React.experimental_useEffectEvent;
    useEffect = React.useEffect;
    useLayoutEffect = React.useLayoutEffect;
    useMemo = React.useMemo;
  });

  function span(prop) {
    return {type: 'span', hidden: false, children: [], prop};
  }

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  // @gate enableUseEffectEventHook
  it('memoizes basic case correctly', () => {
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
    expect(Scheduler).toFlushAndYield(['Increment', 'Count: 0']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 0'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Increment', 'Count: 1']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 1'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield(['Increment', 'Count: 2']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Increment', 'Count: 12']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 12'),
    ]);
  });

  // @gate enableUseEffectEventHook
  it('can be defined more than once', () => {
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
    expect(Scheduler).toFlushAndYield(['Increment', 'Count: 0']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 0'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Increment', 'Count: 5']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 5'),
    ]);

    act(button.current.multiply);
    expect(Scheduler).toHaveYielded(['Increment', 'Count: 25']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 25'),
    ]);
  });

  // @gate enableUseEffectEventHook
  it('does not preserve `this` in event functions', () => {
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
    expect(Scheduler).toFlushAndYield(['Say hej', 'Greeting: Seb says hej']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Say hej'),
      span('Greeting: Seb says hej'),
    ]);

    act(button.current.greet);
    expect(Scheduler).toHaveYielded([
      'Say hej',
      'Greeting: undefined says hej',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Say hej'),
      span('Greeting: undefined says hej'),
    ]);
  });

  // @gate enableUseEffectEventHook
  it('throws when called in render', () => {
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
    expect(Scheduler).toFlushAndThrow(
      "A function wrapped in useEffectEvent can't be called during rendering.",
    );

    // If something throws, we try one more time synchronously in case the error was
    // caused by a data race. See recoverFromConcurrentError
    expect(Scheduler).toHaveYielded(['Count: 0', 'Count: 0']);
  });

  // @gate enableUseEffectEventHook
  it("useLayoutEffect shouldn't re-fire when event handlers change", () => {
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
        Scheduler.unstable_yieldValue('Effect: by ' + incrementBy * 2);
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
    expect(Scheduler).toHaveYielded([]);
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Increment',
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      'Increment',
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 3'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 4'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 4',
      'Effect: by 20',
      'Increment',
      'Count: 24',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 24'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Increment', 'Count: 34']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 34'),
    ]);
  });

  // @gate enableUseEffectEventHook
  it("useEffect shouldn't re-fire when event handlers change", () => {
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
        Scheduler.unstable_yieldValue('Effect: by ' + incrementBy * 2);
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
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Increment',
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      'Increment',
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 3'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 4'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 4',
      'Effect: by 20',
      'Increment',
      'Count: 24',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 24'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Increment', 'Count: 34']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 34'),
    ]);
  });

  // @gate enableUseEffectEventHook
  it('is stable in a custom hook', () => {
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
        Scheduler.unstable_yieldValue('Effect: by ' + incrementBy * 2);
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
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Increment',
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      'Increment',
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 3'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      'Increment',
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 4'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 4',
      'Effect: by 20',
      'Increment',
      'Count: 24',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 24'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Increment', 'Count: 34']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 34'),
    ]);
  });

  // @gate enableUseEffectEventHook
  it('is mutated before all other effects', () => {
    function Counter({value}) {
      useInsertionEffect(() => {
        Scheduler.unstable_yieldValue('Effect value: ' + value);
        increment();
      }, [value]);

      // This is defined after the insertion effect, but it should
      // update the event fn _before_ the insertion effect fires.
      const increment = useEffectEvent(() => {
        Scheduler.unstable_yieldValue('Event value: ' + value);
      });

      return <></>;
    }

    ReactNoop.render(<Counter value={1} />);
    expect(Scheduler).toFlushAndYield(['Effect value: 1', 'Event value: 1']);

    act(() => ReactNoop.render(<Counter value={2} />));
    expect(Scheduler).toHaveYielded(['Effect value: 2', 'Event value: 2']);
  });

  // @gate enableUseEffectEventHook
  it("doesn't provide a stable identity", () => {
    function Counter({shouldRender, value}) {
      const onClick = useEffectEvent(() => {
        Scheduler.unstable_yieldValue(
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
    expect(Scheduler).toFlushAndYield([
      'onClick, shouldRender=true, value=0',
      'onClick, shouldRender=true, value=0',
    ]);

    ReactNoop.render(<Counter shouldRender={true} value={1} />);
    expect(Scheduler).toFlushAndYield(['onClick, shouldRender=true, value=1']);

    ReactNoop.render(<Counter shouldRender={false} value={2} />);
    expect(Scheduler).toFlushAndYield([
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
          Scheduler.unstable_yieldValue('Commit new event handler');
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
    await act(async () => {
      root.render(<App value={1} />);
    });
    expect(Scheduler).toHaveYielded(['Commit new event handler']);
    expect(root).toMatchRenderedOutput('Latest rendered value 1');
    expect(committedEventHandler()).toBe('Value seen by useEffectEvent: 1');

    // Update
    await act(async () => {
      root.render(<App value={2} />);
    });
    // No new event handler should be committed, because it was omitted from
    // the dependency array.
    expect(Scheduler).toHaveYielded([]);
    // But the event handler should still be able to see the latest value.
    expect(root).toMatchRenderedOutput('Latest rendered value 2');
    expect(committedEventHandler()).toBe('Value seen by useEffectEvent: 2');
  });

  // @gate enableUseEffectEventHook
  it('integration: implements docs chat room example', () => {
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
        Scheduler.unstable_yieldValue('Connected! theme: ' + theme);
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

    act(() => ReactNoop.render(<ChatRoom roomId="general" theme="light" />));
    expect(Scheduler).toHaveYielded(['Welcome to the general room!']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Welcome to the general room!'),
    ]);

    jest.advanceTimersByTime(100);
    Scheduler.unstable_advanceTime(100);
    expect(Scheduler).toHaveYielded(['Connected! theme: light']);

    // change roomId only
    act(() => ReactNoop.render(<ChatRoom roomId="music" theme="light" />));
    expect(Scheduler).toHaveYielded(['Welcome to the music room!']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Welcome to the music room!'),
    ]);
    jest.advanceTimersByTime(100);
    Scheduler.unstable_advanceTime(100);
    // should trigger a reconnect
    expect(Scheduler).toHaveYielded(['Connected! theme: light']);

    // change theme only
    act(() => ReactNoop.render(<ChatRoom roomId="music" theme="dark" />));
    expect(Scheduler).toHaveYielded(['Welcome to the music room!']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Welcome to the music room!'),
    ]);
    jest.advanceTimersByTime(100);
    Scheduler.unstable_advanceTime(100);
    // should not trigger a reconnect
    expect(Scheduler).toFlushWithoutYielding();

    // change roomId only
    act(() => ReactNoop.render(<ChatRoom roomId="travel" theme="dark" />));
    expect(Scheduler).toHaveYielded(['Welcome to the travel room!']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Welcome to the travel room!'),
    ]);
    jest.advanceTimersByTime(100);
    Scheduler.unstable_advanceTime(100);
    // should trigger a reconnect
    expect(Scheduler).toHaveYielded(['Connected! theme: dark']);
  });

  // @gate enableUseEffectEventHook
  it('integration: implements the docs logVisit example', () => {
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
        Scheduler.unstable_yieldValue(
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
    act(() =>
      ReactNoop.render(
        <AppShell>
          <Page url="/shop/1" />
        </AppShell>,
      ),
    );
    expect(Scheduler).toHaveYielded([
      'Add to cart',
      'url: /shop/1, numberOfItems: 0',
    ]);
    act(button.current.addToCart);
    expect(Scheduler).toHaveYielded(['Add to cart']);

    act(() =>
      ReactNoop.render(
        <AppShell>
          <Page url="/shop/2" />
        </AppShell>,
      ),
    );
    expect(Scheduler).toHaveYielded([
      'Add to cart',
      'url: /shop/2, numberOfItems: 1',
    ]);
  });
});
