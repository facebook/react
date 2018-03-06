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

type SubscrptionConfig = {
  // Maps property names of subscribable sources (e.g. 'eventDispatcher'),
  // To state names for subscribed values (e.g. 'value').
  subscribablePropertiesMap: {[subscribableProperty: string]: string},

  // Synchronously get data for a given subscribable property.
  // If your component has multiple subscriptions,
  // The second 'propertyName' parameter can be used to distinguish between them.
  getDataFor: (subscribable: any, propertyName: string) => any,

  // Subscribe to a subscribable.
  // Due to the variety of change event types, subscribers should provide their own handlers.
  // Those handlers should NOT update state though;
  // They should call the valueChangedCallback() instead when a subscription changes.
  // If your component has multiple subscriptions,
  // The third 'propertyName' parameter can be used to distinguish between them.
  subscribeTo: (
    valueChangedCallback: (value: any) => void,
    subscribable: any,
    propertyName: string,
  ) => any,

  // Unsubscribe from a given subscribable.
  // If your component has multiple subscriptions,
  // The second 'propertyName' parameter can be used to distinguish between them.
  // The value returned by subscribeTo() is the third 'subscription' parameter.
  unsubscribeFrom: (
    subscribable: any,
    propertyName: string,
    subscription: any,
  ) => void,
};

export function createComponent(
  config: SubscrptionConfig,
  Component: React$ComponentType<*>,
): React$ComponentType<*> {
  invariant(Component != null, 'Invalid subscribable Component specified');
  invariant(
    config.subscribablePropertiesMap !== null &&
      typeof config.subscribablePropertiesMap === 'object',
    'Subscribable config must specify a subscribablePropertiesMap map',
  );
  invariant(
    typeof config.getDataFor === 'function',
    'Subscribable config must specify a getDataFor function',
  );
  invariant(
    typeof config.subscribeTo === 'function',
    'Subscribable config must specify a subscribeTo function',
  );
  invariant(
    typeof config.unsubscribeFrom === 'function',
    'Subscribable config must specify a unsubscribeFrom function',
  );

  const {
    getDataFor,
    subscribablePropertiesMap,
    subscribeTo,
    unsubscribeFrom,
  } = config;

  // Unique state key name to avoid conflicts.
  const getStateWrapperKey = propertyName => `____${propertyName}`;

  // If possible, extend the specified component to add subscriptions.
  // This preserves ref compatibility and avoids the overhead of an extra fiber.
  let BaseClass = (Component: any);
  const prototype = (Component: any).prototype;

  // If this is a functional component, use a HOC.
  // Since functional components can't have refs, that isn't a problem.
  // Class component lifecycles are required, so a class component is needed anyway.
  if (typeof prototype === 'object' && typeof prototype.render !== 'function') {
    BaseClass = class extends React.Component {
      render() {
        const subscribedValues = {};
        for (let propertyName in subscribablePropertiesMap) {
          const stateValueKey = subscribablePropertiesMap[propertyName];
          subscribedValues[stateValueKey] = this.state[stateValueKey];
        }

        return <Component {...this.props} {...subscribedValues} />;
      }
    };
  }

  // Event listeners are only safe to add during the commit phase,
  // So they won't leak if render is interrupted or errors.
  const subscribeToHelper = (subscribable, propertyName, instance) => {
    if (subscribable != null) {
      const stateWrapperKey = getStateWrapperKey(propertyName);
      const stateValueKey = subscribablePropertiesMap[propertyName];

      const wrapper = instance.state[stateWrapperKey];

      const valueChangedCallback = value => {
        instance.setState(state => {
          // If the value is the same, skip the unnecessary state update.
          if (state[stateValueKey] === value) {
            return null;
          }

          const currentSubscribable =
            instance.state[stateWrapperKey] !== undefined
              ? instance.state[stateWrapperKey].subscribable
              : null;

          // If this event belongs to an old or uncommitted data source, ignore it.
          if (wrapper.subscribable !== currentSubscribable) {
            return null;
          }

          return {
            [stateValueKey]: value,
          };
        });
      };

      // Store subscription for later (in case it's needed to unsubscribe).
      // This is safe to do via mutation since:
      // 1) It does not impact render.
      // 2) This method will only be called during the "commit" phase.
      wrapper.subscription = subscribeTo(
        valueChangedCallback,
        subscribable,
        propertyName,
      );

      // External values could change between render and mount,
      // In some cases it may be important to handle this case.
      const value = getDataFor(subscribable, propertyName);
      if (value !== instance.state[stateValueKey]) {
        instance.setState({
          [stateValueKey]: value,
        });
      }
    }
  };

  const unsubscribeFromHelper = (subscribable, propertyName, instance) => {
    if (subscribable != null) {
      const stateWrapperKey = getStateWrapperKey(propertyName);
      const wrapper = instance.state[stateWrapperKey];

      unsubscribeFrom(subscribable, propertyName, wrapper.subscription);

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
      for (let propertyName in subscribablePropertiesMap) {
        const stateWrapperKey = getStateWrapperKey(propertyName);
        const stateValueKey = subscribablePropertiesMap[propertyName];

        const prevSubscribable =
          prevState[stateWrapperKey] !== undefined
            ? prevState[stateWrapperKey].subscribable
            : null;
        const nextSubscribable = nextProps[propertyName];

        if (prevSubscribable !== nextSubscribable) {
          nextState[stateWrapperKey] = {
            ...prevState[stateWrapperKey],
            subscribable: nextSubscribable,
          };
          nextState[stateValueKey] =
            nextSubscribable != null
              ? getDataFor(nextSubscribable, propertyName)
              : undefined;

          hasUpdates = true;
        }
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

      for (let propertyName in subscribablePropertiesMap) {
        const subscribable = this.props[propertyName];
        subscribeToHelper(subscribable, propertyName, this);
      }
    }

    componentDidUpdate(prevProps, prevState) {
      if (typeof super.componentDidUpdate === 'function') {
        super.componentDidUpdate(prevProps, prevState);
      }

      for (let propertyName in subscribablePropertiesMap) {
        const prevSubscribable = prevProps[propertyName];
        const nextSubscribable = this.props[propertyName];
        if (prevSubscribable !== nextSubscribable) {
          unsubscribeFromHelper(prevSubscribable, propertyName, this);
          subscribeToHelper(nextSubscribable, propertyName, this);
        }
      }
    }

    componentWillUnmount() {
      if (typeof super.componentWillUnmount === 'function') {
        super.componentWillUnmount();
      }

      for (let propertyName in subscribablePropertiesMap) {
        const subscribable = this.props[propertyName];
        unsubscribeFromHelper(subscribable, propertyName, this);
      }
    }
  }

  return Subscribable;
}
