/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTestUtils
 */

'use strict';

var EventConstants = require('EventConstants');
var EventPluginHub = require('EventPluginHub');
var EventPluginRegistry = require('EventPluginRegistry');
var EventPropagators = require('EventPropagators');
var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactUpdates = require('ReactUpdates');
var SyntheticEvent = require('SyntheticEvent');
var ReactShallowRenderer = require('ReactShallowRenderer');

var findDOMNode = require('findDOMNode');
var invariant = require('invariant');
var warning = require('warning');

var topLevelTypes = EventConstants.topLevelTypes;

function Event(suffix) {}

// In react 16+ shallowRenderer will not be accessible via ReactTestUtils.createRenderer()
// Instead it will be available via react-test-renderer/shallow
// Maintain backwards compat for 15.5.0 release, but warn about using the deprecated method
let hasWarnedAboutCreateRenderer = false;
function createRendererWithWarning() {
  warning(
    hasWarnedAboutCreateRenderer,
    'Shallow renderer has been moved to react-test-renderer/shallow. ' +
      'Update references to remove this warning.',
  );
  hasWarnedAboutCreateRenderer = true;

  return new ReactShallowRenderer();
}

/**
 * @class ReactTestUtils
 */

function findAllInRenderedTreeInternal(inst, test) {
  if (!inst || !inst.getPublicInstance) {
    return [];
  }
  var publicInst = inst.getPublicInstance();
  var ret = test(publicInst) ? [publicInst] : [];
  var currentElement = inst._currentElement;
  if (ReactTestUtils.isDOMComponent(publicInst)) {
    var renderedChildren = inst._renderedChildren;
    var key;
    for (key in renderedChildren) {
      if (!renderedChildren.hasOwnProperty(key)) {
        continue;
      }
      ret = ret.concat(
        findAllInRenderedTreeInternal(renderedChildren[key], test),
      );
    }
  } else if (
    React.isValidElement(currentElement) &&
    typeof currentElement.type === 'function'
  ) {
    ret = ret.concat(
      findAllInRenderedTreeInternal(inst._renderedComponent, test),
    );
  }
  return ret;
}

/**
 * Utilities for making it easy to test React components.
 *
 * See https://facebook.github.io/react/docs/test-utils.html
 *
 * Todo: Support the entire DOM.scry query syntax. For now, these simple
 * utilities will suffice for testing purposes.
 * @lends ReactTestUtils
 */
