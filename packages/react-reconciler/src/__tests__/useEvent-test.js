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

import {useInsertionEffect} from 'react';

describe('useEvent', () => {
  let React;
  let ReactNoop;
  let Scheduler;
  let act;
  let createContext;
  let useContext;
  let useState;
  let useEvent;
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
    useEvent = React.experimental_useEvent;
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

  // @gate enableUseEventHook
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
      const onClick = useEvent(() => updateCount(c => c + incrementBy));

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

  // @gate enableUseEventHook
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
      const onClick = useEvent(person.greet);

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

  // @gate enableUseEventHook
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
      const onClick = useEvent(() => updateCount(c => c + incrementBy));

      return (
        <>
          <IncrementButton onClick={() => onClick()} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    ReactNoop.render(<Counter incrementBy={1} />);
    expect(Scheduler).toFlushAndThrow(
      'An event from useEvent was called during render',
    );

    // If something throws, we try one more time synchronously in case the error was
    // caused by a data race. See recoverFromConcurrentError
    expect(Scheduler).toHaveYielded(['Count: 0', 'Count: 0']);
  });

  // @gate enableUseEventHook
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
      const increment = useEvent(amount =>
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

  // @gate enableUseEventHook
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
      const increment = useEvent(amount =>
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

  // @gate enableUseEventHook
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
      const increment = useEvent(amount =>
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

  // @gate enableUseEventHook
  it('is mutated before all other effects', () => {
    function Counter({value}) {
      useInsertionEffect(() => {
        Scheduler.unstable_yieldValue('Effect value: ' + value);
        increment();
      }, [value]);

      // This is defined after the insertion effect, but it should
      // update the event fn _before_ the insertion effect fires.
      const increment = useEvent(() => {
        Scheduler.unstable_yieldValue('Event value: ' + value);
      });

      return <></>;
    }

    ReactNoop.render(<Counter value={1} />);
    expect(Scheduler).toFlushAndYield(['Effect value: 1', 'Event value: 1']);

    act(() => ReactNoop.render(<Counter value={2} />));
    expect(Scheduler).toHaveYielded(['Effect value: 2', 'Event value: 2']);
  });

  // @gate enableUseEventHook
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
      const onConnected = useEvent(() => {
        Scheduler.unstable_yieldValue('Connected! theme: ' + theme);
      });

      useEffect(() => {
        const connection = createConnection(roomId);
        connection.on('connected', () => {
          onConnected();
        });
        connection.connect();
        return () => connection.disconnect();
      }, [roomId, onConnected]);

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

  // @gate enableUseEventHook
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
      const onClick = useEvent(() => updateItems([...items, 1]));
      const numberOfItems = items.length;

      const onVisit = useEvent(visitedUrl => {
        Scheduler.unstable_yieldValue(
          'url: ' + url + ', numberOfItems: ' + numberOfItems,
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
