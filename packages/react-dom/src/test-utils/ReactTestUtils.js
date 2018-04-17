/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {findCurrentFiberUsingSlowPath} from 'react-reconciler/reflection';
import * as ReactInstanceMap from 'shared/ReactInstanceMap';
import {
  ClassComponent,
  FunctionalComponent,
  HostComponent,
  HostText,
} from 'shared/ReactTypeOfWork';
import SyntheticEvent from 'events/SyntheticEvent';
import * as TopLevelEventTypes from 'events/TopLevelEventTypes';
import invariant from 'fbjs/lib/invariant';

const {findDOMNode} = ReactDOM;
const {
  EventPluginHub,
  EventPluginRegistry,
  EventPropagators,
  ReactControlledComponent,
  ReactDOMComponentTree,
  ReactDOMEventListener,
} = ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

function Event(suffix) {}

/**
 * @class ReactTestUtils
 */

function findAllInRenderedFiberTreeInternal(fiber, test) {
  if (!fiber) {
    return [];
  }
  const currentParent = findCurrentFiberUsingSlowPath(fiber);
  if (!currentParent) {
    return [];
  }
  let node = currentParent;
  let ret = [];
  while (true) {
    if (
      node.tag === HostComponent ||
      node.tag === HostText ||
      node.tag === ClassComponent ||
      node.tag === FunctionalComponent
    ) {
      const publicInst = node.stateNode;
      if (test(publicInst)) {
        ret.push(publicInst);
      }
    }
    if (node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === currentParent) {
      return ret;
    }
    while (!node.sibling) {
      if (!node.return || node.return === currentParent) {
        return ret;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

/**
 * Utilities for making it easy to test React components.
 *
 * See https://reactjs.org/docs/test-utils.html
 *
 * Todo: Support the entire DOM.scry query syntax. For now, these simple
 * utilities will suffice for testing purposes.
 * @lends ReactTestUtils
 */
const ReactTestUtils = {
  renderIntoDocument: function(element) {
    const div = document.createElement('div');
    // None of our tests actually require attaching the container to the
    // DOM, and doing so creates a mess that we rely on test isolation to
    // clean up, so we're going to stop honoring the name of this method
    // (and probably rename it eventually) if no problems arise.
    // document.documentElement.appendChild(div);
    return ReactDOM.render(element, div);
  },

  isElement: function(element) {
    return React.isValidElement(element);
  },

  isElementOfType: function(inst, convenienceConstructor) {
    return React.isValidElement(inst) && inst.type === convenienceConstructor;
  },

  isDOMComponent: function(inst) {
    return !!(inst && inst.nodeType === 1 && inst.tagName);
  },

  isDOMComponentElement: function(inst) {
    return !!(inst && React.isValidElement(inst) && !!inst.tagName);
  },

  isCompositeComponent: function(inst) {
    if (ReactTestUtils.isDOMComponent(inst)) {
      // Accessing inst.setState warns; just return false as that'll be what
      // this returns when we have DOM nodes as refs directly
      return false;
    }
    return (
      inst != null &&
      typeof inst.render === 'function' &&
      typeof inst.setState === 'function'
    );
  },

  isCompositeComponentWithType: function(inst, type) {
    if (!ReactTestUtils.isCompositeComponent(inst)) {
      return false;
    }
    const internalInstance = ReactInstanceMap.get(inst);
    const constructor = internalInstance.type;
    return constructor === type;
  },

  findAllInRenderedTree: function(inst, test) {
    if (!inst) {
      return [];
    }
    invariant(
      ReactTestUtils.isCompositeComponent(inst),
      'findAllInRenderedTree(...): instance must be a composite component',
    );
    const internalInstance = ReactInstanceMap.get(inst);
    return findAllInRenderedFiberTreeInternal(internalInstance, test);
  },

  /**
   * Finds all instance of components in the rendered tree that are DOM
   * components with the class name matching `className`.
   * @return {array} an array of all the matches.
   */
  scryRenderedDOMComponentsWithClass: function(root, classNames) {
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      if (ReactTestUtils.isDOMComponent(inst)) {
        let className = inst.className;
        if (typeof className !== 'string') {
          // SVG, probably.
          className = inst.getAttribute('class') || '';
        }
        const classList = className.split(/\s+/);

        if (!Array.isArray(classNames)) {
          invariant(
            classNames !== undefined,
            'TestUtils.scryRenderedDOMComponentsWithClass expects a ' +
              'className as a second argument.',
          );
          classNames = classNames.split(/\s+/);
        }
        return classNames.every(function(name) {
          return classList.indexOf(name) !== -1;
        });
      }
      return false;
    });
  },

  /**
   * Like scryRenderedDOMComponentsWithClass but expects there to be one result,
   * and returns that one result, or throws exception if there is any other
   * number of matches besides one.
   * @return {!ReactDOMComponent} The one match.
   */
  findRenderedDOMComponentWithClass: function(root, className) {
    const all = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      root,
      className,
    );
    if (all.length !== 1) {
      throw new Error(
        'Did not find exactly one match (found: ' +
          all.length +
          ') ' +
          'for class:' +
          className,
      );
    }
    return all[0];
  },

  /**
   * Finds all instance of components in the rendered tree that are DOM
   * components with the tag name matching `tagName`.
   * @return {array} an array of all the matches.
   */
  scryRenderedDOMComponentsWithTag: function(root, tagName) {
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      return (
        ReactTestUtils.isDOMComponent(inst) &&
        inst.tagName.toUpperCase() === tagName.toUpperCase()
      );
    });
  },

  /**
   * Like scryRenderedDOMComponentsWithTag but expects there to be one result,
   * and returns that one result, or throws exception if there is any other
   * number of matches besides one.
   * @return {!ReactDOMComponent} The one match.
   */
  findRenderedDOMComponentWithTag: function(root, tagName) {
    const all = ReactTestUtils.scryRenderedDOMComponentsWithTag(root, tagName);
    if (all.length !== 1) {
      throw new Error(
        'Did not find exactly one match (found: ' +
          all.length +
          ') ' +
          'for tag:' +
          tagName,
      );
    }
    return all[0];
  },

  /**
   * Finds all instances of components with type equal to `componentType`.
   * @return {array} an array of all the matches.
   */
  scryRenderedComponentsWithType: function(root, componentType) {
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      return ReactTestUtils.isCompositeComponentWithType(inst, componentType);
    });
  },

  /**
   * Same as `scryRenderedComponentsWithType` but expects there to be one result
   * and returns that one result, or throws exception if there is any other
   * number of matches besides one.
   * @return {!ReactComponent} The one match.
   */
  findRenderedComponentWithType: function(root, componentType) {
    const all = ReactTestUtils.scryRenderedComponentsWithType(
      root,
      componentType,
    );
    if (all.length !== 1) {
      throw new Error(
        'Did not find exactly one match (found: ' +
          all.length +
          ') ' +
          'for componentType:' +
          componentType,
      );
    }
    return all[0];
  },

  /**
   * Pass a mocked component module to this method to augment it with
   * useful methods that allow it to be used as a dummy React component.
   * Instead of rendering as usual, the component will become a simple
   * <div> containing any provided children.
   *
   * @param {object} module the mock function object exported from a
   *                        module that defines the component to be mocked
   * @param {?string} mockTagName optional dummy root tag name to return
   *                              from render method (overrides
   *                              module.mockTagName if provided)
   * @return {object} the ReactTestUtils object (for chaining)
   */
  mockComponent: function(module, mockTagName) {
    mockTagName = mockTagName || module.mockTagName || 'div';

    module.prototype.render.mockImplementation(function() {
      return React.createElement(mockTagName, null, this.props.children);
    });

    return this;
  },

  /**
   * Simulates a top level event being dispatched from a raw event that occurred
   * on an `Element` node.
   * @param {number} topLevelType A number from `TopLevelEventTypes`
   * @param {!Element} node The dom to simulate an event occurring on.
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */
  simulateNativeEventOnNode: function(topLevelType, node, fakeNativeEvent) {
    fakeNativeEvent.target = node;
    ReactDOMEventListener.dispatchEvent(topLevelType, fakeNativeEvent);
  },

  /**
   * Simulates a top level event being dispatched from a raw event that occurred
   * on the `ReactDOMComponent` `comp`.
   * @param {Object} topLevelType A type from `BrowserEventConstants.topLevelTypes`.
   * @param {!ReactDOMComponent} comp
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */
  simulateNativeEventOnDOMComponent: function(
    topLevelType,
    comp,
    fakeNativeEvent,
  ) {
    ReactTestUtils.simulateNativeEventOnNode(
      topLevelType,
      findDOMNode(comp),
      fakeNativeEvent,
    );
  },

  nativeTouchData: function(x, y) {
    return {
      touches: [{pageX: x, pageY: y}],
    };
  },

  Simulate: null,
  SimulateNative: {},
};

