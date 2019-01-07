/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint valid-typeof: 0 */

import invariant from 'shared/invariant';
import warningWithoutStack from 'shared/warningWithoutStack';

const EVENT_POOL_SIZE = 10;
const returnsFalse = () => false;
const returnsTrue = () => true;
/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
const EventInterface = {
  type: null,
  target: null,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  currentTarget: () => null,
  timeStamp: event => event.timeStamp || Date.now(),
  defaultPrevented: null,
  isTrusted: null,
};

export function SyntheticEvent(nativeEvent, proxyContext) {
  if (__DEV__) {
    // these have a getter/setter for warnings
    delete this.nativeEvent;
    delete this.preventDefault;
    delete this.stopPropagation;
    delete this.isDefaultPrevented;
    delete this.isPropagationStopped;
  }

  this.nativeEvent = nativeEvent;

  const Interface = this.constructor.Interface;
  for (const propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue;
    }
    if (__DEV__) {
      delete this[propName]; // this has a getter/setter for warnings
    }
    const normalize = Interface[propName];
    if (normalize) {
      this[propName] = normalize(nativeEvent);
    } else {
      if (propName === 'target') {
        this.target = proxyContext.eventTarget;
      } else {
        this[propName] = nativeEvent[propName];
      }
    }
  }

  const defaultPrevented =
    nativeEvent.defaultPrevented != null
      ? nativeEvent.defaultPrevented
      : nativeEvent.returnValue === false;
  if (defaultPrevented) {
    this.isDefaultPrevented = returnsTrue;
  } else {
    this.isDefaultPrevented = returnsFalse;
  }
  this.isPropagationStopped = returnsFalse;
  return this;
}

Object.assign(SyntheticEvent.prototype, {
  preventDefault: function() {
    this.defaultPrevented = true;
    const event = this.nativeEvent;
    if (!event) {
      return;
    }

    if (event.preventDefault) {
      event.preventDefault();
    } else if (typeof event.returnValue !== 'unknown') {
      event.returnValue = false;
    }
    this.isDefaultPrevented = returnsTrue;
  },

  stopPropagation: function() {
    const event = this.nativeEvent;
    if (!event) {
      return;
    }

    if (event.stopPropagation) {
      event.stopPropagation();
    } else if (typeof event.cancelBubble !== 'unknown') {
      // The ChangeEventPlugin registers a "propertychange" event for
      // IE. This event does not support bubbling or cancelling, and
      // any references to cancelBubble throw "Member not found".  A
      // typeof check of "unknown" circumvents this issue (and is also
      // IE specific).
      event.cancelBubble = true;
    }

    this.isPropagationStopped = returnsTrue;
  },

  /**
   * We release all dispatched `SyntheticEvent`s after each event loop, adding
   * them back into the pool. This allows a way to hold onto a reference that
   * won't be added back into the pool.
   */
  persist: function() {
    this.isPersistent = returnsTrue;
  },

  /**
   * Checks if this event should be released back into the pool.
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: returnsFalse,

  /**
   * `PooledClass` looks for `destructor` on each instance it releases.
   */
  destructor: function() {
    const Interface = this.constructor.Interface;
    for (const propName in Interface) {
      if (__DEV__) {
        Object.defineProperty(
          this,
          propName,
          getPooledWarningPropertyDefinition(propName, Interface[propName]),
        );
      } else {
        this[propName] = null;
      }
    }
    this.isDefaultPrevented = returnsFalse;
    this.isPropagationStopped = returnsFalse;
    this.nativeEvent = null;
    if (__DEV__) {
      Object.defineProperty(
        this,
        'nativeEvent',
        getPooledWarningPropertyDefinition('nativeEvent', null),
      );
      Object.defineProperty(
        this,
        'isDefaultPrevented',
        getPooledWarningPropertyDefinition('isDefaultPrevented', returnsFalse),
      );
      Object.defineProperty(
        this,
        'isPropagationStopped',
        getPooledWarningPropertyDefinition(
          'isPropagationStopped',
          returnsFalse,
        ),
      );
      Object.defineProperty(
        this,
        'preventDefault',
        getPooledWarningPropertyDefinition('preventDefault', () => {}),
      );
      Object.defineProperty(
        this,
        'stopPropagation',
        getPooledWarningPropertyDefinition('stopPropagation', () => {}),
      );
    }
  },
});

SyntheticEvent.Interface = EventInterface;

/**
 * Helper to nullify syntheticEvent instance properties when destructing
 *
 * @param {String} propName
 * @param {?object} getVal
 * @return {object} defineProperty object
 */
function getPooledWarningPropertyDefinition(propName, getVal) {
  const isFunction = typeof getVal === 'function';
  return {
    configurable: true,
    set: set,
    get: get,
  };

  function set(val) {
    const action = isFunction ? 'setting the method' : 'setting the property';
    warn(action, 'This is effectively a no-op');
    return val;
  }

  function get() {
    const action = isFunction
      ? 'accessing the method'
      : 'accessing the property';
    const result = isFunction
      ? 'This is a no-op function'
      : 'This is set to null';
    warn(action, result);
    return getVal;
  }

  function warn(action, result) {
    const warningCondition = false;
    warningWithoutStack(
      warningCondition,
      "This synthetic event is reused for performance reasons. If you're seeing this, " +
        "you're %s `%s` on a released/nullified synthetic event. %s. " +
        'If you must keep the original synthetic event around, use event.persist(). ' +
        'See https://fb.me/react-event-pooling for more information.',
      action,
      propName,
      result,
    );
  }
}

export function extendSyntheticEvent(Super, Interface) {
  const E = function() {};
  E.prototype = Super.prototype;
  const prototype = new E();

  function Class() {
    return Super.apply(this, arguments);
  }
  Object.assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;

  Class.Interface = Object.assign({}, Super.Interface, Interface);
  Class.extend = Super.extend;
  addEventPoolingTo(Class);

  return Class;
}

function addEventPoolingTo(EventConstructor) {
  EventConstructor.eventPool = [];
  EventConstructor.release = releasePooledEvent;
}

function releasePooledEvent(event) {
  const EventConstructor = this;
  invariant(
    event instanceof EventConstructor,
    'Trying to release an event instance into a pool of a different type.',
  );
  event.destructor();
  if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
    EventConstructor.eventPool.push(event);
  }
}

export function getPooledSyntheticEvent(
  EventConstructor,
  nativeEvent,
  proxyContext,
) {
  if (EventConstructor.eventPool.length) {
    const instance = EventConstructor.eventPool.pop();
    EventConstructor.call(instance, nativeEvent, proxyContext);
    return instance;
  }
  return new EventConstructor(nativeEvent, proxyContext);
}

addEventPoolingTo(SyntheticEvent);
