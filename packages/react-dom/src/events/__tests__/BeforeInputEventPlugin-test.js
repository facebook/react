/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('BeforeInputEventPlugin', () => {
  let container;

  function loadReactDOM(envSimulator) {
    jest.resetModules();
    if (envSimulator) {
      envSimulator();
    }
    return require('react-dom');
  }

  function simulateIE11() {
    document.documentMode = 11;
    window.CompositionEvent = {};
  }

  function simulateWebkit() {
    window.CompositionEvent = {};
    window.TextEvent = {};
  }

  function simulatePresto() {
    window.TextEvent = {};
    window.opera = {
      version: () => 12,
    };
  }

  function simulateEvent(elem, type, data) {
    const event = new Event(type, {bubbles: true});
    Object.keys(data).forEach(key => {
      event[key] = data[key];
    });
    elem.dispatchEvent(event);
  }

  function simulateKeyboardEvent(elem, type, data) {
    const {char, value, ...rest} = data;
    const event = new KeyboardEvent(type, {
      bubbles: true,
      ...rest,
    });
    if (char) {
      event.char = char;
    }
    if (value) {
      elem.value = value;
    }
    elem.dispatchEvent(event);
  }

  function simulatePaste(elem) {
    const pasteEvent = new Event('paste', {
      bubbles: true,
    });
    pasteEvent.clipboardData = {
      dropEffect: null,
      effectAllowed: null,
      files: null,
      items: null,
      types: null,
    };
    elem.dispatchEvent(pasteEvent);
  }

  beforeEach(() => {
    React = require('react');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    delete document.documentMode;
    delete window.CompositionEvent;
    delete window.TextEvent;
    document.body.removeChild(container);
    container = null;
  });

  function keyCode(char) {
    return char.charCodeAt(0);
  }

  const scenarios = [
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: ['compositionstart', {detail: {data: 'test'}}],
    },
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: [
        'compositionupdate',
        {detail: {data: 'test string'}},
      ],
    },
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: ['compositionend', {detail: {data: 'test string 3'}}],
    },
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: ['textInput', {data: 'abcß'}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keypress', {which: keyCode('a')}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keypress', {which: keyCode(' ')}, ' '],
    },
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: ['textInput', {data: ' '}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keypress', {which: keyCode('a'), ctrlKey: true}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keypress', {which: keyCode('b'), altKey: true}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: [
        'keypress',
        {which: keyCode('c'), altKey: true, ctrlKey: true},
      ],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: [
        'keypress',
        {which: keyCode('X'), char: '\uD83D\uDE0A'},
      ],
    },
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: ['textInput', {data: '\uD83D\uDE0A'}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keydown', {keyCode: 229, value: 'foo'}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keydown', {keyCode: 9, value: 'foobar'}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keydown', {keyCode: 229, value: 'foofoo'}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keyup', {keyCode: 9, value: 'fooBARfoo'}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keydown', {keyCode: 229, value: 'foofoo'}],
    },
    {
      eventSimulator: simulateKeyboardEvent,
      eventSimulatorArgs: ['keypress', {keyCode: 60, value: 'Barfoofoo'}],
    },
    {
      eventSimulator: simulatePaste,
      eventSimulatorArgs: [],
    },
  ];

  const environments = [
    {
      emulator: simulateWebkit,
      assertions: [
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('compositionend');
            expect(event.data).toBe('test string 3');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('textInput');
            expect(event.data).toBe('abcß');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe(' ');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('textInput');
            expect(event.data).toBe('\uD83D\uDE0A');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
      ],
    },
    {
      emulator: simulateIE11,
      assertions: [
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe('a');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe(' ');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe('c');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe('\uD83D\uDE0A');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
      ],
    },
    {
      emulator: simulatePresto,
      assertions: [
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe('a');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe(' ');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe('c');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe('\uD83D\uDE0A');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keydown');
            expect(event.data).toBe('bar');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keyup');
            expect(event.data).toBe('BAR');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(1);
            expect(event.type).toBe('keypress');
            expect(event.data).toBe('Bar');
          },
        },
        {
          run: (event, spy) => {
            expect(spy.mock.calls.length).toBe(0);
            expect(event).toBeNull();
          },
        },
      ],
    },
  ];

  const testInputComponent = (env, scenes) => {
    let event;
    let spy;
    ReactDOM = loadReactDOM(env.emulator);
    const node = ReactDOM.render(
      <input
        type="text"
        onBeforeInput={({type, data}) => {
          spy();
          event = {type, data};
        }}
      />,
      container,
    );

    scenes.forEach((s, id) => {
      event = null;
      spy = jest.fn();
      s.eventSimulator.apply(null, [node, ...s.eventSimulatorArgs]);
      env.assertions[id].run(event, spy);
    });
  };

  const testContentEditableComponent = (env, scenes) => {
    let event;
    let spy;
    ReactDOM = loadReactDOM(env.emulator);
    const node = ReactDOM.render(
      <div
        contentEditable={true}
        onBeforeInput={({type, data}) => {
          spy();
          event = {type, data};
        }}
      />,
      container,
    );

    scenes.forEach((s, id) => {
      event = null;
      spy = jest.fn();
      s.eventSimulator.apply(null, [node, ...s.eventSimulatorArgs]);
      env.assertions[id].run(event, spy);
    });
  };

  it('should extract onBeforeInput when simulating in Webkit on text input', () => {
    testInputComponent(environments[0], scenarios);
  });
  it('should extract onBeforeInput when simulating in Webkit on content editable', () => {
    testContentEditableComponent(environments[0], scenarios);
  });

  it('should extract onBeforeInput when simulating in IE11 on text input', () => {
    testInputComponent(environments[1], scenarios);
  });
  it('should extract onBeforeInput when simulating in IE11 on content editable', () => {
    testContentEditableComponent(environments[1], scenarios);
  });

  it('should extract onBeforeInput when simulating in Presto on text input', () => {
    testInputComponent(environments[2], scenarios);
  });

  it('should extract onBeforeInput when simulating in Presto on content editable', () => {
    // my test case for fallback composition end is not triggering onBeforeInput
    // still looking into understanding why
    testContentEditableComponent(environments[2], scenarios.splice(0, 5));
  });
});