/**
 * Exports:
 *
 * - `ReactTestUtils.Simulate.click(Element)`
 * - `ReactTestUtils.Simulate.mouseMove(Element)`
 * - `ReactTestUtils.Simulate.change(Element)`
 * - ... (All keys from event plugin `eventTypes` objects)
 */
function makeSimulator(eventType) {
  return function(domNode, eventData) {
    invariant(
      !React.isValidElement(domNode),
      'TestUtils.Simulate expected a DOM node as the first argument but received ' +
        'a React element. Pass the DOM node you wish to simulate the event on instead. ' +
        'Note that TestUtils.Simulate will not work if you are using shallow rendering.',
    );
    invariant(
      !ReactTestUtils.isCompositeComponent(domNode),
      'TestUtils.Simulate expected a DOM node as the first argument but received ' +
        'a component instance. Pass the DOM node you wish to simulate the event on instead.',
    );

    const dispatchConfig =
      EventPluginRegistry.eventNameDispatchConfigs[eventType];

    const fakeNativeEvent = new Event();
    fakeNativeEvent.target = domNode;
    fakeNativeEvent.type = eventType.toLowerCase();

    // We don't use SyntheticEvent.getPooled in order to not have to worry about
    // properly destroying any properties assigned from `eventData` upon release
    const targetInst = ReactDOMComponentTree.getInstanceFromNode(domNode);
    const event = new SyntheticEvent(
      dispatchConfig,
      targetInst,
      fakeNativeEvent,
      domNode,
    );

    // Since we aren't using pooling, always persist the event. This will make
    // sure it's marked and won't warn when setting additional properties.
    event.persist();
    Object.assign(event, eventData);

    if (dispatchConfig.phasedRegistrationNames) {
      EventPropagators.accumulateTwoPhaseDispatches(event);
    } else {
      EventPropagators.accumulateDirectDispatches(event);
    }

    ReactDOM.unstable_batchedUpdates(function() {
      // Normally extractEvent enqueues a state restore, but we'll just always
      // do that since we we're by-passing it here.
      ReactControlledComponent.enqueueStateRestore(domNode);
      EventPluginHub.runEventsInBatch(event, true);
    });
    ReactControlledComponent.restoreStateIfNeeded();
  };
}

