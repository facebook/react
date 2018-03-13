/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

type Unsubscribe = () => void;

export function createSubscription<Property, Value>(
  config: $ReadOnly<{|
    // Synchronously gets the value for the subscribed property.
    // Return undefined if the subscribable value is undefined,
    // Or does not support synchronous reading (e.g. native Promise).
    getValue: (source: Property) => Value | void,

    // Setup a subscription for the subscribable value in props, and return an unsubscribe function.
    // Return false to indicate the property cannot be unsubscribed from (e.g. native Promises).
    // Due to the variety of change event types, subscribers should provide their own handlers.
    // Those handlers should not attempt to update state though;
    // They should call the callback() instead when a subscription changes.
    subscribe: (
      source: Property,
      callback: (value: Value | void) => void,
    ) => Unsubscribe,
  |}>,
): React$ComponentType<{
  children: (value: Value | void) => React$Node,
  source: Property,
}> {
  const {getValue, subscribe} = config;

  warning(
    typeof getValue === 'function',
    'Subscription must specify a getValue function',
  );
  warning(
    typeof subscribe === 'function',
    'Subscription must specify a subscribe function',
  );

  type Props = {
    children: (value: Value) => React$Element<any>,
    source: Property,
  };
  type State = {
    source: Property,
    unsubscribeContainer: {
      unsubscribe: Unsubscribe | null,
    },
    value: Value | void,
  };

  // Reference: https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3
  class Subscription extends React.Component<Props, State> {
    state: State = {
      source: this.props.source,
      unsubscribeContainer: {
        unsubscribe: null,
      },
      value:
        this.props.source != null ? getValue(this.props.source) : undefined,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
      if (nextProps.source !== prevState.source) {
        return {
          source: nextProps.source,
          unsubscribeContainer: {
            unsubscribe: null,
          },
          value:
            nextProps.source != null ? getValue(nextProps.source) : undefined,
        };
      }

      return null;
    }

    componentDidMount() {
      this.subscribe();
    }

    componentDidUpdate(prevProps, prevState) {
      if (this.state.source !== prevState.source) {
        this.unsubscribe(prevState);
        this.subscribe();
      }
    }

    componentWillUnmount() {
      this.unsubscribe(this.state);
    }

    render() {
      return this.props.children(this.state.value);
    }

    subscribe() {
      const {source} = this.state;
      if (source != null) {
        const callback = (value: Value | void) => {
          this.setState(state => {
            // If the value is the same, skip the unnecessary state update.
            if (value === state.value) {
              return null;
            }

            // If this event belongs to an old or uncommitted data source, ignore it.
            if (source !== state.source) {
              return null;
            }

            return {value};
          });
        };

        // Store subscription for later (in case it's needed to unsubscribe).
        // This is safe to do via mutation since:
        // 1) It does not impact render.
        // 2) This method will only be called during the "commit" phase.
        const unsubscribe = subscribe(source, callback);

        invariant(
          typeof unsubscribe === 'function',
          'A subscription should return either an unsubscribe function or false.',
        );

        this.state.unsubscribeContainer.unsubscribe = unsubscribe;

        // External values could change between render and mount,
        // In some cases it may be important to handle this case.
        const value = getValue(this.props.source);
        if (value !== this.state.value) {
          this.setState({value});
        }
      }
    }

    unsubscribe(state: State) {
      const {unsubscribe} = state.unsubscribeContainer;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    }
  }

  return Subscription;
}
