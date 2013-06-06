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
 * @providesModule EventPluginHub
 */

"use strict";

var AbstractEvent = require('AbstractEvent');
var CallbackRegistry = require('CallbackRegistry');
var EventPluginUtils = require('EventPluginUtils');
var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');

var accumulate = require('accumulate');
var forEachAccumulated = require('forEachAccumulated');
var keyMirror = require('keyMirror');
var merge = require('merge');
var throwIf = require('throwIf');

var deleteListener = CallbackRegistry.deleteListener;

var ERRORS = keyMirror({
  DOUBLE_REGISTER: null,
  DOUBLE_ENQUEUE: null,
  DEPENDENCY_ERROR: null
});

if (__DEV__) {
  ERRORS.DOUBLE_REGISTER =
    'You\'ve included an event plugin that extracts an ' +
    'event type with the exact same or identity as an event that ' +
    'had previously been injected - or, one of the registration names ' +
    'used by an plugin has already been used.';
  ERRORS.DOUBLE_ENQUEUE =
    'During the processing of events, more events were enqueued. This ' +
    'is strange and should not happen. Please report immediately. ';
  ERRORS.DEPENDENCY_ERROR =
    'You have either attempted to load an event plugin that has no ' +
    'entry in EventPluginOrder, or have attempted to extract events ' +
    'when some critical dependencies have not yet been injected.';
}


/**
 * EventPluginHub: To see a diagram and explanation of the overall architecture
 * of the plugin hub system, @see ReactEvents.js
 */

/**
 * Injected Dependencies:
 */
var injection = {
  /**
   * [required] Dependency of `EventPropagators`.
   */
  injectInstanceHandle: function(InjectedInstanceHandle) {
    EventPropagators.injection.injectInstanceHandle(InjectedInstanceHandle);
  },

  /**
   * `EventPluginOrder`: [optional] Provides deterministic ordering of
   * `EventPlugin`s. Ordering decoupled from the injection of actual
   * plugins so that there is always a deterministic and permanent ordering
   * regardless of the plugins that happen to become packaged, or applications
   * that happen to inject on-the-fly event plugins.
   */
  EventPluginOrder: null,
  injectEventPluginOrder: function(InjectedEventPluginOrder) {
    injection.EventPluginOrder = InjectedEventPluginOrder;
    injection._recomputePluginsList();
  },

  /**
   * `EventPlugins`: [optional][lazy-loadable] Plugins that must be listed in
   * the `EventPluginOrder` injected dependency. The list of plugins may grow as
   * custom plugins are injected into the system at page as part of the
   * initialization process, or even after the initialization process (on-the-
   * fly). Plugins injected into the hub have an opportunity to infer abstract
   * events when top level events are streamed through the `EventPluginHub`.
   */
  plugins: [],
  injectEventPluginsByName: function(pluginsByName) {
    injection.pluginsByName = merge(injection.pluginsByName, pluginsByName);
    injection._recomputePluginsList();
  },

  /**
   * A reference of all injected plugins by their name. Both plugins and
   * `EventPluginOrder` can be injected on-the-fly. Any time either dependency
   * is (re)injected, the resulting list of plugins in correct order is
   * recomputed.
   */
  pluginsByName: {},
  _recomputePluginsList: function() {
    var injectPluginByName = function(name, PluginModule) {
      var pluginIndex = injection.EventPluginOrder.indexOf(name);
      throwIf(pluginIndex === -1, ERRORS.DEPENDENCY_ERROR + name);
      if (!injection.plugins[pluginIndex]) {
        injection.plugins[pluginIndex] = PluginModule;
        for (var eventName in PluginModule.abstractEventTypes) {
          var eventType = PluginModule.abstractEventTypes[eventName];
          recordAllRegistrationNames(eventType, PluginModule);
        }
      }
    };
    if (injection.EventPluginOrder) {  // Else, do when plugin order injected
      var injectedPluginsByName = injection.pluginsByName;
      for (var name in injectedPluginsByName) {
        injectPluginByName(name, injectedPluginsByName[name]);
      }
    }
  }
};


/**
 * `renderedTarget`: We'll refer to the concept of a "rendered target". Any
 * framework code that uses the `EventPluginHub` will stream events to the
 * `EventPluginHub`. In order for registered plugins to make sense of the native
 * events, it helps to allow plugins to not only have access to the native
 * `Event` object but also the notion of a "rendered target", which is the
 * conceptual target `Element` of the `Event` that the framework (user of
 * `EventPluginHub`) deems as being the "important" target.
 */
/**
 * Keeps track of all valid "registration names" (`onClick` etc). We expose
 * these structures to other modules, who will always see updates that we apply
 * to these structures. They should never have a desire to mutate these.
 */
var registrationNames = {};

/**
 * This prevents the need for clients to call `Object.keys(registrationNames)`
 * every time they want to loop through the possible registration names.
 */
var registrationNamesArr = [];

/**
 * Internal queue of events that have accumulated their dispatches and are
 * waiting to have their dispatches executed.
 */
var abstractEventQueue = [];

/**
 * Records all the registration names that the event plugin makes available
 * to the general event system. These are things like
 * `onClick`/`onClickCapture`.
 */
