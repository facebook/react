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

// TODO The below Flow types don't work for `Props`
export function createComponent<Props, Subscription, Value>(
  config: {|
    // Specifies the name of the subscribable property.
    // The subscription value will be passed along using this same name.
    // In the case of a functional component, it will be passed as a `prop` with this name.
    // For a class component, it will be set in `state` with this name.
    property: string,

    // Synchronously get the value for the subscribed property.
    // Return undefined if the subscribable value is undefined,
    // Or does not support synchronous reading (e.g. native Promise).
    getValue: (props: Props) => Value,

    // Setup a subscription for the subscribable value in props.
    // Due to the variety of change event types, subscribers should provide their own handlers.
    // Those handlers should not attempt to update state though;
    // They should call the valueChangedCallback() instead when a subscription changes.
    // You may optionally return a subscription value to later unsubscribe (e.g. event handler).
    subscribe: (
      props: Props,
      valueChangedCallback: (value: Value) => void,
    ) => Subscription,

    // Unsubsribe from the subscribable value in props.
    // The subscription value returned from subscribe() is passed as the second parameter.
    unsubscribe: (props: Props, subscription: Subscription) => void,
  |},
  Component: React$ComponentType<*>,
): React$ComponentType<Props> {
  invariant(Component != null, 'Invalid subscribable Component specified');
  invariant(
    typeof config.property === 'string' && config.property !== '',
    'Subscribable config must specify a subscribable property',
  );
  invariant(
    typeof config.getValue === 'function',
    'Subscribable config must specify a getValue function',
  );
  invariant(
    typeof config.subscribe === 'function',
    'Subscribable config must specify a subscribe function',
  );
  invariant(
    typeof config.unsubscribe === 'function',
    'Subscribable config must specify a unsubscribe function',
  );

  const {getValue, property, subscribe, unsubscribe} = config;

  // Unique state key name to avoid conflicts.
  const stateWrapperKey = `____${property}`;

  // If possible, extend the specified component to add subscriptions.
  // This preserves ref compatibility and avoids the overhead of an extra fiber.
  let BaseClass = (Component: any);
  const prototype = (Component: any).prototype;

  // If this is a functional component, use a HOC.
  // Since functional components can't have refs, that isn't a problem.
  // Class component lifecycles are required, so a class component is needed anyway.
  if (
    typeof prototype !== 'object' ||
    typeof prototype.render !== 'function' ||
    Component.____isSubscriptionHOC === true
  ) {
    BaseClass = class extends React.Component {
      static ____isSubscriptionHOC = true;
      render() {
        const props = {
          ...this.props,
          [property]: this.state[property],
        };
        return React.createElement(Component, props);
      }
    };
  }

  // Event listeners are only safe to add during the commit phase,
  // So they won't leak if render is interrupted or errors.
  const subscribeHelper = (props, instance) => {
    if (props[property] != null) {
      const wrapper = instance.state[stateWrapperKey];

      const valueChangedCallback = value => {
        instance.setState(state => {
          // If the value is the same, skip the unnecessary state update.
          if (state[property] === value) {
            return null;
          }

          const currentSubscribable =
            state[stateWrapperKey] !== undefined
              ? state[stateWrapperKey].subscribable
              : null;

          // If this event belongs to an old or uncommitted data source, ignore it.
          if (wrapper.subscribable !== currentSubscribable) {
            return null;
          }

          return {
            [property]: value,
          };
        });
      };

      // Store subscription for later (in case it's needed to unsubscribe).
      // This is safe to do via mutation since:
      // 1) It does not impact render.
      // 2) This method will only be called during the "commit" phase.
      wrapper.subscription = subscribe(props, valueChangedCallback);

      // External values could change between render and mount,
      // In some cases it may be important to handle this case.
      const value = getValue(props);
      if (value !== instance.state[property]) {
        instance.setState({
          [property]: value,
        });
      }
    }
  };

  const unsubscribeHelper = (props, instance) => {
    if (props[property] != null) {
      const wrapper = instance.state[stateWrapperKey];

      unsubscribe(props, wrapper.subscription);

      wrapper.subscription = null;
    }
  };

  // Extend specified component class to hook into subscriptions.
  class Subscribable extends BaseClass {
    constructor(props) {
      super(props);

      // Ensure state is initialized, so getDerivedStateFromProps doesn't warn.
      // Parent class components might not use state outside of this helper,
      // So it might be confusing for them to have to initialize it.
      if (this.state == null) {
        this.state = {};
      }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      const nextState = {};

      let hasUpdates = false;

      // Read value (if sync read is possible) for upcoming render
      const prevSubscribable =
        prevState[stateWrapperKey] !== undefined
          ? prevState[stateWrapperKey].subscribable
          : null;
      const nextSubscribable = nextProps[property];

      if (prevSubscribable !== nextSubscribable) {
        nextState[stateWrapperKey] = {
          ...prevState[stateWrapperKey],
          subscribable: nextSubscribable,
        };
        nextState[property] =
          nextSubscribable != null ? getValue(nextProps) : undefined;

        hasUpdates = true;
      }

      const nextSuperState =
        typeof Component.getDerivedStateFromProps === 'function'
          ? Component.getDerivedStateFromProps(nextProps, prevState)
          : null;

      return hasUpdates || nextSuperState !== null
        ? {...nextSuperState, ...nextState}
        : null;
    }

    componentDidMount() {
      if (typeof super.componentDidMount === 'function') {
        super.componentDidMount();
      }

      subscribeHelper(this.props, this);
    }

    componentDidUpdate(prevProps, prevState) {
      if (typeof super.componentDidUpdate === 'function') {
        super.componentDidUpdate(prevProps, prevState);
      }

      if (prevProps[property] !== this.props[property]) {
        unsubscribeHelper(prevProps, this);
        subscribeHelper(this.props, this);
      }
    }

    componentWillUnmount() {
      if (typeof super.componentWillUnmount === 'function') {
        super.componentWillUnmount();
      }

      unsubscribeHelper(this.props, this);
    }
  }

  return Subscribable;
}