function buildSimulators() {
  ReactTestUtils.Simulate = {};

  let eventType;
  for (eventType in EventPluginRegistry.eventNameDispatchConfigs) {
    /**
     * @param {!Element|ReactDOMComponent} domComponentOrNode
     * @param {?object} eventData Fake event data to use in SyntheticEvent.
     */
    ReactTestUtils.Simulate[eventType] = makeSimulator(eventType);
  }
}

// Rebuild ReactTestUtils.Simulate whenever event plugins are injected
const oldInjectEventPluginOrder =
  EventPluginHub.injection.injectEventPluginOrder;
EventPluginHub.injection.injectEventPluginOrder = function() {
  oldInjectEventPluginOrder.apply(this, arguments);
  buildSimulators();
};
const oldInjectEventPlugins = EventPluginHub.injection.injectEventPluginsByName;
EventPluginHub.injection.injectEventPluginsByName = function() {
  oldInjectEventPlugins.apply(this, arguments);
  buildSimulators();
};

buildSimulators();

/**
 * Exports:
 *
 * - `ReactTestUtils.SimulateNative.click(Element/ReactDOMComponent)`
 * - `ReactTestUtils.SimulateNative.mouseMove(Element/ReactDOMComponent)`
 * - `ReactTestUtils.SimulateNative.mouseIn/ReactDOMComponent)`
 * - `ReactTestUtils.SimulateNative.mouseOut(Element/ReactDOMComponent)`
 * - ... (All keys from `BrowserEventConstants.topLevelTypes`)
 *
 * Note: Top level event types are a subset of the entire set of handler types
 * (which include a broader set of "synthetic" events). For example, onDragDone
 * is a synthetic event. Except when testing an event plugin or React's event
 * handling code specifically, you probably want to use ReactTestUtils.Simulate
 * to dispatch synthetic events.
 */

