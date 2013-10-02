/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactTestUtils
 */

var EventConstants = require('EventConstants');
var React = require('React');
var ReactComponent = require('ReactComponent');
var ReactEventEmitter = require('ReactEventEmitter');
var ReactTextComponent = require('ReactTextComponent');
var ReactMount = require('ReactMount');

var mergeInto = require('mergeInto');

var topLevelTypes = EventConstants.topLevelTypes;

function Event(suffix) {}

/**
 * @class ReactTestUtils
 */

/**
 * Todo: Support the entire DOM.scry query syntax. For now, these simple
 * utilities will suffice for testing purposes.
 * @lends ReactTestUtils
 */
var ReactTestUtils = {
  renderIntoDocument: function(instance) {
    var div = document.createElement('div');
    document.documentElement.appendChild(div);
    return React.renderComponent(instance, div);
  },

  isComponentOfType: function(inst, type) {
    return !!(
      inst &&
      ReactComponent.isValidComponent(inst) &&
      inst.constructor === type.componentConstructor
    );
  },

  isDOMComponent: function(inst) {
    return !!(inst &&
              ReactComponent.isValidComponent(inst) &&
              !!inst.tagName);
  },

  isCompositeComponent: function(inst) {
    return !!(
      inst &&
      ReactComponent.isValidComponent(inst) &&
      typeof inst.render === 'function' &&
      typeof inst.setState === 'function' &&
      typeof inst.updateComponent === 'function'
    );
  },

  isCompositeComponentWithType: function(inst, type) {
    return !!(ReactTestUtils.isCompositeComponent(inst) &&
             (inst.constructor === type.componentConstructor ||
              inst.constructor === type));
  },

  isTextComponent: function(inst) {
    return inst instanceof ReactTextComponent;
  },

  findAllInRenderedTree: function(inst, test) {
    if (!inst) {
      return [];
    }
    var ret = test(inst) ? [inst] : [];
    if (ReactTestUtils.isDOMComponent(inst)) {
      var renderedChildren = inst._renderedChildren;
      var key;
      for (key in renderedChildren) {
        if (!renderedChildren.hasOwnProperty(key)) {
          continue;
        }
        ret = ret.concat(
          ReactTestUtils.findAllInRenderedTree(renderedChildren[key], test)
        );
      }
    } else if (ReactTestUtils.isCompositeComponent(inst)) {
      ret = ret.concat(
        ReactTestUtils.findAllInRenderedTree(inst._renderedComponent, test)
      );
    }
    return ret;
  },

  /**
   * Finds all instance of components in the rendered tree that are DOM
   * components with the class name matching `className`.
   * @return an array of all the matches.
   */
  scryRenderedDOMComponentsWithClass: function(root, className) {
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      var instClassName = inst.props.className;
      return ReactTestUtils.isDOMComponent(inst) && (
        instClassName &&
        (' ' + instClassName + ' ').indexOf(' ' + className + ' ') !== -1
      );
    });
  },

  /**
   * Like scryRenderedDOMComponentsWithClass but expects there to be one result,
   * and returns that one result, or throws exception if there is any other
   * number of matches besides one.
   * @return {!ReactDOMComponent} The one match.
   */
  findRenderedDOMComponentWithClass: function(root, className) {
    var all =
      ReactTestUtils.scryRenderedDOMComponentsWithClass(root, className);
    if (all.length !== 1) {
      throw new Error('Did not find exactly one match for class:' + className);
    }
    return all[0];
  },


  /**
   * Finds all instance of components in the rendered tree that are DOM
   * components with the tag name matching `tagName`.
   * @return an array of all the matches.
   */
  scryRenderedDOMComponentsWithTag: function(root, tagName) {
    return ReactTestUtils.findAllInRenderedTree(root, function(inst) {
      return ReactTestUtils.isDOMComponent(inst) &&
            inst.tagName === tagName.toUpperCase();
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
      throw new Error('Did not find exactly one match for tag:' + tagName);
    }
    return all[0];
  },


  /**
   * Finds all instances of components with type equal to `componentType`.
   * @return an array of all the matches.
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
      componentType
    );
    if (all.length !== 1) {
      throw new Error(
        'Did not find exactly one match for componentType:' + componentType
      );
    }
    return all[0];
  },

  /**
   * Simulates a top level event being dispatched from a raw event that occured
   * on and `Element` node.
   * @param topLevelType {Object} A type from `EventConstants.topLevelTypes`
   * @param {!Element} node The dom to simulate an event occurring on.
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */
  simulateEventOnNode: function(topLevelType, node, fakeNativeEvent) {
    var virtualHandler =
      ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
        topLevelType
      );
    fakeNativeEvent.target = node;
    virtualHandler(fakeNativeEvent);
  },

  /**
   * Simulates a top level event being dispatched from a raw event that occured
   * on the `ReactDOMComponent` `comp`.
   * @param topLevelType {Object} A type from `EventConstants.topLevelTypes`.
   * @param comp {!ReactDOMComponent}
   * @param {?Event} fakeNativeEvent Fake native event to use in SyntheticEvent.
   */
  simulateEventOnDOMComponent: function(topLevelType, comp, fakeNativeEvent) {
    var reactRootID = comp._rootNodeID || comp._rootDomId;
    if (!reactRootID) {
      throw new Error('Simulating event on non-rendered component');
    }
    var virtualHandler =
      ReactEventEmitter.TopLevelCallbackCreator.createTopLevelCallback(
        topLevelType
      );
    var node = ReactMount.getNode(reactRootID);
    fakeNativeEvent.target = node;
    /* jsdom is returning nodes without id's - fixing that issue here. */
    ReactMount.setID(node, reactRootID);
    virtualHandler(fakeNativeEvent);
  },

  nativeTouchData: function(x, y) {
    return {
      touches: [
        {pageX: x, pageY: y}
      ]
    };
  },

  Simulate: null    // Will populate
};