var ReactTestUtils = {
  renderIntoDocument: function(element) {
    var div = document.createElement('div');
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
    var internalInstance = ReactInstanceMap.get(inst);
    var constructor = internalInstance._currentElement.type;

    return constructor === type;
  },

  isCompositeComponentElement: function(inst) {
    if (!React.isValidElement(inst)) {
      return false;
    }
    // We check the prototype of the type that will get mounted, not the
    // instance itself. This is a future proof way of duck typing.
    var prototype = inst.type.prototype;
    return (
      typeof prototype.render === 'function' &&
      typeof prototype.setState === 'function'
    );
  },

  isCompositeComponentElementWithType: function(inst, type) {
    var internalInstance = ReactInstanceMap.get(inst);
    var constructor = internalInstance._currentElement.type;

    return !!(
      ReactTestUtils.isCompositeComponentElement(inst) && constructor === type
    );
  },

  getRenderedChildOfCompositeComponent: function(inst) {
    if (!ReactTestUtils.isCompositeComponent(inst)) {
      return null;
    }
    var internalInstance = ReactInstanceMap.get(inst);
    return internalInstance._renderedComponent.getPublicInstance();
  },

  findAllInRenderedTree: function(inst, test) {
    if (!inst) {
      return [];
    }
    invariant(
      ReactTestUtils.isCompositeComponent(inst),
      'findAllInRenderedTree(...): instance must be a composite component',
    );
    return findAllInRenderedTreeInternal(ReactInstanceMap.get(inst), test);
  },

  /**
   * Finds all instance of components in the rendered tree that are DOM
   * components with the class name matching `className`.
   * @return {array} an array of all the matches.
   */
  scryRenderedDOMComponentsWithClass: function(root, classNames) {
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      if (ReactTestUtils.isDOMComponent(inst)) {
        var className = inst.className;
        if (typeof className !== 'string') {
          // SVG, probably.
          className = inst.getAttribute('class') || '';
        }
        var classList = className.split(/\s+/);

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
    var all = ReactTestUtils.scryRenderedDOMComponentsWithClass(
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
    var all = ReactTestUtils.scryRenderedDOMComponentsWithTag(root, tagName);
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
    var all = ReactTestUtils.scryRenderedComponentsWithType(
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
   * @param {Object} topLevelType A type from `EventConstants.topLevelTypes`
   * @param {!Element} node The dom to simulate an event occurring on.
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */
  simulateNativeEventOnNode: function(topLevelType, node, fakeNativeEvent) {
    fakeNativeEvent.target = node;
    fakeNativeEvent.simulated = true;
    ReactBrowserEventEmitter.ReactEventListener.dispatchEvent(
      topLevelType,
      fakeNativeEvent,
    );
  },

  /**
   * Simulates a top level event being dispatched from a raw event that occurred
   * on the `ReactDOMComponent` `comp`.
   * @param {Object} topLevelType A type from `EventConstants.topLevelTypes`.
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

  createRenderer: createRendererWithWarning,

  Simulate: null,
  SimulateNative: {},
};

/**
 * Exports:
 *
 * - `ReactTestUtils.Simulate.click(Element/ReactDOMComponent)`
 * - `ReactTestUtils.Simulate.mouseMove(Element/ReactDOMComponent)`
 * - `ReactTestUtils.Simulate.change(Element/ReactDOMComponent)`
 * - ... (All keys from event plugin `eventTypes` objects)
 */
function makeSimulator(eventType) {
  return function(domComponentOrNode, eventData) {
    var node;
    invariant(
      !React.isValidElement(domComponentOrNode),
      'TestUtils.Simulate expects a component instance and not a ReactElement.' +
        'TestUtils.Simulate will not work if you are using shallow rendering.',
    );
    if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
      node = findDOMNode(domComponentOrNode);
    } else if (domComponentOrNode.tagName) {
      node = domComponentOrNode;
    }

    var dispatchConfig =
      EventPluginRegistry.eventNameDispatchConfigs[eventType];

    var fakeNativeEvent = new Event();
    fakeNativeEvent.target = node;
    fakeNativeEvent.type = eventType.toLowerCase();

    // We don't use SyntheticEvent.getPooled in order to not have to worry about
    // properly destroying any properties assigned from `eventData` upon release
    var event = new SyntheticEvent(
      dispatchConfig,
      ReactDOMComponentTree.getInstanceFromNode(node),
      fakeNativeEvent,
      node,
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

    ReactUpdates.batchedUpdates(function() {
      EventPluginHub.enqueueEvents(event);
      EventPluginHub.processEventQueue(true);
    });
  };
}

function buildSimulators() {
  ReactTestUtils.Simulate = {};

  var eventType;
  for (eventType in EventPluginRegistry.eventNameDispatchConfigs) {
    /**
     * @param {!Element|ReactDOMComponent} domComponentOrNode
     * @param {?object} eventData Fake event data to use in SyntheticEvent.
     */
    ReactTestUtils.Simulate[eventType] = makeSimulator(eventType);
  }
}

// Rebuild ReactTestUtils.Simulate whenever event plugins are injected
var oldInjectEventPluginOrder = EventPluginHub.injection.injectEventPluginOrder;
EventPluginHub.injection.injectEventPluginOrder = function() {
  oldInjectEventPluginOrder.apply(this, arguments);
  buildSimulators();
};
var oldInjectEventPlugins = EventPluginHub.injection.injectEventPluginsByName;
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
 * - ... (All keys from `EventConstants.topLevelTypes`)
 *
 * Note: Top level event types are a subset of the entire set of handler types
 * (which include a broader set of "synthetic" events). For example, onDragDone
 * is a synthetic event. Except when testing an event plugin or React's event
 * handling code specifically, you probably want to use ReactTestUtils.Simulate
 * to dispatch synthetic events.
 */

function makeNativeSimulator(eventType) {
  return function(domComponentOrNode, nativeEventData) {
    var fakeNativeEvent = new Event(eventType);
    Object.assign(fakeNativeEvent, nativeEventData);
    if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
      ReactTestUtils.simulateNativeEventOnDOMComponent(
        eventType,
        domComponentOrNode,
        fakeNativeEvent,
      );
    } else if (domComponentOrNode.tagName) {
      // Will allow on actual dom nodes.
      ReactTestUtils.simulateNativeEventOnNode(
        eventType,
        domComponentOrNode,
        fakeNativeEvent,
      );
    }
  };
}

Object.keys(topLevelTypes).forEach(function(eventType) {
  // Event type is stored as 'topClick' - we transform that to 'click'
  var convenienceName = eventType.indexOf('top') === 0
    ? eventType.charAt(3).toLowerCase() + eventType.substr(4)
    : eventType;
  /**
   * @param {!Element|ReactDOMComponent} domComponentOrNode
   * @param {?Event} nativeEventData Fake native event to use in SyntheticEvent.
   */
  ReactTestUtils.SimulateNative[convenienceName] = makeNativeSimulator(
    eventType,
  );
});

module.exports = ReactTestUtils;
