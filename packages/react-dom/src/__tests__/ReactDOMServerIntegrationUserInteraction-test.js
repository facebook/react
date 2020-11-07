/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  ReactTestUtils = require('react-dom/test-utils');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
    ReactTestUtils,
  };
}

const {
  resetModules,
  itClientRenders,
  renderIntoDom,
  serverRender,
} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegrationUserInteraction', () => {
  let ControlledInput, ControlledTextArea, ControlledCheckbox, ControlledSelect;

  beforeEach(() => {
    resetModules();
    ControlledInput = class extends React.Component {
      static defaultProps = {
        type: 'text',
        initialValue: 'Hello',
      };
      constructor() {
        super(...arguments);
        this.state = {value: this.props.initialValue};
      }
      handleChange(event) {
        if (this.props.onChange) {
          this.props.onChange(event);
        }
        this.setState({value: event.target.value});
      }
      render() {
        return (
          <input
            type={this.props.type}
            value={this.state.value}
            onChange={this.handleChange.bind(this)}
          />
        );
      }
    };
    ControlledTextArea = class extends React.Component {
      constructor() {
        super();
        this.state = {value: 'Hello'};
      }
      handleChange(event) {
        if (this.props.onChange) {
          this.props.onChange(event);
        }
        this.setState({value: event.target.value});
      }
      render() {
        return (
          <textarea
            value={this.state.value}
            onChange={this.handleChange.bind(this)}
          />
        );
      }
    };
    ControlledCheckbox = class extends React.Component {
      constructor() {
        super();
        this.state = {value: true};
      }
      handleChange(event) {
        if (this.props.onChange) {
          this.props.onChange(event);
        }
        this.setState({value: event.target.checked});
      }
      render() {
        return (
          <input
            type="checkbox"
            checked={this.state.value}
            onChange={this.handleChange.bind(this)}
          />
        );
      }
    };
    ControlledSelect = class extends React.Component {
      constructor() {
        super();
        this.state = {value: 'Hello'};
      }
      handleChange(event) {
        if (this.props.onChange) {
          this.props.onChange(event);
        }
        this.setState({value: event.target.value});
      }
      render() {
        return (
          <select
            value={this.state.value}
            onChange={this.handleChange.bind(this)}>
            <option key="1" value="Hello">
              Hello
            </option>
            <option key="2" value="Goodbye">
              Goodbye
            </option>
          </select>
        );
      }
    };
  });

  describe('user interaction with controlled inputs', function() {
    itClientRenders('a controlled text input', async render => {
      const setUntrackedValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      ).set;

      let changeCount = 0;
      const e = await render(
        <ControlledInput onChange={() => changeCount++} />,
      );
      const container = e.parentNode;
      document.body.appendChild(container);

      try {
        expect(changeCount).toBe(0);
        expect(e.value).toBe('Hello');

        // simulate a user typing.
        setUntrackedValue.call(e, 'Goodbye');
        e.dispatchEvent(new Event('input', {bubbles: true, cancelable: false}));

        expect(changeCount).toBe(1);
        expect(e.value).toBe('Goodbye');
      } finally {
        document.body.removeChild(container);
      }
    });

    itClientRenders('a controlled textarea', async render => {
      const setUntrackedValue = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      ).set;

      let changeCount = 0;
      const e = await render(
        <ControlledTextArea onChange={() => changeCount++} />,
      );
      const container = e.parentNode;
      document.body.appendChild(container);

      try {
        expect(changeCount).toBe(0);
        expect(e.value).toBe('Hello');

        // simulate a user typing.
        setUntrackedValue.call(e, 'Goodbye');
        e.dispatchEvent(new Event('input', {bubbles: true, cancelable: false}));

        expect(changeCount).toBe(1);
        expect(e.value).toBe('Goodbye');
      } finally {
        document.body.removeChild(container);
      }
    });

    itClientRenders('a controlled checkbox', async render => {
      let changeCount = 0;
      const e = await render(
        <ControlledCheckbox onChange={() => changeCount++} />,
      );
      const container = e.parentNode;
      document.body.appendChild(container);

      try {
        expect(changeCount).toBe(0);
        expect(e.checked).toBe(true);

        // simulate a user clicking.
        e.click();

        expect(changeCount).toBe(1);
        expect(e.checked).toBe(false);
      } finally {
        document.body.removeChild(container);
      }
    });

    itClientRenders('a controlled select', async render => {
      const setUntrackedValue = Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        'value',
      ).set;

      let changeCount = 0;
      const e = await render(
        <ControlledSelect onChange={() => changeCount++} />,
      );
      const container = e.parentNode;
      document.body.appendChild(container);

      try {
        expect(changeCount).toBe(0);
        expect(e.value).toBe('Hello');

        // simulate a user typing.
        setUntrackedValue.call(e, 'Goodbye');
        e.dispatchEvent(
          new Event('change', {bubbles: true, cancelable: false}),
        );

        expect(changeCount).toBe(1);
        expect(e.value).toBe('Goodbye');
      } finally {
        document.body.removeChild(container);
      }
    });
  });

  describe('user interaction with inputs before client render', function() {
    // renders the element and changes the value **before** the client
    // code has a chance to render; this simulates what happens when a
    // user starts to interact with a server-rendered form before
    // ReactDOM.render is called. the client render should NOT blow away
    // the changes the user has made.
    const testUserInteractionBeforeClientRender = async (
      element,
      initialValue = 'Hello',
      changedValue = 'Goodbye',
      valueKey = 'value',
    ) => {
      const field = await serverRender(element);
      expect(field[valueKey]).toBe(initialValue);

      // simulate a user typing in the field **before** client-side reconnect happens.
      field[valueKey] = changedValue;

      resetModules();
      // client render on top of the server markup.
      const clientField = await renderIntoDom(element, field.parentNode, true);
      // verify that the input field was not replaced.
      // Note that we cannot use expect(clientField).toBe(field) because
      // of jest bug #1772
      expect(clientField === field).toBe(true);
      // confirm that the client render has not changed what the user typed.
      expect(clientField[valueKey]).toBe(changedValue);
    };

    it('should not blow away user-entered text on successful reconnect to an uncontrolled input', () =>
      testUserInteractionBeforeClientRender(<input defaultValue="Hello" />));

    it('should not blow away user-entered text on successful reconnect to a controlled input', async () => {
      let changeCount = 0;
      await testUserInteractionBeforeClientRender(
        <ControlledInput onChange={() => changeCount++} />,
      );
      // note that there's a strong argument to be made that the DOM revival
      // algorithm should notice that the user has changed the value and fire
      // an onChange. however, it does not now, so that's what this tests.
      expect(changeCount).toBe(0);
    });

    it('should not blow away user-interaction on successful reconnect to an uncontrolled range input', () =>
      testUserInteractionBeforeClientRender(
        <input type="text" defaultValue="0.5" />,
        '0.5',
        '1',
      ));

    it('should not blow away user-interaction on successful reconnect to a controlled range input', async () => {
      let changeCount = 0;
      await testUserInteractionBeforeClientRender(
        <ControlledInput
          type="range"
          initialValue="0.25"
          onChange={() => changeCount++}
        />,
        '0.25',
        '1',
      );
      expect(changeCount).toBe(0);
    });

    it('should not blow away user-entered text on successful reconnect to an uncontrolled checkbox', () =>
      testUserInteractionBeforeClientRender(
        <input type="checkbox" defaultChecked={true} />,
        true,
        false,
        'checked',
      ));

    it('should not blow away user-entered text on successful reconnect to a controlled checkbox', async () => {
      let changeCount = 0;
      await testUserInteractionBeforeClientRender(
        <ControlledCheckbox onChange={() => changeCount++} />,
        true,
        false,
        'checked',
      );
      expect(changeCount).toBe(0);
    });

    // skipping this test because React 15 does the wrong thing. it blows
    // away the user's typing in the textarea.
    xit('should not blow away user-entered text on successful reconnect to an uncontrolled textarea', () =>
      testUserInteractionBeforeClientRender(<textarea defaultValue="Hello" />));

    // skipping this test because React 15 does the wrong thing. it blows
    // away the user's typing in the textarea.
    xit('should not blow away user-entered text on successful reconnect to a controlled textarea', async () => {
      let changeCount = 0;
      await testUserInteractionBeforeClientRender(
        <ControlledTextArea onChange={() => changeCount++} />,
      );
      expect(changeCount).toBe(0);
    });

    it('should not blow away user-selected value on successful reconnect to an uncontrolled select', () =>
      testUserInteractionBeforeClientRender(
        <select defaultValue="Hello">
          <option key="1" value="Hello">
            Hello
          </option>
          <option key="2" value="Goodbye">
            Goodbye
          </option>
        </select>,
      ));

    it('should not blow away user-selected value on successful reconnect to an controlled select', async () => {
      let changeCount = 0;
      await testUserInteractionBeforeClientRender(
        <ControlledSelect onChange={() => changeCount++} />,
      );
      expect(changeCount).toBe(0);
    });
  });
});