/**
 * Exports:
 *
 * - `ReactTestUtils.Simulate.click(Element/ReactDOMComponent)`
 * - `ReactTestUtils.Simulate.mouseMove(Element/ReactDOMComponent)`
 * - `ReactTestUtils.Simulate.mouseIn/ReactDOMComponent)`
 * - `ReactTestUtils.Simulate.mouseOut(Element/ReactDOMComponent)`
 * - ... (All keys from `EventConstants.topLevelTypes`)
 *
 * Note: Top level event types are a subset of the entire set of handler types
 * (which include a broader set of "synthetic" events). For example, onDragDone
 * is a synthetic event. You certainly may write test cases for these event
 * types, but it doesn't make sense to simulate them at this low of a level. In
 * this case, the way you test an `onDragDone` event is by simulating a series
 * of `mouseMove`/ `mouseDown`/`mouseUp` events - Then, a synthetic event of
 * type `onDragDone` will be constructed and dispached through your system
 * automatically.
 */

function makeSimulator(eventType) {
  return function(domComponentOrNode, nativeEventData) {
    var fakeNativeEvent = new Event(eventType);
    mergeInto(fakeNativeEvent, nativeEventData);
    if (ReactTestUtils.isDOMComponent(domComponentOrNode)) {
      ReactTestUtils.simulateEventOnDOMComponent(
        eventType,
        domComponentOrNode,
        fakeNativeEvent
      );
    } else if (!!domComponentOrNode.tagName) {
      // Will allow on actual dom nodes.
      ReactTestUtils.simulateEventOnNode(
        eventType,
        domComponentOrNode,
        fakeNativeEvent
      );
    }
  };
}

ReactTestUtils.Simulate = {};
var eventType;
for (eventType in topLevelTypes) {
  // Event type is stored as 'topClick' - we transform that to 'click'
  var convenienceName = eventType.indexOf('top') === 0 ?
    eventType.charAt(3).toLowerCase() + eventType.substr(4) : eventType;
  /**
   * @param {!Element || ReactDOMComponent} domComponentOrNode
   * @param {?Event} nativeEventData Fake native event to use in SyntheticEvent.
   */
  ReactTestUtils.Simulate[convenienceName] = makeSimulator(eventType);
}

module.exports = ReactTestUtils;
