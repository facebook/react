/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let PropTypes;
let React;
let ReactTestUtils;

describe('ReactContextValidator', () => {
  beforeEach(() => {
    jest.resetModules();

    PropTypes = require('prop-types');
    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('warns of incorrect prop types on context provider', () => {
    const TestContext = React.createContext();

    TestContext.Provider.propTypes = {
      value: PropTypes.string.isRequired,
    };

    ReactTestUtils.renderIntoDocument(<TestContext.Provider value="val" />);

    class Component extends React.Component {
      render() {
        return <TestContext.Provider />;
      }
    }

    expect(() => ReactTestUtils.renderIntoDocument(<Component />)).toWarnDev(
      'Warning: Failed prop type: The prop `value` is marked as required in ' +
        '`Context.Provider`, but its value is `undefined`.\n' +
        '    in Component (at **)',
    );
  });
});