function makeNativeSimulator(eventType, topLevelType) {
  return function(domComponentOrNode, nativeEventData) {
    const fakeNativeEvent = new Event(eventType);
    Object.assign(fakeNativeEvent, nativeEventData);
    if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
      ReactTestUtils.simulateNativeEventOnDOMComponent(
        topLevelType,
        domComponentOrNode,
        fakeNativeEvent,
      );
    } else if (domComponentOrNode.tagName) {
      // Will allow on actual dom nodes.
      ReactTestUtils.simulateNativeEventOnNode(
        topLevelType,
        domComponentOrNode,
        fakeNativeEvent,
      );
    }
  };
}

[
  [TopLevelEventTypes.TOP_ANIMATION_END, 'animationEnd'],
  [TopLevelEventTypes.TOP_ANIMATION_ITERATION, 'animationIteration'],
  [TopLevelEventTypes.TOP_ANIMATION_START, 'animationStart'],
  [TopLevelEventTypes.TOP_BLUR, 'blur'],
  [TopLevelEventTypes.TOP_CANCEL, 'cancel'],
  [TopLevelEventTypes.TOP_CHANGE, 'change'],
  [TopLevelEventTypes.TOP_CLICK, 'click'],
  [TopLevelEventTypes.TOP_CLOSE, 'close'],
  [TopLevelEventTypes.TOP_COMPOSITION_END, 'compositionEnd'],
  [TopLevelEventTypes.TOP_COMPOSITION_START, 'compositionStart'],
  [TopLevelEventTypes.TOP_COMPOSITION_UPDATE, 'compositionUpdate'],
  [TopLevelEventTypes.TOP_CONTEXT_MENU, 'contextMenu'],
  [TopLevelEventTypes.TOP_COPY, 'copy'],
  [TopLevelEventTypes.TOP_CUT, 'cut'],
  [TopLevelEventTypes.TOP_DOUBLE_CLICK, 'doubleClick'],
  [TopLevelEventTypes.TOP_DRAG, 'drag'],
  [TopLevelEventTypes.TOP_DRAG_END, 'dragEnd'],
  [TopLevelEventTypes.TOP_DRAG_ENTER, 'dragEnter'],
  [TopLevelEventTypes.TOP_DRAG_EXIT, 'dragExit'],
  [TopLevelEventTypes.TOP_DRAG_LEAVE, 'dragLeave'],
  [TopLevelEventTypes.TOP_DRAG_OVER, 'dragOver'],
  [TopLevelEventTypes.TOP_DRAG_START, 'dragStart'],
  [TopLevelEventTypes.TOP_DROP, 'drop'],
  [TopLevelEventTypes.TOP_FOCUS, 'focus'],
  [TopLevelEventTypes.TOP_INPUT, 'input'],
  [TopLevelEventTypes.TOP_KEY_DOWN, 'keyDown'],
  [TopLevelEventTypes.TOP_KEY_PRESS, 'keyPress'],
  [TopLevelEventTypes.TOP_KEY_UP, 'keyUp'],
  [TopLevelEventTypes.TOP_LOAD, 'load'],
  [TopLevelEventTypes.TOP_LOAD_START, 'loadStart'],
  [TopLevelEventTypes.TOP_MOUSE_DOWN, 'mouseDown'],
  [TopLevelEventTypes.TOP_MOUSE_MOVE, 'mouseMove'],
  [TopLevelEventTypes.TOP_MOUSE_OUT, 'mouseOut'],
  [TopLevelEventTypes.TOP_MOUSE_OVER, 'mouseOver'],
  [TopLevelEventTypes.TOP_MOUSE_UP, 'mouseUp'],
  [TopLevelEventTypes.TOP_PASTE, 'paste'],
  [TopLevelEventTypes.TOP_SCROLL, 'scroll'],
  [TopLevelEventTypes.TOP_SELECTION_CHANGE, 'selectionChange'],
  [TopLevelEventTypes.TOP_TEXT_INPUT, 'textInput'],
  [TopLevelEventTypes.TOP_TOGGLE, 'toggle'],
  [TopLevelEventTypes.TOP_TOUCH_CANCEL, 'touchCancel'],
  [TopLevelEventTypes.TOP_TOUCH_END, 'touchEnd'],
  [TopLevelEventTypes.TOP_TOUCH_MOVE, 'touchMove'],
  [TopLevelEventTypes.TOP_TOUCH_START, 'touchStart'],
  [TopLevelEventTypes.TOP_TRANSITION_END, 'transitionEnd'],
  [TopLevelEventTypes.TOP_WHEEL, 'wheel'],
  [TopLevelEventTypes.TOP_ABORT, 'abort'],
  [TopLevelEventTypes.TOP_CAN_PLAY, 'canPlay'],
  [TopLevelEventTypes.TOP_CAN_PLAY_THROUGH, 'canPlayThrough'],
  [TopLevelEventTypes.TOP_DURATION_CHANGE, 'durationChange'],
  [TopLevelEventTypes.TOP_EMPTIED, 'emptied'],
  [TopLevelEventTypes.TOP_ENCRYPTED, 'encrypted'],
  [TopLevelEventTypes.TOP_ENDED, 'ended'],
  [TopLevelEventTypes.TOP_ERROR, 'error'],
  [TopLevelEventTypes.TOP_LOADED_DATA, 'loadedData'],
  [TopLevelEventTypes.TOP_LOADED_METADATA, 'loadedMetadata'],
  [TopLevelEventTypes.TOP_LOAD_START, 'loadStart'],
  [TopLevelEventTypes.TOP_PAUSE, 'pause'],
  [TopLevelEventTypes.TOP_PLAY, 'play'],
  [TopLevelEventTypes.TOP_PLAYING, 'playing'],
  [TopLevelEventTypes.TOP_PROGRESS, 'progress'],
  [TopLevelEventTypes.TOP_RATE_CHANGE, 'rateChange'],
  [TopLevelEventTypes.TOP_SEEKED, 'seeked'],
  [TopLevelEventTypes.TOP_SEEKING, 'seeking'],
  [TopLevelEventTypes.TOP_STALLED, 'stalled'],
  [TopLevelEventTypes.TOP_SUSPEND, 'suspend'],
  [TopLevelEventTypes.TOP_TIME_UPDATE, 'timeUpdate'],
  [TopLevelEventTypes.TOP_VOLUME_CHANGE, 'volumeChange'],
  [TopLevelEventTypes.TOP_WAITING, 'waiting'],
].forEach(function(tuple) {
  const topLevelType = tuple[0];
  const eventType = tuple[1];

  /**
   * @param {!Element|ReactDOMComponent} domComponentOrNode
   * @param {?Event} nativeEventData Fake native event to use in SyntheticEvent.
   */
  ReactTestUtils.SimulateNative[eventType] = makeNativeSimulator(
    eventType,
    topLevelType,
  );
});

export default ReactTestUtils;
