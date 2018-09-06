/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('forwardRef', () => {
  let PropTypes;
  let React;
  let ReactNoop;

  beforeEach(() => {
    jest.resetModules();
    PropTypes = require('prop-types');
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should update refs when switching between children', () => {
    function FunctionalComponent({forwardedRef, setRefOnDiv}) {
      return (
        <section>
          <div ref={setRefOnDiv ? forwardedRef : null}>First</div>
          <span ref={setRefOnDiv ? null : forwardedRef}>Second</span>
        </section>
      );
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <FunctionalComponent {...props} forwardedRef={ref} />
    ));

    const ref = React.createRef();

    ReactNoop.render(<RefForwardingComponent ref={ref} setRefOnDiv={true} />);
    ReactNoop.flush();
    expect(ref.current.type).toBe('div');

    ReactNoop.render(<RefForwardingComponent ref={ref} setRefOnDiv={false} />);
    ReactNoop.flush();
    expect(ref.current.type).toBe('span');
  });

  it('should support rendering null', () => {
    const RefForwardingComponent = React.forwardRef((props, ref) => null);

    const ref = React.createRef();

    ReactNoop.render(<RefForwardingComponent ref={ref} />);
    ReactNoop.flush();
    expect(ref.current).toBe(null);
  });

  it('should support rendering null for multiple children', () => {
    const RefForwardingComponent = React.forwardRef((props, ref) => null);

    const ref = React.createRef();

    ReactNoop.render(
      <div>
        <div />
        <RefForwardingComponent ref={ref} />
        <div />
      </div>,
    );
    ReactNoop.flush();
    expect(ref.current).toBe(null);
  });

  it('should support propTypes and defaultProps', () => {
    function FunctionalComponent({forwardedRef, optional, required}) {
      return (
        <div ref={forwardedRef}>
          {optional}
          {required}
        </div>
      );
    }

    const RefForwardingComponent = React.forwardRef(function NamedFunction(
      props,
      ref,
    ) {
      return <FunctionalComponent {...props} forwardedRef={ref} />;
    });
    RefForwardingComponent.propTypes = {
      optional: PropTypes.string,
      required: PropTypes.string.isRequired,
    };
    RefForwardingComponent.defaultProps = {
      optional: 'default',
    };

    const ref = React.createRef();

    ReactNoop.render(
      <RefForwardingComponent ref={ref} optional="foo" required="bar" />,
    );
    ReactNoop.flush();
    expect(ref.current.children).toEqual([{text: 'foo'}, {text: 'bar'}]);

    ReactNoop.render(<RefForwardingComponent ref={ref} required="foo" />);
    ReactNoop.flush();
    expect(ref.current.children).toEqual([{text: 'default'}, {text: 'foo'}]);

    expect(() =>
      ReactNoop.render(<RefForwardingComponent ref={ref} optional="foo" />),
    ).toWarnDev(
      'Warning: Failed prop type: The prop `required` is marked as required in ' +
        '`ForwardRef(NamedFunction)`, but its value is `undefined`.\n' +
        '    in ForwardRef(NamedFunction) (at **)',
    );
  });

  it('should warn if not provided a callback during creation', () => {
    expect(() => React.forwardRef(undefined)).toWarnDev(
      'forwardRef requires a render function but was given undefined.',
      {withoutStack: true},
    );
    expect(() => React.forwardRef(null)).toWarnDev(
      'forwardRef requires a render function but was given null.',
      {withoutStack: true},
    );
    expect(() => React.forwardRef('foo')).toWarnDev(
      'forwardRef requires a render function but was given string.',
      {withoutStack: true},
    );
  });

  it('should warn if no render function is provided', () => {
    expect(React.forwardRef).toWarnDev(
      'forwardRef requires a render function but was given undefined.',
      {withoutStack: true},
    );
  });

  it('should warn if the render function provided has propTypes or defaultProps attributes', () => {
    function renderWithPropTypes(props, ref) {
      return null;
    }
    renderWithPropTypes.propTypes = {};

    function renderWithDefaultProps(props, ref) {
      return null;
    }
    renderWithDefaultProps.defaultProps = {};

    expect(() => React.forwardRef(renderWithPropTypes)).toWarnDev(
      'forwardRef render functions do not support propTypes or defaultProps. ' +
        'Did you accidentally pass a React component?',
      {withoutStack: true},
    );
    expect(() => React.forwardRef(renderWithDefaultProps)).toWarnDev(
      'forwardRef render functions do not support propTypes or defaultProps. ' +
        'Did you accidentally pass a React component?',
      {withoutStack: true},
    );
  });

  it('should warn if the render function provided does not use the forwarded ref parameter', () => {
    function arityOfZero() {
      return null;
    }

    const arityOfOne = props => null;

    expect(() => React.forwardRef(arityOfZero)).toWarnDev(
      'forwardRef render functions accept two parameters: props and ref. ' +
        'Did you forget to use the ref parameter?',
      {withoutStack: true},
    );

    expect(() => React.forwardRef(arityOfOne)).toWarnDev(
      'forwardRef render functions accept two parameters: props and ref. ' +
        'Did you forget to use the ref parameter?',
      {withoutStack: true},
    );
  });
});
