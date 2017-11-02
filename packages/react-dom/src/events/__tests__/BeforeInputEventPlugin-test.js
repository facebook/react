/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React = require('react');
var ReactTestUtils = require('react-dom/test-utils');

var EventMapping = {
  compositionstart: 'topCompositionStart',
  compositionend: 'topCompositionEnd',
  keyup: 'topKeyUp',
  keydown: 'topKeyDown',
  keypress: 'topKeyPress',
  textInput: 'topTextInput',
  textinput: null, // Not defined now
};

describe('BeforeInputEventPlugin', function() {
  var ModuleCache;

  function simulateIE11() {
    document.documentMode = 11;
    window.CompositionEvent = {};
    delete window.TextEvent;
  }

  function simulateWebkit() {
    delete document.documentMode;
    window.CompositionEvent = {};
    window.TextEvent = {};
  }

  function initialize(simulator) {
    // Need to delete cached modules before executing simulator
    jest.resetModules();

    // Initialize variables in the scope of BeforeInputEventPlugin
    simulator();

    // Modules which have dependency on BeforeInputEventPlugin are stored
    // in ModuleCache so that we can use these modules ouside test functions.
    this.ReactDOM = require('react-dom');

    // TODO: can we express this test with only public API?
    this.ReactDOMComponentTree = require('../../client/ReactDOMComponentTree').default;
    this.SyntheticCompositionEvent = require('../SyntheticCompositionEvent').default;
    this.SyntheticInputEvent = require('../SyntheticInputEvent').default;
    this.BeforeInputEventPlugin = require('../BeforeInputEventPlugin').default;
  }

  function extract(node, eventType, optionalData) {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent(eventType, true, true);
    evt = Object.assign(evt, optionalData);
    return ModuleCache.BeforeInputEventPlugin.extractEvents(
      EventMapping[eventType],
      ModuleCache.ReactDOMComponentTree.getInstanceFromNode(node),
      evt,
      node,
    );
  }

  function setElementText(node) {
    return args => (node.innerHTML = args);
  }

  function accumulateEvents(node, events) {
    // We don't use accumulateInto module to apply partial application.
    return function() {
      var newArgs = [node].concat(Array.prototype.slice.call(arguments));
      var newEvents = extract.apply(this, newArgs);
      Array.prototype.push.apply(events, newEvents);
    };
  }

  function EventMismatchError(idx, message) {
    this.name = 'EventMismatchError';
    this.message = '[' + idx + '] ' + message;
  }
  EventMismatchError.prototype = Object.create(Error.prototype);

  function verifyEvents(actualEvents, expectedEvents) {
    expect(actualEvents.length).toBe(expectedEvents.length);
    expectedEvents.forEach(function(expected, idx) {
      var actual = actualEvents[idx];
      expect(function() {
        if (actual === null && expected.type === null) {
          // Both are null.  Expected.
        } else if (actual === null) {
          throw new EventMismatchError(idx, 'Expected not to be null');
        } else if (
          expected.type === null ||
          !(actual instanceof expected.type)
        ) {
          throw new EventMismatchError(idx, 'Unexpected type: ' + actual);
        } else {
          // Type match.
          Object.keys(expected.data).forEach(function(expectedKey) {
            if (!(expectedKey in actual)) {
              throw new EventMismatchError(idx, 'KeyNotFound: ' + expectedKey);
            } else if (actual[expectedKey] !== expected.data[expectedKey]) {
              throw new EventMismatchError(
                idx,
                'ValueMismatch: ' + actual[expectedKey],
              );
            }
          });
        }
      }).not.toThrow();
    });
  }

  // IE fires an event named `textinput` with all lowercase characters,
  // instead of a standard name `textInput`.  As of now, React does not have
  // a corresponding topEvent to IE's textinput, but both events are added to
  // this scenario data for future use.
  var Test_Scenario = [
    // Composition test
    {run: accumulateEvents, arg: ['compositionstart', {data: ''}]},
    {run: accumulateEvents, arg: ['textInput', {data: 'A'}]},
    {run: accumulateEvents, arg: ['textinput', {data: 'A'}]},
    {run: accumulateEvents, arg: ['keyup', {keyCode: 65}]},
    {run: setElementText, arg: ['ABC']},
    {run: accumulateEvents, arg: ['textInput', {data: 'abc'}]},
    {run: accumulateEvents, arg: ['textinput', {data: 'abc'}]},
    {run: accumulateEvents, arg: ['keyup', {keyCode: 32}]},
    {run: setElementText, arg: ['XYZ']},
    {run: accumulateEvents, arg: ['textInput', {data: 'xyz'}]},
    {run: accumulateEvents, arg: ['textinput', {data: 'xyz'}]},
    {run: accumulateEvents, arg: ['keyup', {keyCode: 32}]},
    {run: accumulateEvents, arg: ['compositionend', {data: 'Hello'}]},

    // Emoji test
    {
      run: accumulateEvents,
      arg: ['keypress', {char: '\uD83D\uDE0A', which: 65}],
    },
    {run: accumulateEvents, arg: ['textInput', {data: '\uD83D\uDE0A'}]},
  ];

  /* Defined expected results as a factory of result data because we need
     lazy evaluation for event modules.
     Event modules are reloaded to simulate a different platform per testcase.
     If we define expected results as a simple dictionary here, the comparison
     of 'instanceof' fails after module cache is reset.  */

  // Webkit behavior is simple.  We expect SyntheticInputEvent at each
  // textInput, SyntheticCompositionEvent at composition, and nothing from
  // keyUp.
  var Expected_Webkit = () => [
    {type: ModuleCache.SyntheticCompositionEvent, data: {}},
    {type: null},
    {type: null},
    {type: ModuleCache.SyntheticInputEvent, data: {data: 'A'}},
    {type: null},
    {type: null}, // textinput of A
    {type: null},
    {type: null}, // keyUp of 65
    {type: null},
    {type: ModuleCache.SyntheticInputEvent, data: {data: 'abc'}},
    {type: null},
    {type: null}, // textinput of abc
    {type: null},
    {type: null}, // keyUp of 32
    {type: null},
    {type: ModuleCache.SyntheticInputEvent, data: {data: 'xyz'}},
    {type: null},
    {type: null}, // textinput of xyz
    {type: null},
    {type: null}, // keyUp of 32
    {type: ModuleCache.SyntheticCompositionEvent, data: {data: 'Hello'}},
    {type: null},

    // Emoji test
    {type: null},
    {type: null},
    {type: null},
    {type: ModuleCache.SyntheticInputEvent, data: {data: '\uD83D\uDE0A'}},
  ];

  // For IE11, we use fallback data instead of IE's textinput events.
  // We expect no SyntheticInputEvent from textinput. Fallback beforeInput is
  // expected to be triggered at compositionend with a text of the target
  // element, not event data.
  var Expected_IE11 = () => [
    {type: ModuleCache.SyntheticCompositionEvent, data: {}},
    {type: null},
    {type: null},
    {type: null}, // textInput of A
    {type: null},
    {type: null}, // textinput of A
    {type: null},
    {type: null}, // keyUp of 65
    {type: null},
    {type: null}, // textInput of abc
    {type: null},
    {type: null}, // textinput of abc

    // fallbackData should NOT be set at keyUp with any of END_KEYCODES
    {type: null},
    {type: null}, // keyUp of 32

    {type: null},
    {type: null}, // textInput of xyz
    {type: null},
    {type: null}, // textinput of xyz
    {type: null},
    {type: null}, // keyUp of 32

    // fallbackData is retrieved from the element, which is XYZ,
    // at a time of compositionend
    {type: ModuleCache.SyntheticCompositionEvent, data: {}},
    {type: ModuleCache.SyntheticInputEvent, data: {data: 'XYZ'}},

    // Emoji test
    {type: null},
    {type: ModuleCache.SyntheticInputEvent, data: {data: '\uD83D\uDE0A'}},
    {type: null},
    {type: null},
  ];

  function TestEditableReactComponent(Emulator, Scenario, ExpectedResult) {
    ModuleCache = new initialize(Emulator);

    class EditableDiv extends React.Component {
      render() {
        return <div contentEditable="true" />;
      }
    }
    var rendered = ReactTestUtils.renderIntoDocument(<EditableDiv />);

    var node = ModuleCache.ReactDOM.findDOMNode(rendered);
    var events = [];

    Scenario.forEach(el => el.run.call(this, node, events).apply(this, el.arg));
    verifyEvents(events, ExpectedResult());
  }

  it('extract onBeforeInput from native textinput events', function() {
    TestEditableReactComponent(simulateWebkit, Test_Scenario, Expected_Webkit);
  });

  it('extract onBeforeInput from fallback objects', function() {
    TestEditableReactComponent(simulateIE11, Test_Scenario, Expected_IE11);
  });
});
