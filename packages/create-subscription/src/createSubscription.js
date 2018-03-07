/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import warning from 'fbjs/lib/invariant';

export function createSubscription<
  Property,
  CreatedSubscription,
  Value,
>(config: {|
  // Synchronously gets the value for the subscribed property.
  // Return undefined if the subscribable value is undefined,
  // Or does not support synchronous reading (e.g. native Promise).
  +getValue: (source: Property) => Value,

  // Setup a subscription for the subscribable value in props.
  // Due to the variety of change event types, subscribers should provide their own handlers.
  // Those handlers should not attempt to update state though;
  // They should call the callback() instead when a subscription changes.
  // You may optionally return a subscription value to later unsubscribe (e.g. event handler).
  +subscribe: (
    source: Property,
    callback: (value: Value) => void,
  ) => CreatedSubscription,

  // Unsubsribe from the subscribable value in props.
  // The subscription value returned from subscribe() is passed as the second parameter.
  +unsubscribe: (source: Property, subscription: CreatedSubscription) => void,
|}): React$ComponentType<{
  children: (value: Value) => React$Element<any>,
  source: any,
}> {
  const {getValue, subscribe, unsubscribe} = config;

  warning(
    typeof getValue === 'function',
    'Subscription must specify a getValue function',
  );
  warning(
    typeof subscribe === 'function',
    'Subscription must specify a subscribe function',
  );
  warning(
    typeof unsubscribe === 'function',
    'Subscription must specify a unsubscribe function',
  );

  type Props = {
    children: (value: Value) => React$Element<any>,
    source: any,
  };
  type State = {
    source: Property,
    subscriptionWrapper: {
      subscription?: CreatedSubscription,
    },
    value?: Value,
  };

  // Reference: https://gist.github.com/bvaughn/d569177d70b50b58bff69c3c4a5353f3
  class Subscription extends React.Component<Props, State> {
    state: State = {
      source: this.props.source,
      subscriptionWrapper: {},
      value:
        this.props.source != null ? getValue(this.props.source) : undefined,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
      if (nextProps.source !== prevState.source) {
        return {
          source: nextProps.source,
          subscriptionWrapper: {},
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
        // Similar to adding subscriptions,
        // It's only safe to unsubscribe during the commit phase.
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
        const callback = (value: Value) => {
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

        // Event listeners are only safe to add during the commit phase,
        // So they won't leak if render is interrupted or errors.
        const subscription = subscribe(source, callback);

        // Store subscription for later (in case it's needed to unsubscribe).
        // This is safe to do via mutation since:
        // 1) It does not impact render.
        // 2) This method will only be called during the "commit" phase.
        this.state.subscriptionWrapper.subscription = subscription;

        // External values could change between render and mount,
        // In some cases it may be important to handle this case.
        const value = getValue(this.props.source);
        if (value !== this.state.value) {
          this.setState({value});
        }
      }
    }

    unsubscribe(state: State) {
      if (state.source != null) {
        unsubscribe(
          state.source,
          ((state.subscriptionWrapper.subscription: any): CreatedSubscription),
        );
      }
    }
  }

  return Subscription;
}
