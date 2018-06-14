/**
 * Copyright (c) 2013-present, Facebook, Inc.
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
  ReactTestUtils = require('react-dom/test-utils');
  ReactDOMServer = require('react-dom/server');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
  };
}

const {
  resetModules,
  itRenders,
  itClientRenders,
  renderIntoDom,
  serverRender,
} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  describe('form controls', function() {
    describe('inputs', function() {
      itRenders('an input with a value and an onChange', async render => {
        const e = await render(<input value="foo" onChange={() => {}} />);
        expect(e.value).toBe('foo');
      });

      itRenders('an input with a value and readOnly', async render => {
        const e = await render(<input value="foo" readOnly={true} />);
        expect(e.value).toBe('foo');
      });

      itRenders(
        'an input with a value and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that value without
          // onChange or readOnly is a mistake.
          const e = await render(<input value="foo" />, 1);
          expect(e.value).toBe('foo');
          expect(e.getAttribute('value')).toBe('foo');
        },
      );

      itRenders('an input with a defaultValue', async render => {
        const e = await render(<input defaultValue="foo" />);
        expect(e.value).toBe('foo');
        expect(e.getAttribute('value')).toBe('foo');
        expect(e.getAttribute('defaultValue')).toBe(null);
      });

      itRenders('an input value overriding defaultValue', async render => {
        const e = await render(
          <input value="foo" defaultValue="bar" readOnly={true} />,
          1,
        );
        expect(e.value).toBe('foo');
        expect(e.getAttribute('value')).toBe('foo');
        expect(e.getAttribute('defaultValue')).toBe(null);
      });

      itRenders(
        'an input value overriding defaultValue no matter the prop order',
        async render => {
          const e = await render(
            <input defaultValue="bar" value="foo" readOnly={true} />,
            1,
          );
          expect(e.value).toBe('foo');
          expect(e.getAttribute('value')).toBe('foo');
          expect(e.getAttribute('defaultValue')).toBe(null);
        },
      );
    });

    describe('checkboxes', function() {
      itRenders('a checkbox that is checked with an onChange', async render => {
        const e = await render(
          <input type="checkbox" checked={true} onChange={() => {}} />,
        );
        expect(e.checked).toBe(true);
      });

      itRenders('a checkbox that is checked with readOnly', async render => {
        const e = await render(
          <input type="checkbox" checked={true} readOnly={true} />,
        );
        expect(e.checked).toBe(true);
      });

      itRenders(
        'a checkbox that is checked and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that checked without
          // onChange or readOnly is a mistake.
          const e = await render(<input type="checkbox" checked={true} />, 1);
          expect(e.checked).toBe(true);
        },
      );

      itRenders('a checkbox with defaultChecked', async render => {
        const e = await render(<input type="checkbox" defaultChecked={true} />);
        expect(e.checked).toBe(true);
        expect(e.getAttribute('defaultChecked')).toBe(null);
      });

      itRenders(
        'a checkbox checked overriding defaultChecked',
        async render => {
          const e = await render(
            <input
              type="checkbox"
              checked={true}
              defaultChecked={false}
              readOnly={true}
            />,
            1,
          );
          expect(e.checked).toBe(true);
          expect(e.getAttribute('defaultChecked')).toBe(null);
        },
      );

      itRenders(
        'a checkbox checked overriding defaultChecked no matter the prop order',
        async render => {
          const e = await render(
            <input
              type="checkbox"
              defaultChecked={false}
              checked={true}
              readOnly={true}
            />,
            1,
          );
          expect(e.checked).toBe(true);
          expect(e.getAttribute('defaultChecked')).toBe(null);
        },
      );
    });

    describe('textareas', function() {
      // textareas
      // ---------
      itRenders('a textarea with a value and an onChange', async render => {
        const e = await render(<textarea value="foo" onChange={() => {}} />);
        // textarea DOM elements don't have a value **attribute**, the text is
        // a child of the element and accessible via the .value **property**.
        expect(e.getAttribute('value')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders('a textarea with a value and readOnly', async render => {
        const e = await render(<textarea value="foo" readOnly={true} />);
        // textarea DOM elements don't have a value **attribute**, the text is
        // a child of the element and accessible via the .value **property**.
        expect(e.getAttribute('value')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders(
        'a textarea with a value and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that value without
          // onChange or readOnly is a mistake.
          const e = await render(<textarea value="foo" />, 1);
          expect(e.getAttribute('value')).toBe(null);
          expect(e.value).toBe('foo');
        },
      );

      itRenders('a textarea with a defaultValue', async render => {
        const e = await render(<textarea defaultValue="foo" />);
        expect(e.getAttribute('value')).toBe(null);
        expect(e.getAttribute('defaultValue')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders('a textarea value overriding defaultValue', async render => {
        const e = await render(
          <textarea value="foo" defaultValue="bar" readOnly={true} />,
          1,
        );
        expect(e.getAttribute('value')).toBe(null);
        expect(e.getAttribute('defaultValue')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders(
        'a textarea value overriding defaultValue no matter the prop order',
        async render => {
          const e = await render(
            <textarea defaultValue="bar" value="foo" readOnly={true} />,
            1,
          );
          expect(e.getAttribute('value')).toBe(null);
          expect(e.getAttribute('defaultValue')).toBe(null);
          expect(e.value).toBe('foo');
        },
      );
    });

    describe('selects', function() {
      let options;
      beforeEach(function() {
        options = [
          <option key={1} value="foo" id="foo">
            Foo
          </option>,
          <option key={2} value="bar" id="bar">
            Bar
          </option>,
          <option key={3} value="baz" id="baz">
            Baz
          </option>,
        ];
      });

      // a helper function to test the selected value of a <select> element.
      // takes in a <select> DOM element (element) and a value or array of
      // values that should be selected (selected).
      const expectSelectValue = (element, selected) => {
        if (!Array.isArray(selected)) {
          selected = [selected];
        }
        // the select DOM element shouldn't ever have a value or defaultValue
        // attribute; that is not how select values are expressed in the DOM.
        expect(element.getAttribute('value')).toBe(null);
        expect(element.getAttribute('defaultValue')).toBe(null);

        ['foo', 'bar', 'baz'].forEach(value => {
          const expectedValue = selected.indexOf(value) !== -1;
          const option = element.querySelector(`#${value}`);
          expect(option.selected).toBe(expectedValue);
        });
      };

      itRenders('a select with a value and an onChange', async render => {
        const e = await render(
          <select value="bar" onChange={() => {}}>
            {options}
          </select>,
        );
        expectSelectValue(e, 'bar');
      });

      itRenders('a select with a value and readOnly', async render => {
        const e = await render(
          <select value="bar" readOnly={true}>
            {options}
          </select>,
        );
        expectSelectValue(e, 'bar');
      });

      itRenders(
        'a select with a multiple values and an onChange',
        async render => {
          const e = await render(
            <select value={['bar', 'baz']} multiple={true} onChange={() => {}}>
              {options}
            </select>,
          );
          expectSelectValue(e, ['bar', 'baz']);
        },
      );

      itRenders(
        'a select with a multiple values and readOnly',
        async render => {
          const e = await render(
            <select value={['bar', 'baz']} multiple={true} readOnly={true}>
              {options}
            </select>,
          );
          expectSelectValue(e, ['bar', 'baz']);
        },
      );

      itRenders(
        'a select with a value and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that value without
          // onChange or readOnly is a mistake.
          const e = await render(<select value="bar">{options}</select>, 1);
          expectSelectValue(e, 'bar');
        },
      );

      itRenders('a select with a defaultValue', async render => {
        const e = await render(<select defaultValue="bar">{options}</select>);
        expectSelectValue(e, 'bar');
      });

      itRenders('a select value overriding defaultValue', async render => {
        const e = await render(
          <select value="bar" defaultValue="baz" readOnly={true}>
            {options}
          </select>,
          1,
        );
        expectSelectValue(e, 'bar');
      });

      itRenders(
        'a select value overriding defaultValue no matter the prop order',
        async render => {
          const e = await render(
            <select defaultValue="baz" value="bar" readOnly={true}>
              {options}
            </select>,
            1,
          );
          expectSelectValue(e, 'bar');
        },
      );
    });

    describe('user interaction', function() {
      let ControlledInput,
        ControlledTextArea,
        ControlledCheckbox,
        ControlledSelect;
      beforeEach(() => {
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
          let changeCount = 0;
          const e = await render(
            <ControlledInput onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.value).toBe('Hello');

          // simulate a user typing.
          e.value = 'Goodbye';
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.value).toBe('Goodbye');
        });

        itClientRenders('a controlled textarea', async render => {
          let changeCount = 0;
          const e = await render(
            <ControlledTextArea onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.value).toBe('Hello');

          // simulate a user typing.
          e.value = 'Goodbye';
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.value).toBe('Goodbye');
        });

        itClientRenders('a controlled checkbox', async render => {
          let changeCount = 0;
          const e = await render(
            <ControlledCheckbox onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.checked).toBe(true);

          // simulate a user typing.
          e.checked = false;
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.checked).toBe(false);
        });

        itClientRenders('a controlled select', async render => {
          let changeCount = 0;
          const e = await render(
            <ControlledSelect onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.value).toBe('Hello');

          // simulate a user typing.
          e.value = 'Goodbye';
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.value).toBe('Goodbye');
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
          const clientField = await renderIntoDom(
            element,
            field.parentNode,
            true,
          );
          // verify that the input field was not replaced.
          // Note that we cannot use expect(clientField).toBe(field) because
          // of jest bug #1772
          expect(clientField === field).toBe(true);
          // confirm that the client render has not changed what the user typed.
          expect(clientField[valueKey]).toBe(changedValue);
        };

        it('should not blow away user-entered text on successful reconnect to an uncontrolled input', () =>
          testUserInteractionBeforeClientRender(
            <input defaultValue="Hello" />,
          ));

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
          testUserInteractionBeforeClientRender(
            <textarea defaultValue="Hello" />,
          ));

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
  });
});