function recordAllRegistrationNames(eventType, PluginModule) {
  var phaseName;
  var phasedRegistrationNames = eventType.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (phaseName in phasedRegistrationNames) {
      if (!phasedRegistrationNames.hasOwnProperty(phaseName)) {
        continue;
      }
      if (__DEV__) {
        throwIf(
          registrationNames[phasedRegistrationNames[phaseName]],
          ERRORS.DOUBLE_REGISTER
        );
      }
      registrationNames[phasedRegistrationNames[phaseName]] = PluginModule;
      registrationNamesArr.push(phasedRegistrationNames[phaseName]);
    }
  } else if (eventType.registrationName) {
    if (__DEV__) {
      throwIf(
        registrationNames[eventType.registrationName],
        ERRORS.DOUBLE_REGISTER
      );
    }
    registrationNames[eventType.registrationName] = PluginModule;
    registrationNamesArr.push(eventType.registrationName);
  }
}

/**
 * A hacky way to reverse engineer which event plugin module created an
 * AbstractEvent.
 * @param {AbstractEvent} abstractEvent to look at
 */
function getPluginModuleForAbstractEvent(abstractEvent) {
  var reactEventType = abstractEvent.reactEventType;
  if (reactEventType.registrationName) {
    return registrationNames[reactEventType.registrationName];
  } else {
    for (var phase in reactEventType.phasedRegistrationNames) {
      if (!reactEventType.phasedRegistrationNames.hasOwnProperty(phase)) {
        continue;
      }
      var PluginModule = registrationNames[
        reactEventType.phasedRegistrationNames[phase]
      ];
      if (PluginModule) {
        return PluginModule;
      }
    }
  }
  return null;
}

var deleteAllListeners = function(domID) {
  var ii;
  for (ii = 0; ii < registrationNamesArr.length; ii++) {
    deleteListener(domID, registrationNamesArr[ii]);
  }
};

/**
 * Accepts the stream of top level native events, and gives every registered
 * plugin an opportunity to extract `AbstractEvent`s with annotated dispatches.
 *
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {DOMEventTarget} topLevelTarget The listening component root node.
 * @param {string} topLevelTargetID ID of `topLevelTarget`.
 * @param {object} nativeEvent Native browser event.
 * @return {*} An accumulation of `AbstractEvent`s.
 */
var extractAbstractEvents = function(
    topLevelType,
    topLevelTarget,
    topLevelTargetID,
    nativeEvent) {
  var abstractEvents;
  var plugins = injection.plugins;
  for (var i = 0, l = plugins.length; i < l; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    var possiblePlugin = plugins[i];
    if (possiblePlugin) {
      var extractedAbstractEvents = possiblePlugin.extractAbstractEvents(
        topLevelType,
        topLevelTarget,
        topLevelTargetID,
        nativeEvent
      );
      if (extractedAbstractEvents) {
        abstractEvents = accumulate(abstractEvents, extractedAbstractEvents);
      }
    }
  }
  return abstractEvents;
};

var enqueueAbstractEvents = function(abstractEvents) {
  if (abstractEvents) {
    abstractEventQueue = accumulate(abstractEventQueue, abstractEvents);
  }
};

/**
 * Executes a single abstract event dispatch. Returns a value, but this return
 * value doesn't make much sense when executing dispatches for a list of a
 * events. However, if a plugin executes a single dispatch, mostly bypassing
 * `EventPluginHub`, it can execute dispatches directly and assign special
 * meaning to the return value. So this will return the result of executing the
 * dispatch, though for most use cases, it gets dropped.
 */
var executeDispatchesAndRelease = function(abstractEvent) {
  if (abstractEvent) {
    var PluginModule = getPluginModuleForAbstractEvent(abstractEvent);
    var pluginExecuteDispatch = PluginModule && PluginModule.executeDispatch;
    EventPluginUtils.executeDispatchesInOrder(
      abstractEvent,
      pluginExecuteDispatch || EventPluginUtils.executeDispatch
    );
    AbstractEvent.release(abstractEvent);
  }
};

/**
 * Sets `abstractEventQueue` to null before processing it, so that we can tell
 * if in the process of processing events, more were enqueued. We throw if we
 * find that any were enqueued though this use case could be supported in the
 * future. For now, throwing an error as it's something we don't expect to
 * occur.
 */
var processAbstractEventQueue = function() {
  var processingAbstractEventQueue = abstractEventQueue;
  abstractEventQueue = null;
  forEachAccumulated(processingAbstractEventQueue, executeDispatchesAndRelease);
  if (__DEV__) {
    throwIf(abstractEventQueue, ERRORS.DOUBLE_ENQUEUE);
  }
};

/**
 * Provides a unified interface for an arbitrary and dynamic set of event
 * plugins. Loosely, a hub, where several "event plugins" may act as a single
 * event plugin behind the facade of `EventPluginHub`. Each event plugin injects
 * themselves into the HUB, and will immediately become operable upon injection.
 *
 * @constructor EventPluginHub
 */
var EventPluginHub = {
  registrationNames: registrationNames,
  registrationNamesArr: registrationNamesArr,
  putListener: CallbackRegistry.putListener,
  getListener: CallbackRegistry.getListener,
  deleteAllListeners: deleteAllListeners,
  extractAbstractEvents: extractAbstractEvents,
  enqueueAbstractEvents: enqueueAbstractEvents,
  processAbstractEventQueue: processAbstractEventQueue,
  injection: injection
};


if (ExecutionEnvironment.canUseDOM) {
  window.EventPluginHub = EventPluginHub;
}

module.exports = EventPluginHub;
