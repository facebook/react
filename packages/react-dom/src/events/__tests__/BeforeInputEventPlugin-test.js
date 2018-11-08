/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

  function simulateComposition() {
    window.CompositionEvent = {};
  }

  function simulateNoComposition() {
    // no composition event in Window - will use fallback
  }

  function simulateEvent(elem, type, data) {
    const event = new Event(type, {bubbles: true});
    Object.assign(event, data);
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
    delete window.opera;
    document.body.removeChild(container);
    container = null;
  });

  function keyCode(char) {
    return char.charCodeAt(0);
  }

  const scenarios = [
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: [
        'compositionstart',
        {detail: {data: 'test'}, data: 'test'},
      ],
    },
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: [
        'compositionupdate',
        {detail: {data: 'test string'}, data: 'test string'},
      ],
    },
    {
      eventSimulator: simulateEvent,
      eventSimulatorArgs: [
        'compositionend',
        {detail: {data: 'test string 3'}, data: 'test string 3'},
      ],
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
          run: ({
            beforeInputEvent,
            compositionStartEvent,
            spyOnBeforeInput,
            spyOnCompositionStart,
          }) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
            expect(spyOnCompositionStart).toHaveBeenCalledTimes(1);
            expect(compositionStartEvent.type).toBe('compositionstart');
            expect(compositionStartEvent.data).toBe('test');
          },
        },
        {
          run: ({
            beforeInputEvent,
            compositionUpdateEvent,
            spyOnBeforeInput,
            spyOnCompositionUpdate,
          }) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
            expect(spyOnCompositionUpdate).toHaveBeenCalledTimes(1);
            expect(compositionUpdateEvent.type).toBe('compositionupdate');
            expect(compositionUpdateEvent.data).toBe('test string');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('compositionend');
            expect(beforeInputEvent.data).toBe('test string 3');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('textInput');
            expect(beforeInputEvent.data).toBe('abcß');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe(' ');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('textInput');
            expect(beforeInputEvent.data).toBe('\uD83D\uDE0A');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
      ],
    },
    {
      emulator: simulateIE11,
      assertions: [
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('a');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe(' ');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('c');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('\uD83D\uDE0A');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
      ],
    },
    {
      emulator: simulateNoComposition,
      assertions: [
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('a');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe(' ');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('c');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('\uD83D\uDE0A');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keydown');
            expect(beforeInputEvent.data).toBe('bar');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keyup');
            expect(beforeInputEvent.data).toBe('BAR');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('Bar');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
      ],
    },
    {
      emulator: simulateComposition,
      assertions: [
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('compositionend');
            expect(beforeInputEvent.data).toBe('test string 3');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('a');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe(' ');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('c');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(1);
            expect(beforeInputEvent.type).toBe('keypress');
            expect(beforeInputEvent.data).toBe('\uD83D\uDE0A');
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
        {
          run: ({beforeInputEvent, spyOnBeforeInput}) => {
            expect(spyOnBeforeInput).toHaveBeenCalledTimes(0);
            expect(beforeInputEvent).toBeNull();
          },
        },
      ],
    },
  ];

  const testInputComponent = (env, scenes) => {
    let beforeInputEvent;
    let compositionStartEvent;
    let compositionUpdateEvent;
    let spyOnBeforeInput;
    let spyOnCompositionStart;
    let spyOnCompositionUpdate;
    ReactDOM = loadReactDOM(env.emulator);
    const node = ReactDOM.render(
      <input
        type="text"
        onBeforeInput={({type, data}) => {
          spyOnBeforeInput();
          beforeInputEvent = {type, data};
        }}
        onCompositionStart={({type, data}) => {
          spyOnCompositionStart();
          compositionStartEvent = {type, data};
        }}
        onCompositionUpdate={({type, data}) => {
          spyOnCompositionUpdate();
          compositionUpdateEvent = {type, data};
        }}
      />,
      container,
    );

    scenes.forEach((s, id) => {
      beforeInputEvent = null;
      compositionStartEvent = null;
      compositionUpdateEvent = null;
      spyOnBeforeInput = jest.fn();
      spyOnCompositionStart = jest.fn();
      spyOnCompositionUpdate = jest.fn();
      s.eventSimulator.apply(null, [node, ...s.eventSimulatorArgs]);
      env.assertions[id].run({
        beforeInputEvent,
        compositionStartEvent,
        compositionUpdateEvent,
        spyOnBeforeInput,
        spyOnCompositionStart,
        spyOnCompositionUpdate,
      });
    });
  };

  const testContentEditableComponent = (env, scenes) => {
    let beforeInputEvent;
    let compositionStartEvent;
    let compositionUpdateEvent;
    let spyOnBeforeInput;
    let spyOnCompositionStart;
    let spyOnCompositionUpdate;
    ReactDOM = loadReactDOM(env.emulator);
    const node = ReactDOM.render(
      <div
        contentEditable={true}
        onBeforeInput={({type, data}) => {
          spyOnBeforeInput();
          beforeInputEvent = {type, data};
        }}
        onCompositionStart={({type, data}) => {
          spyOnCompositionStart();
          compositionStartEvent = {type, data};
        }}
        onCompositionUpdate={({type, data}) => {
          spyOnCompositionUpdate();
          compositionUpdateEvent = {type, data};
        }}
      />,
      container,
    );

    scenes.forEach((s, id) => {
      beforeInputEvent = null;
      compositionStartEvent = null;
      compositionUpdateEvent = null;
      spyOnBeforeInput = jest.fn();
      spyOnCompositionStart = jest.fn();
      spyOnCompositionUpdate = jest.fn();
      s.eventSimulator.apply(null, [node, ...s.eventSimulatorArgs]);
      env.assertions[id].run({
        beforeInputEvent,
        compositionStartEvent,
        compositionUpdateEvent,
        spyOnBeforeInput,
        spyOnCompositionStart,
        spyOnCompositionUpdate,
      });
    });
  };

  it('should extract onBeforeInput when simulating in Webkit on input[type=text]', () => {
    testInputComponent(environments[0], scenarios);
  });
  it('should extract onBeforeInput when simulating in Webkit on contenteditable', () => {
    testContentEditableComponent(environments[0], scenarios);
  });

  it('should extract onBeforeInput when simulating in IE11 on input[type=text]', () => {
    testInputComponent(environments[1], scenarios);
  });
  it('should extract onBeforeInput when simulating in IE11 on contenteditable', () => {
    testContentEditableComponent(environments[1], scenarios);
  });

  it('should extract onBeforeInput when simulating in env with no CompositionEvent on input[type=text]', () => {
    testInputComponent(environments[2], scenarios);
  });

  // in an environment using composition fallback onBeforeInput will not work
  // as expected on a contenteditable as keydown and keyup events are translated
  // to keypress events

  it('should extract onBeforeInput when simulating in env with only CompositionEvent on input[type=text]', () => {
    testInputComponent(environments[3], scenarios);
  });

  it('should extract onBeforeInput when simulating in env with only CompositionEvent on contenteditable', () => {
    testContentEditableComponent(environments[3], scenarios);
  });
});
